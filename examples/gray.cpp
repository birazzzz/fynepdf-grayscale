// Makes a PDF grey: every page, or only some (`gray in.pdf out.pdf 2-5`).
#include <fynepdf/grayscale/grayscale.h>

#include <iostream>
#include <string>

int main(int argc, char **argv) {
  if (argc < 3) {
    std::cerr << "usage: gray <input.pdf> <output.pdf> [first-last]\n";
    return 64;
  }
  fynepdf::grayscale::GrayOptions options;  // text, drawings and pictures; options.images = false
                                            // keeps pictures in colour
  if (argc == 4) {
    const std::string range = argv[3];
    const int first = std::stoi(range), last = std::stoi(range.substr(range.find('-') + 1));
    for (int page = first; page <= last; ++page)
      options.pages.push_back(page);  // 1-based; other pages stay exactly as they are
  }
  const fynepdf::grayscale::GrayResult result = fynepdf::grayscale::ConvertToGray(argv[1], argv[2], options);
  if (!result.ok) {
    std::cerr << "not converted: " << result.error << "\n";  // "password", "unreadable", ...
    return 1;
  }
  std::cout << result.converted << " of " << result.pages << " pages grey, " << result.images
            << " pictures (" << result.jpegLossless << " JPEGs without re-compressing)\n";
  return 0;
}
