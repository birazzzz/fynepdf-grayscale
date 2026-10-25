"use strict";
// fynepdf-grayscale from Node: the command line for this platform comes in an optional
// dependency (fynepdf-grayscale-linux-x64, -darwin-arm64, ...).

const { execFile } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const PLATFORMS = ["linux-x64", "linux-arm64", "win32-x64", "darwin-arm64", "darwin-x64"];
const ERRORS = {
  2: "needs a password",
  3: "can't be read as a PDF",
  4: "doesn't have those pages",
  5: "couldn't be written",
};

/** The command line's path: FYNEPDF_GRAYSCALE_BINARY if set, else this platform's package. */
function binaryPath() {
  if (process.env.FYNEPDF_GRAYSCALE_BINARY) return process.env.FYNEPDF_GRAYSCALE_BINARY;
  const platform = `${process.platform}-${process.arch}`;
  let folder;
  try {
    folder = path.dirname(require.resolve(`fynepdf-grayscale-${platform}/package.json`));
  } catch {
    throw new Error(
      PLATFORMS.includes(platform)
        ? `fynepdf-grayscale: its command line for ${platform} (fynepdf-grayscale-${platform}) isn't installed. ` +
            "Install again without --no-optional or --omit=optional."
        : `fynepdf-grayscale has no command line for ${platform} yet (it has ${PLATFORMS.join(", ")}). ` +
            "Build it from https://github.com/birazzzz/fynepdf-grayscale and set FYNEPDF_GRAYSCALE_BINARY to it.",
    );
  }
  const binary = path.join(folder, process.platform === "win32" ? "fynepdf-grayscale.exe" : "fynepdf-grayscale");
  if (process.platform !== "win32") {
    try {
      fs.accessSync(binary, fs.constants.X_OK);
    } catch {
      fs.chmodSync(binary, 0o755);
    }
  }
  return binary;
}

/** [2, 3, 4] or "2-4" as the command line's "2-4". */
function pageList(pages) {
  return Array.isArray(pages) ? pages.join(",") : String(pages);
}

/**
 * Makes |input| gray and writes |output|. Resolves with what was converted; rejects when the file
 * can't be read, needs a password, doesn't have the pages asked for, or can't be written.
 */
function toGray(input, output, options = {}) {
  const args = [String(input), String(output)];
  if (options.pages !== undefined) args.push("--pages", pageList(options.pages));
  if (options.only !== undefined) args.push("--only", String(options.only));
  if (options.jpegQuality !== undefined) args.push("--jpeg-quality", String(options.jpegQuality));
  return new Promise((resolve, reject) => {
    let binary;
    try {
      binary = binaryPath();
    } catch (error) {
      reject(error);
      return;
    }
    execFile(binary, args, { maxBuffer: 16 * 1024 * 1024, signal: options.signal }, (error, stdout, stderr) => {
      let result;
      try {
        result = JSON.parse(stdout.trim().split("\n").pop());
      } catch {
        result = undefined;
      }
      if (!error && result) {
        resolve(result);
        return;
      }
      if (error && error.name === "AbortError") {
        reject(error);
        return;
      }
      const code = error && typeof error.code === "number" ? error.code : undefined;
      const why = code === 64 ? `wrong options: ${stderr.trim()}` : ERRORS[code] || (error ? error.message : "no result");
      const failure = new Error(`fynepdf-grayscale: ${input} ${why}`);
      failure.code = result && result.error ? result.error : code === 64 ? "options" : "failed";
      failure.result = result;
      reject(failure);
    });
  });
}

module.exports = { toGray, binaryPath };
