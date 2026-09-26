// One-command local setup: `npm run setup`.
// Creates .env with a random SESSION_SECRET (if it doesn't exist yet), creates the database
// and loads the demo data. Run `npm run setup -- --reset` to wipe the database and reload the demo.
// Add `--no-demo` to load only the learning content and create your own center on the site.
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const reset = process.argv.includes("--reset");
const noDemo = process.argv.includes("--no-demo");

if (existsSync(".env")) {
  console.log("✓ .env already exists — keeping it");
} else {
  const example = readFileSync(".env.example", "utf8");
  const secret = randomBytes(32).toString("base64url");
  writeFileSync(".env", example.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET="${secret}"`));
  console.log("✓ Created .env with a random SESSION_SECRET");
}

// The default SQLite database lives in prisma/dev.db (DATABASE_URL="file:./dev.db").
const hadDatabase = existsSync("prisma/dev.db");

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit" });
}

run("npx prisma db push");

if (hadDatabase && !reset) {
  console.log("\n✓ Database already exists — kept your data. Run `npm run setup -- --reset` to reload the demo data.");
} else {
  run(`npx tsx prisma/seed/index.ts${noDemo ? " --no-demo" : ""}`);
}

// The double-click launchers start the site themselves, so the hint is only for manual setup.
if (!process.env.BIS_LAUNCHER) console.log("\nAll set! Start the app with:  npm run dev\nThen open http://localhost:3000 in your browser.");
