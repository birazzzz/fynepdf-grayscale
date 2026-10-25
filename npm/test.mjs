// Installs the packed npm packages (npm/out, from scripts/npm-packages.mjs) for this platform into
// a new folder, the way a user would, and runs them: the command line through npx, then the Node
// API with its options and errors.
//
//   node npm/test.mjs

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "npm", "out");
const { version } = JSON.parse(fs.readFileSync(path.join(root, "npm", "fynepdf-grayscale", "package.json"), "utf8"));
const fixtures = path.join(root, "tests", "fixtures");
const windows = process.platform === "win32";

const packed = (name) => {
  const file = path.join(out, `${name}-${version}.tgz`);
  assert.ok(fs.existsSync(file), `missing ${path.relative(root, file)}: run scripts/npm-packages.mjs`);
  return file;
};
// npm and npx are .cmd files on Windows, which run through the shell: arguments are quoted.
const run = (command, args, cwd) => {
  const result = windows
    ? spawnSync([command, ...args.map((arg) => `"${arg}"`)].join(" "), { cwd, encoding: "utf8", shell: true })
    : spawnSync(command, args, { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
};

const project = fs.mkdtempSync(path.join(os.tmpdir(), "fynepdf-grayscale-npm-"));
console.log(`installing into ${project}`);
fs.writeFileSync(path.join(project, "package.json"), '{ "private": true }\n');
const install = run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error",
  packed("fynepdf-grayscale"), packed(`fynepdf-grayscale-${process.platform}-${process.arch}`)], project);
assert.equal(install.status, 0, install.stderr);

// The command line.
const shown = run("npx", ["--no-install", "fynepdf-grayscale", "--version"], project);
assert.equal(shown.stdout, `fynepdf-grayscale ${version}`, shown.stderr);
const cli = run("npx", ["--no-install", "fynepdf-grayscale", path.join(fixtures, "e-chrome-report.pdf"), "gray.pdf"], project);
assert.equal(cli.status, 0, cli.stderr);
const all = JSON.parse(cli.stdout);
assert.ok(all.ok && all.converted === all.pages && all.colours > 0, cli.stdout);
console.log("ok  npx fynepdf-grayscale");

// The Node API.
const api = `
const assert = require("node:assert/strict");
const { toGray } = require("fynepdf-grayscale");
const report = ${JSON.stringify(path.join(fixtures, "e-chrome-report.pdf"))};
(async () => {
  const first = await toGray(report, "first.pdf", { pages: [1], only: "drawings" });
  assert.equal(first.converted, 1, JSON.stringify(first));
  await assert.rejects(toGray(report, "none.pdf", { pages: "999" }), { code: "pages" });
  await assert.rejects(toGray(${JSON.stringify(path.join(fixtures, "a-encrypted-user-password.pdf"))}, "password.pdf"), { code: "password" });
  await assert.rejects(toGray("missing.pdf", "missing-out.pdf"), { code: "unreadable" });
})().catch((error) => { console.error(error); process.exit(1); });
`;
fs.writeFileSync(path.join(project, "api.js"), api);
const node = run("node", ["api.js"], project);
assert.equal(node.status, 0, node.stderr);
console.log("ok  toGray (options, errors reported)");
for (const file of ["gray.pdf", "first.pdf"])
  assert.equal(fs.readFileSync(path.join(project, file)).subarray(0, 5).toString(), "%PDF-");
fs.rmSync(project, { recursive: true, force: true });
console.log(`npm packages ${version} work on ${process.platform}-${process.arch}`);
