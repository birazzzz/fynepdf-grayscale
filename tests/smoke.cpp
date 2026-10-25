// Makes every PDF in tests/fixtures gray and checks the results:
//
//   fynepdf_grayscale_smoke <fixtures> <out>
//
// Every file comes out, except the password-protected one (refused, with "password"), opens, and
// has the same pages; the ones with colour have their colours, pictures or gradients rewritten.
// Each is then made gray again with only the first page, and with each kind of content alone
// (text and drawings only must leave pictures as they are; pictures only, gradients).

#include "fynepdf/grayscale/grayscale.h"

#include <qpdf/QPDF.hh>

#include <algorithm>
#include <cstdio>
#include <filesystem>
#include <string>
#include <vector>

namespace fs = std::filesystem;
using namespace fynepdf::grayscale;

namespace {

int Pages(const fs::path &file) {
  try {
    QPDF pdf;
    pdf.processFile(file.string().c_str());
    return static_cast<int>(pdf.getAllPages().size());
  } catch (...) {
    return -1;
  }
}

} // namespace

int main(int argc, char **argv) {
  if (argc != 3)
    return 64;
  const fs::path out = argv[2];
  fs::create_directories(out);
  std::vector<fs::path> files;
  for (const auto &entry : fs::directory_iterator(argv[1]))
    if (entry.path().extension() == ".pdf")
      files.push_back(entry.path());
  std::sort(files.begin(), files.end());

  int failures = 0, converted = 0, changed = 0;
  const auto fail = [&](const fs::path &file, const std::string &why) {
    std::fprintf(stderr, "FAIL %s: %s\n", file.filename().string().c_str(), why.c_str());
    ++failures;
  };
  for (const fs::path &input : files) {
    const bool password = input.filename() == "a-encrypted-user-password.pdf";
    const fs::path output = out / input.filename();
    const GrayResult result = ConvertToGray(input.string(), output.string());
    if (password) {
      if (result.ok || result.error != "password")
        fail(input, "expected a password refusal, got " + ToJson(result));
      continue;
    }
    if (!result.ok) {
      fail(input, "not converted: " + ToJson(result));
      continue;
    }
    if (Pages(output) != Pages(input)) {
      fail(input, "pages changed or the result doesn't open");
      continue;
    }
    ++converted;
    if (result.colours + result.images + result.shadings + result.inlineImages + result.spots + result.wrapped > 0)
      ++changed;

    // The first page only, then each kind of content alone.
    GrayOptions some;
    some.pages = {1};
    const GrayResult first = ConvertToGray(input.string(), (out / ("page1-" + input.filename().string())).string(), some);
    if (!first.ok || first.converted != 1)
      fail(input, "first page only: " + ToJson(first));
    for (const bool drawings : {true, false}) {
      GrayOptions only;
      only.drawings = drawings;
      only.images = !drawings;
      const GrayResult part = ConvertToGray(input.string(), (out / ((drawings ? "drawings-" : "images-") + input.filename().string())).string(), only);
      if (!part.ok)
        fail(input, std::string(drawings ? "drawings only: " : "images only: ") + ToJson(part));
      else if (drawings && part.images + part.inlineImages > 0)
        fail(input, "drawings only made pictures gray: " + ToJson(part));
      // (colours counts a picture's palette entries too, so only gradients tell here.)
      else if (!drawings && part.shadings > 0)
        fail(input, "images only made gradients gray: " + ToJson(part));
    }
  }
  std::printf("Grayscale: %d of %zu converted (%d had colour to change), %d failures\n", converted, files.size(), changed, failures);
  return failures == 0 ? 0 : 1;
}
