/**
 * Generate the training deliverable Excel templates into
 * public/training/templates/, one .xlsx per definition in
 * lib/training-deliverables.ts.
 *
 * Run after adding or editing a deliverable definition:
 *   npx tsx scripts/generate-training-templates.ts
 *
 * Layout per workbook: title + how-to rows, the instruction bullets, the
 * header row, and a clearly-marked example row the trainee replaces. Column
 * widths are sized to the headers. The committed .xlsx files under
 * public/training/templates/ are the download targets linked from the Day
 * panel and the deliverable workspace.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";
import { TRAINING_DELIVERABLES } from "../lib/training-deliverables";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(SCRIPT_DIR, "..", "public", "training", "templates");

/** Excel sheet names: ≤31 chars, no []:*?/\ characters. */
function sheetNameFor(title: string): string {
  return title.replace(/[[\]:*?/\\]/g, "").slice(0, 31) || "Template";
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  for (const d of TRAINING_DELIVERABLES) {
    const rows: (string | number)[][] = [];
    rows.push([d.title]);
    rows.push([
      "SiteCommand Training template — complete this workbook, then submit it in the deliverable workspace.",
    ]);
    rows.push([]);
    rows.push(["Instructions:"]);
    for (const line of d.instructions) rows.push([`• ${line}`]);
    rows.push([]);
    rows.push(d.columns);
    rows.push(["▼ EXAMPLE ROW — replace with your own entries"]);
    rows.push(d.sampleRow);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = d.columns.map((c) => ({
      wch: Math.min(Math.max(c.length + 4, 14), 46),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetNameFor(d.title));

    const out = join(OUT_DIR, basename(d.templateFile));
    if (dirname(d.templateFile) !== "/training/templates") {
      throw new Error(`templateFile for ${d.id} must live under /training/templates/`);
    }
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    writeFileSync(out, buf);
    console.log(`wrote ${out} (${buf.length.toLocaleString()} bytes)`);
  }

  console.log(`\n${TRAINING_DELIVERABLES.length} templates generated.`);
}

main();
