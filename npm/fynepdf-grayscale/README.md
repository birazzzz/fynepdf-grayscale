# fynepdf-grayscale

**Make PDFs grey in place: text stays text, nothing is redrawn.** The
[fynepdf-grayscale](https://github.com/birazzzz/fynepdf-grayscale) command line and a Node API,
with no Ghostscript. Made by [FynePDF](https://fynepdf.com) for its web and desktop apps.

- **Every colour, where it is:** text and drawing colours, pictures, palettes, gradients,
  patterns, spot inks, and the appearances of comments and form fields.
- **Nothing else changes:** text stays selectable, and bookmarks, links, form fields, tags and
  attachments aren't touched.
- **Photos keep their quality:** most JPEGs are made grey without re-compressing them.
- **Fast:** a typical file takes 0.01 s; 1,067 files took 78 s, against 1,038 s for Ghostscript,
  which lost the text of 40 of them.

## Install

```sh
npm install fynepdf-grayscale
```

It brings the command line for your platform (Linux x64 and arm64 with glibc 2.28+, Windows x64,
macOS 11+ on Apple silicon and Intel). Nothing is downloaded at install time and no install script
runs.

## Command line

```sh
npx fynepdf-grayscale input.pdf output.pdf                    # every page
npx fynepdf-grayscale input.pdf output.pdf --pages 2-5,8      # only these pages
npx fynepdf-grayscale input.pdf output.pdf --only drawings    # text and drawings grey, photos in colour
npx fynepdf-grayscale input.pdf output.pdf --only images      # photos grey, text and drawings in colour
```

It prints what it did as one line of JSON.

## Node

```js
const { toGray } = require("fynepdf-grayscale"); // or: import { toGray } from "fynepdf-grayscale";

const result = await toGray("input.pdf", "output.pdf", { pages: [2, 3, 4], only: "drawings" });
console.log(`${result.converted} of ${result.pages} pages made grey`);
```

`toGray` rejects when the file can't be read (`error.code` `"unreadable"`), needs a password
(`"password"`), doesn't have the pages asked for (`"pages"`) or can't be written (`"write"`).
Options: `pages` (an array or `"2-5,8"`), `only` (`"drawings"` or `"images"`), `jpegQuality`
(default 90), `signal`. Types are included.

On a platform without a package, build the command line from the repository and set
`FYNEPDF_GRAYSCALE_BINARY` to it.

## More

How it works, the benchmark against Ghostscript and pages drawn as pictures, and the C++ library:
[github.com/birazzzz/fynepdf-grayscale](https://github.com/birazzzz/fynepdf-grayscale).

MIT, © 2026 FynePDF. The libraries inside each platform package keep their own licences
(`licenses/`).
