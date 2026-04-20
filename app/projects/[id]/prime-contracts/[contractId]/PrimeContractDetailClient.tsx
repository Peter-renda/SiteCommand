"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";
import { Plus, Mail, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Maximize2, HelpCircle } from "lucide-react";

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

type ChangeOrder = {
  id: string;
  number: string;
  revision?: number;
  title: string;
  status: string;
  amount: number;
  date_initiated: string | null;
  due_date: string | null;
  designated_reviewer: string | null;
  executed?: boolean;
  change_reason?: string | null;
  prime_contract_change_order?: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  Draft: "border-gray-400 text-gray-600",
  "Out for Bid": "border-yellow-500 text-yellow-600",
  "Out for Signature": "border-blue-400 text-blue-600",
  Approved: "border-green-500 text-green-600",
  Complete: "border-blue-500 text-blue-600",
  Terminated: "border-red-400 text-red-600",
};

const CO_STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600",
  "In Review": "bg-yellow-50 text-yellow-700",
  Approved: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-600",
  Void: "bg-gray-100 text-gray-400",
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
    <div id="contract-summary" className="scroll-mt-2 bg-white border-b border-gray-200 px-8 py-5">
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

type Tab = "general" | "change_orders" | "emails" | "change_history" | "financial_markup" | "advanced_settings";
type ChangeOrderSortKey = "number" | "revision" | "title" | "status" | "amount" | "date_initiated" | "due_date";
type SortDirection = "asc" | "desc";

const GENERAL_SECTIONS = [
  { id: "general-info", label: "General Information" },
  { id: "contract-summary", label: "Contract Summary" },
  { id: "schedule-of-values", label: "Schedule of Values" },
  { id: "inclusions-exclusions", label: "Inclusions & Exclusions" },
  { id: "contract-dates", label: "Contract Dates" },
  { id: "contract-privacy", label: "Contract Privacy" },
];

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
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("general");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("general-info");
  const [changeOrderSort, setChangeOrderSort] = useState<{ key: ChangeOrderSortKey; direction: SortDirection }>({
    key: "number",
    direction: "desc",
  });
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [executedFilters, setExecutedFilters] = useState<string[]>([]);
  const [reasonFilters, setReasonFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/prime-contracts/${contractId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); } else { setContract(data); }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load contract."); setLoading(false); });

    fetch(`/api/projects/${projectId}/change-orders?type=prime`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setChangeOrders(data.filter((co: ChangeOrder & { prime_contract_id?: string }) => co.prime_contract_id === contractId));
        }
      })
      .catch(() => {});
  }, [projectId, contractId]);

  // Track active sidebar section based on scroll position
  useEffect(() => {
    if (tab !== "general") return;
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const sectionEls = GENERAL_SECTIONS.map((s) => ({
        id: s.id,
        el: container.querySelector(`#${s.id}`),
      }));
      for (let i = sectionEls.length - 1; i >= 0; i--) {
        const { id, el } = sectionEls[i];
        if (el && (el as HTMLElement).offsetTop - container.scrollTop <= 60) {
          setActiveSection(id);
          return;
        }
      }
      setActiveSection("general-info");
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [tab]);

  function scrollToSection(id: string) {
    setActiveSection(id);
    const container = contentRef.current;
    if (!container) return;
    const el = container.querySelector(`#${id}`);
    if (el) {
      (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

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

  function toggleChangeOrderSort(key: ChangeOrderSortKey) {
    setChangeOrderSort((curr) => {
      if (curr.key === key) return { key, direction: curr.direction === "asc" ? "desc" : "asc" };
      return { key, direction: "asc" };
    });
  }

  function compareText(a: string | null | undefined, b: string | null | undefined) {
    return String(a || "").localeCompare(String(b || ""), undefined, { sensitivity: "base", numeric: true });
  }

  function compareNumber(a: number | null | undefined, b: number | null | undefined) {
    return Number(a ?? 0) - Number(b ?? 0);
  }

  function compareDate(a: string | null | undefined, b: string | null | undefined) {
    const aTime = a ? new Date(`${a}T00:00:00`).getTime() : 0;
    const bTime = b ? new Date(`${b}T00:00:00`).getTime() : 0;
    return aTime - bTime;
  }

  const sortedChangeOrders = [...changeOrders].sort((a, b) => {
    const base =
      changeOrderSort.key === "number"
        ? compareText(a.number, b.number)
        : changeOrderSort.key === "revision"
          ? compareNumber(a.revision, b.revision)
          : changeOrderSort.key === "title"
            ? compareText(a.title, b.title)
            : changeOrderSort.key === "status"
              ? compareText(a.status, b.status)
              : changeOrderSort.key === "amount"
                ? compareNumber(a.amount, b.amount)
                : changeOrderSort.key === "date_initiated"
                  ? compareDate(a.date_initiated, b.date_initiated)
                  : compareDate(a.due_date, b.due_date);
    return changeOrderSort.direction === "asc" ? base : -base;
  });

  const statusOptions = Array.from(new Set(changeOrders.map((co) => String(co.status || "").trim()).filter(Boolean)));
  const changeReasonOptions = Array.from(new Set(changeOrders.map((co) => String(co.change_reason || "").trim()).filter(Boolean)));
  const changeTypeOptions = Array.from(new Set(changeOrders.map((co) => String(co.prime_contract_change_order || "").trim()).filter(Boolean)));

  const filteredAndSortedChangeOrders = sortedChangeOrders.filter((co) => {
    if (statusFilters.length > 0 && !statusFilters.includes(co.status)) return false;
    if (executedFilters.length > 0) {
      const executedLabel = co.executed ? "Yes" : "No";
      if (!executedFilters.includes(executedLabel)) return false;
    }
    if (reasonFilters.length > 0 && !reasonFilters.includes(String(co.change_reason || "").trim())) return false;
    if (typeFilters.length > 0 && !typeFilters.includes(String(co.prime_contract_change_order || "").trim())) return false;
    return true;
  });

  function sortHeaderButton(label: string, sortKey: ChangeOrderSortKey, align: "left" | "right" = "left") {
    const active = changeOrderSort.key === sortKey;
    const isAsc = changeOrderSort.direction === "asc";

    return (
      <button
        type="button"
        onClick={() => toggleChangeOrderSort(sortKey)}
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 hover:text-gray-900 ${
          align === "right" ? "w-full justify-end" : ""
        }`}
        title={`Sort by ${label}`}
      >
        <span>{label}</span>
        {active ? (
          isAsc ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
        ) : (
          <ArrowDown className="w-3.5 h-3.5 text-gray-300" />
        )}
      </button>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "general", label: "General" },
    { key: "change_orders", label: `Change Orders (${changeOrders.length})` },
    { key: "emails", label: "Emails" },
    { key: "change_history", label: "Change History" },
    { key: "financial_markup", label: "Financial Markup" },
    { key: "advanced_settings", label: "Advanced Settings" },
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
            Prime Contract #{contract.contract_number}
          </span>
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

      {/* Contract title + status */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">{contract.title || `Prime Contract #${contract.contract_number}`}</h1>
          <StatusBadge status={contract.status} />
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-6 flex items-center shrink-0">
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
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex">

        {/* ── General ── */}
        {tab === "general" && (
          <>
            {/* Left sidebar */}
            <div className="w-48 shrink-0 bg-white border-r border-gray-200 py-4 flex flex-col gap-0.5 overflow-y-auto">
              {GENERAL_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`w-full text-left px-4 py-1.5 text-xs transition-colors ${
                    activeSection === s.id
                      ? "text-gray-900 font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Main content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto">
              {/* Export / Edit Contract actions */}
              <div className="flex justify-end gap-2 px-8 pt-4 pb-2 bg-gray-50">
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                  Export <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => router.push(`/projects/${projectId}/prime-contracts/${contractId}/edit`)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Edit Contract
                </button>
              </div>

              {/* General Information */}
              <div id="general-info" className="scroll-mt-2 bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-900">General Information</h2>
                  </div>
                  <button
                    onClick={() => router.push(`/projects/${projectId}/prime-contracts/${contractId}/edit`)}
                    className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                </div>
                {contract.id && (
                  <p className="text-xs text-gray-400 mb-5">
                    Created by — on {fmtDate(contract.start_date || null)}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-x-8 gap-y-5 mb-6">
                  <Field label="Contract #" value={contract.contract_number} />
                  <Field label="Owner / Client" value={contract.owner_client} />
                  <Field label="Title" value={contract.title} />
                  <Field label="Status" value={<StatusBadge status={contract.status} />} />
                  <Field
                    label="Executed"
                    value={
                      contract.executed
                        ? <span className="inline-flex items-center gap-1 text-sm text-gray-700">✓</span>
                        : <span className="text-gray-400 text-sm">⊘</span>
                    }
                  />
                  <Field label="Default Retainage" value={contract.default_retainage != null ? `${contract.default_retainage}%` : null} />
                  <Field
                    label="Contractor"
                    value={
                      contract.contractor
                        ? <span className="text-orange-600 text-sm">{contract.contractor}</span>
                        : null
                    }
                  />
                  <Field label="Architect / Engineer" value={contract.architect_engineer} />
                </div>
                {contract.description && (
                  <div className="mb-4">
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Attachments</p>
                  <p className="text-sm text-gray-400 italic">No attachments.</p>
                </div>
              </div>

              {/* Contract Summary */}
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

              {/* Schedule of Values */}
              <SovSection sovItems={contract.sov_items} />

              {/* Inclusions & Exclusions */}
              <div id="inclusions-exclusions" className="scroll-mt-2 bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center gap-2 mb-5">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Inclusions &amp; Exclusions</h2>
                </div>
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
              </div>

              {/* Contract Dates */}
              <div id="contract-dates" className="scroll-mt-2 bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center gap-2 mb-5">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Contract Dates</h2>
                </div>
                <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                  <Field label="Start Date" value={fmtDate(contract.start_date)} />
                  <Field label="Estimated Completion" value={fmtDate(contract.estimated_completion_date)} />
                  <Field label="Actual Completion" value={fmtDate(contract.actual_completion_date)} />
                  <Field label="Signed Contract Received" value={fmtDate(contract.signed_contract_received_date)} />
                  <Field label="Contract Termination" value={fmtDate(contract.contract_termination_date)} />
                </div>
              </div>

              {/* Contract Privacy */}
              <div id="contract-privacy" className="scroll-mt-2 bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center gap-2 mb-5">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Contract Privacy</h2>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="Private" value={contract.is_private ? "Yes — visible to admins and select users only" : "No — visible to all project members"} />
                  <Field label="Allow Non-Admin SOV View" value={contract.sov_view_allowed ? "Yes" : "No"} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Change Orders ── */}
        {tab === "change_orders" && (
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Change Orders</h2>
              <button
                onClick={() => router.push(`/projects/${projectId}/prime-contracts/${contractId}/change-orders/new`)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-600 text-white rounded hover:bg-orange-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Change Order
              </button>
            </div>
            <div className="px-8 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !statusFilters.includes(val)) setStatusFilters((prev) => [...prev, val]);
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="">Add Filter: Status</option>
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !executedFilters.includes(val)) setExecutedFilters((prev) => [...prev, val]);
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="">Add Filter: Executed</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !reasonFilters.includes(val)) setReasonFilters((prev) => [...prev, val]);
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="">Add Filter: Change Reason</option>
                {changeReasonOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !typeFilters.includes(val)) setTypeFilters((prev) => [...prev, val]);
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="">Add Filter: Change Type</option>
                {changeTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  setStatusFilters([]);
                  setExecutedFilters([]);
                  setReasonFilters([]);
                  setTypeFilters([]);
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
            {changeOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <p className="text-sm font-medium text-gray-500 mb-1">No change orders</p>
                <p className="text-xs">Change orders created for this contract will appear here.</p>
              </div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-2.5 text-left">{sortHeaderButton("#", "number")}</th>
                    <th className="px-4 py-2.5 text-left">{sortHeaderButton("Revision", "revision")}</th>
                    <th className="px-4 py-2.5 text-left">{sortHeaderButton("Title", "title")}</th>
                    <th className="px-4 py-2.5 text-left">{sortHeaderButton("Status", "status")}</th>
                    <th className="px-4 py-2.5 text-right">{sortHeaderButton("Amount", "amount", "right")}</th>
                    <th className="px-4 py-2.5 text-left">{sortHeaderButton("Date Initiated", "date_initiated")}</th>
                    <th className="px-4 py-2.5 text-left">{sortHeaderButton("Due Date", "due_date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedChangeOrders.map((co) => {
                    const statusCls = CO_STATUS_COLORS[co.status] ?? "bg-gray-100 text-gray-600";
                    return (
                      <tr
                        key={co.id}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/projects/${projectId}/change-orders/${co.id}`)}
                      >
                        <td className="px-4 py-2.5 text-gray-600 font-medium">{co.number}</td>
                        <td className="px-4 py-2.5 text-gray-600">{co.revision ?? 0}</td>
                        <td className="px-4 py-2.5 text-gray-800">{co.title || "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusCls}`}>
                            {co.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{fmt(co.amount)}</td>
                        <td className="px-4 py-2.5 text-gray-600">{fmtDate(co.date_initiated)}</td>
                        <td className="px-4 py-2.5 text-gray-600">{fmtDate(co.due_date)}</td>
                      </tr>
                    );
                  })}
                  {filteredAndSortedChangeOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                        No change orders match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Emails ── */}
        {tab === "emails" && (
          <div className="flex-1 overflow-y-auto bg-white flex flex-col items-center justify-center py-24 text-gray-400">
            <Mail className="w-8 h-8 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500 mb-1">No emails yet</p>
            <p className="text-xs">Emails sent or received for this contract will appear here.</p>
          </div>
        )}

        {/* ── Change History ── */}
        {tab === "change_history" && (
          <div className="flex-1 overflow-y-auto bg-white flex flex-col items-center justify-center py-24 text-gray-400">
            <p className="text-sm font-medium text-gray-500 mb-1">No history yet</p>
            <p className="text-xs">Changes made to this contract will be logged here.</p>
          </div>
        )}

        {/* ── Financial Markup ── */}
        {tab === "financial_markup" && (
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Financial Markup</h2>
              <p className="text-xs text-gray-400">Configure markup rates applied to this contract&apos;s change orders and invoices.</p>
            </div>
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-sm font-medium text-gray-500 mb-1">No markup configured</p>
              <p className="text-xs">Financial markup settings for this contract will appear here.</p>
            </div>
          </div>
        )}

        {/* ── Advanced Settings ── */}
        {tab === "advanced_settings" && (
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Advanced Settings</h2>
              <p className="text-xs text-gray-400">Configure advanced options for this prime contract.</p>
            </div>
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-sm font-medium text-gray-500 mb-1">No advanced settings available</p>
              <p className="text-xs">Advanced configuration options will appear here.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const ADD_GROUP_OPTIONS = [
  { label: "Cost Type", isHeader: false },
  { label: "Cost Code", isHeader: true },
  { label: "Cost Code", isHeader: false },
  { label: "Cost Code Tier 1", isHeader: false },
  { label: "Cost Code Tier 2", isHeader: false },
];

function SovSection({ sovItems }: { sovItems: SovItem[] }) {
  const [groupDropOpen, setGroupDropOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setGroupDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const total = sovItems.reduce((s, i) => s + (i.scheduled_value ?? 0), 0);

  function fmt(val: number) {
    return val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  }

  return (
    <div id="schedule-of-values" className="scroll-mt-2 bg-white border-b border-gray-200">
      {/* Section header */}
      <div className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChevronDown className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Schedule of Values</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
            Open Fullscreen
          </button>
          <button className="px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">
            Edit
          </button>
        </div>
      </div>

      {/* Add Group control */}
      <div className="px-8 pb-3">
        <div ref={dropRef} className="relative inline-block">
          <button
            onClick={() => setGroupDropOpen((v) => !v)}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {selectedGroup ? `Group: ${selectedGroup}` : "Add Group"}
          </button>
          {groupDropOpen && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 w-48 py-1">
              {ADD_GROUP_OPTIONS.map((opt, i) => (
                opt.isHeader ? (
                  <div key={i} className="px-3 pt-2 pb-0.5 text-xs font-semibold text-gray-700">
                    {opt.label}
                  </div>
                ) : (
                  <button
                    key={i}
                    onClick={() => { setSelectedGroup(opt.label); setGroupDropOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    {opt.label}
                  </button>
                )
              ))}
              <div className="border-t border-gray-100 mt-1 px-3 py-1.5 flex justify-end">
                <button
                  onClick={() => { setSelectedGroup(null); setGroupDropOpen(false); }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {sovItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">No schedule of values items</p>
          <p className="text-xs">SOV items can be added when editing this contract.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-t border-gray-200">
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-1/3">
                  <div className="flex items-center gap-1">
                    Budget Code
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-1/3">Description</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-1/3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sovItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-600">{item.budget_code || "—"}</td>
                  <td className="px-4 py-2 text-gray-800">{item.description || "—"}</td>
                  <td className="px-4 py-2 text-gray-700">{fmt(item.scheduled_value)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={2} className="px-4 py-2.5 text-xs font-semibold text-gray-600">Total</td>
                <td className="px-4 py-2.5 text-xs font-semibold text-gray-900">{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
