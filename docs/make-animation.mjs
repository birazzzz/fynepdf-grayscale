// Writes docs/grayscale.svg, the README's animation: three short scenes, one idea each.
//   1. One real PDF from the web made gray by Ghostscript, as pictures, and by fynepdf-grayscale;
//      then all its text is selected: only fynepdf-grayscale's still has all of it.
//   2. A race: making 1,067 files gray. fynepdf-grayscale is done while Ghostscript has done 8%.
//   3. What that adds up to.
// The numbers are docs/benchmarks.md's (c-0000013 is the real file). FynePDF's design system: the
// warm gray page, white cards, blue for ours, orange for errors, Hanken Grotesk embedded, the FynePDF logo.
// CSS only, a 15-second loop; under prefers-reduced-motion the first scene stands still.
//
//   node docs/make-animation.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const font = (file) => fs.readFileSync(path.join(here, "assets", file)).toString("base64");
const logo = fs
  .readFileSync(path.join(here, "assets", "fynepdf-logo.svg"), "utf8")
  .replace(/^<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "")
  .replaceAll("clip0_10990_4358", "logo-clip");

// c-0000013 (209 KB), and every conversion's time over 1,067 files. |width| is the result text's,
// measured in Chrome (Hanken Grotesk SemiBold, 20px), so the icon and text centre under the card.
const CARDS = [
  { name: "Ghostscript 10.08", text: "15% of the text", width: 136, size: "228 KB", selected: [0], ok: false },
  { name: "Pages as pictures", text: "No text", width: 66, size: "5.6 MB", selected: [], ok: false },
  { name: "fynepdf-grayscale", text: "All the text", width: 99, size: "202 KB", selected: [0, 1, 2, 3, 4, 5, 6, 7], ok: true },
];
const TIME = { ours: 78, gs: 1038 };

const LOOP = 15;
const SCENES = [[0, 6.6], [6.6, 12.6], [12.6, LOOP]];
const SWEEP = [1.4, 2.5]; // the pages turning gray
const SELECT = 3.0; // select all
const pc = (s) => `${Math.min(100, (100 * s) / LOOP).toFixed(2)}%`;
const css = [];
let n = 0;
const anim = (frames, { ease = "cubic-bezier(0.16,1,0.3,1)" } = {}) => {
  const name = `k${n++}`;
  css.push(`@keyframes ${name}{${frames}}`);
  return `animation:${name} ${LOOP}s ${ease} infinite`;
};
/** Visible from |from| to |to| (a scene), fading in and out. */
const scene = ([from, to]) =>
  `style="${anim(`0%,${pc(from)}{opacity:0}${pc(from + 0.4)},${pc(to - 0.4)}{opacity:1}${pc(to)},100%{opacity:0}`, { ease: "cubic-bezier(0.4,0,0.2,1)" })}"`;
/** Rises and fades in at |at|. */
const rise = (at, dy = 10) =>
  `style="${anim(`0%,${pc(at)}{opacity:0;transform:translateY(${dy}px)}${pc(at + 0.5)},100%{opacity:1;transform:none}`)}"`;
/** Grows from the left over |dur| seconds from |at|. */
const fill = (at, dur, ease = "linear") =>
  `class="l" style="${anim(`0%,${pc(at)}{transform:scaleX(0)}${pc(at + dur)},100%{transform:none}`, { ease })}"`;
const tick = (cx, cy, r = 11) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#18d54b"/><path d="M${cx - r * 0.45} ${cy + r * 0.05} l${r * 0.3} ${r * 0.3} l${r * 0.6} -${r * 0.65}" fill="none" stroke="#fff" stroke-width="${r * 0.2}" stroke-linecap="round" stroke-linejoin="round"/>`;
const cross = (cx, cy, r = 11) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#d55418"/><path d="M${cx - r * 0.35} ${cy - r * 0.35} l${r * 0.7} ${r * 0.7} m0 -${r * 0.7} l-${r * 0.7} ${r * 0.7}" stroke="#fff" stroke-width="${r * 0.2}" stroke-linecap="round"/>`;

// The page: heading, chart, photo, lines of text. Drawn at 0,0, 210 by 270.
// Each text item, as [x, y, width]: the heading, six lines, the coloured line at the bottom.
const TEXT = [[18, 20, 132], ...[0, 1, 2, 3, 4, 5].map((i) => [18, 152 + i * 16, i % 3 === 2 ? 110 : 174]), [18, 240, 100]];
function page(gray) {
  // Luma of each colour, 0.299 R + 0.587 G + 0.114 B, as the library computes it.
  const c = (colour, luma) => (gray ? `rgb(${luma},${luma},${luma})` : colour);
  return `<rect width="210" height="270" rx="6" fill="#fff"/>
    <text x="18" y="32" class="pagehead" fill="${c("#007bff", 102)}">Quarterly report</text>
    <rect x="18" y="44" width="150" height="5" rx="2.5" fill="#e6e8ee"/>
    <rect x="18" y="56" width="120" height="5" rx="2.5" fill="#e6e8ee"/>
    <rect x="18" y="76" width="80" height="62" rx="4" fill="${c("#f3f1f0", 242)}"/>
    <rect x="26" y="110" width="12" height="22" rx="2" fill="${c("#7b52c7", 108)}"/>
    <rect x="43" y="96" width="12" height="36" rx="2" fill="${c("#0e96a6", 117)}"/>
    <rect x="60" y="88" width="12" height="44" rx="2" fill="${c("#d08315", 151)}"/>
    <rect x="77" y="102" width="12" height="30" rx="2" fill="${c("#c4489a", 115)}"/>
    <rect x="106" y="76" width="86" height="62" rx="4" fill="${c("#9fd2ff", 199)}"/>
    <circle cx="172" cy="92" r="8" fill="${c("#ffc94a", 205)}"/>
    <path d="M106 124 q20 -18 40 -4 t46 -6 v24 h-86 z" fill="${c("#4caf6a", 140)}"/>
    <path d="M106 130 q30 -10 56 2 t30 0 v6 h-86 z" fill="${c("#2e7d4a", 98)}"/>
    ${TEXT.slice(1, 7).map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="5" rx="2.5" fill="${gray ? "#d6d6d6" : "#e6e8ee"}"/>`).join("\n    ")}
    <text x="18" y="250" class="pagebody" fill="${c("#c4489a", 115)}">Revenue up 12%</text>`;
}

const parts = [];

// Scene 1: one real file, three ways; then select all.
const s1 = SCENES[0];
css.push(`@keyframes reveal{0%,${pc(SWEEP[0])}{clip-path:inset(0 0 100% 0)}${pc(SWEEP[1])},100%{clip-path:inset(0)}}`);
parts.push(`<g class="still" ${scene(s1)}>
  <g ${rise(s1[0] + 0.1)}>
    <text x="600" y="92" class="h1" text-anchor="middle">One real PDF from the web, made gray</text>
    <text x="600" y="126" class="h2" text-anchor="middle">209 KB in · then select all its text</text>
  </g>`);
CARDS.forEach((card, i) => {
  const cx = 230 + i * 370;
  // The result: a 20px icon, 10px, the text; centred as one.
  const left = cx - (30 + card.width) / 2;
  const sel = card.selected
    .map((k, j) => {
      const [x, y, w] = TEXT[k];
      const top = k === 7 ? y + 1 : y - 4;
      const h = k === 0 ? 18 : 13;
      return `<rect x="${x - 3}" y="${top}" width="${w + 6}" height="${h}" rx="2" fill="#007bff" fill-opacity="0.28" ${fill(SELECT + j * 0.09, 0.25, "cubic-bezier(0.16,1,0.3,1)")}/>`;
    })
    .join("");
  parts.push(`  <rect x="${cx - 170}" y="160" width="340" height="460" rx="20" class="card"/>
  <text x="${cx}" y="204" class="${card.ok ? "name-ours" : "name"}" text-anchor="middle">${card.name}</text>
  <g transform="translate(${cx - 105} 228)">
    <g class="paper">${page(false)}</g>
    <g class="gray">${page(true)}</g>
    ${sel}
  </g>
  <g ${rise(SELECT + 1.0, 6)}>
    ${(card.ok ? tick : cross)(left + 10, 545, 10)}
    <text x="${left + 30}" y="551" class="${card.ok ? "res-ours" : "res"}">${card.text}</text>
  </g>
  <g ${rise(SELECT + 1.3, 6)}><text x="${cx}" y="586" class="${card.size.endsWith("MB") ? "size-bad" : "size"}" text-anchor="middle">${card.size}</text></g>`);
});
parts.push(`</g>`);

// Scene 2: the race.
const s2 = SCENES[1];
const start = s2[0] + 0.7, oursDur = 0.33, gsDur = oursDur * (TIME.gs / TIME.ours);
parts.push(`<g ${scene(s2)}>
  <g ${rise(s2[0] + 0.1)}>
    <text x="600" y="150" class="h1" text-anchor="middle">Making 1,067 files gray</text>
    <text x="600" y="184" class="h2" text-anchor="middle">every conversion's time, added up</text>
  </g>
  <text x="140" y="300" class="name-ours">fynepdf-grayscale</text>
  <rect x="140" y="320" width="880" height="34" rx="17" fill="#e7e7e7"/>
  <rect x="140" y="320" width="880" height="34" rx="17" fill="url(#blue)" ${fill(start, oursDur)}/>
  <g ${rise(start + oursDur, 0)}><text x="1040" y="345" class="time-ours">78 s</text>${tick(1118, 337, 12)}</g>
  <text x="140" y="430" class="name">Ghostscript 10.08</text>
  <rect x="140" y="450" width="880" height="34" rx="17" fill="#e7e7e7"/>
  <rect x="140" y="450" width="880" height="34" rx="17" fill="#a9a7a5" ${fill(start, gsDur)}/>
  <g ${rise(start + gsDur, 0)}><text x="1040" y="475" class="time">1,038 s</text></g>
  <g ${rise(start + oursDur + 0.3, 8)}>
    <text x="600" y="560" class="h3" text-anchor="middle">fynepdf-grayscale is done when Ghostscript has done 8%</text>
  </g>
</g>`);

// Scene 3: what it adds up to.
const s3 = SCENES[2];
parts.push(`<g ${scene(s3)}>
  <g ${rise(s3[0] + 0.2)}><svg x="460" y="178.6" width="280" height="62.8" viewBox="0 0 107 24">${logo}</svg></g>
  <g ${rise(s3[0] + 0.4)}>
    <text x="600" y="345" class="title" text-anchor="middle">fynepdf-grayscale</text>
    <text x="600" y="395" class="h2b" text-anchor="middle">Text stays text. Links and tags kept. 13× faster than Ghostscript.</text>
  </g>
  <g ${rise(s3[0] + 0.8)}>
    <text x="600" y="465" class="made" text-anchor="middle">Made by FynePDF · MIT</text>
  </g>
</g>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="One real 209 KB PDF from the web made gray three ways, then all its text selected: Ghostscript 10.08's file keeps 15% of the text (228 KB), pages drawn as pictures keep none (5.6 MB), fynepdf-grayscale's keeps all of it (202 KB). Making 1,067 files gray takes fynepdf-grayscale 78 seconds and Ghostscript 1,038: fynepdf-grayscale is done when Ghostscript has done 8%. Text stays text, links and tags kept, 13 times faster than Ghostscript. Made by FynePDF.">
<title>fynepdf-grayscale against Ghostscript</title>
<defs>
  <linearGradient id="blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#007bff"/><stop offset="1" stop-color="#0046b7"/></linearGradient>
  <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#1e1c1c" flood-opacity="0.08"/></filter>
  <filter id="paper" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#1e1c1c" flood-opacity="0.12"/></filter>
</defs>
<style>
@font-face{font-family:"Hanken Grotesk";font-weight:400;src:url(data:font/woff;base64,${font("HankenGrotesk-Regular.woff")}) format("woff")}
@font-face{font-family:"Hanken Grotesk";font-weight:600;src:url(data:font/woff;base64,${font("HankenGrotesk-SemiBold.woff")}) format("woff")}
text{font-family:"Hanken Grotesk",system-ui,-apple-system,"Segoe UI",sans-serif}
.h1{font-size:34px;font-weight:600;fill:#1e1c1c;letter-spacing:-0.01em}
.h2{font-size:19px;fill:#7a7876}
.h2b{font-size:24px;fill:#404040}
.h3{font-size:22px;font-weight:600;fill:#1e1c1c}
.title{font-size:56px;font-weight:600;fill:#1e1c1c;letter-spacing:-0.01em}
.name{font-size:22px;font-weight:600;fill:#404040}
.name-ours{font-size:22px;font-weight:600;fill:#005fdb}
.pagehead{font-size:17px;font-weight:600}
.pagebody{font-size:12px;font-weight:600}
.res{font-size:20px;font-weight:600;fill:#d55418}
.res-ours{font-size:20px;font-weight:600;fill:#0d7a2b}
.size{font-size:18px;fill:#7a7876}
.size-bad{font-size:18px;font-weight:600;fill:#d55418}
.time{font-size:22px;font-weight:600;fill:#404040}
.time-ours{font-size:22px;font-weight:600;fill:#005fdb}
.made{font-size:18px;font-weight:600;fill:#404040}
.card{fill:#fff;filter:url(#shadow)}
.paper{filter:url(#paper)}
.gray{animation:reveal ${LOOP}s cubic-bezier(0.65,0,0.35,1) infinite}
.o,.l{transform-box:fill-box}
.o{transform-origin:center}
.l{transform-origin:left center}
${css.join("\n")}
@media (prefers-reduced-motion:reduce){*{animation:none!important}g[style]{opacity:0}.still,.still [style]{opacity:1!important}}
</style>
<rect width="1200" height="675" fill="#f3f1f0"/>
${parts.join("\n")}
</svg>
`;
fs.writeFileSync(path.join(here, "grayscale.svg"), svg);
console.log(`docs/grayscale.svg: ${(svg.length / 1024).toFixed(0)} KB`);
