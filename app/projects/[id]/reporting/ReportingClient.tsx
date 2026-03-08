"use client";

import { useState } from "react";
import ProjectNav from "@/components/ProjectNav";

type ReportType = {
  label: string;
  value: string;
  group: string;
  columns: { key: string; label: string }[];
  hasDateRange: boolean;
};

const REPORT_TYPES: ReportType[] = [
  // Daily Log
  {
    label: "Delays",
    value: "daily-delays",
    group: "Daily Log",
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
    hasDateRange: true,
    columns: [
      { key: "log_date", label: "Date" },
      { key: "is_issue", label: "Issue?" },
      { key: "location", label: "Location" },
      { key: "comments", label: "Comments" },
    ],
  },
  // Other tools
  {
    label: "RFIs",
    value: "rfis",
    group: "Project Tools",
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

function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "log_date") return new Date(value as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (key === "created_at") return new Date(value as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

// Group report types for the selector
const GROUPS = Array.from(new Set(REPORT_TYPES.map((r) => r.group)));

export default function ReportingClient({
  projectId,
  username,
  role,
}: {
  projectId: string;
  username: string;
  role: string;
}) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ran, setRan] = useState(false);

  const reportDef = REPORT_TYPES.find((r) => r.value === selectedType) ?? null;

  async function runReport() {
    if (!selectedType) return;
    setLoading(true);
    setError("");
    setRan(false);

    const params = new URLSearchParams({ type: selectedType });
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);

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
    if (!reportDef || rows.length === 0) return;
    const csv = toCSV(reportDef.columns, rows);
    downloadCSV(`${reportDef.label.toLowerCase().replace(/\s+/g, "-")}-report.csv`, csv);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={projectId} username={username} role={role} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900">Reporting</h1>
          <p className="text-sm text-gray-400 mt-0.5">Build custom reports from project data</p>
        </div>

        {/* Controls */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Report type selector */}
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Report Type</label>
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setRan(false); setRows([]); setError(""); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Select a report...</option>
                {GROUPS.map((group) => (
                  <optgroup key={group} label={group}>
                    {REPORT_TYPES.filter((r) => r.group === group).map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Date range — only for daily log reports */}
            {reportDef?.hasDateRange && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </>
            )}

            <button
              onClick={runReport}
              disabled={!selectedType || loading}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
              {loading ? "Running..." : "Run Report"}
            </button>

            {ran && rows.length > 0 && (
              <button
                onClick={handleExport}
                className="px-4 py-2 border border-gray-200 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {ran && !error && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {rows.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-gray-400">No records found for the selected criteria.</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">
                    {rows.length} {rows.length === 1 ? "record" : "records"}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        {reportDef?.columns.map((col) => (
                          <th
                            key={col.key}
                            className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          {reportDef?.columns.map((col) => (
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
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
