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
  app.get("/api/projects/:id/rfis", authenticate, (req, res) => {
    const rfis = db.prepare("SELECT * FROM rfis WHERE project_id = ? ORDER BY rfi_number ASC").all(req.params.id);
    res.json(rfis);
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
