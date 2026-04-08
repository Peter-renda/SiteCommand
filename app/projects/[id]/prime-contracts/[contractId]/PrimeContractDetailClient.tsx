"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";
import { Plus, Mail, ChevronDown, ChevronUp } from "lucide-react";

type SovItem = {
  id: string;
  budget_code: string;
  description: string;
  scheduled_value: number;
  work_completed_prev: number;
  work_completed_this_period: number;
  materials_stored: number;
  billed_to_date: number;
  retainage_pct: number;
  retainage_amount: number;
  sort_order: number;
};

type Contract = {
  id: string;
  contract_number: number;
  title: string;
  owner_client: string;
  contractor: string;
  architect_engineer: string;
  status: string;
  erp_status: string | null;
  executed: boolean;
  default_retainage: number;
  description: string;
  inclusions: string;
  exclusions: string;
  start_date: string | null;
  estimated_completion_date: string | null;
  actual_completion_date: string | null;
  signed_contract_received_date: string | null;
  contract_termination_date: string | null;
  is_private: boolean;
  sov_view_allowed: boolean;
  original_contract_amount: number;
  approved_change_orders: number;
  pending_change_orders: number;
  draft_change_orders: number;
  invoiced: number;
  payments_received: number;
  sov_items: SovItem[];
};

const STATUS_COLORS: Record<string, string> = {
  Draft: "border-gray-400 text-gray-600",
  "Out for Bid": "border-yellow-500 text-yellow-600",
  "Out for Signature": "border-blue-400 text-blue-600",
  Approved: "border-green-500 text-green-600",
  Complete: "border-blue-500 text-blue-600",
  Terminated: "border-red-400 text-red-600",
};

function fmt(val: number | null | undefined) {
  if (val == null) return "$0.00";
  return val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "border-gray-400 text-gray-600";
  return (
    <span className={`px-2.5 py-0.5 rounded border text-xs font-medium bg-white ${cls}`}>
      {status}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value || <span className="text-gray-400">—</span>}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-5">{title}</h2>
      {children}
    </div>
  );
}

function ContractSummaryTile({
  original,
  approvedCO,
  pendingCO,
  draftCO,
  invoiced,
  paymentsReceived,
  revised,
  pendingRevised,
  remaining,
  pctPaid,
}: {
  original: number;
  approvedCO: number;
  pendingCO: number;
  draftCO: number;
  invoiced: number;
  paymentsReceived: number;
  revised: number;
  pendingRevised: number;
  remaining: number;
  pctPaid: string;
}) {
  const [open, setOpen] = useState(true);

  type SummaryItem = { label: string; value: number; pct?: true };

  const rows: SummaryItem[][] = [
    [
      { label: "Original Contract Amount", value: original },
      { label: "Pending Change Orders", value: pendingCO },
      { label: "Invoices", value: invoiced },
      { label: "Payments Received", value: paymentsReceived },
    ],
    [
      { label: "Approved Change Orders", value: approvedCO },
      { label: "Pending Revised Contract Amount", value: pendingRevised },
      { label: "Remaining Balance", value: remaining },
      { label: "Percent Paid", value: parseFloat(pctPaid), pct: true },
    ],
    [
      { label: "Revised Contract Amount", value: revised },
      { label: "Draft Change Orders", value: draftCO },
    ],
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 mb-4"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        )}
        <h2 className="text-sm font-semibold text-gray-900">Contract Summary</h2>
      </button>
      {open && (
        <div className="space-y-5">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-4 gap-x-8">
              {row.map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-semibold text-gray-800 mb-0.5">{item.label}</p>
                  <p className="text-sm text-gray-700">
                    {item.pct
                      ? `${item.value.toFixed(1)}%`
                      : `$ ${item.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Tab = "overview" | "sov" | "inclusions" | "dates";

export default function PrimeContractDetailClient({
  projectId,
  contractId,
  role,
}: {
  projectId: string;
  contractId: string;
  role: string;
}) {
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/prime-contracts/${contractId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); } else { setContract(data); }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load contract."); setLoading(false); });
  }, [projectId, contractId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <ProjectNav projectId={projectId} />
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <ProjectNav projectId={projectId} />
        <div className="flex-1 flex items-center justify-center text-red-500 text-sm">{error ?? "Contract not found."}</div>
      </div>
    );
  }

  const revised = (contract.original_contract_amount ?? 0) + (contract.approved_change_orders ?? 0);
  const pendingRevised = (contract.original_contract_amount ?? 0) + (contract.pending_change_orders ?? 0);
  const pctPaid = revised > 0 ? ((contract.payments_received / revised) * 100).toFixed(1) : "0.0";
  const remaining = revised - (contract.payments_received ?? 0);

  const sovTotal = contract.sov_items.reduce((s, x) => s + (x.scheduled_value ?? 0), 0);
  const sovBilled = contract.sov_items.reduce((s, x) => s + (x.billed_to_date ?? 0), 0);
  const sovRetainage = contract.sov_items.reduce((s, x) => s + (x.retainage_amount ?? 0), 0);
  const sovRemaining = sovTotal - sovBilled;

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "sov", label: `Schedule of Values${contract.sov_items.length > 0 ? ` (${contract.sov_items.length})` : ""}` },
    { key: "inclusions", label: "Inclusions & Exclusions" },
    { key: "dates", label: "Dates & Privacy" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ProjectNav projectId={projectId} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/projects/${projectId}/prime-contracts`)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Prime Contracts
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900">
            Contract #{contract.contract_number}{contract.title ? ` — ${contract.title}` : ""}
          </span>
          <StatusBadge status={contract.status} />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setCreateMenuOpen((open) => !open)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-600 text-white rounded hover:bg-orange-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create
              <ChevronDown className="w-3 h-3" />
            </button>
            {createMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] min-w-[210px] bg-white border border-gray-200 rounded-md shadow-md z-10 py-1">
                <button
                  onClick={() => {
                    setCreateMenuOpen(false);
                    router.push(`/projects/${projectId}/change-events/new`);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Create Change Event
                </button>
                <button
                  onClick={() => {
                    setCreateMenuOpen(false);
                    router.push(`/projects/${projectId}/prime-contracts/${contractId}/change-orders/new`);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Create Prime Contract CO
                </button>
              </div>
            )}
          </div>
          <button className="flex items-center justify-center px-2.5 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors">
            <Mail className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Financial summary bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-0 flex shrink-0 overflow-x-auto">
        {[
          { label: "Original Contract Amount", value: fmt(contract.original_contract_amount) },
          { label: "Approved Change Orders", value: fmt(contract.approved_change_orders) },
          { label: "Revised Contract Amount", value: fmt(revised) },
          { label: "Pending Change Orders", value: fmt(contract.pending_change_orders) },
          { label: "Invoiced", value: fmt(contract.invoiced) },
          { label: "Payments Received", value: fmt(contract.payments_received) },
          { label: "% Paid", value: `${pctPaid}%` },
          { label: "Remaining Balance", value: fmt(remaining) },
        ].map((m) => (
          <div key={m.label} className="flex flex-col items-start justify-center px-5 py-3 border-r border-gray-100 shrink-0 min-w-[120px]">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide whitespace-nowrap">{m.label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/projects/${projectId}/prime-contracts/${contractId}/edit`)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors">
            Export <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="space-y-px">
            <Section title="General Information">
              <div className="grid grid-cols-3 gap-x-8 gap-y-5 mb-6">
                <Field label="Contract #" value={contract.contract_number} />
                <Field label="Owner / Client" value={contract.owner_client} />
                <Field label="Title" value={contract.title} />
                <Field label="Status" value={<StatusBadge status={contract.status} />} />
                <Field label="Executed" value={contract.executed ? "Yes" : "No"} />
                <Field label="Default Retainage" value={contract.default_retainage != null ? `${contract.default_retainage}%` : null} />
                <Field label="Contractor" value={contract.contractor} />
                <Field label="Architect / Engineer" value={contract.architect_engineer} />
                <Field label="ERP Status" value={contract.erp_status} />
              </div>
              {contract.description && (
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.description}</p>
                </div>
              )}
            </Section>
            <ContractSummaryTile
              original={contract.original_contract_amount}
              approvedCO={contract.approved_change_orders}
              pendingCO={contract.pending_change_orders}
              draftCO={contract.draft_change_orders}
              invoiced={contract.invoiced}
              paymentsReceived={contract.payments_received}
              revised={revised}
              pendingRevised={pendingRevised}
              remaining={remaining}
              pctPaid={pctPaid}
            />
          </div>
        )}

        {/* ── Schedule of Values ── */}
        {tab === "sov" && (
          <div className="bg-white">
            {contract.sov_items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <p className="text-sm font-medium text-gray-500 mb-1">No schedule of values items</p>
                <p className="text-xs">SOV items can be added when editing this contract.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-2.5 text-left font-medium text-gray-500 w-8">#</th>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-500">Budget Code</th>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-500">Description</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Scheduled Value</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Prev Billed</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">This Period</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Materials Stored</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Billed to Date</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">% Complete</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Retainage</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contract.sov_items.map((item, i) => {
                      const balance = (item.scheduled_value ?? 0) - (item.billed_to_date ?? 0);
                      const pct = item.scheduled_value > 0
                        ? ((item.billed_to_date / item.scheduled_value) * 100).toFixed(1)
                        : "0.0";
                      return (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-2 text-gray-600">{item.budget_code || "—"}</td>
                          <td className="px-4 py-2 text-gray-800 max-w-xs">{item.description || "—"}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{fmt(item.scheduled_value)}</td>
                          <td className="px-4 py-2 text-right text-gray-600">{fmt(item.work_completed_prev)}</td>
                          <td className="px-4 py-2 text-right text-gray-600">{fmt(item.work_completed_this_period)}</td>
                          <td className="px-4 py-2 text-right text-gray-600">{fmt(item.materials_stored)}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{fmt(item.billed_to_date)}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{pct}%</td>
                          <td className="px-4 py-2 text-right text-gray-600">{fmt(item.retainage_amount)}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{fmt(balance)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                      <td colSpan={3} className="px-4 py-2.5 text-xs text-gray-600">Totals</td>
                      <td className="px-4 py-2.5 text-right text-xs text-gray-800">{fmt(sovTotal)}</td>
                      <td className="px-4 py-2.5" />
                      <td className="px-4 py-2.5" />
                      <td className="px-4 py-2.5" />
                      <td className="px-4 py-2.5 text-right text-xs text-gray-800">{fmt(sovBilled)}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-gray-800">
                        {sovTotal > 0 ? ((sovBilled / sovTotal) * 100).toFixed(1) : "0.0"}%
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-gray-800">{fmt(sovRetainage)}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-gray-800">{fmt(sovRemaining)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Inclusions & Exclusions ── */}
        {tab === "inclusions" && (
          <div className="space-y-px">
            <Section title="Inclusions & Exclusions">
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Inclusions</p>
                  {contract.inclusions
                    ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.inclusions}</p>
                    : <p className="text-sm text-gray-400 italic">No inclusions specified.</p>}
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Exclusions</p>
                  {contract.exclusions
                    ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.exclusions}</p>
                    : <p className="text-sm text-gray-400 italic">No exclusions specified.</p>}
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* ── Dates & Privacy ── */}
        {tab === "dates" && (
          <div className="space-y-px">
            <Section title="Contract Dates">
              <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                <Field label="Start Date" value={fmtDate(contract.start_date)} />
                <Field label="Estimated Completion" value={fmtDate(contract.estimated_completion_date)} />
                <Field label="Actual Completion" value={fmtDate(contract.actual_completion_date)} />
                <Field label="Signed Contract Received" value={fmtDate(contract.signed_contract_received_date)} />
                <Field label="Contract Termination" value={fmtDate(contract.contract_termination_date)} />
              </div>
            </Section>
            <Section title="Privacy">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <Field label="Private" value={contract.is_private ? "Yes — visible to admins and select users only" : "No — visible to all project members"} />
                <Field label="Allow Non-Admin SOV View" value={contract.sov_view_allowed ? "Yes" : "No"} />
              </div>
            </Section>
          </div>
        )}

      </div>
    </div>
  );
}
