/**
 * Re-create the "Elm Hill Townhomes Prime Contract" (Prime Contract #1)
 * inside the Hamel -> Elm Hill Townhomes project, including all 37
 * Schedule of Values line items from the source PDF.
 *
 * HOW TO RUN:
 *   1. .env.local must contain:
 *        NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
 *
 *   2. From the project root:
 *        npx ts-node --project tsconfig.json scripts/seed-elm-hill-prime-contract.ts
 *
 *   Optional: override the target project via env or CLI:
 *        PROJECT_ID=<uuid> npx ts-node ... seed-elm-hill-prime-contract.ts
 *        npx ts-node ... seed-elm-hill-prime-contract.ts <project-uuid>
 *
 * Idempotent: if a prime contract with the same (project_id, contract_number)
 * already exists, the script deletes it (cascading SOV items) before
 * re-inserting. Pass DRY_RUN=1 to preview without writing.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DRY_RUN = process.env.DRY_RUN === "1";

const CONTRACT_NUMBER = 1;
const CONTRACT = {
  title: "Elm Hill Townhomes Prime Contract",
  owner_client: "",
  contractor: "Hamel Builders, Inc.",
  architect_engineer: "",
  status: "Approved",
  executed: false,
  default_retainage: 10.0,
  description: "",
  inclusions: "",
  exclusions: "",
  start_date: "2018-04-17",
  estimated_completion_date: "2018-10-30",
  actual_completion_date: "2018-10-10",
  signed_contract_received_date: null as string | null,
  contract_termination_date: null as string | null,
  is_private: true,
  sov_view_allowed: false,
};

type SovRow = {
  budget_code: string;
  description: string;
  scheduled_value: number;
};

const SOV: SovRow[] = [
  { budget_code: "01-030.C Workmen's Facility.Contract",                       description: "Workmen's Facility",                       scheduled_value:    6300.00 },
  { budget_code: "01-040.E Truck & Auto.Equipment",                            description: "Truck & Auto",                             scheduled_value:    6278.00 },
  { budget_code: "01-040.M Truck & Auto.Materials",                            description: "Truck & Auto",                             scheduled_value:    5940.00 },
  { budget_code: "01-045.M Auto Allowance.Materials",                          description: "Auto Allowance",                           scheduled_value:    2588.00 },
  { budget_code: "01-050.C Field Office.Contract",                             description: "Field Office",                             scheduled_value:   13500.00 },
  { budget_code: "01-050.M Field Office.Materials",                            description: "Field Office",                             scheduled_value:    7260.00 },
  { budget_code: "01-090.M Security.Materials",                                description: "Security",                                 scheduled_value:    8000.00 },
  { budget_code: "01-410.L Supervision.Labor",                                 description: "Supervision",                              scheduled_value:  207000.00 },
  { budget_code: "01-410.P Supervision.Payroll Burden/Overhead @ 48%",         description: "Supervision",                              scheduled_value:  124200.00 },
  { budget_code: "01-470.M Photographs.Materials",                             description: "Photographs",                              scheduled_value:     500.00 },
  { budget_code: "01-475.M Plans Reproduction.Materials",                      description: "Plans Reproduction",                       scheduled_value:    1000.00 },
  { budget_code: "01-480.M Construction Signs.Materials",                      description: "Construction Signs",                       scheduled_value:    1200.00 },
  { budget_code: "01-500.M Temporary Facilities.Materials",                    description: "Temporary Facilities",                     scheduled_value:   26865.00 },
  { budget_code: "01-710.M Project Management Software.Materials",             description: "Project Management Software",              scheduled_value:    6525.00 },
  { budget_code: "02-070.C Surveying & Engineering.Contract",                  description: "Surveying & Engineering",                  scheduled_value:  267500.00 },
  { budget_code: "02-310.C Earthwork & Grading.Contract",                      description: "Earthwork & Grading",                      scheduled_value:  679105.00 },
  { budget_code: "02-510.C Water Distribution.Contract",                       description: "Water Distribution",                       scheduled_value: 1409721.00 },
  { budget_code: "02-530.C Sanitary Sewerage.Contract",                        description: "Sanitary Sewerage",                        scheduled_value: 1193491.00 },
  { budget_code: "02-630.C Storm Drainage.Contract",                           description: "Storm Drainage",                           scheduled_value:  238980.00 },
  { budget_code: "02-770.C Curbs and Gutters.Contract",                        description: "Curbs and Gutters",                        scheduled_value:   58800.00 },
  { budget_code: "02-775.C Sidewalks & Site Concrete.Contract",                description: "Sidewalks & Site Concrete",                scheduled_value:  120535.00 },
  { budget_code: "02-785.C Precast Concrete Pavers.Contract",                  description: "Precast Concrete Pavers",                  scheduled_value: 1280000.00 },
  { budget_code: "02-820.C Fences and Gates.Contract",                         description: "Fences and Gates",                         scheduled_value:   22900.00 },
  { budget_code: "02-821.C Temporary Fencing.Contract",                        description: "Temporary Fencing",                        scheduled_value:   14850.00 },
  { budget_code: "02-835.C Modular Block Retaining Walls.Contract",            description: "Modular Block Retaining Walls",            scheduled_value:  224335.00 },
  { budget_code: "06-665.M Safety Inspections.Materials",                      description: "Safety Inspections",                       scheduled_value:    5850.00 },
  { budget_code: "06-720.M Misc. Carpentry Materials.Materials",               description: "Misc. Carpentry Materials",                scheduled_value:    3000.00 },
  { budget_code: "09-915.M Equipment Rental.Materials",                        description: "Equipment Rental",                         scheduled_value:    4500.00 },
  { budget_code: "09-918.C Debris Disposal.Contract",                          description: "Debris Disposal",                          scheduled_value:    5100.00 },
  { budget_code: "09-920.M Clean-up Labor.Materials",                          description: "Clean-up Labor",                           scheduled_value:    4000.00 },
  { budget_code: "09-925.M Punchout Labor.Materials",                          description: "Punchout Labor",                           scheduled_value:    2000.00 },
  { budget_code: "17-010.M Performance Bond.Materials",                        description: "Performance Bond",                         scheduled_value:   37879.00 },
  { budget_code: "17-021.M General Liability Insurance.Materials",             description: "General Liability Insurance",              scheduled_value:   26783.00 },
  { budget_code: "17-050.M Audit Fees.Materials",                              description: "Audit Fees",                               scheduled_value:   15000.00 },
  { budget_code: "17-110.M Contractor's Contingency.Materials",                description: "Contractor's Contingency",                 scheduled_value:  119036.00 },
  { budget_code: "",                                                           description: "Overhead",                                 scheduled_value:  178555.00 },
  { budget_code: "",                                                           description: "Profit",                                   scheduled_value:  238073.00 },
];

const EXPECTED_GRAND_TOTAL = 6567149.00;

async function findProject(cliArg: string | undefined): Promise<{ id: string; name: string }> {
  const explicit = cliArg || process.env.PROJECT_ID;
  if (explicit) {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .eq("id", explicit)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`No project found with id ${explicit}`);
    return data;
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .ilike("name", "%elm hill%");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No project matched name ilike "%elm hill%". Pass PROJECT_ID=<uuid> explicitly.');
  if (data.length > 1) {
    console.error("Multiple projects matched 'elm hill':");
    for (const p of data) console.error(`  ${p.id}  ${p.name}`);
    throw new Error("Pass PROJECT_ID=<uuid> to disambiguate.");
  }
  return data[0];
}

async function main() {
  const computedTotal = SOV.reduce((sum, l) => sum + l.scheduled_value, 0);
  if (Math.round(computedTotal * 100) !== Math.round(EXPECTED_GRAND_TOTAL * 100)) {
    console.warn(`WARNING: SOV sum ${computedTotal.toFixed(2)} != expected grand total ${EXPECTED_GRAND_TOTAL.toFixed(2)}.`);
  }

  const project = await findProject(process.argv[2]);
  console.log(`Target project: ${project.name} (${project.id})`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);

  // Idempotency: hard-delete any existing prime contract at this number (and its SOV via FK cascade).
  const { data: existing, error: existingErr } = await supabase
    .from("prime_contracts")
    .select("id, deleted_at")
    .eq("project_id", project.id)
    .eq("contract_number", CONTRACT_NUMBER);
  if (existingErr) throw existingErr;
  if (existing && existing.length > 0) {
    console.log(`Found ${existing.length} existing prime contract(s) at number ${CONTRACT_NUMBER}. Deleting before re-insert.`);
    if (!DRY_RUN) {
      const ids = existing.map((r) => r.id);
      const { error: delErr } = await supabase.from("prime_contracts").delete().in("id", ids);
      if (delErr) throw delErr;
    }
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] Would insert prime contract:");
    console.log(JSON.stringify({ project_id: project.id, contract_number: CONTRACT_NUMBER, ...CONTRACT, original_contract_amount: computedTotal }, null, 2));
    console.log(`\n[DRY RUN] Would insert ${SOV.length} SOV rows, total $${computedTotal.toLocaleString()}`);
    return;
  }

  const { data: contract, error: insErr } = await supabase
    .from("prime_contracts")
    .insert({
      project_id: project.id,
      contract_number: CONTRACT_NUMBER,
      ...CONTRACT,
      original_contract_amount: computedTotal,
    })
    .select()
    .single();
  if (insErr) throw insErr;
  console.log(`Inserted prime contract id=${contract.id}`);

  const sovRows = SOV.map((line, idx) => ({
    prime_contract_id: contract.id,
    project_id: project.id,
    budget_code: line.budget_code,
    description: line.description,
    scheduled_value: line.scheduled_value,
    sort_order: idx,
  }));
  const { error: sovErr } = await supabase.from("prime_contract_sov_items").insert(sovRows);
  if (sovErr) throw sovErr;
  console.log(`Inserted ${sovRows.length} SOV line items. Grand total: $${computedTotal.toLocaleString()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
