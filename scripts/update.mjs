// Automatic updates for copies of BIS Learn installed from a zip file. The launcher asks GitHub for
// the newest version of the main branch, downloads it and replaces the program files. Your data —
// the database (prisma/dev.db), .env, node_modules and the built site — is never touched.
// Turn updates off with BIS_UPDATES="off" in .env. Folders with a .git directory are skipped: use git pull there.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import https from "node:https";
import path from "node:path";
import { gunzipSync } from "node:zlib";

export const VERSION_FILE = ".bis-version.json";
export const REPO = process.env.BIS_UPDATE_REPO || "Jawas-cre/BIS-school";
export const BRANCH = process.env.BIS_UPDATE_BRANCH || "main";

// Never written by an update: your data and settings, generated folders, and the start-here files,
// which are still running while the update happens (Windows and bash read them line by line).
const KEEP = [/^\.env$/, /^prisma\/[^/]+\.db(-journal)?$/, /^node_modules\//, /^\.next\//, /^\.git\//, /^START-HERE-/, /^\.bis-version\.json$/];
const kept = (file) => KEEP.some((re) => re.test(file));

export function updatesOff() {
  if (process.env.BIS_UPDATES === "off") return 'switched off in .env (BIS_UPDATES="off")';
  if (existsSync(".git")) return "this folder is a Git checkout — use git pull to update it";
  return null;
}

export function currentVersion() {
  try {
    return JSON.parse(readFileSync(VERSION_FILE, "utf8"));
  } catch {
    return null;
  }
}

function get(url, headers = {}, redirects = 3) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "bis-learn-updater", ...headers }, timeout: 30_000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        resolve(get(new URL(res.headers.location, url).href, headers, redirects - 1));
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks);
        if (res.statusCode !== 200) reject(new Error(`GitHub answered ${res.statusCode} for ${url}`));
        else resolve(body);
      });
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("GitHub did not answer in time")));
    req.on("error", reject);
  });
}

/** The newest commit on the branch. Uses the git address rather than the GitHub API, which limits how often it may be asked. */
async function latestCommit() {
  const refs = (await get(`https://github.com/${REPO}.git/info/refs?service=git-upload-pack`)).toString("latin1");
  // Lines look like "<4-digit length><sha> refs/heads/<branch>".
  const line = refs.split("\n").find((l) => l.endsWith(` refs/heads/${BRANCH}`));
  const sha = line?.slice(0, line.indexOf(" ")).slice(-40);
  if (!sha || !/^[0-9a-f]{40}$/.test(sha)) throw new Error(`GitHub has no branch called ${BRANCH}`);
  return sha;
}

// Versions we already know are not newer than this copy (e.g. main is behind a copy made from a newer branch).
const notNewer = new Set();

/**
 * Downloads the newest version if it is newer than this copy, and returns it with its files; otherwise
 * null. Throws when offline. "Newer" compares commit dates, so a copy made before its changes reached
 * main isn't replaced by the older main.
 */
export async function findUpdate() {
  const current = currentVersion();
  const sha = await latestCommit();
  if (current?.sha === sha || notNewer.has(sha)) return null;
  const { files, committedAt } = await download(sha);
  if (current?.committedAt && Date.parse(committedAt) <= Date.parse(current.committedAt)) {
    notNewer.add(sha);
    return null;
  }
  return { sha, short: sha.slice(0, 7), committedAt, files };
}

function parsePax(data) {
  const out = {};
  let rest = data.toString("utf8");
  while (rest.length) {
    const space = rest.indexOf(" ");
    const length = Number(rest.slice(0, space));
    if (!length) break;
    const record = rest.slice(space + 1, length - 1);
    const eq = record.indexOf("=");
    out[record.slice(0, eq)] = record.slice(eq + 1);
    rest = rest.slice(length);
  }
  return out;
}

/** Reads the regular files out of a tar archive (the format GitHub serves source downloads in). */
function untar(buffer) {
  const files = [];
  let offset = 0;
  let longName = null;
  const text = (h, start, end) => h.subarray(start, end).toString("utf8").replace(/\0[\s\S]*$/, "");
  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;
    const size = parseInt(text(header, 124, 136).trim() || "0", 8);
    const type = String.fromCharCode(header[156]);
    const prefix = text(header, 345, 500);
    const name = prefix ? `${prefix}/${text(header, 0, 100)}` : text(header, 0, 100);
    const mode = parseInt(text(header, 100, 108).trim() || "0", 8);
    const mtime = parseInt(text(header, 136, 148).trim() || "0", 8);
    const data = buffer.subarray(offset + 512, offset + 512 + size);
    offset += 512 + Math.ceil(size / 512) * 512;
    if (type === "x") longName = parsePax(data).path ?? null;
    else if (type === "L") longName = text(data, 0, data.length);
    else if (type === "g") continue;
    else {
      if (type === "0" || type === "\0") files.push({ name: longName ?? name, mode, mtime, data: Buffer.from(data) });
      longName = null;
    }
  }
  return files;
}

/** Downloads a version: its files (paths relative to the project folder) and its commit date. */
async function download(sha) {
  const archive = gunzipSync(await get(`https://codeload.github.com/${REPO}/tar.gz/${sha}`));
  const files = [];
  for (const file of untar(archive)) {
    // GitHub puts everything in one top folder, e.g. Owner-Repo-abc1234/.
    const name = file.name.split("/").slice(1).join("/");
    if (!name || name.startsWith("/") || name.split("/").includes("..")) continue;
    files.push({ ...file, name });
  }
  if (!files.some((f) => f.name === "package.json")) throw new Error("The download is incomplete");
  // GitHub stamps every file with the commit's date.
  const committedAt = new Date(Math.max(...files.map((f) => f.mtime)) * 1000).toISOString();
  return { files, committedAt };
}

/**
 * Writes the new version's files over this copy and removes files the new version no longer has.
 * Only files whose content changed are written. Returns the changed files and what undo() needs.
 */
export function install(update) {
  const { files } = update;
  const versionBefore = existsSync(VERSION_FILE) ? readFileSync(VERSION_FILE) : null;
  const backup = [];
  const changed = [];
  const save = (name) => backup.push({ name, data: existsSync(name) ? readFileSync(name) : null });
  for (const file of files) {
    if (kept(file.name)) continue;
    if (existsSync(file.name) && readFileSync(file.name).equals(file.data)) continue;
    save(file.name);
    mkdirSync(path.dirname(file.name), { recursive: true });
    writeFileSync(file.name, file.data);
    if (process.platform !== "win32" && file.mode & 0o111) chmodSync(file.name, 0o755);
    changed.push(file.name);
  }
  const next = new Set(files.map((f) => f.name));
  for (const name of currentVersion()?.files ?? []) {
    if (next.has(name) || kept(name) || !existsSync(name)) continue;
    save(name);
    rmSync(name);
    changed.push(name);
  }
  const version = { repo: REPO, branch: BRANCH, sha: update.sha, committedAt: update.committedAt, installedAt: new Date().toISOString(), files: [...next] };
  writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2));
  return { changed, backup, versionBefore };
}

/** Puts back the files an install() replaced or removed. */
export function undo({ backup, versionBefore }) {
  for (const { name, data } of [...backup].reverse()) {
    if (data === null) rmSync(name, { force: true });
    else {
      mkdirSync(path.dirname(name), { recursive: true });
      writeFileSync(name, data);
    }
  }
  if (versionBefore) writeFileSync(VERSION_FILE, versionBefore);
  else rmSync(VERSION_FILE, { force: true });
}
