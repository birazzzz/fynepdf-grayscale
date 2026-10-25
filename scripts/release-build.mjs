// Builds the release command line for one platform, tests it and packs it into dist/: the
// dependencies come from vcpkg (pinned by vcpkg.json's baseline) and are linked in statically, so
// the program is one file, packed with every licence. The release workflow runs this on each
// platform; locally it runs the same, Linux targets in Docker from any machine.
//
//   node scripts/release-build.mjs <linux-x64|linux-arm64|win32-x64|darwin-arm64|darwin-x64>
//
// VCPKG_ROOT names a vcpkg checkout to use; otherwise build/vcpkg is fetched at the baseline.
// Built dependencies are cached in build/vcpkg-cache (or wherever VCPKG_BINARY_SOURCES says).

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANYLINUX = "quay.io/pypa/manylinux_2_28";
// Each target: its vcpkg triplet (cmake/triplets), its archive's name, and for Linux the
// manylinux image it's built in (glibc 2.28).
const TARGETS = {
  "linux-x64": {
    triplet: "x64-linux-release",
    label: "linux-x64",
    docker: ["linux/amd64", `${MANYLINUX}_x86_64:2026.10.10-1@sha256:4131ddd7acb9c6c966af02fe7e71edc51e078c2d41f475966697676430bfa2ae`],
  },
  "linux-arm64": {
    triplet: "arm64-linux-release",
    label: "linux-arm64",
    docker: ["linux/arm64", `${MANYLINUX}_aarch64:2026.10.10-1@sha256:abd1230aa9e4058a74b89d27cd14ba18c0db036d7bfe6e6f219a29ea63c24eb6`],
  },
  "win32-x64": { triplet: "x64-windows-static-release", label: "windows-x64" },
  "darwin-arm64": { triplet: "arm64-osx-release", label: "macos-arm64" },
  "darwin-x64": { triplet: "x64-osx-release", label: "macos-x64" },
};

const name = process.argv[2];
const target = TARGETS[name];
if (!target) {
  console.error(`usage: node scripts/release-build.mjs <${Object.keys(TARGETS).join("|")}>`);
  process.exit(64);
}
const [os, arch] = name.split("-");

function run(command, args, options = {}) {
  console.log(`> ${command} ${args.join(" ")}`);
  execFileSync(command, args, { stdio: "inherit", cwd: root, ...options });
}
const works = (command, args) => {
  try {
    execFileSync(command, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
// Windows' own tar: Git's GNU tar reads "C:" in a path as a remote host.
const tar = process.platform === "win32" ? path.join(process.env.SystemRoot, "System32", "tar.exe") : "tar";

// The program may load only the system's own libraries: anything else (a Homebrew libjpeg on the
// runner, say) wouldn't be on a user's machine. Windows needs no check: its triplet is all static.
function checkLinks(file) {
  let libraries = [];
  if (os === "linux") {
    const dynamic = execFileSync("readelf", ["-d", file]).toString();
    libraries = [...dynamic.matchAll(/\(NEEDED\)[^[]*\[([^\]]+)\]/g)].map((match) => match[1]);
    libraries = libraries.filter((name) => !/^(libc|libm|libpthread|libdl|librt)\.so\.\d+$|^ld-linux/.test(name));
  } else if (os === "darwin") {
    const lines = execFileSync("otool", ["-L", file]).toString().split("\n").slice(1);
    libraries = lines.map((line) => line.trim().split(" ")[0]).filter(Boolean);
    libraries = libraries.filter((name) => !name.startsWith("/usr/lib/") && !name.startsWith("/System/Library/"));
  }
  if (libraries.length) throw new Error(`${path.basename(file)} links libraries a user may not have: ${libraries.join(", ")}`);
  console.log(`${path.basename(file)}: only system libraries`);
}

// Linux: build inside manylinux_2_28, so the result runs on glibc 2.28 and newer.
if (os === "linux" && !process.env.FYNEPDF_IN_CONTAINER) {
  const [platform, base] = target.docker;
  const image = `fynepdf-grayscale-release:${name}`;
  run("docker", ["build", "-q", "--platform", platform, "--build-arg", `BASE=${base}`, "-t", image,
    "-f", "docker/release-linux.Dockerfile", "docker"]);
  const env = ["VCPKG_BINARY_SOURCES"].filter((key) => process.env[key]).flatMap((key) => ["-e", key]);
  run("docker", ["run", "--rm", "--platform", platform, "-v", `${root}:/src`, ...env, image,
    "node", "scripts/release-build.mjs", name], { env: { ...process.env, MSYS_NO_PATHCONV: "1" } });
  process.exit(0);
}
if (`${process.platform}-${process.arch}` !== name)
  throw new Error(`${name} is built on ${name} (this is ${process.platform}-${process.arch})`);

const version = /project\(fynepdf_grayscale\s+VERSION\s+([0-9.]+)/.exec(fs.readFileSync(path.join(root, "CMakeLists.txt"), "utf8"))[1];
const build = path.join(root, "build", `release-${name}`);
fs.mkdirSync(path.join(root, "build"), { recursive: true });

// vcpkg at vcpkg.json's baseline.
let vcpkg = process.env.VCPKG_ROOT;
if (!vcpkg) {
  vcpkg = path.join(root, "build", "vcpkg");
  const baseline = JSON.parse(fs.readFileSync(path.join(root, "vcpkg.json"), "utf8"))["builtin-baseline"];
  if (!fs.existsSync(path.join(vcpkg, ".git"))) {
    run("git", ["init", "-q", vcpkg]);
    run("git", ["-C", vcpkg, "fetch", "-q", "--depth", "1", "https://github.com/microsoft/vcpkg", baseline]);
    run("git", ["-C", vcpkg, "checkout", "-q", "FETCH_HEAD"]);
  }
  if (!fs.existsSync(path.join(vcpkg, process.platform === "win32" ? "vcpkg.exe" : "vcpkg"))) {
    if (process.platform === "win32") run("cmd", ["/c", path.join(vcpkg, "bootstrap-vcpkg.bat"), "-disableMetrics"]);
    else run("sh", [path.join(vcpkg, "bootstrap-vcpkg.sh"), "-disableMetrics"]);
  }
}
const cache = path.join(root, "build", "vcpkg-cache");
fs.mkdirSync(cache, { recursive: true });
const env = { ...process.env, VCPKG_BINARY_SOURCES: process.env.VCPKG_BINARY_SOURCES || `clear;files,${cache},readwrite` };
// vcpkg has no tools of its own for arm64 Linux: it uses the system's cmake and ninja.
if (os === "linux" && arch === "arm64") env.VCPKG_FORCE_SYSTEM_BINARIES = "1";

// Configure, build, test.
const configure = ["-S", root, "-B", build, "-DCMAKE_BUILD_TYPE=Release",
  `-DCMAKE_TOOLCHAIN_FILE=${path.join(vcpkg, "scripts", "buildsystems", "vcpkg.cmake")}`,
  `-DVCPKG_TARGET_TRIPLET=${target.triplet}`, `-DVCPKG_OVERLAY_TRIPLETS=${path.join(root, "cmake", "triplets")}`,
  "-DFYNEPDF_GRAYSCALE_TESTS=ON"];
if (os === "win32") configure.push("-A", "x64", "-DCMAKE_MSVC_RUNTIME_LIBRARY=MultiThreaded");
else if (works("ninja", ["--version"])) configure.push("-G", "Ninja");
if (os === "linux") configure.push("-DCMAKE_EXE_LINKER_FLAGS=-static-libstdc++ -static-libgcc -s");
if (os === "darwin")
  configure.push("-DCMAKE_OSX_DEPLOYMENT_TARGET=11.0", `-DCMAKE_OSX_ARCHITECTURES=${arch === "x64" ? "x86_64" : "arm64"}`);
run("cmake", configure, { env });
run("cmake", ["--build", build, "--config", "Release", "--parallel"], { env });
run("ctest", ["--test-dir", build, "-C", "Release", "--output-on-failure"], { env });

// Pack: the program and the licences of everything inside it.
const exe = os === "win32" ? "fynepdf-grayscale.exe" : "fynepdf-grayscale";
const built = [path.join(build, "Release", exe), path.join(build, exe)].find((file) => fs.existsSync(file));
checkLinks(built);
const folder =`fynepdf-grayscale-${version}-${target.label}`;
const dist = path.join(root, "dist");
const stage = path.join(dist, folder);
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(path.join(stage, "licenses"), { recursive: true });
fs.copyFileSync(built, path.join(stage, exe));
fs.chmodSync(path.join(stage, exe), 0o755);
for (const file of ["LICENSE", "THIRD-PARTY-NOTICES.md"]) fs.copyFileSync(path.join(root, file), path.join(stage, file));
const share = path.join(build, "vcpkg_installed", target.triplet, "share");
for (const port of fs.readdirSync(share).sort()) {
  const copyright = path.join(share, port, "copyright");
  if (!port.startsWith("vcpkg-") && fs.existsSync(copyright)) fs.copyFileSync(copyright, path.join(stage, "licenses", `${port}.txt`));
}
const program = os === "win32" ? "fynepdf-grayscale.exe" : "./fynepdf-grayscale";
fs.writeFileSync(path.join(stage, "README.txt"), `fynepdf-grayscale ${version} for ${target.label}

  ${program} input.pdf output.pdf                    every page
  ${program} input.pdf output.pdf --pages 2-5,8      only these pages
  ${program} input.pdf output.pdf --only drawings    text and drawings grey, photos in colour
  ${program} input.pdf output.pdf --only images      photos grey, text and drawings in colour

Documentation: https://github.com/birazzzz/fynepdf-grayscale

Made by FynePDF (https://fynepdf.com), MIT licence (LICENSE). The libraries linked into the
program keep their own licences, in licenses/.
`);
const archive = os === "win32" ? `${folder}.zip` : `${folder}.tar.gz`;
fs.rmSync(path.join(dist, archive), { force: true });
run(tar, [os === "win32" ? "-a" : "-z", "-cf", path.join(dist, archive), "-C", dist, folder]);
console.log(`dist/${archive}`);
