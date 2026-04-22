import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { initDb } from "./src/db.js";
import db from "./src/db.js";
import { createToken, verifyToken } from "./src/auth.js";
import path from "path";
import fs from "fs";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

type BudgetImportRow = {
  cost_code: string;
  cost_type: string;
  description?: string;
  original_budget_amount?: number;
  budget_modifications?: number;
  approved_cos?: number;
  pending_budget_changes?: number;
  committed_costs?: number;
  direct_costs?: number;
  erp_job_to_date_costs?: number;
  cost_rom?: number;
  cost_rfq?: number;
  non_commitment_cost?: number;
  pending_cost_changes?: number;
  forecast_to_complete?: number;
  budgeted_quantity?: number;
  budgeted_uom?: string;
  installed_quantity?: number;
  actual_labor_hours?: number;
  actual_labor_cost?: number;
};

function parseBudgetImportCsv(input: string): BudgetImportRow[] {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: BudgetImportRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i].split(",").map((p) => p.trim());
    const row: Record<string, string> = {};
    for (let c = 0; c < header.length; c += 1) row[header[c]] = parts[c] ?? "";
    if (!row.cost_code || !row.cost_type) continue;
    const num = (k: string) => {
      const n = parseFloat((row[k] ?? "0").replace(/[^0-9.-]/g, ""));
      return Number.isFinite(n) ? n : 0;
    };
    rows.push({
      cost_code: row.cost_code,
      cost_type: row.cost_type,
      description: row.description ?? "",
      original_budget_amount: num("original_budget_amount"),
      budget_modifications: num("budget_modifications"),
      approved_cos: num("approved_cos"),
      pending_budget_changes: num("pending_budget_changes"),
      committed_costs: num("committed_costs"),
      direct_costs: num("direct_costs"),
      erp_job_to_date_costs: num("erp_job_to_date_costs"),
      cost_rom: num("cost_rom"),
      cost_rfq: num("cost_rfq"),
      non_commitment_cost: num("non_commitment_cost"),
      pending_cost_changes: num("pending_cost_changes"),
      forecast_to_complete: num("forecast_to_complete"),
      budgeted_quantity: num("budgeted_quantity"),
      budgeted_uom: row.budgeted_uom ?? "",
      installed_quantity: num("installed_quantity"),
      actual_labor_hours: num("actual_labor_hours"),
      actual_labor_cost: num("actual_labor_cost"),
    });
  }
  return rows;
}
async function startServer() {
  initDb();
  const app = express();
  const PORT = 3000;
  app.use(express.json());
  app.use(cookieParser());
  // Auth Middleware
  const authenticate = async (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const user = await verifyToken(token);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  };
  const adminOnly = (req: any, res: any, next: any) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    next();
  };
  // --- Auth Routes ---
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = await createToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      company_id: user.company_id,
      company_role: user.company_role,
      user_type: user.user_type,
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7 * 1000,
      path: "/",
    });
    let redirect = "/dashboard";
    if (user.role === "contractor") redirect = "/teammate";
    else if (user.user_type === "external") redirect = "/subcontractor";
    res.json({ message: "Logged in", redirect });
  });
  app.post("/api/auth/signup", async (req, res) => {
    const { firstName, lastName, email, password, company, plan } = req.body;
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return res.status(409).json({ error: "Email already exists" });
    const companyId = uuidv4();
    db.prepare("INSERT INTO companies (id, name, subscription_plan, subscription_status) VALUES (?, ?, ?, ?)")
      .run(companyId, company, plan || "free", "active");
    const userId = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(`
      INSERT INTO users (id, username, first_name, last_name, email, password_hash, company_id, company_role, user_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, `${firstName} ${lastName}`, firstName, lastName, email, hash, companyId, "super_admin", "internal");
    const token = await createToken({
      id: userId,
      email,
      username: `${firstName} ${lastName}`,
      role: "user",
      company_id: companyId,
      company_role: "super_admin",
      user_type: "internal",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7 * 1000,
      path: "/",
    });
    res.json({ success: true });
  });
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
  });
  // --- Project Routes ---
  app.get("/api/projects", authenticate, (req: any, res) => {
    let projects;
    if (req.user.role === "admin") {
      projects = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
    } else if (req.user.company_id) {
      projects = db.prepare("SELECT * FROM projects WHERE company_id = ? ORDER BY created_at DESC").all(req.user.company_id);
    } else {
      projects = db.prepare(`
        SELECT p.* FROM projects p
        JOIN project_memberships pm ON p.id = pm.project_id
        WHERE pm.user_id = ?
        ORDER BY p.created_at DESC
      `).all(req.user.id);
    }
    res.json(projects);
  });
  app.post("/api/projects", authenticate, (req: any, res) => {
    const { name, description, address, city, state, zip_code, value, status, memberIds } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO projects (id, name, description, address, city, state, zip_code, value, status, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description, address, city, state, zip_code, value || 0, status || "bidding", req.user.company_id);
    if (memberIds && Array.isArray(memberIds)) {
      const stmt = db.prepare("INSERT INTO project_memberships (id, project_id, user_id, company_id, role) VALUES (?, ?, ?, ?, ?)");
      for (const uid of memberIds) {
        stmt.run(uuidv4(), id, uid, req.user.company_id, "member");
      }
    }
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    res.json(project);
  });
  app.get("/api/projects/:id", authenticate, (req: any, res) => {
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id) as any;
    if (!project) return res.status(404).json({ error: "Project not found" });
    
    const members = db.prepare(`
      SELECT u.id, u.username, u.email FROM users u
      JOIN project_memberships pm ON u.id = pm.user_id
      WHERE pm.project_id = ?
    `).all(req.params.id);
    res.json({ ...project, members });
  });
  // --- Directory Routes ---
  app.get("/api/projects/:id/directory", authenticate, (req, res) => {
    const contacts = db.prepare("SELECT * FROM directory_contacts WHERE project_id = ? ORDER BY created_at ASC").all(req.params.id);
    res.json(contacts);
  });
  app.post("/api/projects/:id/directory", authenticate, (req, res) => {
    const id = uuidv4();
    const { type, first_name, last_name, email, phone, company, permission, job_title, address } = req.body;
    db.prepare(`
      INSERT INTO directory_contacts (id, project_id, type, first_name, last_name, email, phone, company, permission, job_title, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, type, first_name, last_name, email, phone, company, permission, job_title, address);
    const contact = db.prepare("SELECT * FROM directory_contacts WHERE id = ?").get(id);
    res.json(contact);
  });
  // --- Tasks Routes ---
  app.get("/api/projects/:id/tasks", authenticate, (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY task_number ASC").all(req.params.id);
    res.json(tasks);
  });
  app.post("/api/projects/:id/tasks", authenticate, (req: any, res) => {
    const { title, status, category, description, due_date, assignees, distribution_list } = req.body;
    const max = db.prepare("SELECT MAX(task_number) as max FROM tasks WHERE project_id = ?").get(req.params.id) as any;
    const task_number = (max?.max || 0) + 1;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO tasks (id, project_id, task_number, title, status, category, description, due_date, assignees, distribution_list, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, task_number, title, status || "open", category, description, due_date, JSON.stringify(assignees), JSON.stringify(distribution_list), req.user.id);
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    res.json(task);
  });
  // --- RFIs Routes ---
  app.get("/api/projects/:id/rfis", authenticate, (req: any, res) => {
    const rfis = db.prepare(`
      SELECT * FROM rfis
      WHERE project_id = ?
      AND (COALESCE(private, 0) = 0 OR created_by = ?)
      ORDER BY rfi_number ASC
    `).all(req.params.id, req.user.id);
    res.json(rfis);
  });
  app.post("/api/projects/:id/rfis", authenticate, (req: any, res) => {
    const {
      subject,
      question,
      status,
      schedule_impact,
      cost_impact,
      cost_code,
      sub_job,
      rfi_stage,
      private: isPrivate,
    } = req.body;
    const max = db.prepare("SELECT MAX(rfi_number) as max FROM rfis WHERE project_id = ?").get(req.params.id) as any;
    const rfi_number = (max?.max || 0) + 1;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO rfis (
        id, project_id, rfi_number, subject, question, status,
        schedule_impact, cost_impact, cost_code, sub_job, rfi_stage, private, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.params.id,
      rfi_number,
      subject,
      question,
      status || "draft",
      schedule_impact,
      cost_impact,
      cost_code,
      sub_job,
      rfi_stage,
      isPrivate ? 1 : 0,
      req.user.id
    );
    const rfi = db.prepare("SELECT * FROM rfis WHERE id = ?").get(id);
    res.json(rfi);
  });
  // --- Submittals Routes ---
  app.get("/api/projects/:id/submittals", authenticate, (req, res) => {
    const submittals = db.prepare("SELECT * FROM submittals WHERE project_id = ? ORDER BY submittal_number ASC").all(req.params.id);
    res.json(submittals);
  });
  // --- Punch List Routes ---
  app.get("/api/projects/:id/punch-list", authenticate, (req, res) => {
    const items = db.prepare("SELECT * FROM punch_list_items WHERE project_id = ? ORDER BY item_number ASC").all(req.params.id);
    res.json(items);
  });
  // --- Schedule Routes ---
  app.get("/api/projects/:id/schedule", authenticate, (req, res) => {
    const schedule = db.prepare("SELECT * FROM project_schedules WHERE project_id = ?").get(req.params.id);
    res.json({ schedule });
  });
  // --- Photos Routes ---
  app.get("/api/projects/:id/photos", authenticate, (req, res) => {
    const photos = db.prepare("SELECT * FROM project_photos WHERE project_id = ? ORDER BY uploaded_at DESC").all(req.params.id);
    res.json(photos);
  });
  // --- Drawings Routes ---
  app.get("/api/projects/:id/drawings", authenticate, (req, res) => {
    const drawings = db.prepare("SELECT * FROM project_drawings WHERE project_id = ? ORDER BY page_number ASC").all(req.params.id);
    res.json({ drawings });
  });
  // --- Prime Contracts Routes ---
  app.get("/api/projects/:id/prime-contracts", authenticate, (req, res) => {
    const contracts = db.prepare("SELECT * FROM prime_contracts WHERE project_id = ? ORDER BY created_at DESC").all(req.params.id);
    res.json(contracts);
  });
  app.get("/api/prime-contracts/:id", authenticate, (req, res) => {
    const contract = db.prepare("SELECT * FROM prime_contracts WHERE id = ?").get(req.params.id) as any;
    if (!contract) return res.status(404).json({ error: "Contract not found" });
    const sov_items = db.prepare("SELECT * FROM prime_contract_sov_items WHERE contract_id = ?").all(req.params.id);
    res.json({ ...contract, sov_items });
  });
  app.post("/api/projects/:id/prime-contracts", authenticate, (req, res) => {
    const id = uuidv4();
    const { 
      contract_number, owner_client, title, status, executed, default_retainage, 
      contractor, architect_engineer, description, inclusions, exclusions,
      start_date, estimated_completion_date, actual_completion_date,
      signed_contract_received_date, contract_termination_date,
      is_private, non_admin_access, allow_non_admin_sov_view,
      sov_items
    } = req.body;
    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO prime_contracts (
          id, project_id, contract_number, owner_client, title, status, executed, 
          default_retainage, contractor, architect_engineer, description, 
          inclusions, exclusions, start_date, estimated_completion_date, 
          actual_completion_date, signed_contract_received_date, 
          contract_termination_date, is_private, non_admin_access, 
          allow_non_admin_sov_view
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, req.params.id, contract_number, owner_client, title, status, executed ? 1 : 0,
        default_retainage, contractor, architect_engineer, description,
        inclusions, exclusions, start_date, estimated_completion_date,
        actual_completion_date, signed_contract_received_date,
        contract_termination_date, is_private ? 1 : 0, JSON.stringify(non_admin_access),
        allow_non_admin_sov_view ? 1 : 0
      );
      if (sov_items && Array.isArray(sov_items)) {
        const insertSov = db.prepare(`
          INSERT INTO prime_contract_sov_items (id, contract_id, budget_code, description, amount, billed_to_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const item of sov_items) {
          insertSov.run(uuidv4(), id, item.budget_code, item.description, item.amount, item.billed_to_date || 0);
        }
      }
    });
    transaction();
    const contract = db.prepare("SELECT * FROM prime_contracts WHERE id = ?").get(id);
    res.json(contract);
  });
  // --- Daily Log Routes ---
  app.get("/api/projects/:id/daily-log", authenticate, (req, res) => {
    const { date } = req.query;
    if (date) {
      const log = db.prepare("SELECT * FROM daily_logs WHERE project_id = ? AND log_date = ?").get(req.params.id, date);
      return res.json(log || null);
    }
    const logs = db.prepare("SELECT * FROM daily_logs WHERE project_id = ? ORDER BY log_date DESC").all(req.params.id);
    res.json(logs);
  });
  app.post("/api/projects/:id/daily-log", authenticate, (req: any, res) => {
    const id = uuidv4();
    const { log_date, weather_conditions, weather_temp, weather_wind, weather_humidity } = req.body;
    db.prepare(`
      INSERT INTO daily_logs (id, project_id, log_date, weather_conditions, weather_temp, weather_wind, weather_humidity, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, log_date, weather_conditions, weather_temp, weather_wind, weather_humidity, req.user.id);
    const log = db.prepare("SELECT * FROM daily_logs WHERE id = ?").get(id);
    res.json(log);
  });
  // --- User Profile ---
  app.get("/api/user/profile", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT id, username, email, phone FROM users WHERE id = ?").get(req.user.id);
    res.json(user);
  });
  app.get("/api/user/favorites", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT favorites FROM users WHERE id = ?").get(req.user.id) as any;
    res.json({ favorites: JSON.parse(user?.favorites || "[]") });
  });
  app.patch("/api/user/favorites", authenticate, (req: any, res) => {
    const { favorites } = req.body;
    db.prepare("UPDATE users SET favorites = ? WHERE id = ?").run(JSON.stringify(favorites), req.user.id);
    res.json({ success: true });
  });
  // --- Admin Routes ---
  app.get("/api/admin/users", authenticate, adminOnly, (req, res) => {
    const users = db.prepare("SELECT id, username, email, role, company_id, company_role, created_at FROM users ORDER BY created_at DESC").all();
    res.json(users);
  });
  app.get("/api/users", authenticate, (req: any, res) => {
    const users = db.prepare("SELECT id, username, email FROM users WHERE company_id = ?").all(req.user.company_id);
    res.json(users);
  });
  // --- Budget Routes ---
  app.get("/api/projects/:id/budget", authenticate, (req, res) => {
    const items = db.prepare("SELECT * FROM budget_line_items WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC").all(req.params.id);
    res.json(items);
  });
  app.post("/api/projects/:id/budget", authenticate, (req, res) => {
    const {
      cost_code,
      cost_type,
      description,
      original_budget_amount,
      budget_modifications,
      approved_cos,
      pending_budget_changes,
      committed_costs,
      direct_costs,
      erp_job_to_date_costs,
      cost_rom,
      cost_rfq,
      non_commitment_cost,
      pending_cost_changes,
      forecast_to_complete,
      budgeted_quantity,
      budgeted_uom,
      installed_quantity,
      actual_labor_hours,
      actual_labor_cost,
      is_gst,
      is_partial,
    } = req.body;
    if (!cost_code?.trim() || !cost_type?.trim()) {
      return res.status(400).json({ error: "Cost code and cost type are required." });
    }
    const duplicate = db.prepare(`
      SELECT id FROM budget_line_items
      WHERE project_id = ? AND lower(cost_code) = lower(?) AND lower(cost_type) = lower(?)
    `).get(req.params.id, cost_code, cost_type) as { id?: string } | undefined;
    if (duplicate?.id) {
      return res.status(409).json({ error: "Budget code combination (cost code + cost type) already exists for this project." });
    }
    const items = db.prepare("SELECT COUNT(*) as count FROM budget_line_items WHERE project_id = ?").get(req.params.id) as any;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO budget_line_items (
        id, project_id, cost_code, cost_type, description, original_budget_amount, budget_modifications, approved_cos, pending_budget_changes,
        committed_costs, direct_costs, erp_job_to_date_costs, cost_rom, cost_rfq, non_commitment_cost, pending_cost_changes, forecast_to_complete,
        budgeted_quantity, budgeted_uom, installed_quantity, actual_labor_hours, actual_labor_cost, is_gst, is_partial, sort_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.params.id, cost_code || "", cost_type || "", description || "", original_budget_amount ?? 0, budget_modifications ?? 0, approved_cos ?? 0,
      pending_budget_changes ?? 0, committed_costs ?? 0, direct_costs ?? 0, erp_job_to_date_costs ?? 0, cost_rom ?? 0, cost_rfq ?? 0, non_commitment_cost ?? 0,
      pending_cost_changes ?? 0, forecast_to_complete ?? 0, budgeted_quantity ?? 0, budgeted_uom ?? "", installed_quantity ?? 0, actual_labor_hours ?? 0,
      actual_labor_cost ?? 0, is_gst ? 1 : 0, is_partial ? 1 : 0, items.count
    );
    const newItem = db.prepare("SELECT * FROM budget_line_items WHERE id = ?").get(id);
    res.json(newItem);
  });
  app.patch("/api/projects/:id/budget/:lineItemId", authenticate, (req, res) => {
    const {
      cost_code,
      cost_type,
      description,
      original_budget_amount,
      budget_modifications,
      approved_cos,
      pending_budget_changes,
      committed_costs,
      direct_costs,
      erp_job_to_date_costs,
      cost_rom,
      cost_rfq,
      non_commitment_cost,
      pending_cost_changes,
      forecast_to_complete,
      budgeted_quantity,
      budgeted_uom,
      installed_quantity,
      actual_labor_hours,
      actual_labor_cost,
      is_gst,
      is_partial,
    } = req.body;
    if (!cost_code?.trim() || !cost_type?.trim()) {
      return res.status(400).json({ error: "Cost code and cost type are required." });
    }
    const duplicate = db.prepare(`
      SELECT id FROM budget_line_items
      WHERE project_id = ? AND lower(cost_code) = lower(?) AND lower(cost_type) = lower(?) AND id != ?
    `).get(req.params.id, cost_code, cost_type, req.params.lineItemId) as { id?: string } | undefined;
    if (duplicate?.id) {
      return res.status(409).json({ error: "Budget code combination (cost code + cost type) already exists for this project." });
    }
    db.prepare(`
      UPDATE budget_line_items
      SET cost_code = ?, cost_type = ?, description = ?, original_budget_amount = ?, budget_modifications = ?, approved_cos = ?, pending_budget_changes = ?, committed_costs = ?, direct_costs = ?, erp_job_to_date_costs = ?, cost_rom = ?, cost_rfq = ?, non_commitment_cost = ?, pending_cost_changes = ?, forecast_to_complete = ?, budgeted_quantity = ?, budgeted_uom = ?, installed_quantity = ?, actual_labor_hours = ?, actual_labor_cost = ?, is_gst = ?, is_partial = ?
      WHERE id = ? AND project_id = ?
    `).run(
      cost_code ?? "", cost_type ?? "", description ?? "", original_budget_amount ?? 0, budget_modifications ?? 0, approved_cos ?? 0, pending_budget_changes ?? 0,
      committed_costs ?? 0, direct_costs ?? 0, erp_job_to_date_costs ?? 0, cost_rom ?? 0, cost_rfq ?? 0, non_commitment_cost ?? 0, pending_cost_changes ?? 0,
      forecast_to_complete ?? 0, budgeted_quantity ?? 0, budgeted_uom ?? "", installed_quantity ?? 0, actual_labor_hours ?? 0, actual_labor_cost ?? 0,
      is_gst ? 1 : 0, is_partial ? 1 : 0, req.params.lineItemId, req.params.id
    );
    const updated = db.prepare("SELECT * FROM budget_line_items WHERE id = ?").get(req.params.lineItemId);
    res.json(updated);
  });
  app.delete("/api/projects/:id/budget/:lineItemId", authenticate, (req, res) => {
    db.prepare("DELETE FROM budget_line_items WHERE id = ? AND project_id = ?").run(req.params.lineItemId, req.params.id);
    res.json({ success: true });
  });
  app.get("/api/projects/:id/budget/import-template", authenticate, (_req, res) => {
    const csv = [
      "cost_code,cost_type,description,original_budget_amount,budget_modifications,approved_cos,pending_budget_changes,committed_costs,direct_costs,erp_job_to_date_costs,cost_rom,cost_rfq,non_commitment_cost,pending_cost_changes,forecast_to_complete,budgeted_quantity,budgeted_uom,installed_quantity,actual_labor_hours,actual_labor_cost",
      "03-300,Labor,Concrete Placement,100000,0,0,0,0,0,0,0,0,0,0,5000,2400,HRS,250,60,4200",
    ].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=budget-import-template.csv");
    res.send(csv);
  });
  app.post("/api/projects/:id/budget/import", authenticate, upload.single("file"), (req, res) => {
    const text = typeof req.body?.csv === "string" ? req.body.csv : "";
    const rows = parseBudgetImportCsv(text);
    if (!rows.length) {
      return res.status(400).json({ error: "No valid budget rows found. Include cost_code and cost_type columns." });
    }
    const upsert = db.transaction(() => {
      for (const row of rows) {
        const existing = db.prepare(`
          SELECT id FROM budget_line_items
          WHERE project_id = ? AND lower(cost_code) = lower(?) AND lower(cost_type) = lower(?)
        `).get(req.params.id, row.cost_code, row.cost_type) as { id?: string } | undefined;
        if (existing?.id) {
          db.prepare(`
            UPDATE budget_line_items
            SET description = ?, original_budget_amount = ?, budget_modifications = ?, approved_cos = ?, pending_budget_changes = ?,
                committed_costs = ?, direct_costs = ?, erp_job_to_date_costs = ?, cost_rom = ?, cost_rfq = ?, non_commitment_cost = ?,
                pending_cost_changes = ?, forecast_to_complete = ?, budgeted_quantity = ?, budgeted_uom = ?, installed_quantity = ?,
                actual_labor_hours = ?, actual_labor_cost = ?
            WHERE id = ?
          `).run(
            row.description ?? "",
            row.original_budget_amount ?? 0,
            row.budget_modifications ?? 0,
            row.approved_cos ?? 0,
            row.pending_budget_changes ?? 0,
            row.committed_costs ?? 0,
            row.direct_costs ?? 0,
            row.erp_job_to_date_costs ?? 0,
            row.cost_rom ?? 0,
            row.cost_rfq ?? 0,
            row.non_commitment_cost ?? 0,
            row.pending_cost_changes ?? 0,
            row.forecast_to_complete ?? 0,
            row.budgeted_quantity ?? 0,
            row.budgeted_uom ?? "",
            row.installed_quantity ?? 0,
            row.actual_labor_hours ?? 0,
            row.actual_labor_cost ?? 0,
            existing.id
          );
        } else {
          const count = db.prepare("SELECT COUNT(*) as count FROM budget_line_items WHERE project_id = ?").get(req.params.id) as any;
          db.prepare(`
            INSERT INTO budget_line_items (
              id, project_id, cost_code, cost_type, description, original_budget_amount, budget_modifications, approved_cos, pending_budget_changes,
              committed_costs, direct_costs, erp_job_to_date_costs, cost_rom, cost_rfq, non_commitment_cost, pending_cost_changes, forecast_to_complete,
              budgeted_quantity, budgeted_uom, installed_quantity, actual_labor_hours, actual_labor_cost, is_gst, is_partial, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
          `).run(
            uuidv4(), req.params.id, row.cost_code, row.cost_type, row.description ?? "", row.original_budget_amount ?? 0,
            row.budget_modifications ?? 0, row.approved_cos ?? 0, row.pending_budget_changes ?? 0, row.committed_costs ?? 0,
            row.direct_costs ?? 0, row.erp_job_to_date_costs ?? 0, row.cost_rom ?? 0, row.cost_rfq ?? 0, row.non_commitment_cost ?? 0,
            row.pending_cost_changes ?? 0, row.forecast_to_complete ?? 0, row.budgeted_quantity ?? 0, row.budgeted_uom ?? "",
            row.installed_quantity ?? 0, row.actual_labor_hours ?? 0, row.actual_labor_cost ?? 0, count.count
          );
        }
      }
    });
    upsert();
    res.json({ success: true, imported: rows.length });
  });
  app.post("/api/projects/:id/budget/:lineItemId/delete-budget-data", authenticate, (req, res) => {
    const mode = req.body?.mode as "labor_hours" | "production_quantities" | "both" | undefined;
    if (!mode || !["labor_hours", "production_quantities", "both"].includes(mode)) {
      return res.status(400).json({ error: "mode must be labor_hours, production_quantities, or both." });
    }
    if (mode === "labor_hours") {
      db.prepare("UPDATE budget_line_items SET actual_labor_hours = 0, actual_labor_cost = 0 WHERE id = ? AND project_id = ?")
        .run(req.params.lineItemId, req.params.id);
    } else if (mode === "production_quantities") {
      db.prepare("UPDATE budget_line_items SET budgeted_quantity = 0, installed_quantity = 0 WHERE id = ? AND project_id = ?")
        .run(req.params.lineItemId, req.params.id);
    } else {
      db.prepare(`
        UPDATE budget_line_items
        SET budgeted_quantity = 0, installed_quantity = 0, actual_labor_hours = 0, actual_labor_cost = 0
        WHERE id = ? AND project_id = ?
      `).run(req.params.lineItemId, req.params.id);
    }
    const updated = db.prepare("SELECT * FROM budget_line_items WHERE id = ? AND project_id = ?")
      .get(req.params.lineItemId, req.params.id);
    res.json(updated || null);
  });
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
