/**
 * Offline sample media for the development seed: a small PNG "scene" per
 * listing photo and a one-page notice PDF. Generated in-process (node:zlib
 * only) so seeding never depends on third-party image hosts.
 */
import { deflateSync } from "node:zlib";

/* ---------------------------------- PNG ---------------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  typeAndData.copy(out, 4);
  out.writeUInt32BE(crc32(typeAndData), 8 + data.length);
  return out;
}

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function hsl(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

/** A simple deterministic landscape (sky, ground, building block) as PNG bytes. */
export function samplePhotoPng(seed: string, width = 800, height = 600): Uint8Array {
  const h = hashSeed(seed);
  const hue = h % 360;
  const sky = hsl((hue + 200) % 360, 0.55, 0.72);
  const ground = hsl((hue + 90) % 360, 0.35, 0.38);
  const wall = hsl(hue, 0.3, 0.82);
  const roof = hsl((hue + 10) % 360, 0.55, 0.35);

  const horizon = Math.floor(height * 0.68);
  const bx0 = Math.floor(width * (0.2 + ((h >>> 8) % 20) / 100));
  const bx1 = bx0 + Math.floor(width * 0.45);
  const by0 = Math.floor(height * 0.38);
  const roofPeak = Math.floor(height * 0.2);

  const raw = Buffer.alloc((width * 3 + 1) * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      let px: [number, number, number];
      const mid = (bx0 + bx1) / 2;
      const halfSpan = (bx1 - bx0) / 2 + 20;
      const roofEdgeY = roofPeak + ((by0 - roofPeak) * Math.abs(x - mid)) / halfSpan;
      if (y >= by0 && y < horizon && x >= bx0 && x < bx1) px = wall;
      else if (y >= roofEdgeY && y < by0 && Math.abs(x - mid) <= halfSpan) px = roof;
      else if (y >= horizon) px = ground;
      else {
        const t = y / horizon; // vertical sky gradient
        px = [sky[0] + (255 - sky[0]) * t * 0.5, sky[1] + (255 - sky[1]) * t * 0.5, sky[2] + (255 - sky[2]) * t * 0.5].map(
          Math.round,
        ) as [number, number, number];
      }
      raw[o++] = px[0];
      raw[o++] = px[1];
      raw[o++] = px[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return new Uint8Array(
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", deflateSync(raw, { level: 9 })),
      chunk("IEND", new Uint8Array(0)),
    ]),
  );
}

/* ---------------------------------- PDF ---------------------------------- */

function pdfEscape(text: string): string {
  return text.replace(/[\\()]/g, (m) => `\\${m}`);
}

/** A minimal valid one-page PDF with the given lines of text. */
export function sampleNoticePdf(lines: string[]): Uint8Array {
  const content = [
    "BT",
    "/F1 16 Tf",
    "72 760 Td",
    "22 TL",
    ...lines.map((line, i) => `${i === 0 ? "" : "T* "}(${pdfEscape(line)}) Tj`),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((off) => `${String(off).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return new Uint8Array(Buffer.from(pdf, "latin1"));
}
