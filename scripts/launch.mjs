// Starts BIS Learn on this computer. Used by START-HERE-Windows.bat and START-HERE-Mac.command.
// First run: installs the packages, creates the database with demo data and builds the site
// (a few minutes). Later runs start in seconds. Opens http://localhost:3000 when the site is ready.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { createInterface } from "node:readline/promises";

const PORT = Number(process.env.PORT) || 3000;
const URL = `http://localhost:${PORT}`;
/** Exit code telling the start-here files that the site was already running and was only opened. */
const ALREADY_RUNNING = 10;
process.env.BIS_LAUNCHER = "1";

function say(text) {
  console.log(`\n${text}`);
}

function stop(text) {
  console.error(`\n${text}`);
  process.exit(1);
}

/** Runs a command in this window and reports whether it succeeded. */
function run(command, args) {
  return spawnSync(command, args, { stdio: "inherit", shell: true }).status === 0;
}

/** Newest modification time of the files the production build is made from. */
function newestSource() {
  let newest = 0;
  const visit = (p) => {
    const s = statSync(p);
    if (s.isDirectory()) for (const name of readdirSync(p)) visit(path.join(p, name));
    else newest = Math.max(newest, s.mtimeMs);
  };
  for (const p of ["src", "public", "prisma/schema.prisma", "package.json", "next.config.ts", ".env"]) if (existsSync(p)) visit(p);
  return newest;
}

function isUp() {
  return new Promise((resolve) => {
    const req = http.get(`${URL}/login`, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function openBrowser() {
  const [command, args] =
    process.platform === "win32" ? ["cmd", ["/c", "start", "", URL]] : process.platform === "darwin" ? ["open", [URL]] : ["xdg-open", [URL]];
  spawn(command, args, { stdio: "ignore", detached: true, windowsHide: true }).on("error", () => {}).unref();
}

if (await isUp()) {
  say(`The site is already running. Opening ${URL} …`);
  openBrowser();
  process.exit(ALREADY_RUNNING);
}

if (!existsSync("node_modules/next/package.json")) {
  say("Installing what the site needs. This happens only once and takes a few minutes…");
  if (!run("npm", ["ci", "--no-audit", "--no-fund"])) stop("Installing failed. Check your internet connection and try again.");
}

/** First start only: a demo center to explore, or an empty site where you create your own center. */
async function askHowToStart() {
  if (!process.stdin.isTTY) return process.env.BIS_START === "own" ? "own" : "demo";
  console.log(`
How do you want to start?
  1  Try the demo: a sample center with students, teachers and results (password: password123)
  2  Set up my own center: you create the center and your own admin password in the browser`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    for (;;) {
      const answer = (await rl.question("\nType 1 or 2 and press Enter: ")).trim();
      if (answer === "1") return "demo";
      if (answer === "2") return "own";
    }
  } finally {
    rl.close();
  }
}

const firstRun = !existsSync(path.join("prisma", "dev.db"));
const start = firstRun ? await askHowToStart() : "keep";

say("Preparing the database…");
const setupArgs = [path.join("scripts", "setup.mjs"), ...(start === "own" ? ["--no-demo"] : [])];
if (!run("node", setupArgs)) stop("Setting up the database failed. Close this window and try again.");
if (start === "own") say("When the browser opens, create your center and your own admin email and password.");

const buildId = path.join(".next", "BUILD_ID");
if (!existsSync(buildId) || newestSource() > statSync(buildId).mtimeMs) {
  say("Building the site. The first time takes a minute or two…");
  if (!run("npm", ["run", "build"])) stop("Building the site failed. Take a photo of this window and send it to the person helping you.");
}

say(`Starting the site at ${URL} — your browser will open by itself.\nKeep this window open while you use the site. To stop it, close this window or press Ctrl+C.`);
const server = spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: "inherit", shell: true });
// Ctrl+C reaches the server too; wait for it to shut down and report a normal stop.
let stopping = false;
process.on("SIGINT", () => {
  stopping = true;
});
server.on("exit", (code) => process.exit(stopping ? 0 : (code ?? 0)));

for (let i = 0; i < 120; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  if (await isUp()) {
    openBrowser();
    break;
  }
}
