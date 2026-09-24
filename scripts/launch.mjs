// Starts BIS Learn on this computer. Used by START-HERE-Windows.bat and START-HERE-Mac.command.
// First run: asks for the admin's email and password, installs the packages, creates the database
// and builds the site (a few minutes). Later runs start in seconds. Opens http://localhost:3000.
// While the site runs, it checks GitHub for a newer version every few minutes and installs it by
// itself (see update.mjs); refreshing the browser then shows the new version.
import { spawn } from "node:child_process";
import { createWriteStream, existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { askOwnerDetails, EXIT } from "./owner.mjs";
import { findUpdate, install, undo, updatesOff } from "./update.mjs";

const PORT = Number(process.env.PORT) || 3000;
const URL = `http://localhost:${PORT}`;
/** Exit code telling the start-here files that the site was already running and was only opened. */
const ALREADY_RUNNING = 10;
const UPDATE_EVERY_MS = (Number(process.env.BIS_UPDATE_MINUTES) || 5) * 60_000;
const DATABASE = path.join("prisma", "dev.db");
const NEXT = path.join("node_modules", "next", "dist", "bin", "next");
/** Where the output of a failed build is kept, so the whole error can be sent to someone who helps. */
const BUILD_LOG = "build-log.txt";
process.env.BIS_LAUNCHER = "1";

function say(text) {
  console.log(`\n${text}`);
}

function stop(text) {
  console.error(`\n${text}`);
  process.exit(1);
}

/** Runs a command in this window and reports whether it succeeded. Doesn't block, so the updating page keeps answering. */
function run(command, args) {
  return new Promise((resolve) => {
    spawn(command, args, { stdio: "inherit", shell: true })
      .on("exit", (code) => resolve(code === 0))
      .on("error", () => resolve(false));
  });
}

/** Like run(), but also copies everything the command prints into a file. */
function runLogged(command, args, file) {
  return new Promise((resolve) => {
    const log = createWriteStream(file);
    const child = spawn(command, args, { stdio: ["inherit", "pipe", "pipe"], shell: true });
    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      log.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
      log.write(chunk);
    });
    const done = (ok) => log.end(() => resolve(ok));
    child.on("exit", (code) => done(code === 0)).on("error", () => done(false));
  });
}

/** Opens a text file in Notepad (Windows) or TextEdit (macOS) so it can be read and sent. */
function showFile(file) {
  const [command, args] = process.platform === "win32" ? ["notepad", [file]] : process.platform === "darwin" ? ["open", ["-e", file]] : ["xdg-open", [file]];
  spawn(command, args, { stdio: "ignore", detached: true }).on("error", () => {}).unref();
}

/** Settings from .env that this launcher reads itself (e.g. BIS_UPDATES). Real environment variables win. */
function loadEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
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

async function waitUntilUp(seconds = 120) {
  for (let i = 0; i < seconds; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isUp()) return true;
  }
  return false;
}

function openBrowser() {
  const [command, args] =
    process.platform === "win32" ? ["cmd", ["/c", "start", "", URL]] : process.platform === "darwin" ? ["open", [URL]] : ["xdg-open", [URL]];
  spawn(command, args, { stdio: "ignore", detached: true, windowsHide: true }).on("error", () => {}).unref();
}

/** Runs `node scripts/owner.mjs <mode>` (see there), optionally sending it JSON, and returns its exit code. */
function ownerTask(mode, input) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join("scripts", "owner.mjs"), mode], { stdio: [input ? "pipe" : "ignore", "inherit", "inherit"] });
    child.on("exit", (code) => resolve(code ?? 1)).on("error", () => resolve(1));
    if (input) child.stdin.end(JSON.stringify(input));
  });
}

/** Installs the packages on the first run, and again when an update changed them. */
async function installPackages() {
  if (!existsSync(path.join("node_modules", "next", "package.json"))) {
    say("Installing what the site needs. This happens only once and takes a few minutes…");
    return run("npm", ["ci", "--no-audit", "--no-fund"]);
  }
  const installed = path.join("node_modules", ".package-lock.json");
  if (existsSync(installed) && statSync("package-lock.json").mtimeMs <= statSync(installed).mtimeMs) return true;
  say("Installing updated packages…");
  return run("npm", ["install", "--no-audit", "--no-fund"]);
}

/**
 * Builds the site when its files changed since the last build. A failed build is tried once more from
 * scratch (a half-written .next folder, or a file briefly locked by antivirus, can break it); if that
 * fails too, its whole output stays in build-log.txt and opens on screen.
 */
async function buildIfNeeded() {
  const buildId = path.join(".next", "BUILD_ID");
  if (existsSync(buildId) && newestSource() <= statSync(buildId).mtimeMs) return true;
  say("Building the site. This takes a minute or two…");
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (await runLogged("npm", ["run", "build"], BUILD_LOG)) {
      rmSync(BUILD_LOG, { force: true });
      return true;
    }
    if (attempt === 1) {
      say("The build failed. Cleaning up and trying once more…");
      rmSync(".next", { recursive: true, force: true });
    }
  }
  say(`The whole error is saved in ${BUILD_LOG} in the BIS Learn folder (it opens now). Send that file to the person helping you.`);
  showFile(BUILD_LOG);
  return false;
}

/** Gets the site ready after an update: packages, database changes, then a new build. */
async function prepareUpdate() {
  return (await installPackages()) && (await run("node", [path.join("scripts", "setup.mjs")])) && (await buildIfNeeded());
}

/** Installs a downloaded version; if it can't be built, puts the previous version back. */
async function applyUpdate(update) {
  const result = install(update);
  if (result.changed.length === 0) return true;
  say(`Installing the new version (${result.changed.length} files changed)…`);
  if (await prepareUpdate()) return true;
  say("The new version could not be installed. Putting the previous version back…");
  undo(result);
  // The database keeps any new columns; the previous version simply doesn't use them.
  if (!((await installPackages()) && (await buildIfNeeded()))) stop("Could not restore the previous version. Take a photo of this window and send it to the person helping you.");
  return false;
}

// ─── Start ──────────────────────────────────────────────────────────────────

if (await isUp()) {
  say(`The site is already running. Opening ${URL} …`);
  openBrowser();
  process.exit(ALREADY_RUNNING);
}

// First start: the person installing the site creates the admin account that controls everything.
const firstRun = !existsSync(DATABASE);
let owner = null;
let demo = false;
if (firstRun) {
  const answer = await askOwnerDetails({ allowDemo: true });
  if (answer === "demo") demo = true;
  else owner = answer;
}

if (!(await installPackages())) stop("Installing failed. Check your internet connection and try again.");

say("Preparing the database…");
const setupArgs = [path.join("scripts", "setup.mjs"), ...(demo ? [] : ["--no-demo"])];
if (!(await run("node", setupArgs))) stop("Setting up the database failed. Close this window and try again.");
loadEnv();

if (!demo && (await ownerTask("--has-accounts")) === EXIT.noAccounts) {
  owner ??= await askOwnerDetails();
  if (owner && (await ownerTask("--create", owner)) === EXIT.ok) say(`✓ Admin account created. Log in on the website with ${owner.email} and your password.`);
  else say("When the browser opens, create your center and your admin email and password there.");
}

const noUpdates = updatesOff();
if (!noUpdates) {
  try {
    const update = await findUpdate();
    if (update) {
      say(`A new version of BIS Learn is available (${update.short}).`);
      if (await applyUpdate(update)) say("✓ Updated to the newest version.");
    }
  } catch (error) {
    say(`Could not check for updates right now (${error.message}). Starting the version you have.`);
  }
}

if (!(await buildIfNeeded())) stop(`Building the site failed. Send the file ${BUILD_LOG} (or a photo of this window) to the person helping you.`);

// ─── Run the site, and update it while it runs ──────────────────────────────

let server = null;
let stopping = false;
let updating = false;

function startServer() {
  server = spawn(process.execPath, [NEXT, "start", "-p", String(PORT)], { stdio: "inherit" });
  server.on("exit", (code) => {
    server = null;
    if (!updating) process.exit(stopping ? 0 : (code ?? 0));
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (!server) return resolve();
    server.once("exit", () => resolve());
    server.kill();
  });
}

// Ctrl+C reaches the server too; wait for it to shut down and report a normal stop.
process.on("SIGINT", () => {
  stopping = true;
  if (!server) process.exit(0);
});

const UPDATING_PAGE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="8"><title>BIS Learn is updating…</title><style>
:root{color-scheme:light dark;font-family:system-ui,sans-serif}body{margin:0;min-height:100vh;display:grid;place-items:center;background:Canvas;color:CanvasText;text-align:center}
.s{width:40px;height:40px;margin:0 auto 20px;border:4px solid #2563eb33;border-top-color:#2563eb;border-radius:50%;animation:r 1s linear infinite}@keyframes r{to{transform:rotate(1turn)}}
p{opacity:.7;margin:.4em 1em}</style></head><body><main><div class="s"></div><h1>BIS Learn is updating…</h1>
<p>A new version is being installed. This page reloads by itself in a minute or two.</p>
<p>Yangi versiya oʻrnatilmoqda. Sahifa bir-ikki daqiqada oʻzi qayta yuklanadi.</p></main></body></html>`;

/** While the site is down for an update, anyone who opens it sees a page that reloads by itself. */
function showUpdatingPage() {
  const page = http.createServer((_, res) => {
    res.writeHead(503, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "10" });
    res.end(UPDATING_PAGE);
  });
  page.on("error", () => {});
  page.listen(PORT);
  return () => new Promise((resolve) => page.close(() => resolve()));
}

async function updateWhileRunning() {
  if (updating || stopping || !server) return;
  let update;
  try {
    update = await findUpdate();
  } catch {
    return; // offline or GitHub busy: try again next time
  }
  if (!update || updating || stopping || !server) return;
  updating = true;
  say(`A new version of BIS Learn is available (${update.short}). Updating now — the site is back in a minute or two.`);
  await stopServer();
  const hideUpdatingPage = showUpdatingPage();
  const updated = await applyUpdate(update);
  await hideUpdatingPage();
  updating = false;
  if (stopping) process.exit(0);
  startServer();
  await waitUntilUp();
  say(updated ? "✓ BIS Learn was updated. Refresh the page in your browser to see what's new." : "The update didn't work, so the site is running the previous version.");
}

say(`Starting the site at ${URL} — your browser will open by itself.\nKeep this window open while you use the site. To stop it, close this window or press Ctrl+C.`);
startServer();
if (await waitUntilUp()) openBrowser();
if (noUpdates) say(`Automatic updates are off: ${noUpdates}.`);
else setInterval(updateWhileRunning, UPDATE_EVERY_MS);
