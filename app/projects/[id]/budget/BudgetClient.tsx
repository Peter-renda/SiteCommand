"use client";

import { useState, useEffect, useRef } from "react";
import ProjectNav from "@/components/ProjectNav";
import { SkeletonTable } from "@/app/components/Skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

type BudgetLineItem = {
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
  sort_order: number;
  created_at: string;
};

type BudgetSnapshot = {
  id: string;
  name: string;
  created_at: string;
};

// ── Calculated helpers ────────────────────────────────────────────────────────

function calc(item: BudgetLineItem) {
  const revisedBudget =
    item.original_budget_amount + item.budget_modifications + item.approved_cos;
  const projectedBudget = revisedBudget + item.pending_budget_changes;
  const directCosts = item.job_to_date_costs - item.commitments_invoiced;
  const projectedCosts = item.committed_costs + directCosts + item.pending_cost_changes;
  const forecastToComplete = Math.max(0, projectedBudget - projectedCosts);
  const estimatedCostAtCompletion = projectedCosts + forecastToComplete;
  const projectedOverUnder = projectedBudget - estimatedCostAtCompletion;
  return {
    revisedBudget,
    projectedBudget,
    directCosts,
    projectedCosts,
    forecastToComplete,
    estimatedCostAtCompletion,
    projectedOverUnder,
  };
}

function sumItems(items: BudgetLineItem[]) {
  const totals = {
    original_budget_amount: 0,
    budget_modifications: 0,
    approved_cos: 0,
    pending_budget_changes: 0,
    committed_costs: 0,
    job_to_date_costs: 0,
    commitments_invoiced: 0,
    pending_cost_changes: 0,
    revisedBudget: 0,
    projectedBudget: 0,
    directCosts: 0,
    projectedCosts: 0,
    forecastToComplete: 0,
    estimatedCostAtCompletion: 0,
    projectedOverUnder: 0,
  };
  for (const item of items) {
    const c = calc(item);
    totals.original_budget_amount += item.original_budget_amount;
    totals.budget_modifications += item.budget_modifications;
    totals.approved_cos += item.approved_cos;
    totals.pending_budget_changes += item.pending_budget_changes;
    totals.committed_costs += item.committed_costs;
    totals.job_to_date_costs += item.job_to_date_costs;
    totals.commitments_invoiced += item.commitments_invoiced;
    totals.pending_cost_changes += item.pending_cost_changes;
    totals.revisedBudget += c.revisedBudget;
    totals.projectedBudget += c.projectedBudget;
    totals.directCosts += c.directCosts;
    totals.projectedCosts += c.projectedCosts;
    totals.forecastToComplete += c.forecastToComplete;
    totals.estimatedCostAtCompletion += c.estimatedCostAtCompletion;
    totals.projectedOverUnder += c.projectedOverUnder;
  }
  return totals;
}

function fmt(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `($${formatted})` : `$${formatted}`;
}

function fmtWithArrow(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const arrow = n >= 0 ? "↑" : "↓";
  return n < 0 ? `${arrow} ($${formatted})` : `${arrow} $${formatted}`;
}

// ── PDF Export ────────────────────────────────────────────────────────────────

function exportPDF(items: BudgetLineItem[]) {
  const totals = sumItems(items);

  const headerRow = `
    <tr>
      <th>Description</th>
      <th>Original Budget</th>
      <th>Budget Mods</th>
      <th>Approved COs</th>
      <th>Revised Budget</th>
      <th>Pending Budget Changes</th>
      <th>Projected Budget</th>
      <th>Committed Costs</th>
      <th>Direct Costs</th>
      <th>Job to Date</th>
      <th>Pending Cost Changes</th>
      <th>Projected Costs</th>
      <th>Forecast to Complete</th>
      <th>Est. Cost at Completion</th>
      <th>Projected Over/Under</th>
    </tr>`;

  const totalRow = () => {
    return `<tr style="font-weight:bold;background:#f9fafb;">
      <td>Total</td>
      <td>${fmt(totals.original_budget_amount)}</td>
      <td>${fmt(totals.budget_modifications)}</td>
      <td>${fmt(totals.approved_cos)}</td>
      <td>${fmt(totals.revisedBudget)}</td>
      <td>${fmt(totals.pending_budget_changes)}</td>
      <td>${fmt(totals.projectedBudget)}</td>
      <td>${fmt(totals.committed_costs)}</td>
      <td>${fmt(totals.directCosts)}</td>
      <td>${fmt(totals.job_to_date_costs)}</td>
      <td>${fmt(totals.pending_cost_changes)}</td>
      <td>${fmt(totals.projectedCosts)}</td>
      <td>${fmt(totals.forecastToComplete)}</td>
      <td>${fmt(totals.estimatedCostAtCompletion)}</td>
      <td style="color:${totals.projectedOverUnder >= 0 ? "inherit" : "#dc2626"}">${fmt(totals.projectedOverUnder)}</td>
    </tr>`;
  };

  const rows = items
    .map((item) => {
      const c = calc(item);
      return `<tr>
        <td>
          <strong>${item.cost_code}</strong><br/>
          <span style="color:#6b7280">${item.description}</span>
        </td>
        <td>${fmt(item.original_budget_amount)}</td>
        <td>${fmt(item.budget_modifications)}</td>
        <td>${fmt(item.approved_cos)}</td>
        <td>${fmt(c.revisedBudget)}</td>
        <td>${fmt(item.pending_budget_changes)}</td>
        <td>${fmt(c.projectedBudget)}</td>
        <td>${fmt(item.committed_costs)}</td>
        <td>${fmt(c.directCosts)}</td>
        <td>${fmt(item.job_to_date_costs)}</td>
        <td>${fmt(item.pending_cost_changes)}</td>
        <td>${fmt(c.projectedCosts)}</td>
        <td>${fmt(c.forecastToComplete)}</td>
        <td>${fmt(c.estimatedCostAtCompletion)}</td>
        <td style="color:${c.projectedOverUnder >= 0 ? "inherit" : "#dc2626"}">${fmt(c.projectedOverUnder)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Budget</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 9px; padding: 20px; }
      h1 { font-size: 14px; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #f3f4f6; text-align: left; padding: 5px 6px; font-size: 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
      td { padding: 5px 6px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
      tr:last-child td { border-bottom: none; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <h1>Budget</h1>
    <table><thead>${headerRow}</thead><tbody>${totalRow()}${rows}</tbody></table>
    </body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

// ── New Line Item Modal ───────────────────────────────────────────────────────

type LineItemFormData = {
  cost_code: string;
  description: string;
  original_budget_amount: string;
  budget_modifications: string;
  approved_cos: string;
  pending_budget_changes: string;
  committed_costs: string;
  job_to_date_costs: string;
  commitments_invoiced: string;
  pending_cost_changes: string;
};

const emptyForm: LineItemFormData = {
  cost_code: "",
  description: "",
  original_budget_amount: "",
  budget_modifications: "",
  approved_cos: "",
  pending_budget_changes: "",
  committed_costs: "",
  job_to_date_costs: "",
  commitments_invoiced: "",
  pending_cost_changes: "",
};

function numVal(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "0.00"}
      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
    />
  );
}

function LineItemModal({
  initial,
  onConfirm,
  onCancel,
}: {
  initial?: BudgetLineItem;
  onConfirm: (data: LineItemFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<LineItemFormData>(
    initial
      ? {
          cost_code: initial.cost_code,
          description: initial.description,
          original_budget_amount: initial.original_budget_amount !== 0 ? String(initial.original_budget_amount) : "",
          budget_modifications: initial.budget_modifications !== 0 ? String(initial.budget_modifications) : "",
          approved_cos: initial.approved_cos !== 0 ? String(initial.approved_cos) : "",
          pending_budget_changes: initial.pending_budget_changes !== 0 ? String(initial.pending_budget_changes) : "",
          committed_costs: initial.committed_costs !== 0 ? String(initial.committed_costs) : "",
          job_to_date_costs: initial.job_to_date_costs !== 0 ? String(initial.job_to_date_costs) : "",
          commitments_invoiced: initial.commitments_invoiced !== 0 ? String(initial.commitments_invoiced) : "",
          pending_cost_changes: initial.pending_cost_changes !== 0 ? String(initial.pending_cost_changes) : "",
        }
      : emptyForm
  );

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function set(key: keyof LineItemFormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cost_code.trim() && !form.description.trim()) return;
    onConfirm(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div ref={ref} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? "Edit Budget Line Item" : "Add Budget Line Item"}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cost Code">
              <input
                type="text"
                value={form.cost_code}
                onChange={(e) => set("cost_code", e.target.value)}
                placeholder="e.g. 01-030.C"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </Field>
            <Field label="Description">
              <input
                type="text"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="e.g. Workmen's Facility.Contract"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </Field>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Budget</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Original Budget Amount">
              <MoneyInput value={form.original_budget_amount} onChange={(v) => set("original_budget_amount", v)} />
            </Field>
            <Field label="Budget Modifications">
              <MoneyInput value={form.budget_modifications} onChange={(v) => set("budget_modifications", v)} />
            </Field>
            <Field label="Approved Change Orders">
              <MoneyInput value={form.approved_cos} onChange={(v) => set("approved_cos", v)} />
            </Field>
            <Field label="Pending Budget Changes">
              <MoneyInput value={form.pending_budget_changes} onChange={(v) => set("pending_budget_changes", v)} />
            </Field>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Costs</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Committed Costs">
              <MoneyInput value={form.committed_costs} onChange={(v) => set("committed_costs", v)} />
            </Field>
            <Field label="ERP Job to Date Costs">
              <MoneyInput value={form.job_to_date_costs} onChange={(v) => set("job_to_date_costs", v)} />
            </Field>
            <Field label="Commitments Invoiced">
              <MoneyInput value={form.commitments_invoiced} onChange={(v) => set("commitments_invoiced", v)} />
            </Field>
            <Field label="Pending Cost Changes">
              <MoneyInput value={form.pending_cost_changes} onChange={(v) => set("pending_cost_changes", v)} />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
            >
              {initial ? "Save Changes" : "Add Line Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Snapshot Modal ────────────────────────────────────────────────────────────

function SnapshotModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(
    `Budget Snapshot – ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Create Budget Snapshot</h2>
        <p className="text-sm text-gray-500">
          Saves a read-only copy of the current budget for historical reference.
        </p>
        <Field label="Snapshot Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            autoFocus
          />
        </Field>
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onConfirm(name.trim())}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
          >
            Create Snapshot
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ERP Resend Confirm Modal ──────────────────────────────────────────────────

function ErpConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Resend Budget to ERP</h2>
        <p className="text-sm text-gray-500">
          This will push the current budget data to your connected ERP system. Continue?
        </p>
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
          >
            Resend to ERP
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Column header tooltip ─────────────────────────────────────────────────────

type ColTooltip = {
  subtitle?: string;
  kind: "Source Column" | "Calculated Column" | "Standard Column";
  body: React.ReactNode;
};

function ColumnTooltip({ label, tooltip }: { label: string; tooltip: ColTooltip }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="cursor-default select-none">{label}</span>
      {show && (
        <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-lg bg-gray-900 text-white shadow-xl p-3 text-xs pointer-events-none">
          <div className="font-semibold text-sm leading-tight">
            {label}
            {tooltip.subtitle && (
              <span className="text-gray-400 font-normal"> {tooltip.subtitle}</span>
            )}
          </div>
          <div className="text-gray-400 mt-0.5 mb-2">{tooltip.kind}</div>
          <div className="border-t border-gray-700 pt-2 space-y-1 leading-relaxed">
            {tooltip.body}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BudgetClient({
  projectId,
  role,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const [items, setItems] = useState<BudgetLineItem[]>([]);
  const [snapshots, setSnapshots] = useState<BudgetSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showLineItemModal, setShowLineItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetLineItem | null>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [showErpModal, setShowErpModal] = useState(false);

  // Dropdown refs
  const createRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Row action menu
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) setShowCreateMenu(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) setRowMenuId(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/budget`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/budget/snapshots`).then((r) => r.json()),
    ]).then(([itemsData, snapshotsData]) => {
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setSnapshots(Array.isArray(snapshotsData) ? snapshotsData : []);
      setLoading(false);
    });
  }, [projectId]);

  async function handleAddLineItem(data: LineItemFormData) {
    const res = await fetch(`/api/projects/${projectId}/budget`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cost_code: data.cost_code,
        description: data.description,
        original_budget_amount: numVal(data.original_budget_amount),
        budget_modifications: numVal(data.budget_modifications),
        approved_cos: numVal(data.approved_cos),
        pending_budget_changes: numVal(data.pending_budget_changes),
        committed_costs: numVal(data.committed_costs),
        job_to_date_costs: numVal(data.job_to_date_costs),
        commitments_invoiced: numVal(data.commitments_invoiced),
        pending_cost_changes: numVal(data.pending_cost_changes),
        sort_order: items.length,
      }),
    });
    if (res.ok) {
      const newItem: BudgetLineItem = await res.json();
      setItems((prev) => [...prev, newItem]);
    }
    setShowLineItemModal(false);
  }

  async function handleEditLineItem(data: LineItemFormData) {
    if (!editingItem) return;
    const res = await fetch(`/api/projects/${projectId}/budget/${editingItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cost_code: data.cost_code,
        description: data.description,
        original_budget_amount: numVal(data.original_budget_amount),
        budget_modifications: numVal(data.budget_modifications),
        approved_cos: numVal(data.approved_cos),
        pending_budget_changes: numVal(data.pending_budget_changes),
        committed_costs: numVal(data.committed_costs),
        job_to_date_costs: numVal(data.job_to_date_costs),
        commitments_invoiced: numVal(data.commitments_invoiced),
        pending_cost_changes: numVal(data.pending_cost_changes),
      }),
    });
    if (res.ok) {
      const updated: BudgetLineItem = await res.json();
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    }
    setEditingItem(null);
  }

  async function handleDeleteItem(id: string) {
    const res = await fetch(`/api/projects/${projectId}/budget/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
    setRowMenuId(null);
  }

  async function handleCreateSnapshot(name: string) {
    const res = await fetch(`/api/projects/${projectId}/budget/snapshots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, snapshot_data: items }),
    });
    if (res.ok) {
      const snap: BudgetSnapshot = await res.json();
      setSnapshots((prev) => [snap, ...prev]);
    }
    setShowSnapshotModal(false);
  }

  function handleErpResend() {
    // Placeholder: integrate with ERP API
    setShowErpModal(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const totals = sumItems(items);

  const COLS: Array<{
    key: string;
    label: string;
    width: string;
    tooltip?: ColTooltip;
  }> = [
    { key: "description", label: "Description", width: "min-w-[180px]" },
    { key: "original_budget_amount", label: "Original Budget Amount", width: "min-w-[130px]" },
    { key: "budget_modifications", label: "Budget Modifications", width: "min-w-[120px]" },
    {
      key: "approved_cos", label: "Approved COs", width: "min-w-[110px]",
      tooltip: {
        subtitle: "(Prime Contract)", kind: "Source Column",
        body: (<><p className="font-medium">Change Orders</p><p className="text-gray-400">Status</p><p className="text-gray-300">• Approved</p></>),
      },
    },
    {
      key: "revised_budget", label: "Revised Budget", width: "min-w-[110px]",
      tooltip: {
        kind: "Calculated Column",
        body: (<><p className="text-gray-300">{"  "}Original Budget Amount</p><p className="text-gray-300">+ Budget Modifications</p><p className="text-gray-300">+ Approved COs</p><div className="border-t border-gray-700 mt-1 pt-1"><p className="font-semibold">= Revised Budget</p></div></>),
      },
    },
    {
      key: "pending_budget_changes", label: "Pending Budget Changes", width: "min-w-[130px]",
      tooltip: {
        subtitle: "(Prime Contract)", kind: "Source Column",
        body: (<><p className="font-medium">Change Orders</p><p className="text-gray-400">Status</p><p className="text-gray-300">• Pending - In Review</p><p className="text-gray-300">• Pending - Not Pricing</p><p className="text-gray-300">• Pending - Not Proceeding</p><p className="text-gray-300">• Pending - Pricing</p><p className="text-gray-300">• Pending - Proceeding</p><p className="text-gray-300">• Pending - Revised</p></>),
      },
    },
    {
      key: "projected_budget", label: "Projected Budget", width: "min-w-[110px]",
      tooltip: {
        kind: "Calculated Column",
        body: (<><p className="text-gray-300">{"  "}Revised Budget</p><p className="text-gray-300">+ Pending Budget Changes</p><div className="border-t border-gray-700 mt-1 pt-1"><p className="font-semibold">= Projected Budget</p></div></>),
      },
    },
    {
      key: "committed_costs", label: "Committed Costs", width: "min-w-[110px]",
      tooltip: {
        subtitle: "(Commitment)", kind: "Source Column",
        body: (<><p className="font-medium">Subcontracts</p><p className="text-gray-400">Status</p><p className="text-gray-300">• Approved</p><p className="text-gray-300">• Complete</p><div className="border-t border-gray-700 my-1.5" /><p className="font-medium">Purchase Order Contracts</p><p className="text-gray-400">Status</p><p className="text-gray-300">• Approved</p><div className="border-t border-gray-700 my-1.5" /><p className="font-medium">Change Orders</p><p className="text-gray-400">Status</p><p className="text-gray-300">• Approved</p></>),
      },
    },
    {
      key: "direct_costs", label: "Direct Costs", width: "min-w-[100px]",
      tooltip: {
        kind: "Calculated Column",
        body: (<><p className="text-gray-300">{"  "}Job to Date Costs</p><p className="text-gray-300">- Commitments Invoiced</p><div className="border-t border-gray-700 mt-1 pt-1"><p className="font-semibold">= Direct Costs</p></div></>),
      },
    },
    {
      key: "job_to_date_costs", label: "Job to Date Costs", width: "min-w-[110px]",
      tooltip: {
        subtitle: "(ERP Job Costs)", kind: "Source Column",
        body: (<><p className="text-gray-300">ERP Job to Date Costs</p></>),
      },
    },
    {
      key: "pending_cost_changes", label: "Pending Cost Changes", width: "min-w-[120px]",
      tooltip: {
        subtitle: "(Commitment)", kind: "Source Column",
        body: (<><p className="font-medium">Subcontracts</p><p className="text-gray-400">Status</p><p className="text-gray-300">• Out For Signature</p><div className="border-t border-gray-700 my-1.5" /><p className="font-medium">Purchase Order Contracts</p><p className="text-gray-400">Status</p><p className="text-gray-300">• Processing</p><p className="text-gray-300">• Submitted</p><p className="text-gray-300">• Partially Received</p><p className="text-gray-300">• Received</p><div className="border-t border-gray-700 my-1.5" /><p className="font-medium">Change Orders</p><p className="text-gray-400">Status</p><p className="text-gray-300">• Pending - In Review</p><p className="text-gray-300">• Pending - Not Pricing</p><p className="text-gray-300">• Pending - Not Proceeding</p><p className="text-gray-300">• Pending - Pricing</p><p className="text-gray-300">• Pending - Proceeding</p><p className="text-gray-300">• Pending - Revised</p></>),
      },
    },
    {
      key: "projected_costs", label: "Projected Costs", width: "min-w-[110px]",
      tooltip: {
        kind: "Calculated Column",
        body: (<><p className="text-gray-300">{"  "}Committed Costs</p><p className="text-gray-300">+ Direct Costs</p><p className="text-gray-300">+ Pending Cost Changes</p><div className="border-t border-gray-700 mt-1 pt-1"><p className="font-semibold">= Projected Costs</p></div></>),
      },
    },
    {
      key: "forecast_to_complete", label: "Forecast To Complete", width: "min-w-[120px]",
      tooltip: {
        kind: "Standard Column",
        body: (<><p className="text-gray-300">{"  "}Projected Budget</p><p className="text-gray-300">- Projected Costs</p><div className="border-t border-gray-700 mt-1 pt-1"><p className="font-semibold">= Forecast To Complete</p></div><p className="text-gray-400 mt-1.5">If negative, column will show 0.</p></>),
      },
    },
    {
      key: "estimated_cost_at_completion", label: "Estimated Cost at Completion", width: "min-w-[140px]",
      tooltip: {
        kind: "Calculated Column",
        body: (<><p className="text-gray-300">{"  "}Projected Costs</p><p className="text-gray-300">+ Forecast To Complete</p><div className="border-t border-gray-700 mt-1 pt-1"><p className="font-semibold">= Estimated Cost at Completion</p></div></>),
      },
    },
    {
      key: "projected_over_under", label: "Projected over Under", width: "min-w-[120px]",
      tooltip: {
        kind: "Calculated Column",
        body: (<><p className="text-gray-300">{"  "}Projected Budget</p><p className="text-gray-300">- Estimated Cost at Completion</p><div className="border-t border-gray-700 mt-1 pt-1"><p className="font-semibold">= Projected over Under</p></div></>),
      },
    },
  ];

  function renderCell(item: BudgetLineItem | null, key: string) {
    if (item === null) {
      // Totals row
      switch (key) {
        case "description": return <span className="font-semibold text-gray-900">Total</span>;
        case "original_budget_amount": return <span className="font-semibold">{fmt(totals.original_budget_amount)}</span>;
        case "budget_modifications": return <span className="font-semibold">{fmt(totals.budget_modifications)}</span>;
        case "approved_cos": return <span className="font-semibold">{fmt(totals.approved_cos)}</span>;
        case "revised_budget": return <span className="font-semibold">{fmt(totals.revisedBudget)}</span>;
        case "pending_budget_changes": return <span className="font-semibold">{fmt(totals.pending_budget_changes)}</span>;
        case "projected_budget": return <span className="font-semibold">{fmt(totals.projectedBudget)}</span>;
        case "committed_costs": return <span className="font-semibold">{fmt(totals.committed_costs)}</span>;
        case "direct_costs": return <span className="font-semibold">{fmt(totals.directCosts)}</span>;
        case "job_to_date_costs": return <span className="font-semibold">{fmt(totals.job_to_date_costs)}</span>;
        case "pending_cost_changes": return <span className="font-semibold">{fmt(totals.pending_cost_changes)}</span>;
        case "projected_costs": return <span className="font-semibold">{fmt(totals.projectedCosts)}</span>;
        case "forecast_to_complete": return <span className="font-semibold">{fmt(totals.forecastToComplete)}</span>;
        case "estimated_cost_at_completion": return <span className="font-semibold">{fmt(totals.estimatedCostAtCompletion)}</span>;
        case "projected_over_under": return (
          <span className={`font-semibold ${totals.projectedOverUnder < 0 ? "text-red-600" : ""}`}>
            {fmt(totals.projectedOverUnder)}
          </span>
        );
        default: return null;
      }
    }

    const c = calc(item!);
    switch (key) {
      case "description":
        return (
          <div>
            <p className="text-xs font-medium text-gray-500">{item!.cost_code}</p>
            <p className="text-xs text-blue-600">{item!.description}</p>
          </div>
        );
      case "original_budget_amount": return <span className="text-blue-600">{fmt(item!.original_budget_amount)}</span>;
      case "budget_modifications": return fmt(item!.budget_modifications);
      case "approved_cos": return fmt(item!.approved_cos);
      case "revised_budget": return fmt(c.revisedBudget);
      case "pending_budget_changes": return fmt(item!.pending_budget_changes);
      case "projected_budget": return fmt(c.projectedBudget);
      case "committed_costs": return fmt(item!.committed_costs);
      case "direct_costs": return fmt(c.directCosts);
      case "job_to_date_costs": return <span className="text-blue-600">{fmt(item!.job_to_date_costs)}</span>;
      case "pending_cost_changes": return fmt(item!.pending_cost_changes);
      case "projected_costs": return fmt(c.projectedCosts);
      case "forecast_to_complete": return fmtWithArrow(c.forecastToComplete);
      case "estimated_cost_at_completion": return fmt(c.estimatedCostAtCompletion);
      case "projected_over_under":
        return (
          <span className={c.projectedOverUnder < 0 ? "text-red-600" : ""}>
            {fmt(c.projectedOverUnder)}
          </span>
        );
      default: return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          SiteCommand
        </a>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <main className="px-6 py-8">
        {/* Title + actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Budget</h1>
            {snapshots.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""} saved
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Create dropdown */}
            <div ref={createRef} className="relative">
              <button
                onClick={() => setShowCreateMenu((o) => !o)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${showCreateMenu ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCreateMenu && (
                <div className="absolute left-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20">
                  <button
                    onClick={() => { setShowLineItemModal(true); setShowCreateMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 19h6m-3-3v6" />
                    </svg>
                    Add Budget Line Item
                  </button>
                  <button
                    onClick={() => { setShowSnapshotModal(true); setShowCreateMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
                    </svg>
                    Create Snapshot
                  </button>
                </div>
              )}
            </div>

            {/* Resend to ERP */}
            <button
              onClick={() => setShowErpModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Resend to ERP
            </button>

            {/* Export */}
            <div ref={exportRef} className="relative">
              <button
                onClick={() => setShowExportMenu((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showExportMenu ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20">
                  <button
                    onClick={() => { exportPDF(items); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    Export as PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonTable rows={6} cols={8} />
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {COLS.map((col) => (
                      <th
                        key={col.key}
                        className={`text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap ${col.width}`}
                      >
                        {col.tooltip ? (
                          <ColumnTooltip label={col.label} tooltip={col.tooltip} />
                        ) : (
                          col.label
                        )}
                      </th>
                    ))}
                    <th className="px-3 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {/* Line items */}
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={COLS.length + 1} className="px-3 py-12 text-center">
                        <p className="text-sm text-gray-400">No budget line items yet</p>
                        <p className="text-xs text-gray-300 mt-1">
                          Click Create → Add Budget Line Item to get started
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-b-0 group"
                      >
                        {COLS.map((col) => (
                          <td key={col.key} className="px-3 py-3 text-xs whitespace-nowrap">
                            {renderCell(item, col.key)}
                          </td>
                        ))}
                        {/* Row action menu */}
                        <td className="px-3 py-3 relative">
                          <div ref={rowMenuId === item.id ? rowMenuRef : undefined}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRowMenuId((prev) => (prev === item.id ? null : item.id));
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            {rowMenuId === item.id && (
                              <div className="absolute right-0 top-8 w-36 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20">
                                <button
                                  onClick={() => { setEditingItem(item); setRowMenuId(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Totals row */}
                  <tr className="border-t border-gray-200 bg-gray-50">
                    {COLS.map((col) => (
                      <td key={col.key} className="px-3 py-3 text-xs whitespace-nowrap">
                        {renderCell(null, col.key)}
                      </td>
                    ))}
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showLineItemModal && (
        <LineItemModal onConfirm={handleAddLineItem} onCancel={() => setShowLineItemModal(false)} />
      )}
      {editingItem && (
        <LineItemModal
          initial={editingItem}
          onConfirm={handleEditLineItem}
          onCancel={() => setEditingItem(null)}
        />
      )}
      {showSnapshotModal && (
        <SnapshotModal onConfirm={handleCreateSnapshot} onCancel={() => setShowSnapshotModal(false)} />
      )}
      {showErpModal && (
        <ErpConfirmModal onConfirm={handleErpResend} onCancel={() => setShowErpModal(false)} />
      )}
    </div>
  );
}
