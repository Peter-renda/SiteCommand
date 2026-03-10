"use client";

import { useState, useEffect } from "react";
import ProjectNav from "@/components/ProjectNav";

type PrimeContract = {
  id: string;
  contract_number: number;
  title: string;
  status: string;
  owner: string | null;
  contractor: string | null;
  contract_value: number | null;
  executed_date: string | null;
  start_date: string | null;
  completion_date: string | null;
  description: string | null;
  created_at: string;
};

const STATUSES = ["draft", "pending", "executed", "terminated", "closed"];
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Pending",
  executed: "Executed",
  terminated: "Terminated",
  closed: "Closed",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700",
  pending: "bg-blue-50 text-blue-700",
  executed: "bg-green-50 text-green-700",
  terminated: "bg-red-50 text-red-700",
  closed: "bg-gray-100 text-gray-600",
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(v: number | null): string {
  if (v == null) return "—";
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function exportPDF(contracts: PrimeContract[]) {
  const headers = ["#", "Title", "Status", "Owner", "Contractor", "Value", "Executed", "Start", "Completion"];
  const rows = contracts.map((c) => [
    String(c.contract_number),
    c.title,
    STATUS_LABELS[c.status] ?? c.status,
    c.owner ?? "—",
    c.contractor ?? "—",
    formatCurrency(c.contract_value),
    formatDate(c.executed_date),
    formatDate(c.start_date),
    formatDate(c.completion_date),
  ]);
  const thRow = headers.map((h) => `<th>${h}</th>`).join("");
  const tableRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${String(cell).replace(/</g, "&lt;")}</td>`).join("")}</tr>`).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Prime Contracts</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px;}h1{font-size:16px;margin-bottom:16px;}table{width:100%;border-collapse:collapse;}th{background:#f3f4f6;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;}td{padding:8px 10px;border-bottom:1px solid #e5e7eb;}@media print{body{padding:0;}}</style></head><body>
    <h1>Prime Contracts</h1><table><thead><tr>${thRow}</tr></thead><tbody>${tableRows}</tbody></table>
    <script>window.onload=()=>{window.print();}<\/script></body></html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

function CreateContractModal({
  nextNumber,
  onConfirm,
  onCancel,
}: {
  nextNumber: number;
  onConfirm: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [owner, setOwner] = useState("");
  const [contractor, setContractor] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [executedDate, setExecutedDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-gray-900">Create Prime Contract</h2>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title <span className="text-red-500">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contract title" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          {/* Number & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contract #</label>
              <input type="text" readOnly value={nextNumber} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          {/* Owner & Contractor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Owner</label>
              <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner name" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contractor</label>
              <input type="text" value={contractor} onChange={(e) => setContractor(e.target.value)} placeholder="Contractor name" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          {/* Contract Value */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Contract Value ($)</label>
            <input type="number" min="0" step="0.01" value={contractValue} onChange={(e) => setContractValue(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Executed Date</label>
              <input type="date" value={executedDate} onChange={(e) => setExecutedDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Completion Date</label>
              <input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Description..." className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              type="button"
              onClick={() => onConfirm({ title, status, owner: owner || null, contractor: contractor || null, contract_value: contractValue ? Number(contractValue) : null, executed_date: executedDate || null, start_date: startDate || null, completion_date: completionDate || null, description: description || null })}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrimeContractsClient({ projectId, role, username }: { projectId: string; role: string; username: string }) {
  const [contracts, setContracts] = useState<PrimeContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/prime-contracts`)
      .then((r) => r.json())
      .then((d) => { setContracts(Array.isArray(d) ? d : []); setLoading(false); });
  }, [projectId]);

  const nextNumber = contracts.length > 0 ? Math.max(...contracts.map((c) => c.contract_number)) + 1 : 1;

  async function handleCreate(data: Record<string, unknown>) {
    setShowCreate(false);
    setCreating(true);
    const res = await fetch(`/api/projects/${projectId}/prime-contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const newContract: PrimeContract = await res.json();
      setContracts((prev) => [...prev, newContract]);
    }
    setCreating(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">SiteCommand</a>
        <div className="flex items-center gap-5">
          {role === "admin" && <a href="/admin" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">Admin</a>}
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Prime Contracts</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportPDF(contracts)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export as PDF
            </button>
            <button
              onClick={() => setShowCreate(true)}
              disabled={creating}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              {creating ? "Creating..." : "Create contract"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : contracts.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-16 text-center">
            <p className="text-sm text-gray-400">No prime contracts yet</p>
            <p className="text-xs text-gray-300 mt-1">Click Create contract to add the first one</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Owner</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Contractor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Executed</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Start</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Completion</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-b-0">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{c.contract_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.owner ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.contractor ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{formatCurrency(c.contract_value)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(c.executed_date)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(c.start_date)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(c.completion_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showCreate && (
        <CreateContractModal
          nextNumber={nextNumber}
          onConfirm={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
