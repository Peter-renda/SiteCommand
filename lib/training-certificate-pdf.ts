/**
 * Renders the "SiteCommand Certified" credential as a landscape certificate
 * PDF (pdf-lib, no headless browser — same approach as the phase-review PDF).
 * Streamed to the holder from GET /api/training/credential/certificate.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type CertificateData = {
  holderName: string;
  title: string;
  overallLevel: string;
  overallScore: number;
  code: string;
  issuedAt: string; // ISO
  verifyUrl: string;
  skills: { label: string; level: string | null; score: number | null }[];
};

// StandardFonts are WinAnsi-encoded; normalize characters that would throw.
function sanitize(s: string): string {
  return String(s ?? "")
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[•·]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

const INK = rgb(0.07, 0.07, 0.06);
const ORANGE = rgb(0.92, 0.35, 0.05);
const GRAY = rgb(0.45, 0.43, 0.41);
const LIGHT = rgb(0.85, 0.84, 0.82);

export async function buildCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([792, 612]); // US Letter, landscape
  const { width, height } = page.getSize();

  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const centerText = (
    text: string,
    y: number,
    font: typeof serif,
    size: number,
    color = INK,
  ) => {
    const clean = sanitize(text);
    const w = font.widthOfTextAtSize(clean, size);
    page.drawText(clean, { x: (width - w) / 2, y, size, font, color });
  };

  // Double border
  page.drawRectangle({
    x: 28, y: 28, width: width - 56, height: height - 56,
    borderColor: INK, borderWidth: 2,
  });
  page.drawRectangle({
    x: 36, y: 36, width: width - 72, height: height - 72,
    borderColor: ORANGE, borderWidth: 0.8,
  });

  // Header
  centerText("SITECOMMAND", height - 88, sansBold, 15, ORANGE);
  centerText("CERTIFICATE OF COMPETENCY", height - 122, serifBold, 27);
  centerText("Construction Project Management", height - 144, sans, 11, GRAY);

  // Rule
  page.drawLine({
    start: { x: width / 2 - 120, y: height - 158 },
    end: { x: width / 2 + 120, y: height - 158 },
    thickness: 0.8,
    color: LIGHT,
  });

  centerText("This certifies that", height - 186, serif, 12, GRAY);
  centerText(data.holderName, height - 224, serifBold, 32);
  centerText(
    `has demonstrated ${data.overallLevel || "assessed"}-level competency (overall score ${data.overallScore}/100)`,
    height - 250, serif, 12,
  );
  centerText(
    "through graded project simulation, scenario decisions, and knowledge assessment in SiteCommand Training.",
    height - 268, serif, 12,
  );

  // Skills grid: two columns of "label — level (score)"
  const scored = data.skills.filter((s) => s.score !== null && s.level);
  if (scored.length > 0) {
    const startY = height - 312;
    const rowH = 22;
    const colW = 300;
    const leftX = width / 2 - colW - 12;
    const rightX = width / 2 + 12;
    const perCol = Math.ceil(scored.length / 2);

    scored.forEach((s, i) => {
      const col = i < perCol ? 0 : 1;
      const row = i % perCol;
      const x = col === 0 ? leftX : rightX;
      const y = startY - row * rowH;
      page.drawText(sanitize(s.label), { x, y, size: 10.5, font: sansBold, color: INK });
      const value = `${s.level}  (${s.score}/100)`;
      const vw = sans.widthOfTextAtSize(sanitize(value), 10.5);
      page.drawText(sanitize(value), { x: x + colW - vw, y, size: 10.5, font: sans, color: GRAY });
      page.drawLine({
        start: { x, y: y - 6 },
        end: { x: x + colW, y: y - 6 },
        thickness: 0.5,
        color: LIGHT,
      });
    });
  }

  // Footer: issue date, credential code, verify URL
  const issued = new Date(data.issuedAt);
  const issuedText = isNaN(issued.getTime())
    ? ""
    : issued.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  centerText(`Issued ${issuedText}`, 106, sans, 10, GRAY);
  centerText(`Credential ${data.code}`, 88, sansBold, 11);
  centerText(`Verify at ${data.verifyUrl}`, 70, sans, 9.5, GRAY);

  return doc.save();
}
