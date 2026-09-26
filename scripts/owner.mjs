// The owner account: the person who installs BIS Learn on a computer. The launcher asks for their
// email and password on the first start; they become the center admin and also manage the platform
// settings. `npm run reset-password` sets a new password for any account if one is forgotten.
//
// The launcher runs the database parts as a separate process (`node scripts/owner.mjs --create`),
// so it never loads the database engine itself: on Windows a loaded engine file can't be replaced
// when an update installs a new one.
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { pathToFileURL } from "node:url";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_CENTER = "My Learning Center";

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  // Ctrl+C while a question waits: stop here; nothing has been set up yet.
  rl.on("SIGINT", () => {
    console.log();
    process.exit(0);
  });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Reads a line without showing it; each typed character appears as *. */
function askHidden(question) {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    let value = "";
    const finish = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          finish();
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          // Ctrl+C
          finish();
          process.exit(0);
        }
        if (ch === "\u007f" || ch === "\b") {
          if (value) {
            value = value.slice(0, -1);
            stdout.write("\b \b");
          }
        } else if (ch >= " ") {
          value += ch;
          stdout.write("*");
        }
      }
    };
    stdin.on("data", onData);
  });
}

async function askNewPassword() {
  for (;;) {
    const password = await askHidden("  Password (at least 8 characters): ");
    if (password.length < 8) {
      console.log("  The password must be at least 8 characters. Try again.");
      continue;
    }
    if ((await askHidden("  Repeat the password: ")) === password) return password;
    console.log("  The two passwords don't match. Try again.");
  }
}

/**
 * Asks in this window for the owner's details. Returns "demo" when they'd rather explore the demo
 * center (only offered when allowDemo), or null when there is no window to type in.
 */
export async function askOwnerDetails({ allowDemo = false } = {}) {
  if (!process.stdin.isTTY) {
    const { BIS_ADMIN_EMAIL: email, BIS_ADMIN_PASSWORD: password } = process.env;
    if (allowDemo && process.env.BIS_START === "demo") return "demo";
    if (!email || !password) return null;
    return { email: email.toLowerCase(), password, name: process.env.BIS_ADMIN_NAME || "Admin", centerName: process.env.BIS_CENTER_NAME || DEFAULT_CENTER };
  }
  console.log(`
  Welcome to BIS Learn! First, create the admin account.
  This person controls everything: the center, teachers, students, invite codes and all settings.
  You will log in on the website with this email and password.`);
  if (allowDemo) console.log("  (To look around a demo center with sample students instead, type demo and press Enter.)");
  console.log();
  let email;
  for (;;) {
    email = (await ask("  Admin email: ")).toLowerCase();
    if (allowDemo && email === "demo") return "demo";
    if (EMAIL.test(email)) break;
    console.log("  That doesn't look like an email address, e.g. name@gmail.com. Try again.");
  }
  const password = await askNewPassword();
  let name = "";
  while (name.length < 2) name = await ask("  Your full name: ");
  const centerName = (await ask(`  Your learning center's name (press Enter for "${DEFAULT_CENTER}"): `)) || DEFAULT_CENTER;
  return { email, password, name, centerName };
}

function randomCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(length), (b) => alphabet[b % alphabet.length]).join("");
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

// Prisma and bcrypt are loaded only when needed: on the very first start they are installed after this file loads.
async function database() {
  const { PrismaClient } = await import("@prisma/client");
  return new PrismaClient();
}

async function hash(password) {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.hash(password, 10);
}

/** Creates the center, its main branch and the owner. Does nothing if the site already has accounts. */
async function createOwner({ email, password, name, centerName }) {
  const db = await database();
  try {
    if ((await db.user.count()) > 0) return false;
    let slug = slugify(centerName) || "center";
    if (await db.center.findUnique({ where: { slug } })) slug = `${slug}-${randomCode(4).toLowerCase()}`;
    await db.center.create({
      data: {
        name: centerName,
        slug,
        inviteCode: randomCode(6),
        branches: { create: { name: "Main branch" } },
        users: { create: { name, email, passwordHash: await hash(password), role: "CENTER_ADMIN", isOwner: true, onboarded: true } },
      },
    });
    return true;
  } finally {
    await db.$disconnect();
  }
}

/** `npm run reset-password`: sets a new password for an account (e.g. the owner forgot theirs). */
async function resetPassword() {
  if (!process.stdin.isTTY) {
    console.error("Run this in a terminal window: npm run reset-password");
    process.exit(1);
  }
  const db = await database();
  try {
    console.log("\n  Set a new password for an account on this computer.\n");
    const login = (await ask("  Email or teacher ID of the account: ")).trim();
    const user = login.includes("@")
      ? await db.user.findUnique({ where: { email: login.toLowerCase() } })
      : await db.user.findUnique({ where: { loginId: login.toUpperCase() } });
    if (!user) {
      console.log("\n  No account with that email or teacher ID.");
      process.exitCode = 1;
      return;
    }
    console.log(`  Account: ${user.name} (${user.email})`);
    const password = await askNewPassword();
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hash(password) } });
    console.log("\n  ✓ Password changed. Log in with the new password.");
  } finally {
    await db.$disconnect();
  }
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

// Exit codes the launcher reads.
export const EXIT = { ok: 0, noAccounts: 3, alreadySetUp: 4 };

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [mode] = process.argv.slice(2);
  if (mode === "--reset-password") await resetPassword();
  else if (mode === "--has-accounts") {
    // Exit code 0: the site has accounts; 3: none yet.
    const db = await database();
    const count = await db.user.count();
    await db.$disconnect();
    process.exitCode = count > 0 ? EXIT.ok : EXIT.noAccounts;
  } else if (mode === "--create") {
    // The launcher sends the details as JSON on stdin, so the password never appears in a command line.
    process.exitCode = (await createOwner(JSON.parse(await readStdin()))) ? EXIT.ok : EXIT.alreadySetUp;
  }
}
