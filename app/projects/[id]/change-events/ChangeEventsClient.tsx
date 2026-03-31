"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Info,
  X,
  Search,
  Pencil,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type LineItem = {
  id: string;
  change_event_id: string;
  budget_code: string | null;
  description: string | null;
  vendor: string | null;
  contract_number: string | null;
  schedule_impact: string | null;
  // Revenue
  rev_unit_qty: number | null;
  rev_unit_cost: number | null;
  rev_rom: number | null;
  rev_prime_pco: number | null;
  rev_latest_price: number | null;
  // Cost
  cost_unit_qty: number | null;
  cost_unit_cost: number | null;
  cost_rom: number | null;
  cost_rfq: number | null;
  cost_commitment: number | null;
  cost_latest: number | null;
  cost_over_under: number | null;
  cost_budget_mod: number | null;
};

type ChangeEvent = {
  id: string;
  number: number;
  title: string;
  status: string;
  created_at: string;
  // Rolled-up Revenue
  rev_unit_qty: number | null;
  rev_unit_cost: number | null;
  rev_rom: number | null;
  rev_prime_pco: number | null;
  rev_latest_price: number | null;
  // Rolled-up Cost
  cost_unit_qty: number | null;
  cost_unit_cost: number | null;
  cost_rom: number | null;
  cost_rfq: number | null;
  cost_commitment: number | null;
  cost_latest: number | null;
  cost_over_under: number | null;
  cost_budget_mod: number | null;
  line_items: LineItem[];
};

type Tab = "detail" | "summary" | "rfqs" | "recycle_bin";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(val: number | null | undefined) {
  if (val === null || val === undefined) return "";
  return val.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function fmtQty(val: number | null | undefined) {
  if (val === null || val === undefined) return "";
  return val.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

// ── Demo data (shown when the DB table is empty / not yet created) ─────────────

const DEMO_EVENTS: ChangeEvent[] = [
  {
    id: "demo-024",
    number: 24,
    title: "RW select backfill",
    status: "Open",
    created_at: "2025-10-01",
    rev_unit_qty: null,
    rev_unit_cost: null,
    rev_rom: 34800,
    rev_prime_pco: 0,
    rev_latest_price: 34800,
    cost_unit_qty: null,
    cost_unit_cost: null,
    cost_rom: 34800,
    cost_rfq: 0,
    cost_commitment: 34800,
    cost_latest: 34800,
    cost_over_under: 0,
    cost_budget_mod: 0,
    line_items: [
      {
        id: "li-024-1",
        change_event_id: "demo-024",
        budget_code: "02-835.C. Modular Block Retaining Walls.Contract",
        description: "select backfill",
        vendor: "Sitescapes, LLC.",
        contract_number: "335501",
        schedule_impact: "Is",
        rev_unit_qty: 1,
        rev_unit_cost: 34800,
        rev_rom: 34800,
        rev_prime_pco: null,
        rev_latest_price: 34800,
        cost_unit_qty: 1,
        cost_unit_cost: 34800,
        cost_rom: 34800,
        cost_rfq: null,
        cost_commitment: 34800,
        cost_latest: 34800,
        cost_over_under: 0,
        cost_budget_mod: 0,
      },
    ],
  },
  {
    id: "demo-023",
    number: 23,
    title: "Retaining wall undercut, backfill and fill",
    status: "Open",
    created_at: "2025-09-15",
    rev_unit_qty: null,
    rev_unit_cost: null,
    rev_rom: 109945.06,
    rev_prime_pco: 0,
    rev_latest_price: 109945.06,
    cost_unit_qty: null,
    cost_unit_cost: null,
    cost_rom: 109945.06,
    cost_rfq: 0,
    cost_commitment: 109945.06,
    cost_latest: 109945.06,
    cost_over_under: 0,
    cost_budget_mod: 0,
    line_items: [
      {
        id: "li-023-1",
        change_event_id: "demo-023",
        budget_code: "02-200.A. Earthwork.Contract",
        description: "Retaining wall undercut and backfill",
        vendor: "Sitescapes, LLC.",
        contract_number: "335501",
        schedule_impact: "Is",
        rev_unit_qty: null,
        rev_unit_cost: null,
        rev_rom: 89945.06,
        rev_prime_pco: null,
        rev_latest_price: 89945.06,
        cost_unit_qty: null,
        cost_unit_cost: null,
        cost_rom: 89945.06,
        cost_rfq: null,
        cost_commitment: 89945.06,
        cost_latest: 89945.06,
        cost_over_under: 0,
        cost_budget_mod: 0,
      },
      {
        id: "li-023-2",
        change_event_id: "demo-023",
        budget_code: "02-200.B. Earthwork.Fill",
        description: "Import fill material",
        vendor: "Sitescapes, LLC.",
        contract_number: "335501",
        schedule_impact: "Is Not",
        rev_unit_qty: null,
        rev_unit_cost: null,
        rev_rom: 20000,
        rev_prime_pco: null,
        rev_latest_price: 20000,
        cost_unit_qty: null,
        cost_unit_cost: null,
        cost_rom: 20000,
        cost_rfq: null,
        cost_commitment: 20000,
        cost_latest: 20000,
        cost_over_under: 0,
        cost_budget_mod: 0,
      },
    ],
  },
  {
    id: "demo-022",
    number: 22,
    title: "Retaining wall fill with import",
    status: "Open",
    created_at: "2025-09-10",
    rev_unit_qty: null,
    rev_unit_cost: null,
    rev_rom: 69660,
    rev_prime_pco: 75260.66,
    rev_latest_price: 75260.66,
    cost_unit_qty: null,
    cost_unit_cost: null,
    cost_rom: 69660,
    cost_rfq: 0,
    cost_commitment: 0,
    cost_latest: 69660,
    cost_over_under: 5600.66,
    cost_budget_mod: 0,
    line_items: [],
  },
  {
    id: "demo-021",
    number: 21,
    title: "Delay claim for period from 8/2025 - 2/2026",
    status: "Open",
    created_at: "2025-08-01",
    rev_unit_qty: null,
    rev_unit_cost: null,
    rev_rom: 0,
    rev_prime_pco: 0,
    rev_latest_price: 0,
    cost_unit_qty: null,
    cost_unit_cost: null,
    cost_rom: 0,
    cost_rfq: 0,
    cost_commitment: 0,
    cost_latest: 0,
    cost_over_under: 0,
    cost_budget_mod: 0,
    line_items: [],
  },
  {
    id: "demo-020",
    number: 20,
    title: "Additional Geotech services",
    status: "Open",
    created_at: "2025-07-20",
    rev_unit_qty: null,
    rev_unit_cost: null,
    rev_rom: 15030.15,
    rev_prime_pco: 0,
    rev_latest_price: 15030.15,
    cost_unit_qty: null,
    cost_unit_cost: null,
    cost_rom: 15030.15,
    cost_rfq: 0,
    cost_commitment: 15030.15,
    cost_latest: 15030.15,
    cost_over_under: 0,
    cost_budget_mod: 0,
    line_items: [],
  },
  {
    id: "demo-019",
    number: 19,
    title: "Retaining wall undercut and fill",
    status: "Open",
    created_at: "2025-07-01",
    rev_unit_qty: null,
    rev_unit_cost: null,
    rev_rom: 58340.22,
    rev_prime_pco: 59341.27,
    rev_latest_price: 62701.27,
    cost_unit_qty: null,
    cost_unit_cost: null,
    cost_rom: 41424.23,
    cost_rfq: 0,
    cost_commitment: 0,
    cost_latest: 41424.23,
    cost_over_under: 21277.04,
    cost_budget_mod: 0,
    line_items: [],
  },
];

// ── Create Modal ───────────────────────────────────────────────────────────────

function CreateModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string;
  onClose: () => void;
  onCreated: (ev: ChangeEvent) => void;
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Open");
  const [saving, setSaving] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/change-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), status }),
      });
      if (res.ok) {
        const ev = await res.json();
        onCreated(ev);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">New Change Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Change event title"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              {["Open", "Pending", "Approved", "Rejected", "Void"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ChangeEventsClient({
  projectId,
  role,
}: {
  projectId: string;
  role: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("detail");
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showRows, setShowRows] = useState(25);
  const [page, setPage] = useState(1);
  const filterRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Click-outside for dropdowns
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    const qs = activeTab === "recycle_bin" ? "?recycle_bin=true" : "";
    fetch(`/api/projects/${projectId}/change-events${qs}`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setEvents(arr.length > 0 ? arr : DEMO_EVENTS);
        setLoading(false);
      })
      .catch(() => {
        setEvents(DEMO_EVENTS);
        setLoading(false);
      });
  }, [projectId, activeTab]);

  useEffect(() => {
    fetchEvents();
    setPage(1);
  }, [fetchEvents]);

  // Filtering
  const filtered = events.filter((ev) =>
    search
      ? ev.title.toLowerCase().includes(search.toLowerCase()) ||
        String(ev.number).includes(search)
      : true
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / showRows));
  const pageStart = (page - 1) * showRows;
  const pageEnd = Math.min(pageStart + showRows, filtered.length);
  const pageEvents = filtered.slice(pageStart, pageEnd);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === pageEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageEvents.map((e) => e.id)));
    }
  }

  const allSelected = pageEvents.length > 0 && selectedIds.size === pageEvents.length;

  const canCreate = role !== "external_collaborator";

  // ── Column header cell ─────────────────────────────────────────────────────
  function TH({ children, right }: { children?: string | number; right?: boolean }) {
    return (
      <th
        className={`px-2 py-2 text-xs font-medium text-gray-500 whitespace-nowrap ${right ? "text-right" : "text-left"}`}
      >
        {children}
      </th>
    );
  }

  // ── Number cell ────────────────────────────────────────────────────────────
  function NumCell({ val, blue }: { val: number | null | undefined; blue?: boolean }) {
    if (val === null || val === undefined || val === 0) {
      return <td className="px-2 py-2 text-right text-xs text-gray-400 whitespace-nowrap">$0.00</td>;
    }
    return (
      <td
        className={`px-2 py-2 text-right text-xs whitespace-nowrap ${blue ? "text-blue-600 font-medium" : "text-gray-700"}`}
      >
        {fmt(val)}
      </td>
    );
  }

  // ── Empty num cell ─────────────────────────────────────────────────────────
  function EmptyCell() {
    return <td className="px-2 py-2 text-right text-xs text-gray-400" />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ProjectNav projectId={projectId} />

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        {/* Left: title + tabs */}
        <div className="flex items-center gap-1">
          <h1 className="text-sm font-semibold text-gray-900 mr-2">Change Events</h1>
          {(["detail", "summary", "rfqs", "recycle_bin"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "recycle_bin" ? "Recycle Bin" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Right: Export + Create */}
        <div className="flex items-center gap-2">
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Export <ChevronDown className="w-3 h-3" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 w-40 py-1">
                {["Export as PDF", "Export as CSV", "Export as Excel"].map((opt) => (
                  <button
                    key={opt}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    onClick={() => setExportOpen(false)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          )}
        </div>
      </div>

      {/* ── Banner ──────────────────────────────────────────────────────────── */}
      {showBanner && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border-b border-blue-100 shrink-0">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-800">Change Events Just Got Faster</p>
            <p className="text-xs text-blue-600">
              We&apos;ve improved the Change Events beta experience with faster load times, grouped filters, and more.
            </p>
          </div>
          <button className="px-3 py-1 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-100 transition-colors shrink-0">
            Learn More
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="text-blue-400 hover:text-blue-600 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white shrink-0">
        {/* Status filter placeholder */}
        <select className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white min-w-[100px]">
          <option value="">Status</option>
          <option>Open</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Void</option>
        </select>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search"
            className="border border-gray-300 rounded pl-7 pr-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300 w-44"
          />
        </div>

        {/* Add Filter */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1 px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Add Filter <ChevronDown className="w-3 h-3" />
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 w-48 py-1">
              {["Number", "Title", "Status", "Vendor", "Budget Code", "Date Created"].map((f) => (
                <button
                  key={f}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  onClick={() => setFilterOpen(false)}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Rows/Pagination bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-white shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>Show Rows:</span>
          <select
            value={showRows}
            onChange={(e) => { setShowRows(Number(e.target.value)); setPage(1); }}
            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {filtered.length > 0 && (
            <span>
              {pageStart + 1}&ndash;{pageEnd} of {filtered.length}
            </span>
          )}
          <span>Page:</span>
          <select
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none"
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="disabled:opacity-30 hover:text-gray-700 transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="disabled:opacity-30 hover:text-gray-700 transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading change events…</div>
        ) : activeTab !== "detail" ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            {activeTab === "recycle_bin" ? "Recycle Bin is empty." : "No data to display for this view."}
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              {/* Column group headers */}
              <tr className="border-b border-gray-100 bg-white">
                {/* Expand + checkbox + title area */}
                <th colSpan={3} className="px-2 py-1" />
                {/* Revenue group */}
                <th colSpan={5} className="px-2 py-1 text-center text-xs font-semibold text-gray-600 border-b border-gray-200">
                  Revenue
                </th>
                {/* Cost group */}
                <th colSpan={8} className="px-2 py-1 text-center text-xs font-semibold text-gray-600 border-b border-gray-200">
                  Cost
                </th>
              </tr>
              {/* Column headers */}
              <tr className="border-b border-gray-200 bg-white">
                <th className="w-6 px-1 py-2" />
                <th className="w-6 px-1 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <TH>Change Event</TH>
                {/* Revenue */}
                <TH right>Unit Qty</TH>
                <TH right>Unit Cost</TH>
                <TH right>ROM</TH>
                <TH right>Prime PCO</TH>
                <TH right>Latest Price</TH>
                {/* Cost */}
                <TH right>Unit Qty</TH>
                <TH right>Unit Cost</TH>
                <TH right>ROM</TH>
                <TH right>RFQ</TH>
                <TH right>Commitment</TH>
                <TH right>Latest Cost</TH>
                <TH right>Over / Under</TH>
                <TH right>Budget Modification</TH>
              </tr>
            </thead>
            <tbody>
              {pageEvents.length === 0 ? (
                <tr>
                  <td colSpan={16} className="text-center py-20 text-gray-400">
                    No change events found.
                  </td>
                </tr>
              ) : (
                pageEvents.map((ev) => {
                  const expanded = expandedIds.has(ev.id);
                  const selected = selectedIds.has(ev.id);
                  return (
                    <>
                      {/* ── Event row ─────────────────────────────────────── */}
                      <tr
                        key={ev.id}
                        className={`border-b border-gray-100 transition-colors ${
                          selected ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Expand toggle */}
                        <td className="w-6 px-1 py-2">
                          <button
                            onClick={() => toggleExpand(ev.id)}
                            className="text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            {expanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                        {/* Checkbox */}
                        <td className="w-6 px-1 py-2">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(ev.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300"
                          />
                        </td>
                        {/* Title */}
                        <td className="px-2 py-2">
                          <button
                            onClick={() =>
                              router.push(`/projects/${projectId}/change-events/${ev.id}`)
                            }
                            className="text-blue-600 hover:underline text-left"
                          >
                            Change Event #{String(ev.number).padStart(3, "0")}: {ev.title}
                          </button>
                        </td>
                        {/* Revenue */}
                        <NumCell val={ev.rev_unit_qty} />
                        <NumCell val={ev.rev_unit_cost} />
                        <NumCell val={ev.rev_rom} />
                        <NumCell val={ev.rev_prime_pco} />
                        <NumCell val={ev.rev_latest_price} />
                        {/* Cost */}
                        <NumCell val={ev.cost_unit_qty} />
                        <NumCell val={ev.cost_unit_cost} />
                        <NumCell val={ev.cost_rom} />
                        <NumCell val={ev.cost_rfq} />
                        <NumCell val={ev.cost_commitment} />
                        <NumCell val={ev.cost_latest} blue />
                        <NumCell val={ev.cost_over_under} />
                        <NumCell val={ev.cost_budget_mod} />
                      </tr>

                      {/* ── Expanded line items ────────────────────────────── */}
                      {expanded &&
                        (ev.line_items.length === 0 ? (
                          <tr key={`${ev.id}-empty`} className="bg-gray-50 border-b border-gray-100">
                            <td colSpan={16} className="px-8 py-3 text-xs text-gray-400 italic">
                              No line items on this change event.
                            </td>
                          </tr>
                        ) : (
                          ev.line_items.map((li) => (
                            <tr
                              key={li.id}
                              className="bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors"
                            >
                              {/* Indent spacer */}
                              <td className="w-6 px-1 py-1.5" />
                              {/* Edit button */}
                              <td className="w-6 px-1 py-1.5">
                                <button
                                  className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs border border-gray-300 rounded text-gray-600 hover:bg-white transition-colors"
                                  onClick={() =>
                                    router.push(
                                      `/projects/${projectId}/change-events/${ev.id}`
                                    )
                                  }
                                >
                                  <Pencil className="w-2.5 h-2.5" />
                                  Edit
                                </button>
                              </td>
                              {/* Budget code + details */}
                              <td className="px-2 py-1.5">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                  <span className="font-medium text-gray-700 text-xs">
                                    {li.budget_code ?? "—"}
                                  </span>
                                  {li.description && (
                                    <span className="text-gray-500 text-xs">{li.description}</span>
                                  )}
                                  {li.vendor && (
                                    <span className="text-gray-500 text-xs">{li.vendor}</span>
                                  )}
                                  {li.contract_number && (
                                    <span className="text-blue-500 text-xs">{li.contract_number}</span>
                                  )}
                                  {li.schedule_impact && (
                                    <span className="text-gray-400 text-xs italic">
                                      {li.schedule_impact}
                                    </span>
                                  )}
                                </div>
                              </td>
                              {/* Revenue */}
                              <NumCell val={li.rev_unit_qty} />
                              <NumCell val={li.rev_unit_cost} />
                              <NumCell val={li.rev_rom} />
                              <NumCell val={li.rev_prime_pco} />
                              <NumCell val={li.rev_latest_price} />
                              {/* Cost */}
                              <NumCell val={li.cost_unit_qty} />
                              <NumCell val={li.cost_unit_cost} />
                              <NumCell val={li.cost_rom} />
                              <NumCell val={li.cost_rfq} />
                              <NumCell val={li.cost_commitment} />
                              <NumCell val={li.cost_latest} blue />
                              <NumCell val={li.cost_over_under} />
                              <NumCell val={li.cost_budget_mod} />
                            </tr>
                          ))
                        ))}
                    </>
                  );
                })
              )}
            </tbody>

            {/* ── Footer totals ─────────────────────────────────────────────── */}
            {pageEvents.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-white font-semibold">
                  <td colSpan={3} className="px-2 py-2 text-xs text-right text-gray-600">
                    Totals
                  </td>
                  {(
                    [
                      "rev_unit_qty",
                      "rev_unit_cost",
                      "rev_rom",
                      "rev_prime_pco",
                      "rev_latest_price",
                      "cost_unit_qty",
                      "cost_unit_cost",
                      "cost_rom",
                      "cost_rfq",
                      "cost_commitment",
                      "cost_latest",
                      "cost_over_under",
                      "cost_budget_mod",
                    ] as const
                  ).map((key) => {
                    const total = pageEvents.reduce(
                      (sum, ev) => sum + (ev[key] ?? 0),
                      0
                    );
                    return (
                      <td key={key} className="px-2 py-2 text-right text-xs text-gray-900 whitespace-nowrap">
                        {fmt(total)}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* ── Bottom pagination ─────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-gray-100 text-xs text-gray-500 shrink-0">
          <span>
            {pageStart + 1}&ndash;{pageEnd} of {filtered.length}
          </span>
          <span>Page:</span>
          <select
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none"
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="disabled:opacity-30 hover:text-gray-700 transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="disabled:opacity-30 hover:text-gray-700 transition-colors"
          >
            ›
          </button>
        </div>
      )}

      {/* ── Create modal ──────────────────────────────────────────────────────── */}
      {showCreate && (
        <CreateModal
          projectId={projectId}
          onClose={() => setShowCreate(false)}
          onCreated={(ev) => setEvents((prev) => [ev, ...prev])}
        />
      )}
    </div>
  );
}
