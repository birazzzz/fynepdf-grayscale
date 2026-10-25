#!/bin/sh
# Builds the library, its command line and its tests for Linux in a Debian bookworm container
# (see docker/build-linux.Dockerfile), then runs the tests: build/linux for x86-64, or with
# ARCH=arm64 build/linux-arm64 (under QEMU on an x86 machine: slow, but the same compiler and
# libraries as on an arm64 one).
set -e
root=$(cd "$(dirname "$0")/.." && (pwd -W 2>/dev/null || pwd))
arch=${ARCH:-amd64}
case "$arch" in
  amd64) out=build/linux; image=fynepdf-grayscale-build:0 ;;
  arm64) out=build/linux-arm64; image=fynepdf-grayscale-build:0-arm64 ;;
  *) echo "ARCH must be amd64 or arm64" >&2; exit 64 ;;
esac
docker build -q --platform "linux/$arch" -t "$image" -f "$root/docker/build-linux.Dockerfile" "$root/docker" >/dev/null
MSYS_NO_PATHCONV=1 docker run --rm --platform "linux/$arch" -v "$root:/src" "$image" sh -c \
  "cmake -S /src -B /src/$out -G Ninja -DCMAKE_BUILD_TYPE=Release -DFYNEPDF_GRAYSCALE_TESTS=ON | grep fynepdf-grayscale \
   && cmake --build /src/$out && ctest --test-dir /src/$out --output-on-failure"
