"use client";

import { useMemo, useState } from "react";
import ProjectNav from "@/components/ProjectNav";

// ─── Types ───────────────────────────────────────────────────────────────────

type ReportDef = {
  label: string;
  value: string;
  group: string;
  description: string;
  columns: { key: string; label: string }[];
  hasDateRange: boolean;
};

type SavedReport = {
  id: string;
  name: string;
  reportType: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sharedWith: string[];
  sourceReportId?: string;
};

type DashboardVisual = {
  id: string;
  reportId: string;
  reportName: string;
  title: string;
  metricLabel: string;
  metricValue: string;
};

type SavedDashboard = {
  id: string;
  name: string;
  visualIds: string[];
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sharedWith: string[];
};

// ─── Report definitions ───────────────────────────────────────────────────────

const REPORT_TYPES: ReportDef[] = [
  {
    label: "Delays",
    value: "daily-delays",
    group: "Daily Log",
    description: "All delay entries logged in the daily log, including type, duration and location.",
    hasDateRange: true,
    columns: [
      { key: "log_date", label: "Date" },
      { key: "delay_type", label: "Delay Type" },
      { key: "start_time", label: "Start Time" },
      { key: "end_time", label: "End Time" },
      { key: "duration_hours", label: "Duration (hrs)" },
      { key: "location", label: "Location" },
      { key: "comments", label: "Comments" },
    ],
  },
  {
    label: "Manpower",
    value: "daily-manpower",
    group: "Daily Log",
    description: "Workforce entries per company, including worker counts, hours and cost codes.",
    hasDateRange: true,
    columns: [
      { key: "log_date", label: "Date" },
      { key: "company", label: "Company" },
      { key: "workers", label: "Workers" },
      { key: "hours", label: "Hours" },
      { key: "location", label: "Location" },
      { key: "cost_code", label: "Cost Code" },
      { key: "comments", label: "Comments" },
    ],
  },
  {
    label: "Weather Observations",
    value: "daily-weather",
    group: "Daily Log",
    description: "Weather conditions recorded each day, including sky, temperature, wind and precipitation.",
    hasDateRange: true,
    columns: [
      { key: "log_date", label: "Date" },
      { key: "time_observed", label: "Time" },
      { key: "sky", label: "Sky" },
      { key: "temperature", label: "Temp" },
      { key: "wind", label: "Wind" },
      { key: "avg_precipitation", label: "Precipitation" },
      { key: "ground_sea", label: "Ground/Sea" },
      { key: "delay", label: "Delay?" },
      { key: "calamity", label: "Calamity" },
      { key: "comments", label: "Comments" },
    ],
  },
  {
    label: "Safety Violations",
    value: "daily-safety",
    group: "Daily Log",
    description: "Safety notices issued on site, including subject, recipient and compliance due date.",
    hasDateRange: true,
    columns: [
      { key: "log_date", label: "Date" },
      { key: "time", label: "Time" },
      { key: "subject", label: "Subject" },
      { key: "safety_notice", label: "Safety Notice" },
      { key: "issued_to", label: "Issued To" },
      { key: "compliance_due", label: "Compliance Due" },
      { key: "comments", label: "Comments" },
    ],
  },
  {
    label: "Accidents",
    value: "daily-accidents",
    group: "Daily Log",
    description: "Accident and incident records logged in the daily log.",
    hasDateRange: true,
    columns: [
      { key: "log_date", label: "Date" },
      { key: "time", label: "Time" },
      { key: "party_involved", label: "Party Involved" },
      { key: "company_involved", label: "Company" },
      { key: "comments", label: "Comments" },
    ],
  },
  {
    label: "Inspections",
    value: "daily-inspections",
    group: "Daily Log",
    description: "Site inspection records including type, inspector, and location details.",
    hasDateRange: true,
    columns: [
      { key: "log_date", label: "Date" },
      { key: "inspection_type", label: "Type" },
      { key: "inspecting_entity", label: "Entity" },
      { key: "inspector_name", label: "Inspector" },
      { key: "start_time", label: "Start" },
      { key: "end_time", label: "End" },
      { key: "location", label: "Location" },
      { key: "inspection_area", label: "Area" },
      { key: "comments", label: "Comments" },
    ],
  },
  {
    label: "Deliveries",
    value: "daily-deliveries",
    group: "Daily Log",
    description: "Material and equipment deliveries tracked in the daily log.",
    hasDateRange: true,
    columns: [
      { key: "log_date", label: "Date" },
      { key: "time", label: "Time" },
      { key: "delivery_from", label: "Delivery From" },
      { key: "tracking_number", label: "Tracking #" },
      { key: "contents", label: "Contents" },
      { key: "comments", label: "Comments" },
    ],
  },
  {
    label: "Visitors",
    value: "daily-visitors",
    group: "Daily Log",
    description: "Visitor log entries including arrival/departure times.",
    hasDateRange: true,
    columns: [
      { key: "log_date", label: "Date" },
      { key: "visitor", label: "Visitor" },
      { key: "start_time", label: "Start" },
      { key: "end_time", label: "End" },
      { key: "comments", label: "Comments" },
    ],
  },
  {
    label: "Notes & Issues",
    value: "daily-notes",
    group: "Daily Log",
    description: "General notes and flagged issues recorded during daily log entries.",
    hasDateRange: true,
    columns: [
      { key: "log_date", label: "Date" },
      { key: "is_issue", label: "Issue?" },
      { key: "location", label: "Location" },
      { key: "comments", label: "Comments" },
    ],
  },
  {
    label: "Commitments Summary",
    value: "commitments-summary",
    group: "Financial Management",
    description: "All purchase orders and subcontracts with status, contract amounts, approved change orders, and remaining balances.",
    hasDateRange: false,
    columns: [
      { key: "number", label: "#" },
      { key: "type", label: "Type" },
      { key: "contract_company", label: "Company" },
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "sov_accounting_method", label: "Accounting Method" },
      { key: "original_contract_amount", label: "Original Amount" },
      { key: "approved_change_orders", label: "Approved COs" },
      { key: "pending_change_orders", label: "Pending COs" },
      { key: "erp_status", label: "ERP Status" },
    ],
  },
  {
    label: "Change Events",
    value: "change-events",
    group: "Financial Management",
    description: "Change events log with scope classification, ROM amounts, and linkage to change orders.",
    hasDateRange: false,
    columns: [
      { key: "number", label: "#" },
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "scope", label: "Scope" },
      { key: "rom_amount", label: "ROM Amount" },
      { key: "created_at", label: "Created" },
    ],
  },
  {
    label: "Commitment Change Orders",
    value: "commitment-change-orders",
    group: "Financial Management",
    description: "All commitment change orders across the project, including status, amount, and linked contracts.",
    hasDateRange: false,
    columns: [
      { key: "number", label: "#" },
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "contract_company", label: "Company" },
      { key: "contract_name", label: "Contract" },
      { key: "amount", label: "Amount" },
      { key: "change_reason", label: "Change Reason" },
      { key: "due_date", label: "Due Date" },
    ],
  },
  {
    label: "Budget Summary",
    value: "budget-summary",
    group: "Financial Management",
    description: "Budget line items showing original budget, committed costs, and variance by cost code.",
    hasDateRange: false,
    columns: [
      { key: "cost_code", label: "Cost Code" },
      { key: "description", label: "Description" },
      { key: "original_budget", label: "Original Budget" },
      { key: "committed_costs", label: "Committed Costs" },
      { key: "variance", label: "Variance" },
    ],
  },
  {
    label: "RFIs",
    value: "rfis",
    group: "Project Tools",
    description: "All Requests for Information on the project, with status and due dates.",
    hasDateRange: false,
    columns: [
      { key: "rfi_number", label: "RFI #" },
      { key: "subject", label: "Subject" },
      { key: "status", label: "Status" },
      { key: "due_date", label: "Due Date" },
      { key: "created_at", label: "Created" },
    ],
  },
  {
    label: "Submittals",
    value: "submittals",
    group: "Project Tools",
    description: "Submittal log including type, status, submission and issue dates.",
    hasDateRange: false,
    columns: [
      { key: "submittal_number", label: "Submittal #" },
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "submittal_type", label: "Type" },
      { key: "submit_by", label: "Submit By" },
      { key: "received_date", label: "Received" },
      { key: "issue_date", label: "Issued" },
      { key: "cost_code", label: "Cost Code" },
    ],
  },
  {
    label: "Tasks",
    value: "tasks",
    group: "Project Tools",
    description: "Open and closed tasks assigned to the project team.",
    hasDateRange: false,
    columns: [
      { key: "task_number", label: "Task #" },
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "category", label: "Category" },
      { key: "created_at", label: "Created" },
    ],
  },
  {
    label: "Punch List",
    value: "punch-list",
    group: "Project Tools",
    description: "Punch list items with type, trade, priority and location details.",
    hasDateRange: false,
    columns: [
      { key: "item_number", label: "Item #" },
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "type", label: "Type" },
      { key: "trade", label: "Trade" },
      { key: "priority", label: "Priority" },
      { key: "due_date", label: "Due Date" },
      { key: "location", label: "Location" },
    ],
  },
];

const GROUPS = Array.from(new Set(REPORT_TYPES.map((r) => r.group)));
const VIEWER_OPTIONS = ["Company Admins", "Project Managers", "Field Team", "Executives"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
}

function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "log_date" || key === "created_at")
    return new Date(value as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (key === "is_issue") return value ? "Issue" : "Note";
  if (key === "delay") return value ? "Yes" : "No";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function toCSV(columns: { key: string; label: string }[], rows: Record<string, unknown>[]): string {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const body = rows
    .map((row) => columns.map((c) => `"${formatCell(c.key, row[c.key]).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function makeVisualFromReport(report: SavedReport): DashboardVisual {
  return {
    id: `visual-${report.id}`,
    reportId: report.id,
    reportName: report.name,
    title: `${report.name} · Snapshot`,
    metricLabel: "Last Updated",
    metricValue: fmtDate(report.updatedAt),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ group }: { group: string }) {
  const label =
    group === "Daily Log"
      ? "Daily Log Report"
      : group === "Financial Management"
      ? "Financial Report"
      : "Single Tool Report";
  const cls =
    group === "Financial Management"
      ? "border-emerald-200 text-emerald-700 bg-emerald-50"
      : "border-gray-300 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}

function SavedTypeBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded border border-gray-300 text-xs text-gray-600 whitespace-nowrap">
      {label}
    </span>
  );
}

function RowMenu({ actions }: { actions: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
                className={`w-full text-left px-4 py-2 text-sm ${action.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  count,
  subtitle,
  open,
  onToggle,
}: {
  title: string;
  count: number;
  subtitle: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors"
        >
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${open ? "" : "-rotate-90"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {title} <span className="font-normal text-gray-500">({count})</span>
        </button>
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5 ml-6">{subtitle}</p>}
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
        active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Run Report Modal ─────────────────────────────────────────────────────────

function RunReportModal({
  reportDef,
  projectId,
  onClose,
  onSave,
}: {
  reportDef: ReportDef;
  projectId: string;
  onClose: () => void;
  onSave: (report: SavedReport) => void;
}) {
  const today = new Date();
  const [reportName, setReportName] = useState(reportDef.label);
  const [startDate, setStartDate] = useState(`${today.getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ran, setRan] = useState(false);

  async function runReport() {
    setLoading(true);
    setError("");
    setRan(false);
    const params = new URLSearchParams({ type: reportDef.value });
    if (reportDef.hasDateRange) {
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);
    }
    const res = await fetch(`/api/projects/${projectId}/reports?${params}`);
    const data = await res.json();
    setLoading(false);
    setRan(true);
    if (!res.ok) {
      setError(data.error || "Failed to run report");
      setRows([]);
      return;
    }
    setRows(Array.isArray(data) ? data : []);
  }

  function handleExport() {
    if (rows.length === 0) return;
    const csv = toCSV(reportDef.columns, rows);
    downloadCSV(`${reportName.toLowerCase().replace(/\s+/g, "-")}.csv`, csv);
  }

  function handleExportPDF() {
    if (rows.length === 0) return;
    const headerCells = reportDef.columns.map((c) => `<th>${c.label}</th>`).join("");
    const bodyRows = rows
      .map((row) => `<tr>${reportDef.columns.map((c) => `<td>${formatCell(c.key, row[c.key])}</td>`).join("")}</tr>`)
      .join("");
    const html = `<!DOCTYPE html><html><head><title>${reportName}</title><style>
      body{font-family:sans-serif;font-size:11px;margin:24px}
      h2{margin:0 0 4px;font-size:14px}
      p{margin:0 0 12px;color:#666;font-size:11px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ddd;padding:5px 8px;text-align:left}
      th{background:#f3f4f6;font-weight:600;font-size:10px;text-transform:uppercase}
      tr:nth-child(even){background:#fafafa}
      @media print{body{margin:12px}}
    </style></head><body>
      <h2>${reportName}</h2>
      <p>${reportDef.group} &middot; ${rows.length} record${rows.length === 1 ? "" : "s"}</p>
      <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
    </body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  function handleSave() {
    const reportType =
      reportDef.group === "Daily Log"
        ? "Daily Log Report"
        : reportDef.group === "Financial Management"
        ? "Financial Report"
        : "Single Tool Report";
    const saved: SavedReport = {
      id: crypto.randomUUID(),
      name: reportName,
      reportType,
      description: reportDef.description,
      createdBy: "Me",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sharedWith: [],
    };
    onSave(saved);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-900 focus:outline-none px-0.5 w-64"
              placeholder="Report name..."
            />
            <p className="text-xs text-gray-400 mt-0.5">
              {reportDef.group} · {reportDef.description}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors ml-4 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="flex flex-wrap items-end gap-3">
            {reportDef.hasDateRange && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </>
            )}
            <button
              onClick={runReport}
              disabled={loading}
              className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
              {loading ? "Running..." : "Run Report"}
            </button>
            {ran && rows.length > 0 && (
              <>
                <button
                  onClick={handleExport}
                  className="px-4 py-1.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-1.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Export PDF
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Save Report
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-auto flex-1">
          {error && <p className="text-sm text-red-600 px-6 py-4">{error}</p>}
          {ran && !error && rows.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-400">No records found for the selected criteria.</p>
            </div>
          )}
          {ran && !error && rows.length > 0 && (
            <>
              <div className="px-6 py-2.5 border-b border-gray-100 bg-white sticky top-0">
                <p className="text-xs text-gray-500">
                  {rows.length} {rows.length === 1 ? "record" : "records"}
                </p>
              </div>
              <table className="w-full text-sm">
                <thead className="sticky top-9">
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {reportDef.columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      {reportDef.columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap max-w-xs truncate"
                          title={formatCell(col.key, row[col.key]) === "—" ? undefined : formatCell(col.key, row[col.key])}
                        >
                          {formatCell(col.key, row[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {!ran && (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-400">
                Configure the filters above and click <span className="font-medium text-gray-600">Run Report</span> to view results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShareDashboardModal({
  dashboard,
  onClose,
  onShare,
}: {
  dashboard: SavedDashboard;
  onClose: () => void;
  onShare: (viewerGroups: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(dashboard.sharedWith);

  function toggle(group: string) {
    setSelected((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-base font-semibold text-gray-900">Share Dashboard</h2>
        <p className="text-xs text-gray-500 mt-1">
          Dashboards must be published before users with Standard or Read Only access can view them.
        </p>

        <div className="mt-4 p-3 rounded-md border border-amber-200 bg-amber-50 text-xs text-amber-900">
          <p className="font-medium">{dashboard.isPublished ? "Published" : "Not published"}</p>
          <p className="mt-1">
            {dashboard.isPublished
              ? "This dashboard is ready to share. Viewers can open it in Shared Dashboards."
              : "Publish this dashboard first, then share it with project users or distribution groups."}
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {VIEWER_OPTIONS.map((group) => (
            <label key={group} className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={selected.includes(group)} onChange={() => toggle(group)} className="rounded" />
              {group}
            </label>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!dashboard.isPublished}
            onClick={() => {
              onShare(selected);
              onClose();
            }}
            className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            Share Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateDashboardModal({
  visuals,
  onClose,
  onCreate,
}: {
  visuals: DashboardVisual[];
  onClose: () => void;
  onCreate: (payload: { name: string; visualIds: string[] }) => void;
}) {
  const [name, setName] = useState("Project Dashboard");
  const [selectedVisuals, setSelectedVisuals] = useState<string[]>([]);

  function toggleVisual(id: string) {
    setSelectedVisuals((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <h2 className="text-base font-semibold text-gray-900">Create Dashboard</h2>
        <p className="text-xs text-gray-500 mt-1">Select visuals from your report library and save your dashboard.</p>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Dashboard Title</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="mt-4 border border-gray-200 rounded-lg max-h-80 overflow-auto">
          {visuals.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">Save at least one report to build your visual library.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {visuals.map((visual) => (
                <label key={visual.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedVisuals.includes(visual.id)}
                    onChange={() => toggleVisual(visual.id)}
                    className="mt-0.5 rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{visual.title}</p>
                    <p className="text-xs text-gray-500">Source report: {visual.reportName}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={selectedVisuals.length === 0 || !name.trim()}
            onClick={() => onCreate({ name: name.trim(), visualIds: selectedVisuals })}
            className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            Save Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportingClient({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<"reports" | "dashboards">("reports");
  const [search, setSearch] = useState("");
  const [myReports, setMyReports] = useState<SavedReport[]>([]);
  const [myReportsOpen, setMyReportsOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(true);

  const [dashboards, setDashboards] = useState<SavedDashboard[]>([]);
  const [showCreateDashboardModal, setShowCreateDashboardModal] = useState(false);
  const [shareDashboardId, setShareDashboardId] = useState<string | null>(null);

  const [activeReport, setActiveReport] = useState<ReportDef | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState("");

  const visualLibrary = useMemo(() => myReports.map(makeVisualFromReport), [myReports]);

  function openTemplate(def: ReportDef) {
    setActiveReport(def);
  }

  function openFromSaved(saved: SavedReport) {
    const def =
      REPORT_TYPES.find((r) => {
        const expectedType = r.group === "Daily Log" ? "Daily Log Report" : "Single Tool Report";
        return expectedType === saved.reportType && r.label === saved.name.split(" - ")[0];
      }) ??
      REPORT_TYPES.find((r) => {
        const expectedType = r.group === "Daily Log" ? "Daily Log Report" : "Single Tool Report";
        return expectedType === saved.reportType;
      });

    if (def) setActiveReport(def);
  }

  function handleSaveReport(report: SavedReport) {
    setMyReports((prev) => [report, ...prev]);
  }

  function deleteReport(id: string) {
    setMyReports((prev) => prev.filter((r) => r.id !== id));
  }

  function cloneReport(report: SavedReport) {
    const now = new Date().toISOString();
    const clone: SavedReport = {
      ...report,
      id: crypto.randomUUID(),
      name: `Copy of ${report.name}`,
      createdBy: "Me",
      createdAt: now,
      updatedAt: now,
      sourceReportId: report.id,
      sharedWith: [],
    };
    setMyReports((prev) => [clone, ...prev]);
  }

  function createDashboard(payload: { name: string; visualIds: string[] }) {
    const now = new Date().toISOString();
    const dashboard: SavedDashboard = {
      id: crypto.randomUUID(),
      name: payload.name,
      visualIds: payload.visualIds,
      isPublished: false,
      createdBy: "Me",
      createdAt: now,
      updatedAt: now,
      sharedWith: [],
    };
    setDashboards((prev) => [dashboard, ...prev]);
    setShowCreateDashboardModal(false);
  }

  function updateDashboard(id: string, patch: Partial<SavedDashboard>) {
    setDashboards((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d))
    );
  }

  function deleteDashboard(id: string) {
    setDashboards((prev) => prev.filter((d) => d.id !== id));
  }

  const filteredTemplates = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return REPORT_TYPES;
    return REPORT_TYPES.filter(
      (r) => r.label.toLowerCase().includes(q) || r.group.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredMyReports = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return myReports;
    return myReports.filter(
      (r) => r.name.toLowerCase().includes(q) || r.reportType.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    );
  }, [search, myReports]);

  const groupedTemplates = useMemo(() => {
    return GROUPS.map((g) => ({
      group: g,
      items: filteredTemplates.filter((r) => r.group === g),
    })).filter((g) => g.items.length > 0);
  }, [filteredTemplates]);

  const filteredDashboards = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return dashboards;
    return dashboards.filter((d) => d.name.toLowerCase().includes(q) || d.sharedWith.join(" ").toLowerCase().includes(q));
  }, [dashboards, search]);

  const sharingDashboard = shareDashboardId ? dashboards.find((d) => d.id === shareDashboardId) ?? null : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={projectId} />

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-gray-400">Project 360 Reporting</p>
            <p className="text-xs text-gray-500 mt-1">Create reports, clone reports, then build and share dashboards from your visual library.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <TabButton active={activeTab === "reports"} label="Reports" onClick={() => setActiveTab("reports")} />
            <TabButton active={activeTab === "dashboards"} label="Dashboards" onClick={() => setActiveTab("dashboards")} />
            {activeTab === "reports" ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Report
              </button>
            ) : (
              <button
                onClick={() => setShowCreateDashboardModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Dashboard
              </button>
            )}
          </div>
        </div>

        <div className="relative mb-6 max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === "reports" ? "Search reports/templates" : "Search dashboards"}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        {activeTab === "reports" && (
          <>
            <div className="mb-6">
              <SectionHeader
                title="My Reports"
                count={filteredMyReports.length}
                subtitle="Created reports and cloned copies. Users with Standard or higher permissions can clone shared reports."
                open={myReportsOpen}
                onToggle={() => setMyReportsOpen((v) => !v)}
              />

              {myReportsOpen && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-3">
                  {filteredMyReports.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-sm text-gray-400">
                        {search ? "No saved reports match your search." : "No saved reports yet. Run a template and click “Save Report”."}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-64">Report Name</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-44">Report Type</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Description</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-32">Created By</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-28">Date Created</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-28">Last Modified</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredMyReports.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openFromSaved(r)}>
                            <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                            <td className="px-4 py-3">
                              <SavedTypeBadge label={r.reportType} />
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{r.description}</td>
                            <td className="px-4 py-3 text-gray-600">{r.createdBy}</td>
                            <td className="px-4 py-3 text-gray-500">{fmtDate(r.createdAt)}</td>
                            <td className="px-4 py-3 text-gray-500">{fmtDate(r.updatedAt)}</td>
                            <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                              <RowMenu
                                actions={[
                                  { label: "Run Report", onClick: () => openFromSaved(r) },
                                  { label: "Clone Report", onClick: () => cloneReport(r) },
                                  { label: "Delete", onClick: () => deleteReport(r.id), danger: true },
                                ]}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            <div>
              <SectionHeader
                title="Popular Templates"
                count={filteredTemplates.length}
                subtitle="Choose a template to produce a report from a single project tool. Data is relative to this project."
                open={templatesOpen}
                onToggle={() => setTemplatesOpen((v) => !v)}
              />

              {templatesOpen && (
                <div className="space-y-4 mt-3">
                  {groupedTemplates.map(({ group, items }) => (
                    <div key={group}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 px-1">{group}</p>
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-64">Report Name</th>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-44">Report Type</th>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Description</th>
                              <th className="w-10" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {items.map((r) => (
                              <tr key={r.value} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openTemplate(r)}>
                                <td className="px-4 py-3 font-medium text-gray-900">{r.label}</td>
                                <td className="px-4 py-3">
                                  <TypeBadge group={r.group} />
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500 max-w-sm">{r.description}</td>
                                <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                                  <RowMenu actions={[{ label: "Run Report", onClick: () => openTemplate(r) }]} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                  {groupedTemplates.length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg py-10 text-center">
                      <p className="text-sm text-gray-400">No templates match your search.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "dashboards" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900">
              Dashboards are built from visuals created from your custom reports. Publish a dashboard before sharing it with Standard or Read Only users.
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {filteredDashboards.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">No dashboards yet. Click “Create Dashboard” to start.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Dashboard</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Visuals</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Status</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Shared With</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Updated</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDashboards.map((dashboard) => (
                      <tr key={dashboard.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{dashboard.name}</p>
                          <p className="text-xs text-gray-500">Created by {dashboard.createdBy}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{dashboard.visualIds.length}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs rounded border ${
                              dashboard.isPublished
                                ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                                : "border-gray-200 text-gray-600 bg-gray-50"
                            }`}
                          >
                            {dashboard.isPublished ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {dashboard.sharedWith.length === 0 ? "Not shared" : dashboard.sharedWith.join(", ")}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{fmtDate(dashboard.updatedAt)}</td>
                        <td className="px-2 py-3">
                          <RowMenu
                            actions={[
                              {
                                label: dashboard.isPublished ? "Unpublish" : "Publish",
                                onClick: () => updateDashboard(dashboard.id, { isPublished: !dashboard.isPublished }),
                              },
                              { label: "Share", onClick: () => setShareDashboardId(dashboard.id) },
                              { label: "Delete", onClick: () => deleteDashboard(dashboard.id), danger: true },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {filteredDashboards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDashboards.map((dashboard) => {
                  const visuals = visualLibrary.filter((v) => dashboard.visualIds.includes(v.id));
                  return (
                    <div key={`${dashboard.id}-preview`} className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-900">{dashboard.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Dashboard preview</p>
                      <div className="mt-3 space-y-2">
                        {visuals.length === 0 ? (
                          <p className="text-xs text-gray-400">No visuals selected.</p>
                        ) : (
                          visuals.map((visual) => (
                            <div key={visual.id} className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
                              <p className="text-xs font-medium text-gray-700">{visual.title}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {visual.metricLabel}: {visual.metricValue}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {activeReport && (
        <RunReportModal
          reportDef={activeReport}
          projectId={projectId}
          onClose={() => setActiveReport(null)}
          onSave={handleSaveReport}
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Create Report</h2>
            <p className="text-xs text-gray-400 mb-4">Select a report type to get started.</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Select a report...</option>
                {GROUPS.map((group) => (
                  <optgroup key={group} label={group}>
                    {REPORT_TYPES.filter((r) => r.group === group).map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateType("");
                }}
                className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!createType}
                onClick={() => {
                  const def = REPORT_TYPES.find((r) => r.value === createType);
                  if (def) {
                    setShowCreateModal(false);
                    setCreateType("");
                    setActiveReport(def);
                  }
                }}
                className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateDashboardModal && (
        <CreateDashboardModal
          visuals={visualLibrary}
          onClose={() => setShowCreateDashboardModal(false)}
          onCreate={createDashboard}
        />
      )}

      {sharingDashboard && (
        <ShareDashboardModal
          dashboard={sharingDashboard}
          onClose={() => setShareDashboardId(null)}
          onShare={(viewerGroups) => updateDashboard(sharingDashboard.id, { sharedWith: viewerGroups })}
        />
      )}
    </div>
  );
}
