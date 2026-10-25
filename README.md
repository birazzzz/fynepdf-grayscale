# fynepdf-grayscale

Makes a PDF grey in place: colours, pictures, gradients and spot inks are rewritten, while text
stays text and bookmarks, links, forms and tags stay as they are. A C++17 library on
[qpdf](https://github.com/qpdf/qpdf), with a command line. Made by [FynePDF](https://fynepdf.com).

> Work in progress: the full README (how it works, benchmarks, install) is being written.

```sh
fynepdf-grayscale input.pdf output.pdf                 # every page
fynepdf-grayscale input.pdf output.pdf --pages 2-5     # only these pages
fynepdf-grayscale input.pdf output.pdf --only images   # pictures grey, text and drawings in colour
```

```cpp
#include <fynepdf/grayscale/grayscale.h>

fynepdf::grayscale::GrayResult result = fynepdf::grayscale::ConvertToGray("in.pdf", "out.pdf");
```

Build and test: `cmake --preset default && cmake --build --preset default && ctest --preset default`
(qpdf, libjpeg-turbo, OpenJPEG and Little CMS from the system), or `--preset vcpkg`.

MIT licence. Sister project: [fynepdf-pdfa](https://github.com/birazzzz/fynepdf-pdfa).
