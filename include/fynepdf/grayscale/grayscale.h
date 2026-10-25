#pragma once

#include <string>
#include <vector>

namespace fynepdf::grayscale {

struct GrayOptions {
  // The pages to make grey, 1-based; empty for all. Other pages stay exactly as they are, even
  // when they share pictures or fonts with the converted ones.
  std::vector<int> pages;
  // What to make grey: text and drawings (with gradients, patterns, comments and form fields),
  // pictures, or both. With only one, transparency groups keep their colour space.
  bool drawings = true;
  bool images = true;
  // For photos that have to be re-compressed (most JPEGs are made grey without it).
  int jpegQuality = 90;
};

struct GrayResult {
  bool ok = false;
  // When not ok: "unreadable", "password", "pages" (a page outside the document) or "write".
  std::string error;
  int pages = 0;       // in the document
  int converted = 0;   // pages made grey
  int colours = 0;     // colour operators rewritten
  int images = 0;      // pictures made grey
  int jpegLossless = 0;  // of those, JPEGs made grey without re-compressing (their brightness kept)
  int shadings = 0;    // gradients made grey
  int inlineImages = 0;
  int spots = 0;       // spot-ink colours made grey
  // What couldn't be converted and still has colour: Lab or spot-ink pictures and gradients that
  // can't be decoded, JPEG 2000 without OpenJPEG and without a colour space, content that doesn't
  // parse.
  int imagesKept = 0, shadingsKept = 0, inlineKept = 0, contentKept = 0;
  // Of those made grey, how many through a colour space that draws them grey (DeviceN with a
  // grey alternate), their data left as it was: mesh gradients, colour-keyed pictures, pictures
  // that can't be decoded here or are too large to.
  int wrapped = 0;
  int signatures = 0;  // signed signature fields: rewriting the file invalidates them
};

// A PDF's colours made grey in place: text and drawing colours, pictures, palettes, gradients,
// patterns, spot inks, transparency groups, soft masks, Type 3 glyphs and the appearances of
// comments and form fields. Text stays text, pictures keep their size, and everything else in
// the file (bookmarks, links, forms, tags, attachments) is untouched. Grey is luma, 0.299 R +
// 0.587 G + 0.114 B, as a JPEG's brightness channel is; CMYK is 1 - min(1, 0.3 C + 0.59 M +
// 0.11 Y + K).
GrayResult ConvertToGray(const std::string &input, const std::string &output, const GrayOptions &options = {});

// The result as one line of JSON.
std::string ToJson(const GrayResult &result);

} // namespace fynepdf::grayscale
