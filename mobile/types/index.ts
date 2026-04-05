export type UserType = 'internal' | 'external' | 'demo';
export type CompanyRole = 'super_admin' | 'admin' | 'member';
export type UserRole = 'user' | 'contractor' | 'admin';
export type ProjectPermission = 'write' | 'read_only';

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  organizations: Organization[];
}

export interface Organization {
  org_id: string;
  name: string;
  role: string;
  billing: { stripe_customer_id: string | null; subscription_status: string | null } | null;
  projects: ProjectEntry[];
}

export interface ProjectEntry {
  project_id: string;
  name: string;
  status: string;
  evaluated_permission: ProjectPermission;
}

export interface AuthSession {
  id: string;
  email: string;
  username: string;
  role: string;
  company_id: string | null;
  company_role: string | null;
  user_type: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  zip_code: string | null;
  city: string | null;
  state: string | null;
  county: string | null;
  value: number;
  status: string;
  company_id: string;
  project_number: string | null;
  sector: string | null;
  start_date: string | null;
  actual_start_date: string | null;
  completion_date: string | null;
  projected_finish_date: string | null;
  created_at: string;
}

export type RFIStatus = 'draft' | 'open' | 'closed';

export interface RFI {
  id: string;
  project_id: string;
  rfi_number: number;
  subject: string;
  question: string;
  due_date: string | null;
  status: RFIStatus;
  rfi_manager_id: string | null;
  responsible_contractor_id: string | null;
  assignees: string[];
  distribution_list: string[];
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
  responses?: RFIResponse[];
}

export interface RFIResponse {
  id: string;
  rfi_id: string;
  response: string;
  attachments: Attachment[];
  created_by: string;
  created_at: string;
}

export type SubmittalStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'approved_as_noted' | 'revise_resubmit' | 'rejected';

export interface Submittal {
  id: string;
  project_id: string;
  submittal_number: number;
  revision: string;
  title: string;
  status: SubmittalStatus;
  type: string | null;
  spec_id: string | null;
  submit_by: string | null;
  received_date: string | null;
  issue_date: string | null;
  final_due_date: string | null;
  ball_in_court_id: string | null;
  created_at: string;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface Task {
  id: string;
  project_id: string;
  task_number: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  category: string | null;
  due_date: string | null;
  assignees: string[];
  distribution_list: string[];
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  project_id: string;
  log_date: string;
  weather_conditions: string | null;
  weather_temp: string | null;
  weather_wind: string | null;
  inspections: string | null;
  deliveries: string | null;
  visitors: string | null;
  safety_violations: string | null;
  accidents: string | null;
  delays: string | null;
  manpower: ManpowerEntry[];
  notes: string | null;
  photos: string[];
  created_by: string | null;
  created_at: string;
}

export interface ManpowerEntry {
  company: string;
  workers: number;
  hours: number;
}

export interface BudgetLineItem {
  id: string;
  project_id: string;
  cost_code: string;
  description: string;
  original_budget_amount: number;
  budget_modifications: number;
  approved_cos: number;
  pending_budget_changes: number;
  committed_costs: number;
  job_to_date_costs: number;
  commitments_invoiced: number;
  pending_cost_changes: number;
}

export interface Attachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface DirectoryContact {
  id: string;
  project_id: string;
  type: 'user' | 'company' | 'distribution_group';
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  role: string | null;
}

export interface ProjectPhoto {
  id: string;
  project_id: string;
  storage_path: string;
  url: string;
  caption: string | null;
  album_id: string | null;
  created_at: string;
  uploader_name: string | null;
}

export interface PhotoAlbum {
  id: string;
  project_id: string;
  name: string;
  cover_url: string | null;
  photo_count: number;
  created_at: string;
}
