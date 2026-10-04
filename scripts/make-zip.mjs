// Makes the zip file for laptops from a commit: `npm run zip` (or `npm run zip -- <commit> <file>`).
// It adds .bis-version.json, which tells the automatic updater (update.mjs) which version the zip
// holds, so it only installs versions that are newer.
//
// `npm run zip -- --mock` makes the CD IELTS Mock zip instead (cd-ielts-mock.zip): the same program
// in a cd-ielts-mock folder whose start files (scripts/cd-mock/) run it as the mock site on its own.
// BIS Learn's start files are left out. It updates itself from the same GitHub branch.
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { BRANCH, REPO, VERSION_FILE } from "./update.mjs";

const args = process.argv.slice(2);
const mock = args.includes("--mock");
const [rev = "HEAD", out = mock ? "cd-ielts-mock.zip" : "bis-learn.zip"] = args.filter((a) => a !== "--mock");
const folder = mock ? "cd-ielts-mock" : "bis-learn";
const git = (gitArgs, env) => execFileSync("git", gitArgs, { encoding: "utf8", env: env ? { ...process.env, ...env } : process.env }).trim();
const sha = git(["rev-parse", `${rev}^{commit}`]);
const version = {
  repo: REPO,
  branch: BRANCH,
  sha,
  committedAt: new Date(Number(git(["show", "-s", "--format=%ct", sha])) * 1000).toISOString(),
  files: git(["ls-tree", "-r", "--name-only", sha]).split("\n"),
};

/**
 * The files of the mock zip: the commit's files with the mock's start files at the top instead of
 * BIS Learn's, built in a temporary git index so the Mac file keeps its "can run" mark and the
 * Windows file gets its CRLF line endings like any file in the repository.
 */
function mockTree() {
  const index = path.join(os.tmpdir(), `cd-mock-index-${process.pid}`);
  const env = { GIT_INDEX_FILE: index };
  try {
    git(["read-tree", sha], env);
    git(["rm", "--cached", "--quiet", "START-HERE-Windows.bat", "START-HERE-Mac.command"], env);
    for (const [name, mode] of [
      ["START-HERE-CD-Mock-Windows.bat", "100644"],
      ["START-HERE-CD-Mock-Mac.command", "100755"],
    ]) {
      git(["update-index", "--add", "--cacheinfo", `${mode},${git(["rev-parse", `${sha}:scripts/cd-mock/${name}`])},${name}`], env);
    }
    return git(["write-tree"], env);
  } finally {
    rmSync(index, { force: true });
  }
}

const tree = mock ? mockTree() : sha;
execFileSync("git", ["archive", "--format=zip", `--prefix=${folder}/`, `--add-virtual-file=${folder}/${VERSION_FILE}:${JSON.stringify(version, null, 2)}`, "-o", out, tree]);
console.log(`✓ ${out}: ${mock ? "CD IELTS Mock, " : ""}version ${sha.slice(0, 7)} (${version.committedAt})`);
