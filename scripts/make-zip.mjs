// Makes the zip file for laptops from a commit: `npm run zip` (or `npm run zip -- <commit> <file>`).
// It adds .bis-version.json, which tells the automatic updater (update.mjs) which version the zip
// holds, so it only installs versions that are newer.
import { execFileSync } from "node:child_process";
import { BRANCH, REPO, VERSION_FILE } from "./update.mjs";

const [rev = "HEAD", out = "bis-learn.zip"] = process.argv.slice(2);
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const sha = git("rev-parse", `${rev}^{commit}`);
const version = {
  repo: REPO,
  branch: BRANCH,
  sha,
  committedAt: new Date(Number(git("show", "-s", "--format=%ct", sha)) * 1000).toISOString(),
  files: git("ls-tree", "-r", "--name-only", sha).split("\n"),
};
execFileSync("git", ["archive", "--format=zip", "--prefix=bis-learn/", `--add-virtual-file=bis-learn/${VERSION_FILE}:${JSON.stringify(version, null, 2)}`, "-o", out, sha]);
console.log(`✓ ${out}: version ${sha.slice(0, 7)} (${version.committedAt})`);
