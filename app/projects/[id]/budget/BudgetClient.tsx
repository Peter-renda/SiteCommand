"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import ProjectNav from "@/components/ProjectNav";
import { SkeletonTable } from "@/app/components/Skeleton";
import * as XLSX from "xlsx";

// ── Types ─────────────────────────────────────────────────────────────────────

type BudgetLineItem = {
  id: string;
  project_id: string;
  cost_code: string;
  cost_type: string;
  description: string;
  manual_calculation: boolean;
  unit_qty: number;
  unit_of_measure: string;
  unit_cost: number;
  original_budget_amount: number;
  budget_modifications: number;
  approved_cos: number;
  pending_budget_changes: number;
  committed_costs: number;
  job_to_date_costs: number;
  commitments_invoiced: number;
  pending_cost_changes: number;
  start_date: string | null;
  end_date: string | null;
  curve: string;
  sort_order: number;
  created_at: string;
};

type BudgetSnapshot = {
  id: string;
  name: string;
  created_at: string;
};

type CommitmentSovRow = {
  id: string;
  description: string;
  qty: number;
  uom: string;
  unit_cost: number;
  amount: number;
};

type CommitmentSummary = {
  id: string;
  type: "subcontract" | "purchase_order";
  number: number;
  title: string;
  contract_company: string;
  total_amount: number;
  lines: CommitmentSovRow[];
};

type CommitmentChangeOrderSummary = {
  id: string;
  number: string;
  title: string;
  contract_company: string;
  amount: number;
  commitment_id: string | null;
};

type CommittedCostsDetail = {
  cost_code: string;
  subcontracts: CommitmentSummary[];
  purchase_orders: CommitmentSummary[];
  commitment_change_orders: CommitmentChangeOrderSummary[];
};

type ForecastMethod = "automatic" | "manual" | "lump_sum" | "monitored_resources";

type ForecastEdit = {
  method: ForecastMethod;
  amount: number | null;
  notes: string;
};

type ModificationRow = {
  id: string;
  fromId: string;
  toId: string;
  amount: string;
  notes: string;
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

function calcWithForecastOverride(item: BudgetLineItem, overrideAmount?: number | null) {
  const base = calc(item);
  if (overrideAmount === undefined || overrideAmount === null) {
    return base;
  }
  const forecastToComplete = Math.max(0, overrideAmount);
  const estimatedCostAtCompletion = base.projectedCosts + forecastToComplete;
  const projectedOverUnder = base.projectedBudget - estimatedCostAtCompletion;
  return {
    ...base,
    forecastToComplete,
    estimatedCostAtCompletion,
    projectedOverUnder,
  };
}

// ── PDF Export ────────────────────────────────────────────────────────────────

function exportPDF(items: BudgetLineItem[], forecastEdits: Record<string, ForecastEdit>) {
  const totals = items.reduce(
    (acc, item) => {
      const edit = forecastEdits[item.id];
      const useOverride = edit && (edit.method === "manual" || edit.method === "lump_sum");
      const c = calcWithForecastOverride(item, useOverride ? edit.amount : null);
      acc.original_budget_amount += item.original_budget_amount;
      acc.budget_modifications += item.budget_modifications;
      acc.approved_cos += item.approved_cos;
      acc.pending_budget_changes += item.pending_budget_changes;
      acc.committed_costs += item.committed_costs;
      acc.job_to_date_costs += item.job_to_date_costs;
      acc.commitments_invoiced += item.commitments_invoiced;
      acc.pending_cost_changes += item.pending_cost_changes;
      acc.revisedBudget += c.revisedBudget;
      acc.projectedBudget += c.projectedBudget;
      acc.directCosts += c.directCosts;
      acc.projectedCosts += c.projectedCosts;
      acc.forecastToComplete += c.forecastToComplete;
      acc.estimatedCostAtCompletion += c.estimatedCostAtCompletion;
      acc.projectedOverUnder += c.projectedOverUnder;
      return acc;
    },
    sumItems([])
  );

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
      const edit = forecastEdits[item.id];
      const useOverride = edit && (edit.method === "manual" || edit.method === "lump_sum");
      const c = calcWithForecastOverride(item, useOverride ? edit.amount : null);
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

function readString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function readNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return numVal(value);
  return 0;
}

function readBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    return lower === "true" || lower === "yes" || lower === "1";
  }
  return false;
}

function readDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toISOString().split("T")[0];
  if (typeof value === "number") {
    // Excel 1900 date serial → JS timestamp
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? trimmed : d.toISOString().split("T")[0];
  }
  return null;
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
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "0.00"}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
    />
  );
}

function LineItemModal({
  initial,
  lockOriginalBudgetAmount = false,
  onConfirm,
  onCancel,
}: {
  initial?: BudgetLineItem;
  lockOriginalBudgetAmount?: boolean;
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
              <MoneyInput
                value={form.original_budget_amount}
                onChange={(v) => set("original_budget_amount", v)}
                disabled={lockOriginalBudgetAmount}
              />
              {lockOriginalBudgetAmount && (
                <p className="mt-1 text-[11px] text-gray-500">
                  Original Budget Amount is locked for this budget.
                </p>
              )}
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

function BudgetChangeModal({
  items,
  onConfirm,
  onCancel,
}: {
  items: BudgetLineItem[];
  onConfirm: (payload: { itemId: string; amount: number }) => void;
  onCancel: () => void;
}) {
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [amount, setAmount] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemId) return;
    onConfirm({ itemId, amount: numVal(amount) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Create Budget Change</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 transition-colors" aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Budget Line Item</label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.cost_code} — {item.description || "No description"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Budget Change Amount</label>
            <MoneyInput value={amount} onChange={setAmount} />
            <p className="mt-1 text-[11px] text-gray-500">
              This updates the selected line item&apos;s Pending Budget Changes.
            </p>
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
              Create Budget Change
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Budget Modification Modal ─────────────────────────────────────────────────

function BudgetModificationModal({
  items,
  onConfirm,
  onCancel,
}: {
  items: BudgetLineItem[];
  onConfirm: (rows: { fromId: string; toId: string; amount: number; notes: string }[]) => void;
  onCancel: () => void;
}) {
  function makeRow(): ModificationRow {
    return { id: Math.random().toString(36).slice(2), fromId: "", toId: "", amount: "", notes: "" };
  }

  const [rows, setRows] = useState<ModificationRow[]>(() => [makeRow(), makeRow(), makeRow(), makeRow()]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function updateRow(id: string, updates: Partial<ModificationRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  function handleSubmit() {
    const validRows = rows
      .filter((r) => r.fromId && r.toId && numVal(r.amount) !== 0)
      .map((r) => ({ fromId: r.fromId, toId: r.toId, amount: numVal(r.amount), notes: r.notes }));
    if (validRows.length === 0) return;
    onConfirm(validRows);
  }

  const selectClass =
    "w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Create Budget Modifications</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-900 text-xl leading-none" aria-label="Close">
            ×
          </button>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-[1fr_1fr_160px_1fr_36px] gap-3 mb-2">
            <span className="text-xs font-medium text-gray-600">From</span>
            <span className="text-xs font-medium text-gray-600">To</span>
            <span className="text-xs font-medium text-gray-600">Transfer Amount</span>
            <span className="text-xs font-medium text-gray-600">Notes</span>
            <span />
          </div>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_1fr_160px_1fr_36px] gap-3 items-center">
                <select
                  value={row.fromId}
                  onChange={(e) => updateRow(row.id, { fromId: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Select a Line Item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.cost_code}{item.description ? ` - ${item.description}` : ""}
                    </option>
                  ))}
                </select>
                <select
                  value={row.toId}
                  onChange={(e) => updateRow(row.id, { toId: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Select a Line Item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.cost_code}{item.description ? ` - ${item.description}` : ""}
                    </option>
                  ))}
                </select>
                <MoneyInput value={row.amount} onChange={(v) => updateRow(row.id, { amount: v })} placeholder="$0.00" />
                <input
                  type="text"
                  value={row.notes}
                  onChange={(e) => updateRow(row.id, { notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex-shrink-0"
                  aria-label="Remove row"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, makeRow()])}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            + Add Line Item
          </button>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-800 transition-colors"
          >
            Create
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
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleEnter() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
    setShow(true);
  }

  const tooltipEl = show && pos && mounted
    ? createPortal(
        <div
          className="fixed z-[200] w-64 rounded-lg bg-gray-900 text-white shadow-xl p-3 text-xs pointer-events-none"
          style={{ top: pos.top, left: pos.left }}
        >
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
        </div>,
        document.body
      )
    : null;

  return (
    <div
      ref={triggerRef}
      className="inline-block"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
    >
      <span className="cursor-default select-none">{label}</span>
      {tooltipEl}
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
  const [showBudgetChangeModal, setShowBudgetChangeModal] = useState(false);
  const [showBudgetModificationModal, setShowBudgetModificationModal] = useState(false);
  const [showErpModal, setShowErpModal] = useState(false);
  const [showCommittedCostsModal, setShowCommittedCostsModal] = useState(false);
  const [committedCostsLoading, setCommittedCostsLoading] = useState(false);
  const [committedCostsError, setCommittedCostsError] = useState<string | null>(null);
  const [committedCostsData, setCommittedCostsData] = useState<CommittedCostsDetail | null>(null);
  const [forecastEdits, setForecastEdits] = useState<Record<string, ForecastEdit>>({});
  const [selectedForecastItemId, setSelectedForecastItemId] = useState<string | null>(null);
  const [isBudgetLocked, setIsBudgetLocked] = useState(false);

  // Dropdown refs
  const exportRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const reportsMenuRef = useRef<HTMLDivElement>(null);
  const [showReportsMenu, setShowReportsMenu] = useState(false);

  // Row action menu
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) setRowMenuId(null);
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) setShowCreateMenu(false);
      if (reportsMenuRef.current && !reportsMenuRef.current.contains(e.target as Node)) setShowReportsMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/budget`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/budget/snapshots`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/budget/lock`).then((r) => r.json()),
    ]).then(([itemsData, snapshotsData, lockData]) => {
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setSnapshots(Array.isArray(snapshotsData) ? snapshotsData : []);
      setIsBudgetLocked(lockData?.locked === true);
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
        original_budget_amount: isBudgetLocked
          ? editingItem.original_budget_amount
          : numVal(data.original_budget_amount),
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

  async function handleLockBudget() {
    if (isBudgetLocked) return;
    const confirmed = window.confirm(
      "Lock budget? Once locked, Original Budget Amount values can no longer be edited."
    );
    if (!confirmed) return;
    const res = await fetch(`/api/projects/${projectId}/budget/lock`, { method: "POST" });
    if (res.ok) setIsBudgetLocked(true);
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

  async function handleCreateBudgetChange(payload: { itemId: string; amount: number }) {
    const targetItem = items.find((item) => item.id === payload.itemId);
    if (!targetItem) return;
    const res = await fetch(`/api/projects/${projectId}/budget/${payload.itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cost_code: targetItem.cost_code,
        description: targetItem.description,
        original_budget_amount: targetItem.original_budget_amount,
        budget_modifications: targetItem.budget_modifications,
        approved_cos: targetItem.approved_cos,
        pending_budget_changes: targetItem.pending_budget_changes + payload.amount,
        committed_costs: targetItem.committed_costs,
        job_to_date_costs: targetItem.job_to_date_costs,
        commitments_invoiced: targetItem.commitments_invoiced,
        pending_cost_changes: targetItem.pending_cost_changes,
      }),
    });
    if (res.ok) {
      const updated: BudgetLineItem = await res.json();
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setShowBudgetChangeModal(false);
    }
  }

  async function handleCreateBudgetModification(
    rows: { fromId: string; toId: string; amount: number; notes: string }[]
  ) {
    // Aggregate net delta per line item so each item is only PATCHed once
    const deltas = new Map<string, number>();
    for (const row of rows) {
      if (!row.fromId || !row.toId || row.amount === 0) continue;
      deltas.set(row.fromId, (deltas.get(row.fromId) ?? 0) - row.amount);
      deltas.set(row.toId, (deltas.get(row.toId) ?? 0) + row.amount);
    }

    const updatedMap = new Map(items.map((i) => [i.id, i]));
    for (const [itemId, delta] of deltas) {
      const item = updatedMap.get(itemId);
      if (!item) continue;
      const res = await fetch(`/api/projects/${projectId}/budget/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cost_code: item.cost_code,
          description: item.description,
          original_budget_amount: item.original_budget_amount,
          budget_modifications: item.budget_modifications + delta,
          approved_cos: item.approved_cos,
          pending_budget_changes: item.pending_budget_changes,
          committed_costs: item.committed_costs,
          job_to_date_costs: item.job_to_date_costs,
          commitments_invoiced: item.commitments_invoiced,
          pending_cost_changes: item.pending_cost_changes,
        }),
      });
      if (res.ok) {
        const updated: BudgetLineItem = await res.json();
        updatedMap.set(updated.id, updated);
      }
    }
    setItems(items.map((i) => updatedMap.get(i.id) ?? i));

    // Save audit records (fire-and-forget; don't block the UI)
    const validRows = rows.filter((r) => r.fromId && r.toId && r.amount !== 0);
    if (validRows.length > 0) {
      fetch(`/api/projects/${projectId}/budget/modifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: validRows.map((r) => ({
            fromId: r.fromId,
            toId: r.toId,
            fromCostCode: updatedMap.get(r.fromId)?.cost_code ?? "",
            toCostCode: updatedMap.get(r.toId)?.cost_code ?? "",
            amount: r.amount,
            notes: r.notes,
          })),
        }),
      });
    }

    setShowBudgetModificationModal(false);
  }

  function handleErpResend() {
    // Placeholder: integrate with ERP API
    setShowErpModal(false);
  }

  function handleDownloadTemplate() {
    const headers = [
      "Cost Code",
      "Cost Type",
      "Description",
      "Manual Calculation",
      "Unit Qty",
      "Unit of Measure",
      "Unit Cost",
      "Budget Amount",
      "Start Date",
      "End Date",
      "Curve",
    ];
    const sample = [
      "01-100",
      "Labor",
      "Site Preparation",
      "false",
      100,
      "HR",
      75.00,
      "",
      "2024-01-01",
      "2024-03-31",
      "Linear",
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    // Set column widths for readability
    ws["!cols"] = headers.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Budget Template");
    XLSX.writeFile(wb, "budget_template.xlsx");
  }

  async function handleImportBudgetFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        window.alert("The selected file has no worksheet.");
        return;
      }
      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (rows.length === 0) {
        window.alert("No rows were found in the selected file.");
        return;
      }

      const importedItems = rows
        .map((row) => {
          const costCode = readString(row["Cost Code"] ?? row.cost_code ?? row["cost code"]);
          const costType = readString(row["Cost Type"] ?? row.cost_type ?? row["cost type"]);
          const description = readString(row.Description ?? row.description);
          const manualCalculation = readBool(
            row["Manual Calculation"] ?? row.manual_calculation ?? row["manual calculation"]
          );
          const unitQty = readNumber(row["Unit Qty"] ?? row.unit_qty ?? row["unit qty"]);
          const unitOfMeasure = readString(
            row["Unit of Measure"] ?? row.unit_of_measure ?? row["unit of measure"]
          );
          const unitCost = readNumber(row["Unit Cost"] ?? row.unit_cost ?? row["unit cost"]);
          const budgetAmountRaw = readNumber(
            row["Budget Amount"] ?? row.budget_amount ?? row["budget amount"]
          );

          // If manual_calculation = true, use the provided budget amount directly.
          // If false, calculate from unit_qty × unit_cost.
          const originalBudgetAmount = manualCalculation
            ? budgetAmountRaw
            : unitQty * unitCost;

          return {
            cost_code: costCode,
            cost_type: costType,
            description,
            manual_calculation: manualCalculation,
            unit_qty: unitQty,
            unit_of_measure: unitOfMeasure,
            unit_cost: unitCost,
            original_budget_amount: originalBudgetAmount,
            start_date: readDate(row["Start Date"] ?? row.start_date ?? row["start date"]),
            end_date: readDate(row["End Date"] ?? row.end_date ?? row["end date"]),
            curve: readString(row.Curve ?? row.curve),
          };
        })
        .filter((row) => row.cost_code || row.description);

      if (importedItems.length === 0) {
        window.alert("No valid budget rows found. Include at least a Cost Code or Description per row.");
        return;
      }

      const startOrder = items.length;
      const created: BudgetLineItem[] = [];
      for (const [index, row] of importedItems.entries()) {
        const res = await fetch(`/api/projects/${projectId}/budget`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...row, sort_order: startOrder + index }),
        });
        if (res.ok) {
          const newItem: BudgetLineItem = await res.json();
          created.push(newItem);
        }
      }

      if (created.length > 0) {
        setItems((prev) => [...prev, ...created]);
      }
      window.alert(`Imported ${created.length} budget row${created.length === 1 ? "" : "s"}.`);
    } catch (error) {
      console.error("Budget import failed", error);
      window.alert("Failed to import this file. Please verify the format and try again.");
    } finally {
      e.target.value = "";
    }
  }

  async function openCommittedCostsModal(item: BudgetLineItem) {
    setShowCommittedCostsModal(true);
    setCommittedCostsLoading(true);
    setCommittedCostsError(null);
    setCommittedCostsData(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/budget/committed-costs?costCode=${encodeURIComponent(item.cost_code)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load committed costs");
      setCommittedCostsData(data);
    } catch (err) {
      setCommittedCostsError(err instanceof Error ? err.message : "Failed to load committed costs");
    } finally {
      setCommittedCostsLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function getItemCalc(item: BudgetLineItem) {
    const edit = forecastEdits[item.id];
    const useOverride = edit && (edit.method === "manual" || edit.method === "lump_sum");
    return calcWithForecastOverride(item, useOverride ? edit.amount : null);
  }

  const totals = items.reduce(
    (acc, item) => {
      const c = getItemCalc(item);
      acc.original_budget_amount += item.original_budget_amount;
      acc.budget_modifications += item.budget_modifications;
      acc.approved_cos += item.approved_cos;
      acc.pending_budget_changes += item.pending_budget_changes;
      acc.committed_costs += item.committed_costs;
      acc.job_to_date_costs += item.job_to_date_costs;
      acc.commitments_invoiced += item.commitments_invoiced;
      acc.pending_cost_changes += item.pending_cost_changes;
      acc.revisedBudget += c.revisedBudget;
      acc.projectedBudget += c.projectedBudget;
      acc.directCosts += c.directCosts;
      acc.projectedCosts += c.projectedCosts;
      acc.forecastToComplete += c.forecastToComplete;
      acc.estimatedCostAtCompletion += c.estimatedCostAtCompletion;
      acc.projectedOverUnder += c.projectedOverUnder;
      return acc;
    },
    sumItems([])
  );
  const selectedForecastItem = items.find((item) => item.id === selectedForecastItemId) ?? null;
  const selectedForecastEdit = selectedForecastItem
    ? forecastEdits[selectedForecastItem.id] ?? { method: "automatic" as ForecastMethod, amount: null, notes: "" }
    : null;

  function updateForecastEdit(itemId: string, updates: Partial<ForecastEdit>) {
    setForecastEdits((prev) => {
      const current = prev[itemId] ?? { method: "automatic" as ForecastMethod, amount: null, notes: "" };
      return {
        ...prev,
        [itemId]: {
          ...current,
          ...updates,
        },
      };
    });
  }

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

    const c = getItemCalc(item!);
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
      case "committed_costs":
        return (
          <button
            type="button"
            onClick={() => openCommittedCostsModal(item)}
            className="text-blue-600 hover:text-blue-800 underline underline-offset-2 decoration-blue-200"
          >
            {fmt(item!.committed_costs)}
          </button>
        );
      case "direct_costs": return fmt(c.directCosts);
      case "job_to_date_costs": return <span className="text-blue-600">{fmt(item!.job_to_date_costs)}</span>;
      case "pending_cost_changes": return fmt(item!.pending_cost_changes);
      case "projected_costs": return fmt(c.projectedCosts);
      case "forecast_to_complete":
        return (
          <button
            type="button"
            onClick={() => setSelectedForecastItemId(item.id)}
            className="text-blue-600 hover:text-blue-800 underline underline-offset-2 decoration-blue-200"
          >
            {fmtWithArrow(c.forecastToComplete)}
          </button>
        );
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
            {/* Create dropdown — shown when budget is locked */}
            {isBudgetLocked && (
              <div ref={createMenuRef} className="relative">
                <button
                  onClick={() => setShowCreateMenu((o) => !o)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
                >
                  + Create
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${showCreateMenu ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showCreateMenu && (
                  <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                    <button
                      onClick={() => { setShowLineItemModal(true); setShowCreateMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Budget Line Item
                    </button>
                    <button
                      onClick={() => { setShowBudgetModificationModal(true); setShowCreateMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Budget Modification
                    </button>
                    <button
                      onClick={() => { setShowSnapshotModal(true); setShowCreateMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Snapshot
                    </button>
                  </div>
                )}
              </div>
            )}

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
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                  <button
                    onClick={() => { exportPDF(items, forecastEdits); setShowExportMenu(false); }}
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

            {/* Three-dot reports menu */}
            <div ref={reportsMenuRef} className="relative">
              <button
                onClick={() => setShowReportsMenu((o) => !o)}
                className={`p-2 text-gray-600 border rounded-md transition-colors hover:bg-gray-50 ${showReportsMenu ? "border-gray-400 bg-gray-50" : "border-gray-200 bg-white"}`}
                aria-label="Reports"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {showReportsMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                  <div className="group relative">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      Budget Reports
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="absolute right-full top-0 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 hidden group-hover:block">
                      <a
                        href={`/projects/${projectId}/reporting/budget-modifications`}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowReportsMenu(false)}
                      >
                        Budget Modifications
                      </a>
                      <a
                        href={`/projects/${projectId}/reporting/buyout-summary`}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowReportsMenu(false)}
                      >
                        Buyout Summary Report
                      </a>
                      {["Legacy Budget Detail", "Monitored Resources Report"].map((report) => (
                        <button
                          key={report}
                          onClick={() => setShowReportsMenu(false)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {report}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="group relative">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      Custom Reports
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="absolute right-full top-0 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 hidden group-hover:block">
                      <p className="px-4 py-2 text-sm text-gray-400 italic">No custom reports</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-4 items-start ${!isBudgetLocked ? "xl:grid-cols-[minmax(0,1fr)_280px]" : ""}`}>
          <section>
            {/* Table */}
            {loading ? (
              <SkeletonTable rows={6} cols={8} />
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="overflow-auto max-h-[70vh]">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-20">
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {COLS.map((col) => (
                          <th
                            key={col.key}
                            className={`text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap bg-gray-50 ${col.width} ${
                              col.key === "description" ? "sticky left-0 z-30" : ""
                            }`}
                          >
                            {col.tooltip ? (
                              <ColumnTooltip label={col.label} tooltip={col.tooltip} />
                            ) : (
                              col.label
                            )}
                          </th>
                        ))}
                        <th className="px-3 py-3 w-10 bg-gray-50" />
                      </tr>
                    </thead>
                    <tbody>
                      {/* Line items */}
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={COLS.length + 1} className="px-3 py-12 text-center">
                            <p className="text-sm text-gray-400">No budget line items yet</p>
                            <p className="text-xs text-gray-300 mt-1">
                              Use the right panel to create your first budget code.
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
                              <td
                                key={col.key}
                                className={`px-3 py-3 text-xs whitespace-nowrap ${
                                  col.key === "description" ? "sticky left-0 z-10 bg-white" : ""
                                }`}
                              >
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
                      <tr className="border-t border-gray-200 bg-gray-50 sticky bottom-0 z-20">
                        {COLS.map((col) => (
                          <td
                            key={col.key}
                            className={`px-3 py-3 text-xs whitespace-nowrap bg-gray-50 ${
                              col.key === "description" ? "sticky left-0 z-30" : ""
                            }`}
                          >
                            {renderCell(null, col.key)}
                          </td>
                        ))}
                        <td className="bg-gray-50" />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {!isBudgetLocked && (
          <aside className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
            <button
              onClick={() => setShowLineItemModal(true)}
              className="w-full px-3 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors text-left"
            >
              + Create Budget Line Item
            </button>
            <button
              onClick={() => setShowSnapshotModal(true)}
              className="w-full px-3 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors text-left"
            >
              + Create Snapshot
            </button>
            <button
              onClick={handleLockBudget}
              disabled={isBudgetLocked}
              className={`w-full px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left ${
                isBudgetLocked
                  ? "bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed"
                  : "text-white bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {isBudgetLocked ? "Budget Locked" : "Lock Budget"}
            </button>
            <div className="pt-4 space-y-3">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); handleDownloadTemplate(); }}
                className="block text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2"
              >
                Download Excel Template
              </a>
              <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportBudgetFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="w-full px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
              >
                Import
              </button>
            </div>
          </aside>
          )}
        </div>
      </main>

      {selectedForecastItem && selectedForecastEdit && (
        <section className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-300 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-[28px] leading-none font-semibold text-gray-700">
              Forecast To Complete for {selectedForecastItem.cost_code}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedForecastItemId(null)}
              className="text-4xl leading-none text-gray-700 hover:text-black"
              aria-label="Close forecast editor"
            >
              ×
            </button>
          </div>
          <div className="px-5 py-3 max-h-[38vh] overflow-auto">
            <p className="text-lg font-semibold text-gray-900 mb-2">Calculation Method:</p>
            <div className="space-y-0.5 text-base leading-tight">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="forecast-method"
                  checked={selectedForecastEdit.method === "automatic"}
                  onChange={() => updateForecastEdit(selectedForecastItem.id, { method: "automatic", amount: null })}
                />
                <span>
                  Automatic Calculation{" "}
                  <span className="font-semibold">{fmt(calc(selectedForecastItem).forecastToComplete)}</span>
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="forecast-method"
                  checked={selectedForecastEdit.method === "manual"}
                  onChange={() =>
                    updateForecastEdit(selectedForecastItem.id, {
                      method: "manual",
                      amount: selectedForecastEdit.amount ?? calc(selectedForecastItem).forecastToComplete,
                    })
                  }
                />
                <span>Manual Entry</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="forecast-method"
                  checked={selectedForecastEdit.method === "lump_sum"}
                  onChange={() =>
                    updateForecastEdit(selectedForecastItem.id, {
                      method: "lump_sum",
                      amount: selectedForecastEdit.amount ?? calc(selectedForecastItem).forecastToComplete,
                    })
                  }
                />
                <span>Lump Sum Entry</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="forecast-method"
                  checked={selectedForecastEdit.method === "monitored_resources"}
                  onChange={() =>
                    updateForecastEdit(selectedForecastItem.id, { method: "monitored_resources", amount: null })
                  }
                />
                <span>Monitored Resources</span>
              </label>
            </div>

            {(selectedForecastEdit.method === "manual" || selectedForecastEdit.method === "lump_sum") && (
              <div className="mt-3 max-w-sm">
                <label className="block text-lg font-semibold text-gray-900 mb-1">New Forecast Amount:</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={selectedForecastEdit.amount !== null ? String(selectedForecastEdit.amount) : ""}
                  onChange={(e) =>
                    updateForecastEdit(selectedForecastItem.id, { amount: numVal(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="mt-3 max-w-md">
              <label className="block text-lg font-semibold text-gray-900 mb-1">Notes:</label>
              <textarea
                value={selectedForecastEdit.notes}
                onChange={(e) => updateForecastEdit(selectedForecastItem.id, { notes: e.target.value })}
                className="w-full h-24 border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>
      )}

      {/* Modals */}
      {showLineItemModal && (
        <LineItemModal onConfirm={handleAddLineItem} onCancel={() => setShowLineItemModal(false)} />
      )}
      {editingItem && (
        <LineItemModal
          initial={editingItem}
          lockOriginalBudgetAmount={isBudgetLocked}
          onConfirm={handleEditLineItem}
          onCancel={() => setEditingItem(null)}
        />
      )}
      {showSnapshotModal && (
        <SnapshotModal onConfirm={handleCreateSnapshot} onCancel={() => setShowSnapshotModal(false)} />
      )}
      {showBudgetChangeModal && (
        <BudgetChangeModal
          items={items}
          onConfirm={handleCreateBudgetChange}
          onCancel={() => setShowBudgetChangeModal(false)}
        />
      )}
      {showBudgetModificationModal && (
        <BudgetModificationModal
          items={items}
          onConfirm={handleCreateBudgetModification}
          onCancel={() => setShowBudgetModificationModal(false)}
        />
      )}
      {showErpModal && (
        <ErpConfirmModal onConfirm={handleErpResend} onCancel={() => setShowErpModal(false)} />
      )}
      {showCommittedCostsModal && (
        <CommittedCostsModal
          projectId={projectId}
          loading={committedCostsLoading}
          error={committedCostsError}
          data={committedCostsData}
          onClose={() => {
            setShowCommittedCostsModal(false);
            setCommittedCostsData(null);
            setCommittedCostsError(null);
          }}
        />
      )}
    </div>
  );
}

function CommittedCostsModal({
  projectId,
  loading,
  error,
  data,
  onClose,
}: {
  projectId: string;
  loading: boolean;
  error: string | null;
  data: CommittedCostsDetail | null;
  onClose: () => void;
}) {
  const sectionTitleClass = "text-sm font-semibold text-gray-900";
  const sectionCountClass = "text-xs text-gray-500";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Committed Costs {data?.cost_code ? `for ${data.cost_code}` : ""}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 overflow-auto max-h-[calc(90vh-58px)]">
          {loading && <p className="text-sm text-gray-500">Loading committed cost details…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && data && (
            <div className="space-y-6">
              <CommitmentSection
                projectId={projectId}
                title="Approved Subcontracts"
                items={data.subcontracts}
                sectionTitleClass={sectionTitleClass}
                sectionCountClass={sectionCountClass}
              />
              <CommitmentSection
                projectId={projectId}
                title="Approved Purchase Order Contracts"
                items={data.purchase_orders}
                sectionTitleClass={sectionTitleClass}
                sectionCountClass={sectionCountClass}
              />
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className={sectionTitleClass}>Approved Commitment Change Orders</h3>
                  <span className={sectionCountClass}>{data.commitment_change_orders.length} items</span>
                </div>
                {data.commitment_change_orders.length === 0 ? (
                  <p className="text-xs text-gray-500">No approved commitment change orders for this cost code.</p>
                ) : (
                  <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Change Order</th>
                        <th className="px-3 py-2 text-left font-semibold">Company</th>
                        <th className="px-3 py-2 text-left font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.commitment_change_orders.map((co) => (
                        <tr key={co.id} className="border-t border-gray-100">
                          <td className="px-3 py-2">
                            <Link
                              href={`/projects/${projectId}/change-orders/${co.id}`}
                              className="text-blue-700 hover:text-blue-900 hover:underline"
                            >
                              {co.number} - {co.title || "Untitled"}
                            </Link>
                          </td>
                          <td className="px-3 py-2">{co.contract_company || "—"}</td>
                          <td className="px-3 py-2">{fmt(co.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommitmentSection({
  projectId,
  title,
  items,
  sectionTitleClass,
  sectionCountClass,
}: {
  projectId: string;
  title: string;
  items: CommitmentSummary[];
  sectionTitleClass: string;
  sectionCountClass: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className={sectionTitleClass}>{title}</h3>
        <span className={sectionCountClass}>{items.length} items</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-gray-500">No matching approved commitments for this cost code.</p>
      ) : (
        <div className="space-y-3">
          {items.map((commitment) => (
            <div key={commitment.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <Link
                    href={`/projects/${projectId}/commitments/${commitment.id}`}
                    className="text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    #{commitment.number} - {commitment.title || "Untitled Commitment"}
                  </Link>
                  <p className="text-gray-500 truncate">{commitment.contract_company || "—"}</p>
                </div>
                <div className="font-semibold text-gray-900 whitespace-nowrap">{fmt(commitment.total_amount)}</div>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-white text-gray-700">
                  <tr className="border-t border-gray-200">
                    <th className="px-3 py-2 text-left font-semibold">Description</th>
                    <th className="px-3 py-2 text-left font-semibold">QTY</th>
                    <th className="px-3 py-2 text-left font-semibold">UOM</th>
                    <th className="px-3 py-2 text-left font-semibold">Unit Cost</th>
                    <th className="px-3 py-2 text-left font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {commitment.lines.map((line) => (
                    <tr key={line.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">{line.description || "—"}</td>
                      <td className="px-3 py-2">{line.qty}</td>
                      <td className="px-3 py-2">{line.uom || "—"}</td>
                      <td className="px-3 py-2">{fmt(line.unit_cost)}</td>
                      <td className="px-3 py-2">{fmt(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
