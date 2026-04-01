"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";
import { ChevronRight, Pencil } from "lucide-react";

type LineItem = {
  id: string;
  budget_code: string | null;
  description: string | null;
  vendor: string | null;
  contract_number: string | null;
  unit_of_measure: string | null;
  rev_unit_qty: number | null;
  rev_unit_cost: number | null;
  rev_rom: number | null;
  cost_unit_qty: number | null;
  cost_unit_cost: number | null;
  cost_rom: number | null;
};

type ChangeEvent = {
  id: string;
  number: number;
  title: string;
  status: string;
  origin: string | null;
  type: string | null;
  change_reason: string | null;
  scope: string | null;
  expecting_revenue: boolean;
  revenue_source: string | null;
  prime_contract: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  line_items: LineItem[];
};

function fmt(val: number | null | undefined) {
  if (val === null || val === undefined) return "—";
  return val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function fmtQty(val: number | null | undefined) {
  if (val === null || val === undefined) return "—";
  return val.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || "—"}</span>
    </div>
  );
}

export default function ChangeEventDetailClient({
  projectId,
  eventId,
}: {
  projectId: string;
  eventId: string;
}) {
  const router = useRouter();
  const [event, setEvent] = useState<ChangeEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/change-events/${eventId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setEvent(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load change event.");
        setLoading(false);
      });
  }, [projectId, eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ProjectNav projectId={projectId} />
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ProjectNav projectId={projectId} />
        <div className="flex-1 flex items-center justify-center text-sm text-red-500">
          {error ?? "Change event not found."}
        </div>
      </div>
    );
  }

  const totalRevRom = event.line_items.reduce((s, li) => s + (li.rev_rom ?? 0), 0);
  const totalCostRom = event.line_items.reduce((s, li) => s + (li.cost_rom ?? 0), 0);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ProjectNav projectId={projectId} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <button
            onClick={() => router.push(`/projects/${projectId}/change-events`)}
            className="hover:text-blue-600 transition-colors"
          >
            Change Events
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 font-medium">
            Change Event #{String(event.number).padStart(3, "0")}: {event.title}
          </span>
        </div>
        <button
          onClick={() => router.push(`/projects/${projectId}/change-events/${eventId}/edit`)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors text-gray-700"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Status badge + summary */}
        <div className="flex items-center gap-3">
          <span
            className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
              event.status === "Open"
                ? "bg-green-100 text-green-700"
                : event.status === "Void"
                ? "bg-red-100 text-red-600"
                : event.status === "Closed"
                ? "bg-gray-100 text-gray-600"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {event.status}
          </span>
          <span className="text-xs text-gray-400">
            Created {new Date(event.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 border border-gray-200 rounded p-4">
          <Field label="Title" value={event.title} />
          <Field label="Origin" value={event.origin} />
          <Field label="Type" value={event.type} />
          <Field label="Change Reason" value={event.change_reason} />
          <Field label="Scope" value={event.scope} />
          <Field
            label="Expecting Revenue"
            value={event.expecting_revenue ? "Yes" : "No"}
          />
          <Field label="Revenue Source" value={event.revenue_source} />
          <Field label="Prime Contract" value={event.prime_contract} />
        </div>

        {/* Description */}
        {event.description && (
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* ROM summary */}
        <div className="flex gap-4">
          <div className="border border-gray-200 rounded p-4 flex flex-col gap-1 min-w-[160px]">
            <span className="text-xs text-gray-500">Total Revenue ROM</span>
            <span className="text-lg font-semibold text-gray-900">{fmt(totalRevRom)}</span>
          </div>
          <div className="border border-gray-200 rounded p-4 flex flex-col gap-1 min-w-[160px]">
            <span className="text-xs text-gray-500">Total Cost ROM</span>
            <span className="text-lg font-semibold text-gray-900">{fmt(totalCostRom)}</span>
          </div>
        </div>

        {/* Line items table */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Line Items</h2>
          {event.line_items.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No line items.</p>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th colSpan={5} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-r border-gray-200">
                      Detail
                    </th>
                    <th colSpan={3} className="px-3 py-2 text-left text-xs font-semibold text-blue-600 border-r border-gray-200">
                      Revenue
                    </th>
                    <th colSpan={3} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      Cost
                    </th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                    <th className="px-3 py-2 text-left whitespace-nowrap">Budget Code</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">Description</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">Vendor</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">Contract</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap border-r border-gray-200">Unit of Measure</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Unit Qty</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Unit Cost</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap border-r border-gray-200">ROM</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Unit Qty</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Unit Cost</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">ROM</th>
                  </tr>
                </thead>
                <tbody>
                  {event.line_items.map((li) => (
                    <tr key={li.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-gray-700">{li.budget_code ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{li.description ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{li.vendor ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{li.contract_number ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600 border-r border-gray-200">{li.unit_of_measure ?? "—"}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{fmtQty(li.rev_unit_qty)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{fmt(li.rev_unit_cost)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900 border-r border-gray-200">{fmt(li.rev_rom)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{fmtQty(li.cost_unit_qty)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{fmt(li.cost_unit_cost)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{fmt(li.cost_rom)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-white font-semibold">
                    <td colSpan={5} className="px-3 py-2 text-right text-xs text-gray-600 border-r border-gray-200">
                      Totals
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-900">
                      {fmtQty(event.line_items.reduce((s, li) => s + (li.rev_unit_qty ?? 0), 0))}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-900">
                      {fmt(event.line_items.reduce((s, li) => s + (li.rev_unit_cost ?? 0), 0))}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-900 border-r border-gray-200">
                      {fmt(totalRevRom)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-900">
                      {fmtQty(event.line_items.reduce((s, li) => s + (li.cost_unit_qty ?? 0), 0))}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-900">
                      {fmt(event.line_items.reduce((s, li) => s + (li.cost_unit_cost ?? 0), 0))}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-900">
                      {fmt(totalCostRom)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
