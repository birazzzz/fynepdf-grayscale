# Third-party notices

fynepdf-grayscale's own code is under the MIT licence (`LICENSE`). It copies no third-party
code; it links these libraries, which your build brings. A binary that includes them carries
their notices.

| Library | Use | Licence |
| --- | --- | --- |
| [qpdf](https://github.com/qpdf/qpdf) | reading and writing PDF objects | Apache-2.0 |
| [libjpeg-turbo](https://github.com/libjpeg-turbo/libjpeg-turbo) (or MozJPEG) | JPEG pictures | IJG licence and BSD-3-Clause |
| [OpenJPEG](https://github.com/uclouvain/openjpeg) (optional) | JPEG 2000 pictures | BSD-2-Clause |
| [Little CMS](https://github.com/mm2/Little-CMS) (optional) | ICC colour profiles | MIT |

The test files in `tests/fixtures` were made for these tests (by the PDF/A bench of the sister
project [fynepdf-pdfa](https://github.com/fynepdf/fynepdf-pdfa)) and are under the same MIT
licence.

## The documentation

`docs/assets` holds Hanken Grotesk (SIL Open Font License 1.1, `docs/assets/HankenGrotesk-OFL.txt`),
embedded in the README's animation, and the FynePDF mark.
