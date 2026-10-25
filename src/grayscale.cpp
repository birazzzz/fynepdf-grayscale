#include "fynepdf/grayscale/grayscale.h"

#include "colour.h"
#include "common.h"

#include <set>
#include <string>
#include <vector>

#include <qpdf/QPDF.hh>
#include <qpdf/QPDFExc.hh>
#include <qpdf/QPDFObjectHandle.hh>
#include <qpdf/QPDFPageDocumentHelper.hh>
#include <qpdf/QPDFPageObjectHelper.hh>
#include <qpdf/QPDFWriter.hh>

namespace fynepdf::grayscale {

GrayResult ConvertToGray(const std::string &input, const std::string &output, const GrayOptions &options) {
  GrayResult result;
  QPDF q;
  QPDF gray_copy;  // for a choice of pages: its pages are converted and moved across
  try {
    Open(q, input);
  } catch (const QPDFExc &error) {
    result.error = error.getErrorCode() == qpdf_e_password ? "password" : "unreadable";
    return result;
  } catch (const std::exception &) {
    result.error = "unreadable";
    return result;
  }
  ColourStats stats;
  ColourOptions colour;
  colour.target = Target::Gray;
  colour.drawings = options.drawings;
  colour.images = options.images;
  colour.jpegQuality = options.jpegQuality;
  try {
    std::vector<QPDFPageObjectHelper> pages = QPDFPageDocumentHelper(q).getAllPages();
    result.pages = static_cast<int>(pages.size());
    std::set<int> chosen;
    for (const int page : options.pages) {
      if (page < 1 || page > result.pages) {
        result.error = "pages";
        return result;
      }
      chosen.insert(page - 1);
    }
    result.signatures = CountSignatures(q);
    if (chosen.empty() || static_cast<int>(chosen.size()) == result.pages) {
      ColourConverter converter(q, stats, colour);
      for (QPDFPageObjectHelper &page : pages)
        converter.Page(page);
      converter.FormDefaults();
      result.converted = result.pages;
    } else {
      // Pages share pictures, fonts and forms. The chosen pages are converted in a copy of the
      // file and their content, resources and appearances moved into the original's same page
      // objects, so the other pages keep their colours and links and bookmarks keep their pages.
      Open(gray_copy, input);
      std::vector<QPDFPageObjectHelper> gray_pages = QPDFPageDocumentHelper(gray_copy).getAllPages();
      ColourConverter converter(gray_copy, stats, colour);
      for (const int index : chosen)
        converter.Page(gray_pages[static_cast<size_t>(index)]);
      for (const int index : chosen) {
        QPDFObjectHandle target = pages[static_cast<size_t>(index)].getObjectHandle();
        QPDFObjectHandle source = gray_pages[static_cast<size_t>(index)].getObjectHandle();
        for (const char *key : {"/Contents", "/Resources", "/Group"}) {
          if (source.hasKey(key))
            target.replaceKey(key, Foreign(q, gray_copy, source.getKey(key)));
          else
            target.removeKey(key);
        }
        QPDFObjectHandle from = source.getKey("/Annots"), to = target.getKey("/Annots");
        for (int at = 0; from.isArray() && to.isArray() && at < std::min(from.getArrayNItems(), to.getArrayNItems()); ++at) {
          QPDFObjectHandle annotation = to.getArrayItem(at), gray = from.getArrayItem(at);
          if (!annotation.isDictionary() || !gray.isDictionary())
            continue;
          for (const char *key : {"/AP", "/C", "/IC", "/MK", "/DA"})
            if (gray.hasKey(key))
              annotation.replaceKey(key, Foreign(q, gray_copy, gray.getKey(key)));
        }
      }
      result.converted = static_cast<int>(chosen.size());
    }
  } catch (const std::exception &) {
    result.error = "unreadable";
    return result;
  }
  result.colours = stats.colours;
  result.images = stats.images;
  result.jpegLossless = stats.jpegLossless;
  result.shadings = stats.shadings;
  result.inlineImages = stats.inlineImages;
  result.spots = stats.spots;
  result.imagesKept = stats.imagesKept;
  result.shadingsKept = stats.shadingsKept;
  result.inlineKept = stats.inlineKept;
  result.contentKept = stats.contentKept;
  result.wrapped = stats.wrapped;
  try {
    QPDFWriter writer(q, output.c_str());
    writer.setObjectStreamMode(qpdf_o_preserve);
    writer.setCompressStreams(true);
    // The same input gives the same bytes (qpdf allows it only without encryption).
    if (!q.isEncrypted())
      writer.setDeterministicID(true);
    writer.write();
  } catch (const std::exception &) {
    result.error = "write";
    return result;
  }
  result.ok = true;
  return result;
}

std::string ToJson(const GrayResult &r) {
  std::string json = "{\"ok\":" + std::string(r.ok ? "true" : "false");
  if (!r.error.empty())
    json += ",\"error\":\"" + r.error + "\"";
  const std::pair<const char *, int> fields[] = {{"pages", r.pages},
                                                 {"converted", r.converted},
                                                 {"colours", r.colours},
                                                 {"images", r.images},
                                                 {"jpegLossless", r.jpegLossless},
                                                 {"shadings", r.shadings},
                                                 {"inlineImages", r.inlineImages},
                                                 {"spots", r.spots},
                                                 {"imagesKept", r.imagesKept},
                                                 {"shadingsKept", r.shadingsKept},
                                                 {"inlineKept", r.inlineKept},
                                                 {"contentKept", r.contentKept},
                                                 {"wrapped", r.wrapped},
                                                 {"signatures", r.signatures}};
  for (const auto &[key, value] : fields)
    json += ",\"" + std::string(key) + "\":" + std::to_string(value);
  return json + "}";
}

} // namespace fynepdf::grayscale
