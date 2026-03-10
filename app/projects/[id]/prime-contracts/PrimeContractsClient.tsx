"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import ProjectNav from "@/components/ProjectNav";

type SovLine = { id: string; budget_code: string; description: string; amount: string };

type PrimeContract = {
  id: string;
  contract_number: number;
  title: string;
  status: string;
  executed: boolean;
  owner: string | null;
  contractor: string | null;
  architect_engineer: string | null;
  default_retainage: number | null;
  contract_value: number | null;
  description: string | null;
  schedule_of_values: SovLine[];
  inclusions: string | null;
  exclusions: string | null;
  start_date: string | null;
  estimated_completion_date: string | null;
  actual_completion_date: string | null;
  signed_contract_received_date: string | null;
  contract_termination_date: string | null;
  private: boolean;
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

function sovTotal(lines: SovLine[]): number {
  return lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
}

function exportPDF(contracts: PrimeContract[]) {
  const headers = ["#", "Title", "Status", "Owner", "Contractor", "Value", "Start", "Est. Completion"];
  const rows = contracts.map((c) => [
    String(c.contract_number),
    c.title,
    STATUS_LABELS[c.status] ?? c.status,
    c.owner ?? "—",
    c.contractor ?? "—",
    formatCurrency(c.contract_value),
    formatDate(c.start_date),
    formatDate(c.estimated_completion_date),
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

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-base font-semibold text-gray-900 pb-3 border-b border-gray-200 mb-5">{title}</h3>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white";
const selectCls = inputCls;

function CreateContractModal({
  nextNumber,
  onConfirm,
  onCancel,
}: {
  nextNumber: number;
  onConfirm: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  // General Information
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [executed, setExecuted] = useState(false);
  const [owner, setOwner] = useState("");
  const [contractor, setContractor] = useState("");
  const [architectEngineer, setArchitectEngineer] = useState("");
  const [defaultRetainage, setDefaultRetainage] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Schedule of Values
  const [sovLines, setSovLines] = useState<SovLine[]>([]);

  // Inclusions & Exclusions
  const [inclusions, setInclusions] = useState("");
  const [exclusions, setExclusions] = useState("");

  // Contract Dates
  const [startDate, setStartDate] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [actualCompletionDate, setActualCompletionDate] = useState("");
  const [signedContractReceivedDate, setSignedContractReceivedDate] = useState("");
  const [contractTerminationDate, setContractTerminationDate] = useState("");

  // Contract Privacy
  const [isPrivate, setIsPrivate] = useState(false);

  function addSovLine() {
    setSovLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), budget_code: "", description: "", amount: "" },
    ]);
  }

  function updateSovLine(id: string, field: keyof SovLine, value: string) {
    setSovLines((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));
  }

  function removeSovLine(id: string) {
    setSovLines((prev) => prev.filter((l) => l.id !== id));
  }

  const total = sovTotal(sovLines);

  function handleSubmit() {
    onConfirm({
      title,
      status,
      executed,
      owner: owner || null,
      contractor: contractor || null,
      architect_engineer: architectEngineer || null,
      default_retainage: defaultRetainage ? parseFloat(defaultRetainage) : null,
      description: description || null,
      schedule_of_values: sovLines,
      contract_value: total > 0 ? total : null,
      inclusions: inclusions || null,
      exclusions: exclusions || null,
      start_date: startDate || null,
      estimated_completion_date: estimatedCompletionDate || null,
      actual_completion_date: actualCompletionDate || null,
      signed_contract_received_date: signedContractReceivedDate || null,
      contract_termination_date: contractTerminationDate || null,
      private: isPrivate,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col">
      {/* Full-screen scrollable modal */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

          {/* Modal header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Create Prime Contract</h2>
            <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* ── General Information ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader title="General Information" />

            {/* Row 1: Contract #, Owner/Client, Title */}
            <div className="grid grid-cols-3 gap-5 mb-5">
              <Field label="Contract #">
                <input type="text" readOnly value={nextNumber} className={inputCls + " bg-gray-50 text-gray-500 cursor-not-allowed"} />
              </Field>
              <Field label="Owner/Client">
                <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Enter owner/client" className={inputCls} />
              </Field>
              <Field label="Title">
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" className={inputCls} />
              </Field>
            </div>

            {/* Row 2: Status, Executed, Default Retainage */}
            <div className="grid grid-cols-3 gap-5 mb-5">
              <Field label="Status" required>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </Field>
              <Field label="Executed" required>
                <div className="flex items-center h-[38px]">
                  <input
                    id="executed-check"
                    type="checkbox"
                    checked={executed}
                    onChange={(e) => setExecuted(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                  />
                  <label htmlFor="executed-check" className="ml-2 text-sm text-gray-600 cursor-pointer select-none">Yes</label>
                </div>
              </Field>
              <Field label="Default Retainage">
                <div className="relative">
                  <input type="number" min="0" max="100" step="0.01" value={defaultRetainage} onChange={(e) => setDefaultRetainage(e.target.value)} placeholder="0.00" className={inputCls + " pr-8"} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
              </Field>
            </div>

            {/* Row 3: Contractor, Architect/Engineer */}
            <div className="grid grid-cols-2 gap-5 mb-5">
              <Field label="Contractor">
                <input type="text" value={contractor} onChange={(e) => setContractor(e.target.value)} placeholder="Enter contractor" className={inputCls} />
              </Field>
              <Field label="Architect/Engineer">
                <input type="text" value={architectEngineer} onChange={(e) => setArchitectEngineer(e.target.value)} placeholder="Enter architect/engineer" className={inputCls} />
              </Field>
            </div>

            {/* Description */}
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Enter description..." className={inputCls + " resize-none"} />
            </Field>

            {/* Attachments */}
            <div className="mt-5">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Attachments</label>
              <input ref={fileInputRef} type="file" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setAttachmentFile(f); }} />
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) setAttachmentFile(f); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragOver ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                {attachmentFile ? (
                  <p className="text-sm text-gray-700">{attachmentFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-600">Attach Files</p>
                    <p className="text-xs text-gray-400 mt-1">or Drag &amp; Drop</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Schedule of Values ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader title="Schedule of Values" />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 w-10">#</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 w-36">Budget Code</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Description</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 w-36">Amount</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 w-32">Billed to Date</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 w-36">Amount Remaining</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {sovLines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center">
                        <p className="text-sm text-gray-400">No line items yet</p>
                        <button type="button" onClick={addSovLine} className="mt-3 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors">
                          Add Line
                        </button>
                      </td>
                    </tr>
                  ) : (
                    sovLines.map((line, idx) => {
                      const amt = parseFloat(line.amount) || 0;
                      return (
                        <tr key={line.id} className="border-b border-gray-100">
                          <td className="py-2 px-3 text-gray-500 text-xs">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <input type="text" value={line.budget_code} onChange={(e) => updateSovLine(line.id, "budget_code", e.target.value)} placeholder="Code" className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                          </td>
                          <td className="py-2 px-3">
                            <input type="text" value={line.description} onChange={(e) => updateSovLine(line.id, "description", e.target.value)} placeholder="Description" className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                          </td>
                          <td className="py-2 px-3">
                            <input type="number" min="0" step="0.01" value={line.amount} onChange={(e) => updateSovLine(line.id, "amount", e.target.value)} placeholder="0.00" className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-500">$0.00</td>
                          <td className="py-2 px-3 text-sm text-gray-700">{amt > 0 ? "$" + amt.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "$0.00"}</td>
                          <td className="py-2 px-3">
                            <button type="button" onClick={() => removeSovLine(line.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {sovLines.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-gray-200">
                      <td colSpan={3} className="py-2 px-3 text-sm font-semibold text-gray-700">Total:</td>
                      <td className="py-2 px-3 text-sm font-semibold text-gray-900">
                        ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-sm font-semibold text-gray-900">$0.00</td>
                      <td className="py-2 px-3 text-sm font-semibold text-gray-900">
                        ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {sovLines.length > 0 && (
              <button type="button" onClick={addSovLine} className="mt-4 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add Line
              </button>
            )}
          </div>

          {/* ── Inclusions & Exclusions ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader title="Inclusions &amp; Exclusions" />
            <div className="space-y-5">
              <Field label="Inclusions">
                <textarea value={inclusions} onChange={(e) => setInclusions(e.target.value)} rows={4} placeholder="List inclusions..." className={inputCls + " resize-none"} />
              </Field>
              <Field label="Exclusions">
                <textarea value={exclusions} onChange={(e) => setExclusions(e.target.value)} rows={4} placeholder="List exclusions..." className={inputCls + " resize-none"} />
              </Field>
            </div>
          </div>

          {/* ── Contract Dates ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader title="Contract Dates" />
            <div className="grid grid-cols-3 gap-5 mb-5">
              <Field label="Start Date">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={selectCls} />
              </Field>
              <Field label="Estimated Completion Date">
                <input type="date" value={estimatedCompletionDate} onChange={(e) => setEstimatedCompletionDate(e.target.value)} className={selectCls} />
              </Field>
              <Field label="Actual Completion Date">
                <input type="date" value={actualCompletionDate} onChange={(e) => setActualCompletionDate(e.target.value)} className={selectCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Signed Contract Received Date">
                <input type="date" value={signedContractReceivedDate} onChange={(e) => setSignedContractReceivedDate(e.target.value)} className={selectCls} />
              </Field>
              <Field label="Contract Termination Date">
                <input type="date" value={contractTerminationDate} onChange={(e) => setContractTerminationDate(e.target.value)} className={selectCls} />
              </Field>
            </div>
          </div>

          {/* ── Contract Privacy ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader title="Contract Privacy" />
            <p className="text-xs text-gray-500 mb-4">Using the privacy setting allows only project admins and select non-admin users access.</p>
            <label className="flex items-center gap-2.5 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm font-medium text-gray-700">Private</span>
            </label>
          </div>

          {/* Bottom padding for sticky bar */}
          <div className="h-4" />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <p className="text-xs text-gray-400">* Required fields</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors">
            Create
          </button>
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Owner/Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Contractor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Start</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Est. Completion</th>
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
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(c.start_date)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(c.estimated_completion_date)}</td>
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
