import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";
import { Settings, Plus, ChevronDown, ChevronRight, Search, SlidersHorizontal, Columns3, Upload, X, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function DragHandle() {
  return (
    <span className="inline-flex flex-col gap-[2px] ml-1 opacity-30 group-hover:opacity-60 cursor-col-resize shrink-0">
      <span className="flex gap-[2px]">
        <span className="w-[2.5px] h-[2.5px] rounded-full bg-current" />
        <span className="w-[2.5px] h-[2.5px] rounded-full bg-current" />
      </span>
      <span className="flex gap-[2px]">
        <span className="w-[2.5px] h-[2.5px] rounded-full bg-current" />
        <span className="w-[2.5px] h-[2.5px] rounded-full bg-current" />
      </span>
      <span className="flex gap-[2px]">
        <span className="w-[2.5px] h-[2.5px] rounded-full bg-current" />
        <span className="w-[2.5px] h-[2.5px] rounded-full bg-current" />
      </span>
    </span>
  );
}

function fmt(val: number | null | undefined) {
  if (val == null) return "$0.00";
  return val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Draft: "border-gray-400 text-gray-600",
    "Out for Bid": "border-yellow-500 text-yellow-600",
    "Out for Signature": "border-blue-400 text-blue-600",
    Approved: "border-green-500 text-green-600",
    Complete: "border-blue-500 text-blue-600",
    Terminated: "border-red-400 text-red-600",
  };
  const cls = map[status] ?? "border-gray-400 text-gray-600";
  return (
    <span className={`px-2 py-0.5 rounded border text-[11px] font-medium bg-white ${cls}`}>
      {status}
    </span>
  );
}

const COLUMNS = [
  { key: "number",                    label: "Number",                       right: false },
  { key: "owner_client",              label: "Owner/Client",                 right: false },
  { key: "title",                     label: "Title",                        right: false },
  { key: "erp_status",                label: "ERP Status",                   right: false },
  { key: "status",                    label: "Status",                       right: false },
  { key: "executed",                  label: "Executed",                     right: false },
  { key: "original_contract_amount",  label: "Original\nContract\nAmount",   right: true  },
  { key: "approved_change_orders",    label: "Approved\nChange Orders",      right: true  },
  { key: "revised_contract_amount",   label: "Revised\nContract\nAmount",    right: true  },
  { key: "pending_change_orders",     label: "Pending Change\nOrders",       right: true  },
  { key: "draft_change_orders",       label: "Draft Change\nOrders",         right: true  },
  { key: "invoiced",                  label: "Invoiced",                     right: true  },
  { key: "payments_received",         label: "Payments\nReceived",           right: true  },
  { key: "pct_paid",                  label: "%\nPaid",                      right: true  },
  { key: "remaining_balance",         label: "Remaining\nBalance\nOutstanding", right: true },
  { key: "private",                   label: "Private",                      right: false },
  { key: "attachments",               label: "Attach-\nments",               right: true  },
];

type ImportFields = {
  contract_number?: string | null;
  title?: string | null;
  owner_client?: string | null;
  contractor?: string | null;
  architect_engineer?: string | null;
  status?: string | null;
  executed?: boolean | null;
  default_retainage?: number | null;
  original_contract_amount?: number | null;
  description?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  start_date?: string | null;
  estimated_completion_date?: string | null;
  actual_completion_date?: string | null;
  signed_contract_received_date?: string | null;
  contract_termination_date?: string | null;
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xs text-gray-800 mt-0.5">{value ?? <span className="text-gray-400">—</span>}</p>
    </div>
  );
}

export default function PrimeContracts() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<"idle" | "parsing" | "review" | "creating">("idle");
  const [importFields, setImportFields] = useState<ImportFields | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function loadContracts() {
    fetch(`/api/projects/${id}/prime-contracts`)
      .then((res) => res.json())
      .then((data) => {
        setContracts(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadContracts();
  }, [id]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImportError(null);
    setImportState("parsing");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`/api/projects/${id}/prime-contracts/import`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to parse PDF");
      setImportFields(data.fields ?? {});
      setImportState("review");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to parse PDF");
      setImportState("idle");
    }
  }

  async function handleCreateFromImport() {
    if (!importFields) return;
    setImportState("creating");

    try {
      const res = await fetch(`/api/projects/${id}/prime-contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importFields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create contract");
      setImportState("idle");
      setImportFields(null);
      setLoading(true);
      loadContracts();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to create contract");
      setImportState("review");
    }
  }

  function closeImportModal() {
    setImportState("idle");
    setImportFields(null);
    setImportError(null);
  }

  const exportToPDF = async (contractId: string) => {
    const res = await fetch(`/api/prime-contracts/${contractId}`);
    const contract = await res.json();
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("PRIME CONTRACT", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Contract #: ${contract.contract_number}`, 20, 40);
    doc.text(`Title: ${contract.title}`, 20, 50);
    doc.text(`Status: ${contract.status}`, 20, 60);
    doc.text(`Owner/Client: ${contract.owner_client}`, 20, 70);
    doc.text(`Contractor: ${contract.contractor}`, 20, 80);
    doc.setFontSize(16);
    doc.text("Schedule of Values", 20, 100);
    const sovData = contract.sov_items.map((item: any) => [
      item.budget_code,
      item.description,
      `$${item.amount.toLocaleString()}`,
      `$${item.billed_to_date.toLocaleString()}`,
      `$${(item.amount - item.billed_to_date).toLocaleString()}`,
    ]);
    autoTable(doc, {
      startY: 110,
      head: [["Budget Code", "Description", "Amount", "Billed to Date", "Remaining"]],
      body: sovData,
    });
    doc.save(`Contract_${contract.contract_number}.pdf`);
  };

  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (c.contract_number ?? "").toLowerCase().includes(q) ||
      (c.title ?? "").toLowerCase().includes(q) ||
      (c.owner_client ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ProjectNav projectId={id!} />

      {/* Page header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          <h1 className="text-sm font-semibold text-gray-900">Prime Contracts</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors">
            Export
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-3 h-3" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => navigate(`/projects/${id}/prime-contracts/new`)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-900 hover:bg-gray-700 text-white rounded font-medium transition-colors"
          >
            <Plus className="w-3 h-3" />
            Create
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 pr-3 py-1 text-xs border border-gray-300 rounded w-44 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors">
            <SlidersHorizontal className="w-3 h-3" />
            Filters
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-500 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-48">
            <option value="">Select a column to group</option>
            <option value="status">Status</option>
            <option value="owner_client">Owner/Client</option>
          </select>
          <button className="flex items-center gap-1.5 px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors">
            <Columns3 className="w-3 h-3" />
            Configure
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading contracts...</div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-white">
                {/* expand column */}
                <th className="w-6 px-2 py-2" />
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`group px-2 py-2 font-medium text-gray-500 whitespace-pre-line leading-tight ${col.right ? "text-right" : "text-left"}`}
                  >
                    <span className={`inline-flex items-start gap-0.5 ${col.right ? "justify-end" : ""}`}>
                      <span className="leading-tight">{col.label}</span>
                      <DragHandle />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="text-center py-16 text-gray-400 text-sm">
                    No prime contracts found.
                  </td>
                </tr>
              ) : (
                filtered.map((contract, i) => {
                  const original  = contract.original_contract_amount  ?? 0;
                  const approved  = contract.approved_change_orders     ?? 0;
                  const revised   = contract.revised_contract_amount    ?? (original + approved);
                  const pending   = contract.pending_change_orders      ?? 0;
                  const draft     = contract.draft_change_orders        ?? 0;
                  const invoiced  = contract.invoiced                   ?? 0;
                  const payments  = contract.payments_received          ?? 0;
                  const pctPaid   = revised > 0 ? ((payments / revised) * 100).toFixed(2) : "0.00";
                  const remaining = revised - payments;
                  const attachments = contract.attachments_count ?? 0;

                  return (
                    <tr key={contract.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-1.5 text-gray-400">
                        <ChevronRight className="w-3 h-3" />
                      </td>
                      {/* Number */}
                      <td className="px-2 py-1.5">
                        <Link
                          to={`/projects/${id}/prime-contracts/${contract.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {contract.contract_number ?? i + 1}
                        </Link>
                      </td>
                      {/* Owner/Client */}
                      <td className="px-2 py-1.5 max-w-[9rem]">
                        <Link
                          to={`/projects/${id}/prime-contracts/${contract.id}`}
                          className="text-blue-600 hover:underline truncate block"
                          title={contract.owner_client}
                        >
                          {contract.owner_client}
                        </Link>
                      </td>
                      {/* Title */}
                      <td className="px-2 py-1.5 text-gray-700 max-w-[10rem] truncate" title={contract.title}>
                        {contract.title}
                      </td>
                      {/* ERP Status */}
                      <td className="px-2 py-1.5 text-gray-500">
                        {contract.erp_status
                          ? `— ${contract.erp_status}`
                          : <span className="text-gray-400">— Not Ready</span>}
                      </td>
                      {/* Status */}
                      <td className="px-2 py-1.5">
                        <StatusBadge status={contract.status} />
                      </td>
                      {/* Executed */}
                      <td className="px-2 py-1.5 text-gray-700">{contract.executed ? "Yes" : "No"}</td>
                      {/* Original Contract Amount */}
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(original)}</td>
                      {/* Approved Change Orders */}
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(approved)}</td>
                      {/* Revised Contract Amount */}
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(revised)}</td>
                      {/* Pending Change Orders */}
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(pending)}</td>
                      {/* Draft Change Orders */}
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(draft)}</td>
                      {/* Invoiced */}
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(invoiced)}</td>
                      {/* Payments Received */}
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(payments)}</td>
                      {/* % Paid */}
                      <td className="px-2 py-1.5 text-right text-gray-700">{pctPaid}%</td>
                      {/* Remaining Balance Outstanding */}
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(remaining)}</td>
                      {/* Private */}
                      <td className="px-2 py-1.5 text-gray-700">{contract.is_private ? "Yes" : "No"}</td>
                      {/* Attachments */}
                      <td className="px-2 py-1.5 text-right text-gray-700">{attachments}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Parsing overlay */}
      {importState === "parsing" && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl px-8 py-6 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            <p className="text-sm font-medium text-gray-700">Parsing PDF…</p>
            <p className="text-xs text-gray-400">Extracting contract fields with AI</p>
          </div>
        </div>
      )}

      {/* Review modal */}
      {(importState === "review" || importState === "creating") && importFields && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Review Imported Contract</h2>
              <button onClick={closeImportModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 flex-1">
              {importError && (
                <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                  {importError}
                </div>
              )}
              <p className="text-xs text-gray-500 mb-4">
                Review the fields extracted from the PDF. Click <strong>Create Contract</strong> to add it to the table.
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                <Field label="Contract #" value={importFields.contract_number} />
                <Field label="Title" value={importFields.title} />
                <Field label="Owner / Client" value={importFields.owner_client} />
                <Field label="Contractor" value={importFields.contractor} />
                <Field label="Architect / Engineer" value={importFields.architect_engineer} />
                <Field label="Status" value={importFields.status} />
                <Field label="Executed" value={importFields.executed == null ? null : importFields.executed ? "Yes" : "No"} />
                <Field label="Default Retainage" value={importFields.default_retainage == null ? null : `${importFields.default_retainage}%`} />
                <Field label="Original Contract Amount" value={importFields.original_contract_amount == null ? null : fmt(importFields.original_contract_amount)} />
                <Field label="Start Date" value={fmtDate(importFields.start_date)} />
                <Field label="Est. Completion" value={fmtDate(importFields.estimated_completion_date)} />
                <Field label="Actual Completion" value={fmtDate(importFields.actual_completion_date)} />
                <Field label="Signed Contract Received" value={fmtDate(importFields.signed_contract_received_date)} />
                <Field label="Termination Date" value={fmtDate(importFields.contract_termination_date)} />
              </div>
              {importFields.description && (
                <div className="mt-3">
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{importFields.description}</p>
                </div>
              )}
              {importFields.inclusions && (
                <div className="mt-3">
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">Inclusions</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{importFields.inclusions}</p>
                </div>
              )}
              {importFields.exclusions && (
                <div className="mt-3">
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">Exclusions</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{importFields.exclusions}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200">
              <button
                onClick={closeImportModal}
                disabled={importState === "creating"}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFromImport}
                disabled={importState === "creating"}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 hover:bg-gray-700 text-white rounded font-medium transition-colors disabled:opacity-50"
              >
                {importState === "creating" && <Loader2 className="w-3 h-3 animate-spin" />}
                Create Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
