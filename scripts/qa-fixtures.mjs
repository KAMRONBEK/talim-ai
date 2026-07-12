#!/usr/bin/env node
/**
 * qa-fixtures.mjs — deterministic test fixtures for the overnight visual-QA run.
 *
 * The overnight agent needs *known* inputs so it can grade outputs like a human:
 * a PDF whose facts are recorded in an answer key (so an AI summary/quiz can be
 * checked for factual correctness, not just "renders"), CSV files for the student
 * import (valid / malformed / duplicate rows), and reject-path files (fake pptx,
 * empty pdf, text-as-pdf, unicode filename). Everything is generated — no binary
 * fixtures live in git; `docs/qa/fixtures/` is gitignored.
 *
 * Usage:
 *   node scripts/qa-fixtures.mjs                    # write the standard small set
 *   node scripts/qa-fixtures.mjs --oversize 30      # + oversize-30mb.pdf (plan cap)
 *   node scripts/qa-fixtures.mjs --oversize 130     # + oversize-130mb.pdf (hard cap)
 *   node scripts/qa-fixtures.mjs --csv-rows 250     # + students-bulk-250.csv
 *   node scripts/qa-fixtures.mjs --wrap-jpeg shot.jpeg [out.pdf]
 *                                                   # wrap a screenshot JPEG into an
 *                                                   # image-only "scanned" PDF (OCR path)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'docs', 'qa', 'fixtures');
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// Minimal correct PDF builder (proper xref offsets; latin1 text only — Uzbek is
// written with straight apostrophes, which is also how real users type it).
// ---------------------------------------------------------------------------
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

function buildTextPdf(pages) {
  // objects: 1=Catalog 2=Pages 3=Font, then per page i: (4+2i)=Page (5+2i)=Contents
  const objs = [];
  const kids = pages.map((_, i) => `${4 + 2 * i} 0 R`).join(' ');
  objs[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objs[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;
  objs[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  pages.forEach((lines, i) => {
    let stream = 'BT\n/F1 13 Tf\n50 770 Td\n17 TL\n';
    for (const l of lines) stream += `(${esc(l)}) Tj\nT*\n`;
    stream += 'ET';
    objs[4 + 2 * i] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + 2 * i} 0 R >>`;
    objs[5 + 2 * i] = `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`;
  });
  return assemblePdf(objs.map((body) => Buffer.from(body, 'latin1')));
}

function assemblePdf(bodies /* 1-indexed sparse array of Buffers */) {
  const chunks = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
  let offset = chunks[0].length;
  const offsets = [];
  for (let n = 1; n < bodies.length; n += 1) {
    offsets[n] = offset;
    const obj = Buffer.concat([
      Buffer.from(`${n} 0 obj\n`, 'latin1'),
      bodies[n],
      Buffer.from('\nendobj\n', 'latin1'),
    ]);
    chunks.push(obj);
    offset += obj.length;
  }
  const count = bodies.length;
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let n = 1; n < count; n += 1) xref += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  chunks.push(
    Buffer.from(
      `${xref}trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`,
      'latin1',
    ),
  );
  return Buffer.concat(chunks);
}

// ---------------------------------------------------------------------------
// The known-content Uzbek math PDF + its answer key (the oracle for AI output).
// ---------------------------------------------------------------------------
const PAGE1 = [
  "Matematika asoslari - 7-sinf uchun qo'llanma",
  '',
  '1-bob. Pifagor teoremasi',
  '',
  "Pifagor teoremasi to'g'ri burchakli uchburchakning tomonlari orasidagi",
  "bog'lanishni ifodalaydi. Teorema shunday deydi: gipotenuzaning kvadrati",
  "katetlar kvadratlarining yig'indisiga teng, ya'ni a^2 + b^2 = c^2.",
  "Bu yerda c - gipotenuza, a va b - katetlar.",
  '',
  "Misol: agar katetlar a = 3 va b = 4 bo'lsa, gipotenuza c = 5 bo'ladi,",
  "chunki 3^2 + 4^2 = 9 + 16 = 25 = 5^2.",
  '',
  "Teorema qadimgi yunon matematigi Pifagor nomi bilan atalgan, lekin bu",
  "bog'lanish Bobil va Hindiston matematiklariga undan ancha oldin ham",
  "ma'lum bo'lgan.",
];
const PAGE2 = [
  '2-bob. Kvadrat tenglamalar',
  '',
  "Kvadrat tenglama umumiy ko'rinishi: ax^2 + bx + c = 0, bunda a nolga",
  'teng emas. Yechimlar soni diskriminant orqali aniqlanadi:',
  'D = b^2 - 4ac.',
  '',
  "Agar D > 0 bo'lsa, tenglama ikkita har xil haqiqiy ildizga ega.",
  "Agar D = 0 bo'lsa, bitta (takrorlanuvchi) ildiz bor.",
  "Agar D < 0 bo'lsa, haqiqiy ildizlar yo'q.",
  '',
  'Misol: x^2 - 5x + 6 = 0 tenglamada D = 25 - 24 = 1, demak ildizlar',
  'x = 2 va x = 3.',
];
const PAGE3 = [
  "3-bob. To'plamlar va Venn diagrammasi",
  '',
  "To'plam - bu aniq ob'ektlar guruhi. Ikki to'plamning kesishmasi ikkalasiga",
  "ham tegishli elementlardan iborat. Venn diagrammasi to'plamlarni doiralar",
  "ko'rinishida tasvirlaydi.",
  '',
  "Misol: A = {1, 2, 3} va B = {2, 3, 4} bo'lsa, A va B kesishmasi {2, 3}",
  "bo'ladi, birlashmasi esa {1, 2, 3, 4}.",
  '',
  "Savollar: 1) Katetlari 6 va 8 bo'lgan uchburchakning gipotenuzasi necha?",
  '(javob: 10). 2) x^2 - 5x + 6 = 0 ning ildizlari? (javob: 2 va 3).',
  '3) A va B kesishmasida nechta element bor? (javob: 2 ta).',
];

const FACTS = `# uz-math.pdf — answer key (oracle for grading AI output)

Grade any AI summary / quiz / podcast / flashcards generated from \`uz-math.pdf\`
against these facts. A summary that contradicts one is a FINDING (wrong output),
not a style issue. A quiz whose answer key disagrees is a grading bug.

## Facts the content states
1. Pifagor teoremasi: a^2 + b^2 = c^2 (c = gipotenuza, a/b = katetlar).
2. Worked example: katetlar 3 va 4 → gipotenuza 5.
3. Teorema Pifagor nomi bilan atalgan; Bobil/Hindistonda oldin ham ma'lum edi.
4. Kvadrat tenglama: ax^2 + bx + c = 0 (a ≠ 0); diskriminant D = b^2 - 4ac.
5. D > 0 → 2 ildiz; D = 0 → 1 ildiz; D < 0 → haqiqiy ildiz yo'q.
6. Worked example: x^2 - 5x + 6 = 0 → D = 1, ildizlar x = 2 va x = 3.
7. A = {1,2,3}, B = {2,3,4} → kesishma {2,3}, birlashma {1,2,3,4}.
8. Embedded Q&A: katetlar 6/8 → gipotenuza 10; kesishmada 2 ta element.

## Trap answers (if AI output asserts these, it hallucinated)
- gipotenuza 7 (3+4) — additive error
- D = b^2 + 4ac — sign error
- kesishma {1,4} — that's the symmetric difference
- "Pifagor teoremani birinchi bo'lib kashf etgan" — the text says otherwise

## Language checks (Uzbek-first policy)
- Output should be natural Uzbek (Latin), consistent apostrophes (o'/g'),
  no Russian/English leakage, no transliteration artifacts.
`;

// ---------------------------------------------------------------------------
// CSV import fixtures (matches apps/api/src/services/tenant/students.ts parser:
// header name/email/username in any order, or positional name,email-or-username).
// ---------------------------------------------------------------------------
const CSV_VALID = `name,email,username
Aziza Karimova,qa-csv-aziza@example.com,
Bekzod Toshmatov,,qa_csv_bekzod
"Nodira, opa",qa-csv-nodira@example.com,
Jasur O'ktamov,,
   Malika Yusupova   ,qa-csv-malika@example.com,
`;

const CSV_MALFORMED = `name,email,username
,qa-csv-noname@example.com,
Aziza Karimova,qa-csv-aziza@example.com,
Toxir G'aniyev,not-an-email,
"Unclosed quote,qa-csv-broken@example.com,
Zilola Rahimova,,qa_csv_bekzod
`;

// ---------------------------------------------------------------------------
// Fixtures README = the expected-ingest-outcome manifest the QA run grades against.
// ---------------------------------------------------------------------------
const README = `# QA fixtures (generated — do not edit; regenerate with \`pnpm qa:fixtures\`)

These are the deterministic inputs the overnight QA run uploads so AI output and
error paths can be graded against a KNOWN source. Nothing here is committed
(\`docs/qa/fixtures/\` is gitignored); the generator \`scripts/qa-fixtures.mjs\` IS
the fixture. See \`docs/qa/human-qa-playbook.md\` §3.6/§4.10 for how they're used.

| File | Purpose | Expected outcome |
| --- | --- | --- |
| \`uz-math.pdf\` | 3-page known Uzbek math text (Pifagor / kvadrat tenglama / Venn) | Ingest → READY; parses via pdf-parse (no OCR). Grade summary/quiz/flashcards against \`uz-math-facts.md\`. |
| \`uz-math-facts.md\` | The **answer key / oracle** for \`uz-math.pdf\` | Not uploaded — the grading ground truth. |
| \`o'zbek matematikasi 📚.pdf\` | Same bytes, unicode+emoji filename | Ingest → READY; filename round-trips unmangled in the UI. |
| \`students-valid.csv\` | 5 valid roster rows (email, username, name-only, quoted, whitespace) | Import → all created; credentials shown once. |
| \`students-malformed.csv\` | missing-name, bad-email, unclosed-quote, dup-username rows | Import → per-row errors; valid rows still commit (partial success). |
| \`empty.pdf\` | 0-byte file | Reject at upload boundary — clear error, never eternal processing. |
| \`notapdf.pdf\` | plain text with a \`.pdf\` extension (wrong magic) | User-readable failure, not a stuck job. |
| \`fake.pptx\` | not a real PowerPoint (ZIP magic only) | 400 at upload ("export to PDF and upload that", cf. F35). |
| \`oversize-<N>mb.pdf\` | \`--oversize N\` — valid PDF padded to ~N MB | Plan file-limit / hard-cap error per N (25/120 MB boundaries). |
| \`students-bulk-<N>.csv\` | \`--csv-rows N\` — N name-only rows | Seat-limit boundary + bulk-import perf under a bounded wall-clock. |
| \`scanned.pdf\` | \`--wrap-jpeg <shot.jpeg>\` — image-only PDF | Forces the scanned-PDF OCR ladder (no selectable text). |
`;

// ---------------------------------------------------------------------------
// Writers
// ---------------------------------------------------------------------------
/**
 * Prefer a REAL PDF generator when available: pdf-parse bundles pdf.js v1.10
 * (2017), which rejects our hand-built xref table ("bad XRef entry") and would
 * silently push every fixture upload through the paid Mistral-OCR ladder. macOS
 * ships `cupsfilter` (text → PDF); its output parses cleanly with pdf-parse, so
 * ingest is fast, free, and deterministic. Fallback: the hand-built PDF (valid
 * per spec, ingests via the OCR ladder — slower but functional).
 */
function makePdf(pages) {
  try {
    const txt = path.join(os.tmpdir(), 'qa-fixture-src.txt');
    // \f = form feed → page break in cupsfilter's text-to-pdf filter
    fs.writeFileSync(txt, pages.map((p) => p.join('\n')).join('\n\f'));
    const pdf = execFileSync('cupsfilter', [txt], {
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    });
    if (pdf.slice(0, 5).toString() === '%PDF-') return pdf;
  } catch {
    /* no cupsfilter (non-mac) or it failed — fall through */
  }
  console.warn('cupsfilter unavailable — writing hand-built PDF (ingests via OCR ladder)');
  return buildTextPdf(pages);
}

function writeStandardSet() {
  const pdf = makePdf([PAGE1, PAGE2, PAGE3]);
  const w = (name, data) => {
    fs.writeFileSync(path.join(OUT, name), data);
    console.log(`wrote ${path.join('docs/qa/fixtures', name)} (${data.length} bytes)`);
  };
  w('uz-math.pdf', pdf);
  w("o'zbek matematikasi \u{1F4DA}.pdf", pdf); // unicode/emoji filename upload test
  w('uz-math-facts.md', Buffer.from(FACTS));
  w('students-valid.csv', Buffer.from(CSV_VALID));
  w('students-malformed.csv', Buffer.from(CSV_MALFORMED));
  w('empty.pdf', Buffer.alloc(0));
  w('notapdf.pdf', Buffer.from('This is plain text pretending to be a PDF.\n'));
  w('fake.pptx', Buffer.from('PK\x03\x04 not a real PowerPoint file')); // reject-path (400)
  w('README.md', Buffer.from(README));
}

function writeOversize(mb) {
  // A valid 1-page PDF padded with an unreferenced stream object to ~mb MB —
  // exercises the client/plan size caps with a file that still parses as PDF.
  const pad = Buffer.alloc(mb * 1024 * 1024, 0x20);
  const bodies = [];
  bodies[1] = Buffer.from('<< /Type /Catalog /Pages 2 0 R >>', 'latin1');
  bodies[2] = Buffer.from('<< /Type /Pages /Kids [3 0 R] /Count 1 >>', 'latin1');
  bodies[3] = Buffer.from(
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    'latin1',
  );
  const stream = 'BT\n/F1 13 Tf\n50 770 Td\n(Oversize fixture) Tj\nET';
  bodies[4] = Buffer.from(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, 'latin1');
  bodies[5] = Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', 'latin1');
  bodies[6] = Buffer.concat([
    Buffer.from(`<< /Length ${pad.length} >>\nstream\n`, 'latin1'),
    pad,
    Buffer.from('\nendstream', 'latin1'),
  ]);
  const name = `oversize-${mb}mb.pdf`;
  fs.writeFileSync(path.join(OUT, name), assemblePdf(bodies));
  console.log(`wrote docs/qa/fixtures/${name}`);
}

function writeBulkCsv(n) {
  let csv = 'name,email,username\n';
  for (let i = 1; i <= n; i += 1) csv += `QA Bulk Student ${String(i).padStart(3, '0')},,\n`;
  const name = `students-bulk-${n}.csv`;
  fs.writeFileSync(path.join(OUT, name), csv);
  console.log(`wrote docs/qa/fixtures/${name} (${n} rows)`);
}

function jpegDimensions(buf) {
  // Scan JPEG markers for SOF0–SOF15 (except DHT/JPG/DAC) to read height/width.
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error('could not find JPEG SOF marker (is this a JPEG?)');
}

function wrapJpeg(src, out = 'scanned.pdf') {
  // Image-only PDF (no text layer) → forces the scanned-PDF OCR ladder.
  const jpeg = fs.readFileSync(src);
  const { width, height } = jpegDimensions(jpeg);
  const content = `q ${width} 0 0 ${height} 0 0 cm /Im0 Do Q`;
  const bodies = [];
  bodies[1] = Buffer.from('<< /Type /Catalog /Pages 2 0 R >>', 'latin1');
  bodies[2] = Buffer.from('<< /Type /Pages /Kids [3 0 R] /Count 1 >>', 'latin1');
  bodies[3] = Buffer.from(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] ` +
      `/Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
    'latin1',
  );
  bodies[4] = Buffer.from(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`, 'latin1');
  bodies[5] = Buffer.concat([
    Buffer.from(
      `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
      'latin1',
    ),
    jpeg,
    Buffer.from('\nendstream', 'latin1'),
  ]);
  const dest = path.isAbsolute(out) ? out : path.join(OUT, out);
  fs.writeFileSync(dest, assemblePdf(bodies));
  console.log(`wrote ${dest} (${width}x${height} image-only PDF)`);
}

// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
if (args[0] === '--wrap-jpeg') {
  if (!args[1]) { console.error('usage: qa-fixtures.mjs --wrap-jpeg <src.jpeg> [out.pdf]'); process.exit(1); }
  wrapJpeg(args[1], args[2]);
} else {
  writeStandardSet();
  const over = args.indexOf('--oversize');
  if (over !== -1) writeOversize(parseInt(args[over + 1], 10) || 30);
  const bulk = args.indexOf('--csv-rows');
  if (bulk !== -1) writeBulkCsv(Math.min(parseInt(bulk === -1 ? 0 : args[bulk + 1], 10) || 250, 1000));
}
