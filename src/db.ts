import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { join } from "path";
const db = new Database("sitecommand.db");
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subscription_plan TEXT,
      subscription_status TEXT DEFAULT 'inactive',
      seat_limit INTEGER DEFAULT 0,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      billing_owner_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      first_name TEXT,
      last_name TEXT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      company_id TEXT,
      company_role TEXT,
      user_type TEXT DEFAULT 'internal',
      phone TEXT,
      favorites TEXT, -- JSON array
      approved BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies (id)
    );
    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      company_id TEXT,
      project_id TEXT,
      invited_by TEXT,
      invitation_type TEXT DEFAULT 'internal',
      invited_role TEXT DEFAULT 'member',
      project_role TEXT,
      accepted_at DATETIME,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies (id),
      FOREIGN KEY (invited_by) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      project_number TEXT,
      sector TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      county TEXT,
      value REAL DEFAULT 0,
      status TEXT DEFAULT 'bidding',
      photo_url TEXT,
      start_date DATE,
      actual_start_date DATE,
      completion_date DATE,
      projected_finish_date DATE,
      warranty_start_date DATE,
      warranty_end_date DATE,
      company_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies (id)
    );
    CREATE TABLE IF NOT EXISTS project_memberships (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      company_id TEXT,
      role TEXT DEFAULT 'member',
      allowed_sections TEXT, -- JSON array
      invited_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (company_id) REFERENCES companies (id)
    );
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      log_date DATE NOT NULL,
      weather_conditions TEXT,
      weather_temp TEXT,
      weather_wind TEXT,
      weather_humidity TEXT,
      inspections TEXT, -- JSON
      deliveries TEXT, -- JSON
      visitors TEXT, -- JSON
      safety_violations TEXT, -- JSON
      accidents TEXT, -- JSON
      delays TEXT, -- JSON
      manpower TEXT, -- JSON
      note_entries TEXT, -- JSON
      photos TEXT, -- JSON
      weather_observations TEXT, -- JSON
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, log_date),
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS directory_contacts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      company TEXT,
      permission TEXT,
      group_name TEXT,
      notes TEXT,
      job_title TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      parent_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'file' or 'folder'
      storage_path TEXT,
      mime_type TEXT,
      size INTEGER,
      is_private BOOLEAN DEFAULT 0,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (parent_id) REFERENCES documents (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS drawing_uploads (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      filename TEXT NOT NULL,
      page_count INTEGER NOT NULL,
      uploaded_by_name TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    );
    CREATE TABLE IF NOT EXISTS project_drawings (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      upload_id TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      drawing_no TEXT,
      title TEXT,
      revision TEXT,
      discipline TEXT,
      set_name TEXT,
      drawing_date DATE,
      received_date DATE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (upload_id) REFERENCES drawing_uploads (id)
    );
    CREATE TABLE IF NOT EXISTS prime_contracts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      contract_number TEXT,
      owner_client TEXT,
      title TEXT,
      status TEXT DEFAULT 'Draft',
      executed BOOLEAN DEFAULT 0,
      default_retainage REAL DEFAULT 0,
      contractor TEXT,
      architect_engineer TEXT,
      description TEXT,
      inclusions TEXT,
      exclusions TEXT,
      start_date DATE,
      estimated_completion_date DATE,
      actual_completion_date DATE,
      signed_contract_received_date DATE,
      contract_termination_date DATE,
      is_private BOOLEAN DEFAULT 1,
      non_admin_access TEXT,
      allow_non_admin_sov_view BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    );
    CREATE TABLE IF NOT EXISTS prime_contract_sov_items (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      budget_code TEXT,
      description TEXT,
      amount REAL DEFAULT 0,
      billed_to_date REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES prime_contracts (id)
    );
    CREATE TABLE IF NOT EXISTS project_specifications (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    );
    CREATE TABLE IF NOT EXISTS rfis (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      rfi_number INTEGER NOT NULL,
      subject TEXT,
      question TEXT,
      due_date DATE,
      status TEXT DEFAULT 'draft',
      rfi_manager_id TEXT,
      received_from_id TEXT,
      assignees TEXT, -- JSON
      distribution_list TEXT, -- JSON
      responsible_contractor_id TEXT,
      specification_id TEXT,
      drawing_number TEXT,
      attachments TEXT, -- JSON
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS rfi_responses (
      id TEXT PRIMARY KEY,
      rfi_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rfi_id) REFERENCES rfis (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS submittals (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      submittal_number INTEGER NOT NULL,
      revision TEXT DEFAULT 'A',
      title TEXT NOT NULL,
      specification_id TEXT,
      submittal_type TEXT,
      status TEXT DEFAULT 'draft',
      responsible_contractor_id TEXT,
      received_from_id TEXT,
      submittal_manager_id TEXT,
      submit_by DATE,
      received_date DATE,
      issue_date DATE,
      final_due_date DATE,
      cost_code TEXT,
      linked_drawings TEXT,
      distribution_list TEXT, -- JSON
      ball_in_court_id TEXT,
      lead_time INTEGER,
      required_on_site_date DATE,
      private BOOLEAN DEFAULT 0,
      description TEXT,
      attachments TEXT, -- JSON
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      task_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      category TEXT,
      description TEXT,
      photo_url TEXT,
      distribution_list TEXT, -- JSON
      assignees TEXT, -- JSON
      due_date DATE,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS punch_list_items (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      item_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      punch_item_manager_id TEXT,
      type TEXT,
      assignees TEXT, -- JSON
      due_date DATE,
      final_approver_id TEXT,
      distribution_list TEXT, -- JSON
      location TEXT,
      priority TEXT,
      trade TEXT,
      reference TEXT,
      schedule_impact TEXT,
      cost_impact TEXT,
      cost_codes TEXT,
      private BOOLEAN DEFAULT 0,
      description TEXT,
      attachments TEXT, -- JSON
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS photo_albums (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS project_photos (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      album_id TEXT,
      storage_path TEXT NOT NULL,
      url TEXT NOT NULL,
      filename TEXT NOT NULL,
      caption TEXT,
      uploaded_by_id TEXT,
      uploaded_by_name TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (album_id) REFERENCES photo_albums (id),
      FOREIGN KEY (uploaded_by_id) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS company_lessons (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      uploaded_by_name TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      row_count INTEGER,
      columns TEXT, -- JSON
      rows TEXT, -- JSON
      FOREIGN KEY (company_id) REFERENCES companies (id)
    );
    CREATE TABLE IF NOT EXISTS project_schedules (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      filename TEXT NOT NULL,
      uploaded_by_name TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    );
    CREATE TABLE IF NOT EXISTS budget_line_items (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      cost_code TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      original_budget_amount REAL NOT NULL DEFAULT 0,
      budget_modifications REAL NOT NULL DEFAULT 0,
      approved_cos REAL NOT NULL DEFAULT 0,
      pending_budget_changes REAL NOT NULL DEFAULT 0,
      committed_costs REAL NOT NULL DEFAULT 0,
      direct_costs REAL NOT NULL DEFAULT 0,
      pending_cost_changes REAL NOT NULL DEFAULT 0,
      forecast_to_complete REAL NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    );
  `);
  // Create default admin user if not exists
  const adminEmail = "ptrenda1@gmail.com";
  const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync("admin123", salt);
    db.prepare(`
      INSERT INTO users (id, username, first_name, last_name, email, password_hash, role, user_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      "Admin",
      "System",
      "Admin",
      adminEmail,
      hash,
      "admin",
      "internal"
    );
  }
}
export default db;
