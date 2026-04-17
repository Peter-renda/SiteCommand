import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";

type BudgetLineItem = {
  id: string;
  project_id: string;
  cost_code: string;
  cost_type: string;
  description: string;
  original_budget_amount: number;
  budget_modifications: number;
  approved_cos: number;
  pending_budget_changes: number;
  committed_costs: number;
  direct_costs: number;
  erp_job_to_date_costs: number;
  cost_rom: number;
  cost_rfq: number;
  non_commitment_cost: number;
  pending_cost_changes: number;
  forecast_to_complete: number;
  budgeted_quantity: number;
  budgeted_uom: string;
  installed_quantity: number;
  actual_labor_hours: number;
  actual_labor_cost: number;
  is_gst: number;
  is_partial: number;
  sort_order: number;
  created_at: string;
};

type FormData = {
  cost_code: string;
  cost_type: string;
  description: string;
  original_budget_amount: string;
  budget_modifications: string;
  approved_cos: string;
  pending_budget_changes: string;
  committed_costs: string;
  direct_costs: string;
  erp_job_to_date_costs: string;
  cost_rom: string;
  cost_rfq: string;
  non_commitment_cost: string;
  pending_cost_changes: string;
  forecast_to_complete: string;
  budgeted_quantity: string;
  budgeted_uom: string;
  installed_quantity: string;
  actual_labor_hours: string;
  actual_labor_cost: string;
  is_gst: boolean;
  is_partial: boolean;
};

const emptyForm: FormData = {
  cost_code: "",
  cost_type: "",
  description: "",
  original_budget_amount: "",
  budget_modifications: "",
  approved_cos: "",
  pending_budget_changes: "",
  committed_costs: "",
  direct_costs: "",
  erp_job_to_date_costs: "",
  cost_rom: "",
  cost_rfq: "",
  non_commitment_cost: "",
  pending_cost_changes: "",
  forecast_to_complete: "",
  budgeted_quantity: "",
  budgeted_uom: "",
  installed_quantity: "",
  actual_labor_hours: "",
  actual_labor_cost: "",
  is_gst: false,
  is_partial: false,
};

function numVal(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function calc(item: BudgetLineItem) {
  const revisedBudget = item.original_budget_amount + item.budget_modifications + item.approved_cos;
  const projectedBudget = revisedBudget + item.pending_budget_changes;
  const jobToDateCosts = item.committed_costs + item.direct_costs + item.erp_job_to_date_costs;
  const erpDirectCosts = item.direct_costs + item.erp_job_to_date_costs;
  const projectedCosts = jobToDateCosts + item.pending_cost_changes;
  const estimatedCostAtCompletion = jobToDateCosts + item.forecast_to_complete;
  const projectedOverUnder = revisedBudget - estimatedCostAtCompletion;
  const laborRate = item.actual_labor_hours > 0 ? item.actual_labor_cost / item.actual_labor_hours : 0;
  const installedPerHour = item.actual_labor_hours > 0 ? item.installed_quantity / item.actual_labor_hours : 0;
  return { revisedBudget, projectedBudget, jobToDateCosts, erpDirectCosts, projectedCosts, estimatedCostAtCompletion, projectedOverUnder, laborRate, installedPerHour };
}

function LineItemModal({
  initial,
  preset,
  onConfirm,
  onCancel,
}: {
  initial?: BudgetLineItem;
  preset?: Partial<FormData>;
  onConfirm: (data: FormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormData>(
    initial
      ? {
          cost_code: initial.cost_code,
          cost_type: initial.cost_type,
          description: initial.description,
          original_budget_amount: initial.original_budget_amount !== 0 ? String(initial.original_budget_amount) : "",
          budget_modifications: initial.budget_modifications !== 0 ? String(initial.budget_modifications) : "",
          approved_cos: initial.approved_cos !== 0 ? String(initial.approved_cos) : "",
          pending_budget_changes: initial.pending_budget_changes !== 0 ? String(initial.pending_budget_changes) : "",
          committed_costs: initial.committed_costs !== 0 ? String(initial.committed_costs) : "",
          direct_costs: initial.direct_costs !== 0 ? String(initial.direct_costs) : "",
          erp_job_to_date_costs: initial.erp_job_to_date_costs !== 0 ? String(initial.erp_job_to_date_costs) : "",
          cost_rom: initial.cost_rom !== 0 ? String(initial.cost_rom) : "",
          cost_rfq: initial.cost_rfq !== 0 ? String(initial.cost_rfq) : "",
          non_commitment_cost: initial.non_commitment_cost !== 0 ? String(initial.non_commitment_cost) : "",
          pending_cost_changes: initial.pending_cost_changes !== 0 ? String(initial.pending_cost_changes) : "",
          forecast_to_complete: initial.forecast_to_complete !== 0 ? String(initial.forecast_to_complete) : "",
          budgeted_quantity: initial.budgeted_quantity !== 0 ? String(initial.budgeted_quantity) : "",
          budgeted_uom: initial.budgeted_uom || "",
          installed_quantity: initial.installed_quantity !== 0 ? String(initial.installed_quantity) : "",
          actual_labor_hours: initial.actual_labor_hours !== 0 ? String(initial.actual_labor_hours) : "",
          actual_labor_cost: initial.actual_labor_cost !== 0 ? String(initial.actual_labor_cost) : "",
          is_gst: Boolean(initial.is_gst),
          is_partial: Boolean(initial.is_partial),
        }
      : { ...emptyForm, ...preset }
  );
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function set(key: keyof FormData, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cost_code.trim() || !form.cost_type.trim()) {
      setError("Cost code and cost type are required.");
      return;
    }
    setError("");
    onConfirm(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
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
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cost Code</label>
              <input
                type="text"
                value={form.cost_code}
                onChange={(e) => set("cost_code", e.target.value)}
                placeholder="e.g. 01-030.C"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cost Type</label>
              <input
                type="text"
                value={form.cost_type}
                onChange={(e) => set("cost_type", e.target.value)}
                placeholder="e.g. Labor"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="e.g. Concrete Work"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="flex items-center gap-6 pt-6">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                <input type="checkbox" checked={form.is_partial} onChange={(e) => set("is_partial", e.target.checked)} />
                Partial / Unbudgeted
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                <input type="checkbox" checked={form.is_gst} onChange={(e) => set("is_gst", e.target.checked)} />
                GST Line Item
              </label>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Budget</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "original_budget_amount", label: "Original Budget Amount" },
              { key: "budget_modifications", label: "Budget Modifications" },
              { key: "approved_cos", label: "Approved Change Orders" },
              { key: "pending_budget_changes", label: "Pending Budget Changes" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form[key as keyof FormData] as string}
                  onChange={(e) => set(key as keyof FormData, e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Costs</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "committed_costs", label: "Committed Costs" },
              { key: "direct_costs", label: "Direct Costs" },
              { key: "erp_job_to_date_costs", label: "ERP Job to Date Costs" },
              { key: "pending_cost_changes", label: "Pending Cost Changes" },
              { key: "forecast_to_complete", label: "Forecast to Complete" },
              { key: "cost_rom", label: "Cost ROM" },
              { key: "cost_rfq", label: "Cost RFQ" },
              { key: "non_commitment_cost", label: "Non-Commitment Cost" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form[key as keyof FormData] as string}
                  onChange={(e) => set(key as keyof FormData, e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            ))}
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Production & Labor</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "budgeted_quantity", label: "Budgeted Quantity" },
              { key: "budgeted_uom", label: "UOM" },
              { key: "installed_quantity", label: "Installed Quantity" },
              { key: "actual_labor_hours", label: "Actual Labor Hours" },
              { key: "actual_labor_cost", label: "Actual Labor Cost" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form[key as keyof FormData] as string}
                  onChange={(e) => set(key as keyof FormData, e.target.value)}
                  placeholder={key === "budgeted_uom" ? "e.g. LF" : "0.00"}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            ))}
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

export default function Budget() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<
    "budget" | "production_quantities" | "budget_details" | "forecasting" | "project_status_snapshot" | "change_history"
  >("budget");
  const [items, setItems] = useState<BudgetLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetLineItem | null>(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [newItemPreset, setNewItemPreset] = useState<Partial<FormData>>({});
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const createRef = useRef<HTMLDivElement>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) setShowCreateMenu(false);
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) setRowMenuId(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadItems() {
    const res = await fetch(`/api/projects/${id}/budget`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, [id]);

  async function handleAdd(data: FormData) {
    const res = await fetch(`/api/projects/${id}/budget`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cost_code: data.cost_code,
        cost_type: data.cost_type || (data.is_gst ? "Other" : ""),
        description: data.description,
        original_budget_amount: numVal(data.original_budget_amount),
        budget_modifications: numVal(data.budget_modifications),
        approved_cos: numVal(data.approved_cos),
        pending_budget_changes: numVal(data.pending_budget_changes),
        committed_costs: numVal(data.committed_costs),
        direct_costs: numVal(data.direct_costs),
        erp_job_to_date_costs: numVal(data.erp_job_to_date_costs),
        cost_rom: numVal(data.cost_rom),
        cost_rfq: numVal(data.cost_rfq),
        non_commitment_cost: numVal(data.non_commitment_cost),
        pending_cost_changes: numVal(data.pending_cost_changes),
        forecast_to_complete: numVal(data.forecast_to_complete),
        budgeted_quantity: numVal(data.budgeted_quantity),
        budgeted_uom: data.budgeted_uom,
        installed_quantity: numVal(data.installed_quantity),
        actual_labor_hours: numVal(data.actual_labor_hours),
        actual_labor_cost: numVal(data.actual_labor_cost),
        is_gst: data.is_gst,
        is_partial: data.is_partial,
      }),
    });
    if (res.ok) {
      const newItem: BudgetLineItem = await res.json();
      setItems((prev) => [...prev, newItem]);
    } else {
      const errorData = await res.json().catch(() => ({}));
      alert(errorData.error || "Failed to create budget line item.");
    }
    setShowModal(false);
  }

  async function handleEdit(data: FormData) {
    if (!editingItem) return;
    const res = await fetch(`/api/projects/${id}/budget/${editingItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cost_code: data.cost_code,
        cost_type: data.cost_type || (data.is_gst ? "Other" : ""),
        description: data.description,
        original_budget_amount: numVal(data.original_budget_amount),
        budget_modifications: numVal(data.budget_modifications),
        approved_cos: numVal(data.approved_cos),
        pending_budget_changes: numVal(data.pending_budget_changes),
        committed_costs: numVal(data.committed_costs),
        direct_costs: numVal(data.direct_costs),
        erp_job_to_date_costs: numVal(data.erp_job_to_date_costs),
        cost_rom: numVal(data.cost_rom),
        cost_rfq: numVal(data.cost_rfq),
        non_commitment_cost: numVal(data.non_commitment_cost),
        pending_cost_changes: numVal(data.pending_cost_changes),
        forecast_to_complete: numVal(data.forecast_to_complete),
        budgeted_quantity: numVal(data.budgeted_quantity),
        budgeted_uom: data.budgeted_uom,
        installed_quantity: numVal(data.installed_quantity),
        actual_labor_hours: numVal(data.actual_labor_hours),
        actual_labor_cost: numVal(data.actual_labor_cost),
        is_gst: data.is_gst,
        is_partial: data.is_partial,
      }),
    });
    if (res.ok) {
      const updated: BudgetLineItem = await res.json();
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } else {
      const errorData = await res.json().catch(() => ({}));
      alert(errorData.error || "Failed to update budget line item.");
    }
    setEditingItem(null);
  }

  async function handleDelete(itemId: string) {
    const res = await fetch(`/api/projects/${id}/budget/${itemId}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== itemId));
    setRowMenuId(null);
  }

  const totals = items.reduce(
    (acc, item) => {
      const c = calc(item);
      return {
        original_budget_amount: acc.original_budget_amount + item.original_budget_amount,
        budget_modifications: acc.budget_modifications + item.budget_modifications,
        approved_cos: acc.approved_cos + item.approved_cos,
        revisedBudget: acc.revisedBudget + c.revisedBudget,
        pending_budget_changes: acc.pending_budget_changes + item.pending_budget_changes,
        projectedBudget: acc.projectedBudget + c.projectedBudget,
        committed_costs: acc.committed_costs + item.committed_costs,
        direct_costs: acc.direct_costs + item.direct_costs,
        erp_job_to_date_costs: acc.erp_job_to_date_costs + item.erp_job_to_date_costs,
        cost_rom: acc.cost_rom + item.cost_rom,
        cost_rfq: acc.cost_rfq + item.cost_rfq,
        non_commitment_cost: acc.non_commitment_cost + item.non_commitment_cost,
        jobToDateCosts: acc.jobToDateCosts + c.jobToDateCosts,
        erpDirectCosts: acc.erpDirectCosts + c.erpDirectCosts,
        pending_cost_changes: acc.pending_cost_changes + item.pending_cost_changes,
        projectedCosts: acc.projectedCosts + c.projectedCosts,
        forecast_to_complete: acc.forecast_to_complete + item.forecast_to_complete,
        estimatedCostAtCompletion: acc.estimatedCostAtCompletion + c.estimatedCostAtCompletion,
        projectedOverUnder: acc.projectedOverUnder + c.projectedOverUnder,
        budgeted_quantity: acc.budgeted_quantity + item.budgeted_quantity,
        installed_quantity: acc.installed_quantity + item.installed_quantity,
        actual_labor_hours: acc.actual_labor_hours + item.actual_labor_hours,
        actual_labor_cost: acc.actual_labor_cost + item.actual_labor_cost,
      };
    },
    {
      original_budget_amount: 0, budget_modifications: 0, approved_cos: 0, revisedBudget: 0,
      pending_budget_changes: 0, projectedBudget: 0, committed_costs: 0, direct_costs: 0, erp_job_to_date_costs: 0,
      cost_rom: 0, cost_rfq: 0, non_commitment_cost: 0, jobToDateCosts: 0, erpDirectCosts: 0, pending_cost_changes: 0,
      projectedCosts: 0, forecast_to_complete: 0, estimatedCostAtCompletion: 0, projectedOverUnder: 0, budgeted_quantity: 0,
      installed_quantity: 0, actual_labor_hours: 0, actual_labor_cost: 0,
    }
  );

  const COLS = [
    { key: "description", label: "Description", width: "min-w-[180px]" },
    { key: "cost_type", label: "Cost Type", width: "min-w-[110px]" },
    { key: "original_budget_amount", label: "Original Budget", width: "min-w-[120px]" },
    { key: "budget_modifications", label: "Modifications", width: "min-w-[110px]" },
    { key: "approved_cos", label: "Approved COs", width: "min-w-[110px]" },
    { key: "revised_budget", label: "Revised Budget", width: "min-w-[110px]" },
    { key: "pending_budget_changes", label: "Pending Budget", width: "min-w-[110px]" },
    { key: "projected_budget", label: "Projected Budget", width: "min-w-[110px]" },
    { key: "committed_costs", label: "Committed Costs", width: "min-w-[110px]" },
    { key: "direct_costs", label: "Direct Costs", width: "min-w-[100px]" },
    { key: "erp_job_to_date_costs", label: "ERP JTD Costs", width: "min-w-[110px]" },
    { key: "erp_direct_costs", label: "ERP Direct Costs", width: "min-w-[110px]" },
    { key: "cost_rom", label: "Cost ROM", width: "min-w-[100px]" },
    { key: "cost_rfq", label: "Cost RFQ", width: "min-w-[100px]" },
    { key: "non_commitment_cost", label: "NCC", width: "min-w-[90px]" },
    { key: "job_to_date_costs", label: "JTD Costs", width: "min-w-[100px]" },
    { key: "pending_cost_changes", label: "Pending Costs", width: "min-w-[110px]" },
    { key: "projected_costs", label: "Projected Costs", width: "min-w-[110px]" },
    { key: "forecast_to_complete", label: "Forecast to Complete", width: "min-w-[120px]" },
    { key: "estimated_cost_at_completion", label: "Est. Cost at Completion", width: "min-w-[130px]" },
    { key: "projected_over_under", label: "Proj. Over/Under", width: "min-w-[120px]" },
    { key: "budgeted_quantity", label: "Budgeted Qty", width: "min-w-[110px]" },
    { key: "installed_quantity", label: "Installed Qty", width: "min-w-[110px]" },
    { key: "actual_labor_hours", label: "Actual Labor Hrs", width: "min-w-[120px]" },
    { key: "actual_labor_cost", label: "Actual Labor Cost", width: "min-w-[120px]" },
    { key: "installed_per_hour", label: "Units / Hr", width: "min-w-[90px]" },
  ] as const;

  const budgetDetailsColumns = [
    { key: "budget_code", label: "Budget Code", width: "min-w-[220px]" },
    { key: "vendor", label: "Vendor", width: "min-w-[130px]" },
    { key: "item", label: "Item", width: "min-w-[130px]" },
    { key: "description", label: "Description", width: "min-w-[140px]" },
    { key: "detail_type", label: "Detail Type", width: "min-w-[170px]" },
    { key: "original_budget_amount", label: "Original Budget Amount", width: "min-w-[140px]" },
    { key: "budget_modifications", label: "Budget Modifications", width: "min-w-[130px]" },
    { key: "approved_cos", label: "Approved COs", width: "min-w-[110px]" },
    { key: "pending_budget_changes", label: "Pending Budget Changes", width: "min-w-[130px]" },
    { key: "committed_costs", label: "Committed Costs", width: "min-w-[130px]" },
    { key: "job_to_date_costs", label: "Job to Date Costs", width: "min-w-[120px]" },
    { key: "pending_cost_changes", label: "Pending Cost Changes", width: "min-w-[120px]" },
    { key: "forecast_to_complete", label: "Forecast To Complete", width: "min-w-[120px]" },
  ] as const;

  function renderCell(item: BudgetLineItem | null, key: (typeof COLS)[number]["key"]) {
    if (item === null) {
      switch (key) {
        case "description": return <span className="font-semibold text-gray-900">Total</span>;
        case "cost_type": return <span className="font-semibold">—</span>;
        case "original_budget_amount": return <span className="font-semibold">{fmt(totals.original_budget_amount)}</span>;
        case "budget_modifications": return <span className="font-semibold">{fmt(totals.budget_modifications)}</span>;
        case "approved_cos": return <span className="font-semibold">{fmt(totals.approved_cos)}</span>;
        case "revised_budget": return <span className="font-semibold">{fmt(totals.revisedBudget)}</span>;
        case "pending_budget_changes": return <span className="font-semibold">{fmt(totals.pending_budget_changes)}</span>;
        case "projected_budget": return <span className="font-semibold">{fmt(totals.projectedBudget)}</span>;
        case "committed_costs": return <span className="font-semibold">{fmt(totals.committed_costs)}</span>;
        case "direct_costs": return <span className="font-semibold">{fmt(totals.direct_costs)}</span>;
        case "erp_job_to_date_costs": return <span className="font-semibold">{fmt(totals.erp_job_to_date_costs)}</span>;
        case "erp_direct_costs": return <span className="font-semibold">{fmt(totals.erpDirectCosts)}</span>;
        case "cost_rom": return <span className="font-semibold">{fmt(totals.cost_rom)}</span>;
        case "cost_rfq": return <span className="font-semibold">{fmt(totals.cost_rfq)}</span>;
        case "non_commitment_cost": return <span className="font-semibold">{fmt(totals.non_commitment_cost)}</span>;
        case "job_to_date_costs": return <span className="font-semibold">{fmt(totals.jobToDateCosts)}</span>;
        case "pending_cost_changes": return <span className="font-semibold">{fmt(totals.pending_cost_changes)}</span>;
        case "projected_costs": return <span className="font-semibold">{fmt(totals.projectedCosts)}</span>;
        case "forecast_to_complete": return <span className="font-semibold">{fmt(totals.forecast_to_complete)}</span>;
        case "estimated_cost_at_completion": return <span className="font-semibold">{fmt(totals.estimatedCostAtCompletion)}</span>;
        case "projected_over_under": return (
          <span className={`font-semibold ${totals.projectedOverUnder < 0 ? "text-red-600" : ""}`}>
            {fmt(totals.projectedOverUnder)}
          </span>
        );
        case "budgeted_quantity": return <span className="font-semibold">{totals.budgeted_quantity.toLocaleString("en-US")}</span>;
        case "installed_quantity": return <span className="font-semibold">{totals.installed_quantity.toLocaleString("en-US")}</span>;
        case "actual_labor_hours": return <span className="font-semibold">{totals.actual_labor_hours.toLocaleString("en-US")}</span>;
        case "actual_labor_cost": return <span className="font-semibold">{fmt(totals.actual_labor_cost)}</span>;
        case "installed_per_hour": return (
          <span className="font-semibold">
            {totals.actual_labor_hours > 0 ? (totals.installed_quantity / totals.actual_labor_hours).toFixed(2) : "0.00"}
          </span>
        );
      }
    }
    const c = calc(item!);
    switch (key) {
      case "description":
        return (
          <div>
            <p className="text-xs font-medium text-gray-500">{item!.cost_code}</p>
            <p className="text-xs text-blue-600">
              {item!.is_partial ? "?" : ""} {item!.description} {item!.is_gst ? "(GST)" : ""}
            </p>
          </div>
        );
      case "cost_type": return item!.cost_type || "—";
      case "original_budget_amount": return <span className="text-blue-600">{fmt(item!.original_budget_amount)}</span>;
      case "budget_modifications": return fmt(item!.budget_modifications);
      case "approved_cos": return fmt(item!.approved_cos);
      case "revised_budget": return fmt(c.revisedBudget);
      case "pending_budget_changes": return fmt(item!.pending_budget_changes);
      case "projected_budget": return fmt(c.projectedBudget);
      case "committed_costs": return fmt(item!.committed_costs);
      case "direct_costs": return fmt(item!.direct_costs);
      case "erp_job_to_date_costs": return fmt(item!.erp_job_to_date_costs);
      case "erp_direct_costs": return fmt(c.erpDirectCosts);
      case "cost_rom": return fmt(item!.cost_rom);
      case "cost_rfq": return fmt(item!.cost_rfq);
      case "non_commitment_cost": return fmt(item!.non_commitment_cost);
      case "job_to_date_costs": return <span className="text-blue-600">{fmt(c.jobToDateCosts)}</span>;
      case "pending_cost_changes": return fmt(item!.pending_cost_changes);
      case "projected_costs": return fmt(c.projectedCosts);
      case "forecast_to_complete": return fmt(item!.forecast_to_complete);
      case "estimated_cost_at_completion": return fmt(c.estimatedCostAtCompletion);
      case "projected_over_under":
        return (
          <span className={c.projectedOverUnder < 0 ? "text-red-600" : ""}>
            {fmt(c.projectedOverUnder)}
          </span>
        );
      case "budgeted_quantity":
        return `${item!.budgeted_quantity.toLocaleString("en-US")} ${item!.budgeted_uom || ""}`.trim();
      case "installed_quantity":
        return item!.installed_quantity.toLocaleString("en-US");
      case "actual_labor_hours":
        return item!.actual_labor_hours.toLocaleString("en-US");
      case "actual_labor_cost":
        return fmt(item!.actual_labor_cost);
      case "installed_per_hour":
        return c.installedPerHour.toFixed(2);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={id!} />
      <main className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Budget</h1>
          {activeTab === "budget" ? (
            <div ref={createRef} className="relative">
              <button
                onClick={() => setShowCreateMenu((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20">
                  <button
                    onClick={() => { setNewItemPreset({}); setShowModal(true); setShowCreateMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Add Budget Line Item
                  </button>
                  <button
                    onClick={() => { setEditingItem(null); setNewItemPreset({ is_partial: true, original_budget_amount: "0" }); setShowModal(true); setShowCreateMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Add Partial Line Item
                  </button>
                  <button
                    onClick={() => { setEditingItem(null); setNewItemPreset({ is_gst: true, cost_type: "Other" }); setShowModal(true); setShowCreateMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Add GST Line Item
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
              Export
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 011.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        <div className="mb-4 border-b border-gray-200">
          <div className="flex items-end gap-6">
            <button
              onClick={() => setActiveTab("budget")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "budget" ? "text-gray-900 border-gray-900" : "text-gray-500 border-transparent hover:text-gray-700"}`}
            >
              Budget
            </button>
            <button
              onClick={() => setActiveTab("production_quantities")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "production_quantities" ? "text-gray-900 border-gray-900" : "text-gray-500 border-transparent hover:text-gray-700"}`}
            >
              Production Quantities
            </button>
            <button
              onClick={() => setActiveTab("budget_details")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "budget_details" ? "text-gray-900 border-gray-900" : "text-gray-500 border-transparent hover:text-gray-700"}`}
            >
              Budget Details
            </button>
            <button
              onClick={() => setActiveTab("forecasting")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "forecasting" ? "text-gray-900 border-gray-900" : "text-gray-500 border-transparent hover:text-gray-700"}`}
            >
              Forecasting
            </button>
            <button
              onClick={() => setActiveTab("project_status_snapshot")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "project_status_snapshot" ? "text-gray-900 border-gray-900" : "text-gray-500 border-transparent hover:text-gray-700"}`}
            >
              Project Status Snapshot
            </button>
            <button
              onClick={() => setActiveTab("change_history")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "change_history" ? "text-gray-900 border-gray-900" : "text-gray-500 border-transparent hover:text-gray-700"}`}
            >
              Change History
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : activeTab === "budget" ? (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {COLS.map((col) => (
                      <th key={col.key} className={`text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap ${col.width}`}>
                        {col.label}
                      </th>
                    ))}
                    <th className="px-3 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {COLS.map((col) => (
                      <td key={col.key} className="px-3 py-3 text-xs whitespace-nowrap">
                        {renderCell(null, col.key)}
                      </td>
                    ))}
                    <td />
                  </tr>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={COLS.length + 1} className="px-3 py-12 text-center">
                        <p className="text-sm text-gray-400">No budget line items yet</p>
                        <p className="text-xs text-gray-300 mt-1">Click Create → Add Budget Line Item to get started</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-b-0 group">
                        {COLS.map((col) => (
                          <td key={col.key} className="px-3 py-3 text-xs whitespace-nowrap">
                            {renderCell(item, col.key)}
                          </td>
                        ))}
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
                                  onClick={() => handleDelete(item.id)}
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
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "production_quantities" ? (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-700">
                Add budgeted production quantities and compare installed quantities with actual labor hours for real-time productivity tracking.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-3 py-3 font-semibold text-gray-700">Cost Code</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700">Cost Type</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700">Budgeted Qty</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700">UOM</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700">Installed Qty</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700">Actual Labor Hrs</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700">Units / Hour</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-gray-400">No production quantities yet.</td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const c = calc(item);
                      return (
                        <tr key={`prod-${item.id}`} className="border-b border-gray-50">
                          <td className="px-3 py-2">{item.cost_code || "—"}</td>
                          <td className="px-3 py-2">{item.cost_type || "—"}</td>
                          <td className="px-3 py-2">{item.budgeted_quantity.toLocaleString("en-US")}</td>
                          <td className="px-3 py-2">{item.budgeted_uom || "—"}</td>
                          <td className="px-3 py-2">{item.installed_quantity.toLocaleString("en-US")}</td>
                          <td className="px-3 py-2">{item.actual_labor_hours.toLocaleString("en-US")}</td>
                          <td className="px-3 py-2">{c.installedPerHour.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "budget_details" ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-blue-600">ℹ️</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Calculated Columns on Budget Detail are not supported</p>
                  <p className="text-sm text-gray-600">
                    Views applied on the Budget Detail tab will not include Calculated Columns, only Standard and Source columns will be displayed.
                  </p>
                </div>
              </div>
              <button className="text-sm font-medium text-gray-700 bg-gray-100 rounded-md px-3 py-2 hover:bg-gray-200">
                Do not show again
              </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="flex flex-wrap items-end gap-3 mb-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">View</p>
                  <button className="text-sm text-left px-3 py-2 bg-white border border-gray-200 rounded-md min-w-[230px]">Procore ERP Budget</button>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Group</p>
                  <button className="text-sm text-left px-3 py-2 bg-white border border-gray-200 rounded-md min-w-[230px] text-gray-400">Add Group</button>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Filter</p>
                  <button className="text-sm text-left px-3 py-2 bg-white border border-gray-200 rounded-md min-w-[100px]">Add filter</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {budgetDetailsColumns.map((col) => (
                        <th key={col.key} className={`text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap ${col.width}`}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={budgetDetailsColumns.length} className="px-3 py-12 text-center text-gray-400">
                          Add budget line items to view budget details.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => {
                        const c = calc(item);
                        return (
                          <tr key={`details-${item.id}`} className="border-b border-gray-100">
                            <td className="px-3 py-2 text-gray-700">
                              <p>{item.cost_code || "—"}</p>
                              <p className="text-gray-400">{item.description || ""}</p>
                            </td>
                            <td className="px-3 py-2">None</td>
                            <td className="px-3 py-2">—</td>
                            <td className="px-3 py-2">—</td>
                            <td className="px-3 py-2">Automatic Forecast</td>
                            <td className="px-3 py-2">{fmt(item.original_budget_amount)}</td>
                            <td className="px-3 py-2">{item.budget_modifications === 0 ? "—" : fmt(item.budget_modifications)}</td>
                            <td className="px-3 py-2">{item.approved_cos === 0 ? "—" : fmt(item.approved_cos)}</td>
                            <td className="px-3 py-2">{item.pending_budget_changes === 0 ? "—" : fmt(item.pending_budget_changes)}</td>
                            <td className="px-3 py-2">{item.committed_costs === 0 ? "—" : fmt(item.committed_costs)}</td>
                            <td className="px-3 py-2">{c.jobToDateCosts === 0 ? "—" : fmt(c.jobToDateCosts)}</td>
                            <td className="px-3 py-2">{item.pending_cost_changes === 0 ? "—" : fmt(item.pending_cost_changes)}</td>
                            <td className="px-3 py-2">{fmt(item.forecast_to_complete)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === "forecasting" ? (
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Forecasting</h2>
            <p className="text-sm text-gray-600 mb-4">
              Forecasting helps track projected cost performance for each budget line item.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Cost Code</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Description</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Revised Budget</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Forecast to Complete</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Est. Cost at Completion</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Projected Over/Under</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-gray-400">
                        Add budget line items to populate forecasting.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const c = calc(item);
                      return (
                        <tr key={`forecast-${item.id}`} className="border-b border-gray-50">
                          <td className="px-3 py-2">{item.cost_code || "—"}</td>
                          <td className="px-3 py-2">{item.description || "—"}</td>
                          <td className="px-3 py-2">{fmt(c.revisedBudget)}</td>
                          <td className="px-3 py-2">{fmt(item.forecast_to_complete)}</td>
                          <td className="px-3 py-2">{fmt(c.estimatedCostAtCompletion)}</td>
                          <td className={`px-3 py-2 ${c.projectedOverUnder < 0 ? "text-red-600" : "text-gray-700"}`}>
                            {fmt(c.projectedOverUnder)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "project_status_snapshot" ? (
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Project Status Snapshot</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">Revised Budget</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{fmt(totals.revisedBudget)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">Projected Cost</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{fmt(totals.projectedCosts)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">Projected Over/Under</p>
                <p className={`mt-2 text-2xl font-semibold ${totals.projectedOverUnder < 0 ? "text-red-600" : "text-gray-900"}`}>
                  {fmt(totals.projectedOverUnder)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Change History</h2>
            <p className="text-sm text-gray-600 mb-4">
              View a quick timeline of budget edits and key updates.
            </p>
            <div className="space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-gray-400">No changes yet. Add or update budget line items to generate history.</p>
              ) : (
                items.map((item) => (
                  <div key={`history-${item.id}`} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-800">{item.cost_code || "No Cost Code"} · {item.description || "No Description"}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last updated {new Date(item.created_at).toLocaleDateString("en-US")} · Forecast to Complete {fmt(item.forecast_to_complete)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <LineItemModal preset={newItemPreset} onConfirm={handleAdd} onCancel={() => setShowModal(false)} />
      )}
      {editingItem && (
        <LineItemModal initial={editingItem} onConfirm={handleEdit} onCancel={() => setEditingItem(null)} />
      )}
    </div>
  );
}
