// fynepdf-grayscale: the library's command line.
//
//   fynepdf-grayscale <input.pdf> <output.pdf> [--pages 1-3,5] [--only drawings|images] [--jpeg-quality 90]
//
// Prints the result as one line of JSON. Exit codes: 0 done, 2 needs a password, 3 can't be read,
// 4 a page that isn't in the file, 5 can't be written, 64 wrong arguments.

#include "fynepdf/grayscale/grayscale.h"

#include <cstdlib>
#include <iostream>
#include <string>
#include <vector>

namespace {

// "1-3,5" as 1, 2, 3, 5.
bool ParsePages(const std::string &text, std::vector<int> &pages) {
  size_t at = 0;
  while (at < text.size()) {
    size_t end = text.find(',', at);
    if (end == std::string::npos)
      end = text.size();
    const std::string part = text.substr(at, end - at);
    const size_t dash = part.find('-');
    char *rest = nullptr;
    const long first = std::strtol(part.c_str(), &rest, 10);
    long last = first;
    if (dash != std::string::npos)
      last = std::strtol(part.c_str() + dash + 1, &rest, 10);
    if (first < 1 || last < first || last - first > 100000 || (rest && *rest))
      return false;
    for (long page = first; page <= last; ++page)
      pages.push_back(static_cast<int>(page));
    at = end + 1;
  }
  return !pages.empty();
}

int Usage() {
  std::cerr << "usage: fynepdf-grayscale <input.pdf> <output.pdf> [--pages 1-3,5] [--only drawings|images] [--jpeg-quality 90]\n"
               "  --pages         only these pages turn grey; the rest stay exactly as they are\n"
               "  --only drawings text and drawings turn grey, pictures keep their colour\n"
               "  --only images   pictures turn grey, text and drawings keep their colour\n";
  return 64;
}

} // namespace

int main(int argc, char **argv) {
  if (argc < 3)
    return Usage();
  fynepdf::grayscale::GrayOptions options;
  for (int index = 3; index < argc; ++index) {
    const std::string arg = argv[index];
    if (arg == "--pages" && index + 1 < argc) {
      if (!ParsePages(argv[++index], options.pages))
        return Usage();
    } else if (arg == "--only" && index + 1 < argc) {
      const std::string only = argv[++index];
      if (only != "drawings" && only != "images")
        return Usage();
      options.drawings = only == "drawings";
      options.images = only == "images";
    } else if (arg == "--jpeg-quality" && index + 1 < argc) {
      options.jpegQuality = std::atoi(argv[++index]);
      if (options.jpegQuality < 10 || options.jpegQuality > 100)
        return Usage();
    } else {
      return Usage();
    }
  }
  const fynepdf::grayscale::GrayResult result = fynepdf::grayscale::ConvertToGray(argv[1], argv[2], options);
  std::cout << fynepdf::grayscale::ToJson(result) << "\n";
  if (result.ok)
    return 0;
  return result.error == "password" ? 2 : result.error == "pages" ? 4 : result.error == "write" ? 5 : 3;
}
