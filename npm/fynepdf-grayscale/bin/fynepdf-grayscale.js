#!/usr/bin/env node
"use strict";
// `npx fynepdf-grayscale ...`: runs this platform's command line with the same arguments.

const { spawnSync } = require("node:child_process");
const { binaryPath } = require("..");

let binary;
try {
  binary = binaryPath();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const run = spawnSync(binary, process.argv.slice(2), { stdio: "inherit" });
if (run.error) {
  console.error(`fynepdf-grayscale: ${run.error.message}`);
  process.exit(1);
}
if (run.signal) process.kill(process.pid, run.signal);
process.exit(run.status);
