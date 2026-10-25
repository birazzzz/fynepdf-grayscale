# How fynepdf-grayscale works

Most tools make a PDF grey one of two ways. They draw every page as a picture and save the
pictures (the text stops being text, and the file grows several times over), or they send the
file through Ghostscript, which rebuilds every object on the way and loses some of them:
bookmarks, links, tags, sometimes the text's meaning.

fynepdf-grayscale does neither. It opens the file with [qpdf](https://github.com/qpdf/qpdf),
finds every place a colour is set, and rewrites that colour where it stands. Text stays text,
pictures keep their size, and everything that has no colour (bookmarks, links, form fields,
tags, attachments, metadata) isn't touched at all.

## Grey, exactly

Grey is luma, the brightness a JPEG stores: `0.299 R + 0.587 G + 0.114 B`. CMYK becomes
`1 - min(1, 0.3 C + 0.59 M + 0.11 Y + K)`. Colours with an ICC profile go through their own
profile when Little CMS is there; Lab, calibrated and spot-ink colours through their own
definitions.

## Where colours are, and what happens to each

| Where | What happens |
| --- | --- |
| Colours in page content (`rg`, `RG`, `k`, `K`, `sc`, `scn`, `cs`) | Rewritten operator by operator to grey; the rest of the content stream stays byte for byte. |
| Forms, patterns, Type 3 glyphs, soft masks | The same, in their own content, each only once even when many pages use it. |
| JPEG pictures | Made grey without re-compressing when their colours are stored as brightness plus colour (YCbCr, most photos): the brightness is kept exactly, the colour dropped. Others are decoded and re-encoded at `--jpeg-quality` (90 by default). |
| Other pictures (Flate, LZW, run-length, inline pictures) | Decoded, made grey, compressed again without loss. |
| Palettes (indexed pictures) | Only the palette changes; the picture's data stays. |
| Gradients (shadings) | Their functions sampled and rewritten in grey; mesh gradients keep their data under a grey colour space. |
| Spot inks (Separation, DeviceN) | Their tints mapped to the grey their alternate colours make, so a spot logo keeps its shade. |
| Comments and form fields | Their appearances made grey, and the default appearance a reader redraws a field from. |
| Transparency groups | Their blending space set to grey, so blends come out grey too. |

When something can't be decoded (a picture with a filter nobody has, a JPEG 2000 picture without
OpenJPEG), its data is left alone and it gets a colour space that draws it grey: readers convert
it as they draw. The result's `wrapped` and `*Kept` counts say how many of each there were.

## Choices

- **Some pages:** `GrayOptions::pages` (`--pages 2-5,8`). Only those pages change; a picture or
  font they share with other pages is copied first, so the other pages stay exactly as they
  were.
- **Text and drawings only** (`drawings = true, images = false`, `--only drawings`): the pictures
  keep their colour. Useful for printing a report in grey ink with its photos still in colour.
- **Pictures only** (`--only images`): text, lines, charts and coloured headings keep their
  colour.

## What it doesn't change

Signatures: rewriting the file breaks a digital signature, and `GrayResult::signatures` counts
the signed fields so an app can warn first. Files that need a password to open are refused
(`error: "password"`).

## Memory and speed

Content is rewritten operator by operator, never held as a parsed tree; new stream data over
32 MB is kept compressed until the file is written; JPEGs that only drop their colour are never
decoded to pixels. On the bench's 1,067 public files the conversions took 78 s in total, the
slowest 3.5 s, and none used more than 255 MB ([benchmarks](benchmarks.md)).

## How it's checked

`ctest` makes the 64 files in `tests/fixtures` grey whole, first page only, and with each kind of
content alone, and checks that every result opens with its pages and that "only" means only.
The PDF/A project's [bench](https://github.com/birazzzz/fynepdf-pdfa/tree/main/bench) draws the
pages of every result and checks that no colour is left, that the text is still there and that
the pages look as they should.
