# Benchmarks

fynepdf-grayscale against the two usual ways of making a PDF gray, on the same 1,067 files:
Ghostscript's gray conversion, and drawing every page as a gray picture (what many "convert to
grayscale" apps do).

**In short:** no colour left on any page, no text lost, nothing lost (bookmarks, links, form
fields, tags), files the same size or a little smaller, and 13 to 23 times less time than
Ghostscript in total (9 times less than drawing pages as pictures), with at most 255 MB of
memory where Ghostscript reaches 1.4 GB.

## Results, sets A, C and E

| Tool | Colour left | Text lost | Pages look different | Files that lost something | Median size | Time, summed | Slowest file | Most memory |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **fynepdf-grayscale** | 0 of 1,062 | 0 of 950 | 3 | 0 | 0.94× | 78 s | 3.5 s | 255 MB |
| Ghostscript 10.08 | 5 of 1,064 | 40 of 949 | 221 | 370 | 0.64× | 1,038 s | 105 s | 1375 MB |
| Ghostscript 10.00 | 5 of 1,064 | 83 of 949 | 222 | 378 | 0.66× | 1,816 s | 229 s | 1378 MB |
| Pages as pictures | 0 of 1,062 | 950 of 950 | 994 | 593 | 4.46× | 705 s | 45 s | 655 MB |

### Files that lost each kind of thing

| Tool | bookmarks | links | fields | tags | comments | attachments | signatures | pages |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **fynepdf-grayscale** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Ghostscript 10.08 | 3 | 3 | 18 | 350 | 1 | 5 | 8 | 0 |
| Ghostscript 10.00 | 6 | 10 | 18 | 350 | 1 | 6 | 8 | 1 |
| Pages as pictures | 114 | 334 | 18 | 350 | 17 | 6 | 8 | 0 |

**Why Ghostscript's files are smaller:** it re-compresses every picture and rebuilds the file
without what it doesn't carry over (tags, some fields and links). fynepdf-grayscale keeps
pictures at their quality (a JPEG photo keeps its brightness exactly, its colour dropped) and
keeps everything else, and its files still come out a little smaller than the input.

## Real files

- **c-0000013** (real world, 209 KB): fynepdf-grayscale writes 202 KB with all the text. Ghostscript
  10.08 writes 228 KB in which pdf.js finds 15% of the text. Pages as pictures: 5.6 MB, no text.
- **c-0000000** (30 KB, made with InDesign): fynepdf-grayscale 30 KB, all text kept.
  Ghostscript 36 KB with 10% of the text; pictures 1.6 MB.
- **c-0000028** (502 KB): fynepdf-grayscale 479 KB, all text kept, 0.02 s. Ghostscript 223 KB
  with 14% of the text; pictures 4.4 MB.

## How it was measured

The files and the measures are the [fynepdf-pdfa bench](https://github.com/fynepdf/fynepdf-pdfa/blob/main/docs/benchmarks.md):
set A (56 small PDFs made for the bench), set C (1,000 PDFs from Digital Corpora's SafeDocs web
crawl) and set E (11 exports from Chrome, LibreOffice and LaTeX). The veraPDF corpus is a PDF/A
test, so Grayscale doesn't run on it; a private set of 93 files is left out of these numbers.

- **Colour left:** Poppler draws the first 10 pages of the result; a page with colour on more
  than 0.1% of its pixels counts.
- **Text lost:** pdf.js finds less than 90% of the input's text in the result.
- **Pages look different:** the result's pages against the input's drawn in gray, at 30 dpi.
- **Lost:** bookmarks, links, form fields, tags, comments, attachments, signatures or pages the
  input had and the result doesn't.
- **Time and memory:** GNU time per conversion, 4 at once in Docker with 8 CPUs and 8 GB on an
  x86-64 desktop.

The commands: `fynepdf-grayscale in.pdf out.pdf`; Ghostscript
`gs -sDEVICE=pdfwrite -dProcessColorModel=/DeviceGray -dColorConversionStrategy=/Gray -dNOPAUSE -dBATCH -sOutputFile=out.pdf in.pdf`
(10.08.0 and Debian bookworm's 10.00.0); pages as pictures
`pdftoppm -r 180 -gray -jpeg -jpegopt quality=84` then `img2pdf`.

To run it yourself, check out this repository next to fynepdf-pdfa, build it with
`scripts/build-linux.sh`, and follow the bench's instructions; the Grayscale task runs this
project's command line.
