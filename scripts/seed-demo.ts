/**
 * SiteCommand Demo Seed Script
 * ============================================================
 * Seeds a realistic demo project into Supabase so that the
 * demo login (demo@sitecommand.app) has meaningful data to
 * explore.
 *
 * HOW TO RUN:
 *   1. Ensure your .env.local (or environment) has:
 *        NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
 *
 *   2. From the project root, run:
 *        npm run seed:demo
 *
 *      Or directly:
 *        npx ts-node --project tsconfig.json scripts/seed-demo.ts
 *
 *   3. The script is idempotent for the company/user rows (it
 *      upserts on id). Project and child records are inserted
 *      fresh each run — re-running will create duplicates for
 *      project-level data.  To reset cleanly, delete the
 *      "Lakefront Mixed-Use Development" project from the
 *      Supabase dashboard before re-running.
 * ============================================================
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";

// Load .env.local if present (ts-node doesn't load it automatically)
dotenv.config({ path: ".env.local" });
dotenv.config(); // also try plain .env

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Stable IDs (so the demo user's JWT company_id always matches) ──────────
const COMPANY_ID = "demo-company";
const USER_ID = "demo-user";

async function seed() {
  console.log("Seeding demo data...\n");

  // ── 1. Company ─────────────────────────────────────────────────────────────
  const { error: companyErr } = await supabase.from("companies").upsert(
    {
      id: COMPANY_ID,
      name: "Meridian Construction Group",
      subscription_status: "active",
      subscription_plan: "pro",
      seat_limit: 25,
    },
    { onConflict: "id" }
  );
  if (companyErr) throw new Error(`Company upsert: ${companyErr.message}`);
  console.log("Company upserted.");

  // ── 2. User ────────────────────────────────────────────────────────────────
  const { error: userErr } = await supabase.from("users").upsert(
    {
      id: USER_ID,
      email: "demo@sitecommand.app",
      username: "Demo User",
      company_id: COMPANY_ID,
      company_role: "super_admin",
      user_type: "internal",
      // password_hash intentionally omitted — login is via demo token only
    },
    { onConflict: "id" }
  );
  if (userErr) throw new Error(`User upsert: ${userErr.message}`);
  console.log("User upserted.");

  // ── 3. Project ─────────────────────────────────────────────────────────────
  const projectId = randomUUID();
  const { error: projectErr } = await supabase.from("projects").insert({
    id: projectId,
    name: "Lakefront Mixed-Use Development",
    address: "450 Harbor Blvd",
    city: "Chicago",
    state: "IL",
    status: "active",
    project_number: "MCG-2024-001",
    sector: "Commercial",
    company_id: COMPANY_ID,
  });
  if (projectErr) throw new Error(`Project insert: ${projectErr.message}`);
  console.log(`Project inserted: ${projectId}`);

  // ── 4. RFIs ────────────────────────────────────────────────────────────────
  const rfis = [
    {
      id: randomUUID(),
      project_id: projectId,
      rfi_number: 1,
      subject: "Shear wall reinforcement at grid line C-4",
      question:
        "Structural drawings show #6 @ 12\" o.c. vertical reinforcement in the shear wall at grid C-4, but the foundation plan calls out #5 @ 10\" o.c. dowels. Please clarify the correct bar size and spacing to use, and provide a lap splice detail at the slab-on-grade interface.",
      status: "open",
      due_date: "2026-03-25",
      drawing_number: "S-201",
    },
    {
      id: randomUUID(),
      project_id: projectId,
      rfi_number: 2,
      subject: "Mechanical equipment curb height — roof level",
      question:
        "The roofing spec section 075216 requires a minimum 8\" curb height for RTU-3 and RTU-4, but the mechanical drawings (M-501) dimension the curbs at 6\". Which dimension governs? Please confirm and update the affected detail.",
      status: "answered",
      due_date: "2026-03-10",
      drawing_number: "M-501",
    },
    {
      id: randomUUID(),
      project_id: projectId,
      rfi_number: 3,
      subject: "Lobby flooring transition at elevator threshold",
      question:
        "Finish plan indicates 24x24 porcelain tile (FL-03) in the main lobby transitioning to polished concrete at the elevator lobby. No transition strip or threshold detail is shown on drawings. What is the specified transition method and acceptable edge treatment?",
      status: "answered",
      due_date: "2026-02-28",
      drawing_number: "A-401",
    },
    {
      id: randomUUID(),
      project_id: projectId,
      rfi_number: 4,
      subject: "Electrical panel clearance — 2nd floor electrical room",
      question:
        "NEC 110.26 requires 36\" clear workspace in front of panel EP-2B. As-built conditions on the 2nd floor show a structural column at 28\" from the panel face. Please confirm if a variance or panel relocation is required, or provide an engineer-of-record approval.",
      status: "open",
      due_date: "2026-04-01",
      drawing_number: "E-202",
    },
    {
      id: randomUUID(),
      project_id: projectId,
      rfi_number: 5,
      subject: "Waterproofing membrane lap at planters — Level 3 terrace",
      question:
        "Spec section 071326 requires 6\" minimum membrane lap at all penetrations. Detail 5/A-702 shows only 4\" lap at the planter drain bodies on Level 3. Please clarify the correct lap dimension and issue a revised detail if needed.",
      status: "closed",
      due_date: "2026-02-15",
      drawing_number: "A-702",
    },
  ];

  const { error: rfiErr } = await supabase.from("rfis").insert(rfis);
  if (rfiErr) throw new Error(`RFIs insert: ${rfiErr.message}`);
  console.log(`${rfis.length} RFIs inserted.`);

  // ── 5. Submittals ──────────────────────────────────────────────────────────
  const submittals = [
    {
      id: randomUUID(),
      project_id: projectId,
      submittal_number: 1,
      revision: "A",
      title: "Structural Steel Shop Drawings — Level 2 Framing",
      submittal_type: "Shop Drawing",
      status: "approved",
      cost_code: "05120",
      received_date: "2026-01-20",
      issue_date: "2026-02-03",
      description:
        "Shop drawings for structural steel framing at Level 2, including beam-to-column connections and anchor bolt layouts per structural drawings S-301 through S-305.",
    },
    {
      id: randomUUID(),
      project_id: projectId,
      submittal_number: 2,
      revision: "A",
      title: "Lobby Porcelain Tile — FL-03 Product Data & Samples",
      submittal_type: "Product Data",
      status: "revise_and_resubmit",
      cost_code: "09300",
      received_date: "2026-02-10",
      issue_date: "2026-02-24",
      description:
        "Product data sheets and 6x6 physical samples for 24x24 porcelain floor tile FL-03 (Gresline Tecno Stone, Grigio). Returned for resubmission — architect requires DCOF wet rating documentation and grout joint specification.",
    },
    {
      id: randomUUID(),
      project_id: projectId,
      submittal_number: 3,
      revision: "A",
      title: "Rooftop HVAC Units RTU-1 through RTU-4 — Equipment Submittals",
      submittal_type: "Product Data",
      status: "pending",
      cost_code: "23700",
      received_date: "2026-03-05",
      submit_by: "2026-03-28",
      description:
        "Equipment submittals for four rooftop air handling units including performance curves, electrical characteristics, vibration isolation requirements, and curb anchor bolt patterns.",
    },
  ];

  const { error: submittalErr } = await supabase.from("submittals").insert(submittals);
  if (submittalErr) throw new Error(`Submittals insert: ${submittalErr.message}`);
  console.log(`${submittals.length} submittals inserted.`);

  // ── 6. Budget Line Items ───────────────────────────────────────────────────
  const budgetItems = [
    {
      id: randomUUID(),
      project_id: projectId,
      cost_code: "03300",
      description: "Cast-in-Place Concrete — Structure & Flatwork",
      original_budget_amount: 1850000,
      budget_modifications: 42000,
      approved_cos: 18500,
      pending_budget_changes: 0,
      committed_costs: 1640000,
      direct_costs: 1290000,
      pending_cost_changes: 22000,
      forecast_to_complete: 380000,
      sort_order: 1,
    },
    {
      id: randomUUID(),
      project_id: projectId,
      cost_code: "05120",
      description: "Structural Steel Framing",
      original_budget_amount: 920000,
      budget_modifications: 0,
      approved_cos: 0,
      pending_budget_changes: 15000,
      committed_costs: 905000,
      direct_costs: 870000,
      pending_cost_changes: 0,
      forecast_to_complete: 50000,
      sort_order: 2,
    },
    {
      id: randomUUID(),
      project_id: projectId,
      cost_code: "23700",
      description: "HVAC — Mechanical Systems",
      original_budget_amount: 680000,
      budget_modifications: 25000,
      approved_cos: 0,
      pending_budget_changes: 0,
      committed_costs: 612000,
      direct_costs: 390000,
      pending_cost_changes: 31000,
      forecast_to_complete: 295000,
      sort_order: 3,
    },
  ];

  const { error: budgetErr } = await supabase.from("budget_line_items").insert(budgetItems);
  if (budgetErr) throw new Error(`Budget insert: ${budgetErr.message}`);
  console.log(`${budgetItems.length} budget line items inserted.`);

  // ── 7. Tasks ───────────────────────────────────────────────────────────────
  const tasks = [
    {
      id: randomUUID(),
      project_id: projectId,
      task_number: 1,
      title: "Submit shear wall RFI response to structural engineer",
      status: "open",
      category: "RFI",
      due_date: "2026-03-20",
      description:
        "Compile field measurements at grid C-4 and submit formal RFI response package to EOR for review.",
    },
    {
      id: randomUUID(),
      project_id: projectId,
      task_number: 2,
      title: "Obtain roofing contractor approval for revised curb heights",
      status: "open",
      category: "Submittal",
      due_date: "2026-03-22",
      description:
        "Coordinate with MEP sub and roofing contractor to align on 8\" curb height per spec. Get written confirmation before fabrication.",
    },
    {
      id: randomUUID(),
      project_id: projectId,
      task_number: 3,
      title: "Schedule Level 3 waterproofing inspection",
      status: "in_progress",
      category: "Inspection",
      due_date: "2026-03-18",
      description:
        "Flood test of Level 3 planters required before concrete topping placement. Coordinate with special inspector and owner's rep.",
    },
    {
      id: randomUUID(),
      project_id: projectId,
      task_number: 4,
      title: "Resubmit FL-03 tile product data with DCOF documentation",
      status: "in_progress",
      category: "Submittal",
      due_date: "2026-03-28",
      description:
        "Contact Gresline rep for updated DCOF wet test report. Resubmit with grout joint callout per architect comment.",
    },
    {
      id: randomUUID(),
      project_id: projectId,
      task_number: 5,
      title: "Closeout punch list — Level 1 restrooms",
      status: "closed",
      category: "Punch List",
      due_date: "2026-03-10",
      description:
        "All items from 03/05 walk complete. Owner signed off on Level 1 restroom finishes 03/10.",
    },
  ];

  const { error: tasksErr } = await supabase.from("tasks").insert(tasks);
  if (tasksErr) throw new Error(`Tasks insert: ${tasksErr.message}`);
  console.log(`${tasks.length} tasks inserted.`);

  // ── 8. Daily Logs ──────────────────────────────────────────────────────────
  const dailyLogs = [
    {
      id: randomUUID(),
      project_id: projectId,
      log_date: "2026-03-14",
      weather_conditions: "Partly Cloudy",
      weather_temp: "48°F",
      weather_wind: "12 mph NW",
      weather_humidity: "55%",
      notes:
        "Concrete placement for Level 3 slab — poured approx 280 CY. Pump on-site from 06:30 to 14:00. No issues with mix design. ACI special inspector on-site all day. Rebar cage for column CF-08 complete; awaiting form inspection before next pour.",
      manpower: JSON.stringify([
        { trade: "Concrete", company: "Midwest Concrete Inc.", headcount: 14 },
        { trade: "Ironworkers", company: "Pinnacle Steel Erectors", headcount: 6 },
        { trade: "Carpenters", company: "Meridian Self-Perform", headcount: 4 },
      ]),
      deliveries: JSON.stringify([
        { description: "Ready-mix concrete — 14 trucks", time: "06:30", supplier: "Central Ready Mix" },
      ]),
      inspections: JSON.stringify([
        { type: "ACI Concrete Special Inspection", inspector: "Brian Kowalski, GTL Associates", result: "Pass" },
      ]),
      note_entries: JSON.stringify([]),
      weather_observations: JSON.stringify([]),
    },
    {
      id: randomUUID(),
      project_id: projectId,
      log_date: "2026-03-13",
      weather_conditions: "Overcast",
      weather_temp: "42°F",
      weather_wind: "8 mph S",
      weather_humidity: "68%",
      notes:
        "Steel erection on Level 2 continued; W18 beams set at grids D-E. Two beams short-shipped — field measured and reorder placed with Pinnacle. Plumbing rough-in for 2nd floor restroom core in progress. MEP coordination meeting held on-site at 14:00.",
      manpower: JSON.stringify([
        { trade: "Ironworkers", company: "Pinnacle Steel Erectors", headcount: 10 },
        { trade: "Plumbing", company: "Lake Shore Mechanical", headcount: 5 },
        { trade: "General Conditions", company: "Meridian Construction Group", headcount: 3 },
      ]),
      deliveries: JSON.stringify([
        { description: "Structural steel — partial delivery (8 of 10 pieces)", time: "07:45", supplier: "Pinnacle Steel Erectors" },
      ]),
      inspections: JSON.stringify([]),
      note_entries: JSON.stringify([]),
      weather_observations: JSON.stringify([]),
    },
    {
      id: randomUUID(),
      project_id: projectId,
      log_date: "2026-03-12",
      weather_conditions: "Sunny",
      weather_temp: "53°F",
      weather_wind: "5 mph",
      weather_humidity: "45%",
      notes:
        "Owner walkthrough conducted 10:00–12:30 with project manager and architect. Owner requested additional recessed lighting in lobby — architect to issue potential change order. Waterproofing membrane on Level 3 planters 80% complete; will complete Thursday pending dry weather.",
      manpower: JSON.stringify([
        { trade: "Waterproofing", company: "Tri-State Roofing & Waterproofing", headcount: 4 },
        { trade: "Electrical", company: "Volt Electric Co.", headcount: 8 },
        { trade: "Drywall / Framing", company: "Urban Drywall Systems", headcount: 12 },
      ]),
      visitors: JSON.stringify([
        { name: "James Harrington", organization: "Lakefront Partners LLC (Owner)", reason: "Project progress walkthrough" },
        { name: "Sandra Chu AIA", organization: "RDG Architecture", reason: "Owner walkthrough / RFI review" },
      ]),
      deliveries: JSON.stringify([
        { description: "Electrical conduit and wire — 3 pallets", time: "08:00", supplier: "Graybar Electric" },
      ]),
      inspections: JSON.stringify([]),
      note_entries: JSON.stringify([]),
      weather_observations: JSON.stringify([]),
    },
  ];

  const { error: logsErr } = await supabase.from("daily_logs").insert(dailyLogs);
  if (logsErr) throw new Error(`Daily logs insert: ${logsErr.message}`);
  console.log(`${dailyLogs.length} daily log entries inserted.`);

  console.log("\nDemo seed complete.");
  console.log(`  Project ID: ${projectId}`);
  console.log(`  Company ID: ${COMPANY_ID}`);
  console.log(`  User ID:    ${USER_ID}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
