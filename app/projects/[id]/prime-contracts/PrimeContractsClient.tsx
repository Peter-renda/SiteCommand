"use client";

import { useState, useEffect, useRef } from "react";
import ProjectNav from "@/components/ProjectNav";

interface SovItem {
  id?: string;
  budget_code: string;
  description: string;
  amount: number;
  billed_to_date: number;
  sort_order?: number;
}

interface PrimeContract {
  id: string;
  number: string | null;
  owner_client: string | null;
  title: string | null;
  erp_status: string;
  status: string;
  executed: boolean;
  original_contract_amount: number;
  approved_change_orders: number;
  pending_change_orders: number;
  draft_change_orders: number;
  invoiced: number;
  payments_received: number;
  default_retainage: number | null;
  contractor: string | null;
  architect_engineer: string | null;
  description: string | null;
  inclusions: string | null;
  exclusions: string | null;
  start_date: string | null;
  estimated_completion_date: string | null;
  actual_completion_date: string | null;
  signed_contract_received_date: string | null;
  contract_termination_date: string | null;
  is_private: boolean;
  prime_contract_sov_items?: SovItem[];
  created_at: string;
}

const STATUS_OPTIONS = ["Draft", "Out for Signature", "Approved", "Complete", "Terminated"];

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600",
  "Out for Signature": "bg-amber-50 text-amber-700",
  Approved: "bg-green-50 text-green-700",
  Complete: "bg-blue-50 text-blue-700",
  Terminated: "bg-red-50 text-red-600",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function pct(payments: number, revised: number) {
  if (!revised) return "0.00%";
  return ((payments / revised) * 100).toFixed(2) + "%";
}

export default function PrimeContractsClient({
  projectId,
  role,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const [contracts, setContracts] = useState<PrimeContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Create form fields
  const [contractNumber, setContractNumber] = useState("");
  const [ownerClient, setOwnerClient] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Draft");
  const [executed, setExecuted] = useState(false);
  const [defaultRetainage, setDefaultRetainage] = useState("");
  const [contractor, setContractor] = useState("");
  const [architectEngineer, setArchitectEngineer] = useState("");
  const [description, setDescription] = useState("");
  const [inclusions, setInclusions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [startDate, setStartDate] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [actualCompletionDate, setActualCompletionDate] = useState("");
  const [signedContractReceivedDate, setSignedContractReceivedDate] = useState("");
  const [contractTerminationDate, setContractTerminationDate] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [sovItems, setSovItems] = useState<SovItem[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Row action menu
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/prime-contracts`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.error === "MISSING_TABLE") {
          setTableError(true);
        } else {
          setContracts(Array.isArray(d) ? d : []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  function openCreate() {
    // Auto-generate next number
    const nextNum = contracts.length + 1;
    setContractNumber(String(nextNum));
    setOwnerClient("");
    setTitle("");
    setStatus("Draft");
    setExecuted(false);
    setDefaultRetainage("");
    setContractor("");
    setArchitectEngineer("");
    setDescription("");
    setInclusions("");
    setExclusions("");
    setStartDate("");
    setEstimatedCompletionDate("");
    setActualCompletionDate("");
    setSignedContractReceivedDate("");
    setContractTerminationDate("");
    setIsPrivate(true);
    setSovItems([]);
    setAttachments([]);
    setError("");
    setShowCreate(true);
  }

  async function handleCreate() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/prime-contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: contractNumber,
          owner_client: ownerClient,
          title,
          status,
          executed,
          default_retainage: defaultRetainage ? parseFloat(defaultRetainage) : null,
          contractor,
          architect_engineer: architectEngineer,
          description,
          inclusions,
          exclusions,
          start_date: startDate || null,
          estimated_completion_date: estimatedCompletionDate || null,
          actual_completion_date: actualCompletionDate || null,
          signed_contract_received_date: signedContractReceivedDate || null,
          contract_termination_date: contractTerminationDate || null,
          is_private: isPrivate,
          sov_items: sovItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          setTableError(true);
          setShowCreate(false);
        } else {
          setError(data.error || "Failed to create contract");
        }
        setSaving(false);
        return;
      }
      setContracts((prev) => [...prev, data]);
      setShowCreate(false);
    } catch {
      setError("Failed to create contract");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this prime contract?")) return;
    await fetch(`/api/projects/${projectId}/prime-contracts/${id}`, { method: "DELETE" });
    setContracts((prev) => prev.filter((c) => c.id !== id));
    setMenuOpen(null);
  }

  function addSovItem() {
    setSovItems((prev) => [
      ...prev,
      { budget_code: "", description: "", amount: 0, billed_to_date: 0 },
    ]);
  }

  function updateSovItem(idx: number, field: keyof SovItem, value: string | number) {
    setSovItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function removeSovItem(idx: number) {
    setSovItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setAttachments((prev) => [...prev, ...files]);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (c.number && c.number.toLowerCase().includes(q)) ||
      (c.owner_client && c.owner_client.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      c.status.toLowerCase().includes(q)
    );
  });

  const totalOriginal = filtered.reduce((s, c) => s + (c.original_contract_amount || 0), 0);
  const totalApproved = filtered.reduce((s, c) => s + (c.approved_change_orders || 0), 0);
  const totalRevised = filtered.reduce((s, c) => s + (c.original_contract_amount || 0) + (c.approved_change_orders || 0), 0);
  const totalPending = filtered.reduce((s, c) => s + (c.pending_change_orders || 0), 0);
  const totalDraft = filtered.reduce((s, c) => s + (c.draft_change_orders || 0), 0);
  const totalInvoiced = filtered.reduce((s, c) => s + (c.invoiced || 0), 0);
  const totalPayments = filtered.reduce((s, c) => s + (c.payments_received || 0), 0);

  const sovTotal = sovItems.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProjectNav projectId={projectId} />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h1 className="text-sm font-semibold text-gray-900">Prime Contracts</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Export button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors">
            Export
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* Create button */}
          {role !== "viewer" && (
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            />
          </div>
          {/* Filters */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Group by */}
          <select className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="">Select a column to group</option>
            <option value="status">Status</option>
            <option value="owner_client">Owner/Client</option>
          </select>
          {/* Configure */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Configure
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200 sticky top-0 z-10">
                {[
                  "Number",
                  "Owner/Client",
                  "Title",
                  "ERP Status",
                  "Status",
                  "Executed",
                  "Original Contract Amount",
                  "Approved Change Orders",
                  "Revised Contract Amount",
                  "Pending Change Orders",
                  "Draft Change Orders",
                  "Invoiced",
                  "Payments Received",
                  "% Paid",
                  "Remaining Balance Outstanding",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap border-r border-gray-100 last:border-r-0"
                  >
                    <div className="flex items-center gap-1">
                      {col}
                      <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12l7-7 7 7" />
                      </svg>
                    </div>
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={16} className="px-3 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : tableError ? (
                <tr>
                  <td colSpan={16} className="px-3 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 max-w-lg mx-auto">
                      <p className="text-sm font-medium text-red-600">Database tables not set up yet</p>
                      <p className="text-xs text-gray-500">
                        Run the following SQL in your{" "}
                        <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          Supabase SQL editor
                        </a>
                        :
                      </p>
                      <pre className="text-left text-xs bg-gray-50 border border-gray-200 rounded p-3 w-full overflow-auto max-h-48 text-gray-700">{`CREATE TABLE IF NOT EXISTS prime_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  number TEXT, owner_client TEXT, title TEXT,
  erp_status TEXT NOT NULL DEFAULT 'Not Ready',
  status TEXT NOT NULL DEFAULT 'Draft',
  executed BOOLEAN NOT NULL DEFAULT false,
  original_contract_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  approved_change_orders NUMERIC(15,2) NOT NULL DEFAULT 0,
  pending_change_orders NUMERIC(15,2) NOT NULL DEFAULT 0,
  draft_change_orders NUMERIC(15,2) NOT NULL DEFAULT 0,
  invoiced NUMERIC(15,2) NOT NULL DEFAULT 0,
  payments_received NUMERIC(15,2) NOT NULL DEFAULT 0,
  default_retainage NUMERIC(5,2),
  contractor TEXT, architect_engineer TEXT,
  description TEXT, inclusions TEXT, exclusions TEXT,
  start_date DATE, estimated_completion_date DATE,
  actual_completion_date DATE,
  signed_contract_received_date DATE,
  contract_termination_date DATE,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS prime_contract_sov_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL, project_id UUID NOT NULL,
  budget_code TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  billed_to_date NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`}</pre>
                      <button
                        onClick={() => { setTableError(false); setLoading(true); fetch(`/api/projects/${projectId}/prime-contracts`).then(r => r.json()).then(d => { setContracts(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); }}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-3 py-16 text-center text-gray-400">
                    No prime contracts yet. Click &quot;+ Create&quot; to add one.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const revised = (c.original_contract_amount || 0) + (c.approved_change_orders || 0);
                  const remaining = revised - (c.payments_received || 0);
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 hover:bg-gray-50 group bg-white"
                    >
                      <td className="px-3 py-2 border-r border-gray-100">
                        <span className="text-blue-600 hover:underline cursor-pointer font-medium">
                          {c.number || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-gray-600">
                        {c.owner_client || "—"}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-gray-600 max-w-[200px] truncate">
                        {c.title || "—"}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-gray-400 italic">
                        {c.erp_status || "Not Ready"}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-gray-600">
                        {c.executed ? "Yes" : "No"}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-right text-gray-700 font-medium">
                        {fmt(c.original_contract_amount || 0)}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-right text-gray-700">
                        {fmt(c.approved_change_orders || 0)}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-right text-gray-700 font-medium">
                        {fmt(revised)}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-right text-gray-700">
                        {fmt(c.pending_change_orders || 0)}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-right text-gray-700">
                        {fmt(c.draft_change_orders || 0)}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-right text-gray-700">
                        {fmt(c.invoiced || 0)}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-right text-gray-700">
                        {fmt(c.payments_received || 0)}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-right text-gray-700">
                        {pct(c.payments_received || 0, revised)}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-100 text-right text-gray-700 font-medium">
                        {fmt(remaining)}
                      </td>
                      <td className="px-3 py-2 relative">
                        <div ref={menuOpen === c.id ? menuRef : undefined} className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                            </svg>
                          </button>
                          {menuOpen === c.id && (
                            <div className="absolute right-0 top-6 bg-white border border-gray-100 rounded-lg shadow-lg z-20 min-w-[120px] py-1">
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer totals */}
      {filtered.length > 0 && (
        <div className="bg-white border-t border-gray-200 overflow-x-auto">
          <table className="w-full text-xs">
            <tbody>
              <tr className="font-semibold text-gray-700">
                <td className="px-3 py-2 border-r border-gray-100 w-[80px]" />
                <td className="px-3 py-2 border-r border-gray-100 w-[120px]" />
                <td className="px-3 py-2 border-r border-gray-100 w-[200px]" />
                <td className="px-3 py-2 border-r border-gray-100 w-[100px]" />
                <td className="px-3 py-2 border-r border-gray-100 w-[110px]" />
                <td className="px-3 py-2 border-r border-gray-100 w-[80px]" />
                <td className="px-3 py-2 border-r border-gray-100 text-right">{fmt(totalOriginal)}</td>
                <td className="px-3 py-2 border-r border-gray-100 text-right">{fmt(totalApproved)}</td>
                <td className="px-3 py-2 border-r border-gray-100 text-right">{fmt(totalRevised)}</td>
                <td className="px-3 py-2 border-r border-gray-100 text-right">{fmt(totalPending)}</td>
                <td className="px-3 py-2 border-r border-gray-100 text-right">{fmt(totalDraft)}</td>
                <td className="px-3 py-2 border-r border-gray-100 text-right">{fmt(totalInvoiced)}</td>
                <td className="px-3 py-2 border-r border-gray-100 text-right">{fmt(totalPayments)}</td>
                <td className="px-3 py-2 border-r border-gray-100 text-right">{pct(totalPayments, totalRevised)}</td>
                <td className="px-3 py-2 text-right">{fmt(totalRevised - totalPayments)}</td>
                <td className="w-8" />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900">Create Prime Contract</h2>
            <button
              onClick={() => setShowCreate(false)}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* General Information */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">General Information</h3>
              <div className="grid grid-cols-3 gap-4">
                {/* Contract # */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contract #</label>
                  <input
                    type="text"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                {/* Owner/Client */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Owner/Client</label>
                  <input
                    type="text"
                    value={ownerClient}
                    onChange={(e) => setOwnerClient(e.target.value)}
                    placeholder="Select company"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Executed */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Executed <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="executed"
                      checked={executed}
                      onChange={(e) => setExecuted(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <label htmlFor="executed" className="text-sm text-gray-600 cursor-pointer">Yes</label>
                  </div>
                </div>

                {/* Default Retainage */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Default Retainage</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={defaultRetainage}
                      onChange={(e) => setDefaultRetainage(e.target.value)}
                      placeholder=""
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                  </div>
                </div>

                {/* Contractor */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contractor</label>
                  <input
                    type="text"
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                {/* Architect/Engineer */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Architect/Engineer</label>
                  <input
                    type="text"
                    value={architectEngineer}
                    onChange={(e) => setArchitectEngineer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>

              {/* Attachments */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Attachments</label>
                <div
                  ref={dropRef}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-md p-8 text-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors bg-gray-50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <p className="text-sm text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">Attach Files</span>
                  </p>
                  <p className="text-xs text-gray-400">or Drag & Drop</p>
                  {attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 justify-center">
                      {attachments.map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">
                          {f.name}
                          <button
                            onClick={(e) => { e.stopPropagation(); setAttachments((prev) => prev.filter((_, j) => j !== i)); }}
                            className="text-gray-400 hover:text-red-500"
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Schedule of Values */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Schedule of Values</h3>
              <div className="mb-3">
                <button className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors">
                  Add Group
                </button>
              </div>

              <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 w-8">#</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Budget Code</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Description</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Amount</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Billed to Date</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Amount Remaining</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {sovItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-orange-200 flex items-center justify-center">
                              <svg className="w-8 h-8 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">You Have No Line Items Yet</p>
                            <button
                              onClick={addSovItem}
                              className="px-4 py-2 text-xs font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
                            >
                              Add Line
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sovItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.budget_code}
                              onChange={(e) => updateSovItem(idx, "budget_code", e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                              placeholder="Code"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateSovItem(idx, "description", e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                              placeholder="Description"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.amount || ""}
                              onChange={(e) => updateSovItem(idx, "amount", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-gray-900"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-gray-400">
                            {fmt(item.billed_to_date || 0)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-600">
                            {fmt((item.amount || 0) - (item.billed_to_date || 0))}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeSovItem(idx)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* SOV footer */}
                <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={addSovItem}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
                    >
                      Add Line
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors">
                      Import
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Total: <span className="ml-2">{fmt(sovTotal)}</span>
                    <span className="ml-8">$0.00</span>
                    <span className="ml-8">{fmt(sovTotal)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Inclusions & Exclusions */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Inclusions &amp; Exclusions</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Inclusions</label>
                  <textarea
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Exclusions</label>
                  <textarea
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Contract Dates */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Contract Dates</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Completion Date</label>
                  <input
                    type="date"
                    value={estimatedCompletionDate}
                    onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Actual Completion Date</label>
                  <input
                    type="date"
                    value={actualCompletionDate}
                    onChange={(e) => setActualCompletionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Signed Contract Received Date</label>
                  <input
                    type="date"
                    value={signedContractReceivedDate}
                    onChange={(e) => setSignedContractReceivedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contract Termination Date</label>
                  <input
                    type="date"
                    value={contractTerminationDate}
                    onChange={(e) => setContractTerminationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
            </section>

            {/* Contract Privacy */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Contract Privacy</h3>
              <p className="text-xs text-gray-400 mb-4">
                Using the privacy setting allows only project admins and the select non-admin users access.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_private"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_private" className="text-sm text-gray-700 cursor-pointer">Private</label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Access for Non Admin Users</label>
                  <select
                    multiple
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white h-20"
                  >
                    <option value="" disabled>Select Values</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allow_sov"
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <label htmlFor="allow_sov" className="text-xs text-gray-600 cursor-pointer">
                    Allow these non-admin users to view the SOV items.
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* Modal footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
            <p className="text-xs text-gray-400">* Required fields</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
