// Writes docs/grayscale.svg, the README's animation: a colour page made grey in place (text still
// selectable afterwards), then three results from docs/benchmarks.md. FynePDF's design system:
// the warm grey page, white cards, blue for ours, Hanken Grotesk (embedded, so it renders the
// same everywhere), Fynebot. Motion is CSS, a 12-second loop, still under prefers-reduced-motion.
//
//   node docs/make-animation.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const font = (file) => fs.readFileSync(path.join(here, "assets", file)).toString("base64");
const mark = fs
  .readFileSync(path.join(here, "assets", "fynepdf-mark.svg"), "utf8")
  .replace(/^<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "")
  .replaceAll("clip0_2233_1174", "mark-clip");

// The numbers, from docs/benchmarks.md (sets A, C and E).
const GROUPS = [
  {
    title: "Files whose text was lost",
    note: "of 950 files with text · lower is better",
    max: 950,
    bad: true,
    rows: [
      ["fynepdf-grayscale", 0, "0"],
      ["Ghostscript 10.08", 40, "40"],
      ["Pages as pictures", 950, "950"],
    ],
  },
  {
    title: "Files that lost links, tags or fields",
    note: "of 1,067 files · lower is better",
    max: 593,
    bad: true,
    rows: [
      ["fynepdf-grayscale", 0, "0"],
      ["Ghostscript 10.08", 370, "370"],
      ["Pages as pictures", 593, "593"],
    ],
  },
  {
    title: "Time for 1,067 files",
    note: "every conversion, summed · lower is better",
    max: 1038,
    rows: [
      ["fynepdf-grayscale", 78, "78 s"],
      ["Ghostscript 10.08", 1038, "1,038 s"],
      ["Pages as pictures", 705, "705 s"],
    ],
  },
];
const KEPT = ["Colours rewritten in place", "Photos keep their quality", "Bookmarks and links kept"];

const LOOP = 12; // seconds
const SWEEP = [1.0, 2.6]; // the page turning grey
const pc = (seconds) => `${((100 * seconds) / LOOP).toFixed(2)}%`;
const css = [];
let id = 0;
const appear = (at, { rise = 8, dur = 0.5 } = {}) => {
  const name = `a${id++}`;
  css.push(`@keyframes ${name}{0%,${pc(at)}{opacity:0;transform:translateY(${rise}px)}${pc(at + dur)},100%{opacity:1;transform:none}}`);
  return `style="animation:${name} ${LOOP}s cubic-bezier(0.16,1,0.3,1) infinite"`;
};
const grow = (at) => {
  const name = `a${id++}`;
  css.push(`@keyframes ${name}{0%,${pc(at)}{transform:scaleX(0)}${pc(at + 0.7)},100%{transform:none}}`);
  return `class="bar" style="animation:${name} ${LOOP}s cubic-bezier(0.16,1,0.3,1) infinite"`;
};
const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
css.push(`@keyframes scene{0%,${pc(LOOP - 0.8)}{opacity:1}${pc(LOOP - 0.25)},100%{opacity:0}}`);
// The grey page uncovered left to right, and the line that does it.
css.push(`@keyframes reveal{0%,${pc(SWEEP[0])}{clip-path:inset(0 100% 0 0)}${pc(SWEEP[1])},100%{clip-path:inset(0 0 0 0)}}`);
css.push(`@keyframes sweep{0%,${pc(SWEEP[0])}{opacity:0;transform:translateX(0)}${pc(SWEEP[0] + 0.1)}{opacity:1}${pc(SWEEP[1] - 0.1)}{opacity:1}${pc(SWEEP[1])}{opacity:0;transform:translateX(210px)}100%{opacity:0;transform:translateX(210px)}}`);
// Fynebot's eyes follow the line, then come back.
css.push(`@keyframes look{0%,${pc(SWEEP[0])}{transform:translateX(-4px)}${pc(SWEEP[1])}{transform:translateX(4px)}${pc(SWEEP[1] + 0.6)},100%{transform:none}}`);

/** The page's drawing, in colour or in grey: heading, chart, photo, lines of text. */
function page(grey) {
  const c = (colour, luma) => (grey ? `rgb(${luma},${luma},${luma})` : colour);
  // Luma of each colour, 0.299 R + 0.587 G + 0.114 B, as the library computes it.
  return `<rect x="92" y="194" width="210" height="270" rx="6" fill="#fff"/>
  <text x="110" y="226" class="t-pagehead" fill="${c("#007bff", 102)}">Quarterly report</text>
  <rect x="110" y="238" width="150" height="5" rx="2.5" fill="#e6e8ee"/>
  <rect x="110" y="250" width="120" height="5" rx="2.5" fill="#e6e8ee"/>
  <rect x="110" y="270" width="80" height="62" rx="4" fill="${c("#f3f1f0", 242)}"/>
  <rect x="118" y="304" width="12" height="22" rx="2" fill="${c("#7b52c7", 108)}"/>
  <rect x="135" y="290" width="12" height="36" rx="2" fill="${c("#0e96a6", 117)}"/>
  <rect x="152" y="282" width="12" height="44" rx="2" fill="${c("#d08315", 151)}"/>
  <rect x="169" y="296" width="12" height="30" rx="2" fill="${c("#c4489a", 115)}"/>
  <rect x="198" y="270" width="86" height="62" rx="4" fill="${c("#9fd2ff", 199)}"/>
  <circle cx="264" cy="286" r="8" fill="${c("#ffc94a", 205)}"/>
  <path d="M198 318 q20 -18 40 -4 t46 -6 v24 h-86 z" fill="${c("#4caf6a", 140)}"/>
  <path d="M198 324 q30 -10 56 2 t30 0 v6 h-86 z" fill="${c("#2e7d4a", 98)}"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="110" y="${350 + i * 16}" width="${i % 3 === 2 ? 110 : 174}" height="5" rx="2.5" fill="#e6e8ee"/>`).join("\n  ")}
  <text x="110" y="${446}" class="t-pagebody" fill="${c("#c4489a", 115)}">Revenue up 12%</text>`;
}

const parts = [];
parts.push(`<g ${appear(0)}>
  <text x="60" y="84" class="t-title">fynepdf-grayscale</text>
  <text x="60" y="118" class="t-sub">PDFs made grey in place. Text stays text.</text>
</g>
<g transform="translate(980 52)"><g ${appear(0.2)}>
  <svg width="40" height="40" viewBox="0 0 58 58">${mark}</svg>
  <text x="46" y="27" class="t-made">Made by FynePDF</text>
</g></g>`);

// Left card: the page turning grey.
parts.push(`<rect x="60" y="160" width="520" height="455" rx="20" class="card"/>
<g ${appear(0.3)}>
  <text x="92" y="186" class="t-file">report.pdf</text>
  <g class="paper-shadow">${page(false)}</g>
</g>
<g class="grey">${page(true)}</g>
<rect x="92" y="190" width="3" height="278" rx="1.5" fill="#007bff" class="sweep"/>`);
// Then the text, selected: still text.
parts.push(`<g ${appear(SWEEP[1] + 0.4, { rise: 0, dur: 0.3 })}>
  <rect x="106" y="210" width="144" height="22" rx="3" fill="#007bff" opacity="0.22"/>
</g>
<g ${appear(SWEEP[1] + 0.4, { rise: 0, dur: 0.2 })}>
  <path d="M252 207 v28 M248 207 h8 M248 235 h8" stroke="#1e1c1c" stroke-width="1.6" stroke-linecap="round"/>
</g>
<g ${appear(SWEEP[1] + 0.7)}>
  <rect x="92" y="484" width="210" height="44" rx="12" fill="url(#blue)"/>
  <text x="197" y="511" class="t-badge" text-anchor="middle">Text still selectable</text>
</g>`);
KEPT.forEach((text, i) => {
  const y = 206 + i * 62, at = SWEEP[1] + 0.9 + i * 0.3;
  parts.push(`<g ${appear(at)}>
  <rect x="326" y="${y}" width="230" height="48" rx="12" class="chip"/>
  <circle cx="348" cy="${y + 24}" r="9" fill="#18d54b"/>
  <path d="M343.5 ${y + 24.5} l3 3 l6 -6.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="364" y="${y + 29}" class="t-chip">${esc(text)}</text>
</g>`);
});
parts.push(`<g ${appear(SWEEP[1] + 1.8)}>
  <text x="92" y="572" class="t-note">Nothing redrawn: the same file, its colours</text>
  <text x="92" y="594" class="t-note">grey, everything else as it was.</text>
</g>`);
css.push(`@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}`);
css.push(`@keyframes blink{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(0.15)}}`);
parts.push(`<g transform="translate(518 552)"><g class="bot-bob">
  <circle r="26" fill="url(#bot)"/>
  <g class="bot-look"><g class="bot-eyes"><rect x="-13" y="-10" width="7" height="18" rx="3.5" fill="#fff"/><rect x="6" y="-10" width="7" height="18" rx="3.5" fill="#fff"/></g></g>
</g></g>`);

// Right card: three results.
parts.push(`<rect x="620" y="160" width="520" height="455" rx="20" class="card"/>`);
GROUPS.forEach((group, g) => {
  const top = 196 + g * 136, at = 5.2 + g * 0.8;
  parts.push(`<g ${appear(at - 0.2)}>
  <text x="652" y="${top}" class="t-group">${esc(group.title)}</text>
  <text x="652" y="${top + 20}" class="t-groupnote">${esc(group.note)}</text>
</g>`);
  group.rows.forEach(([name, value, label], r) => {
    const y = top + 42 + r * 28, ours = r === 0;
    const width = Math.max(value > 0 ? 3 : 0, (value / group.max) * 230);
    const fill = ours ? "url(#blue)" : group.bad ? "#f0c3ad" : "#d6d6d6";
    parts.push(`<g ${appear(at, { rise: 0 })}><text x="652" y="${y + 5}" class="${ours ? "t-ours" : "t-row"}">${esc(name)}</text></g>
<rect x="808" y="${y - 8}" width="${width.toFixed(1)}" height="16" rx="8" fill="${fill}" ${grow(at)}/>
<g ${appear(at + 0.5, { rise: 0 })}><text x="${(818 + width).toFixed(1)}" y="${y + 5}" class="${ours ? "t-ours" : "t-row"}">${label}</text>${ours && group.bad ? `<circle cx="${(848 + width).toFixed(1)}" cy="${y}" r="8" fill="#18d54b"/><path d="M${(844.5 + width).toFixed(1)} ${y + 0.5} l2.3 2.3 l4.7 -5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` : ""}</g>`);
  });
});
parts.push(`<g ${appear(7.6)}><text x="652" y="594" class="t-foot">the same files for every tool · docs/benchmarks.md</text></g>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="fynepdf-grayscale turns a colour page grey in place, and its text can still be selected. Of 950 files with text, it lost the text of none, against 40 for Ghostscript 10.08 and all 950 when pages are drawn as pictures. Of 1,067 files, none lost links, tags or form fields, against 370 for Ghostscript and 593 for pictures. Converting them all takes 78 seconds, against 1,038 for Ghostscript and 705 for pictures.">
<title>fynepdf-grayscale: PDFs made grey in place</title>
<defs>
  <linearGradient id="blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#007bff"/><stop offset="1" stop-color="#0046b7"/></linearGradient>
  <linearGradient id="bot" x1="0" y1="-26" x2="0" y2="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2d92ff"/><stop offset="1" stop-color="#0046b7"/></linearGradient>
  <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#1e1c1c" flood-opacity="0.08"/></filter>
  <filter id="paper-shadow" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.16"/></filter>
</defs>
<style>
@font-face{font-family:"Hanken Grotesk";font-weight:400;src:url(data:font/woff;base64,${font("HankenGrotesk-Regular.woff")}) format("woff")}
@font-face{font-family:"Hanken Grotesk";font-weight:600;src:url(data:font/woff;base64,${font("HankenGrotesk-SemiBold.woff")}) format("woff")}
text{font-family:"Hanken Grotesk",system-ui,-apple-system,"Segoe UI",sans-serif}
.t-title{font-size:40px;font-weight:600;fill:#1e1c1c;letter-spacing:-0.01em}
.t-sub{font-size:20px;fill:#7a7876}
.t-made{font-size:15px;font-weight:600;fill:#404040}
.t-file{font-size:13px;fill:#7a7876}
.t-pagehead{font-size:17px;font-weight:600}
.t-pagebody{font-size:12px;font-weight:600}
.t-chip{font-size:14px;fill:#404040}
.t-badge{font-size:16px;font-weight:600;fill:#fff}
.t-note{font-size:15px;fill:#7a7876}
.t-group{font-size:17px;font-weight:600;fill:#1e1c1c}
.t-groupnote{font-size:13px;fill:#909090}
.t-row{font-size:14px;fill:#404040}
.t-ours{font-size:14px;font-weight:600;fill:#005fdb}
.t-foot{font-size:12px;fill:#909090}
.card{fill:#fff;filter:url(#card-shadow)}
.paper-shadow>rect:first-child{filter:url(#paper-shadow)}
.chip{fill:#fff;stroke:#e4e2e0}
.bar,.bot-bob,.bot-eyes,.bot-look{transform-box:fill-box}
.bar{transform-origin:left center}
.scene{animation:scene ${LOOP}s linear infinite}
.grey{animation:reveal ${LOOP}s cubic-bezier(0.65,0,0.35,1) infinite}
.sweep{opacity:0;animation:sweep ${LOOP}s cubic-bezier(0.65,0,0.35,1) infinite}
.bot-bob{animation:bob 3.2s cubic-bezier(0.65,0,0.35,1) infinite}
.bot-look{animation:look ${LOOP}s cubic-bezier(0.65,0,0.35,1) infinite}
.bot-eyes{transform-origin:center;animation:blink 4.6s linear infinite}
${css.join("\n")}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<rect width="1200" height="675" fill="#f3f1f0"/>
<g class="scene">
${parts.join("\n")}
</g>
</svg>
`;
fs.writeFileSync(path.join(here, "grayscale.svg"), svg);
console.log(`docs/grayscale.svg: ${(svg.length / 1024).toFixed(0)} KB`);
