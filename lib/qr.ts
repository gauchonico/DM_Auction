import QRCode from "qrcode";

/**
 * QR codes for print. Error correction "Q" (recovers ~25% damage) survives ink spread,
 * folds and smudges on newsprint; the URLs are short enough that the code stays sparse.
 * The 4-module quiet zone is required by the QR spec — layout must not crop it.
 */
const ERROR_CORRECTION = "Q" as const;
const QUIET_ZONE = 4;

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
}

/**
 * Vector QR as SVG (one path, pure black on white, crisp at any print size).
 * With `caption`, the text is set under the code so readers who can't scan can type it.
 */
export function qrSvg(text: string, caption?: string): string {
  const qr = QRCode.create(text, { errorCorrectionLevel: ERROR_CORRECTION });
  const n = qr.modules.size;
  const size = n + QUIET_ZONE * 2;

  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (qr.modules.get(x, y)) d += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`;
    }
  }

  // Caption band below the code, scaled to the module grid so proportions are fixed.
  const captionHeight = caption ? 5 : 0;
  const fontSize = Math.min(2.6, (size - 2) / Math.max(caption?.length ?? 1, 1) / 0.55);
  const height = size + captionHeight;
  const captionSvg = caption
    ? `<text x="${size / 2}" y="${size + 1.5}" text-anchor="middle" dominant-baseline="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-weight="600" font-size="${fontSize.toFixed(2)}" fill="#000">${escapeXml(caption)}</text>`
    : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${height}" width="${size * 10}" height="${height * 10}" shape-rendering="crispEdges">` +
    `<rect width="${size}" height="${height}" fill="#fff"/>` +
    `<path d="${d}" fill="#000"/>` +
    captionSvg +
    `</svg>`
  );
}

/** High-resolution PNG (about 7 cm at 300 dpi by default) for tools that can't place SVG. */
export function qrPng(text: string, width = 828): Promise<Buffer> {
  return QRCode.toBuffer(text, { errorCorrectionLevel: ERROR_CORRECTION, margin: QUIET_ZONE, width, color: { dark: "#000000", light: "#ffffff" } });
}
