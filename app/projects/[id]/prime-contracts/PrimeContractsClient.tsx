"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";
import { Settings, Plus, ChevronDown, ChevronRight, Search, SlidersHorizontal, Columns3 } from "lucide-react";

type PrimeContract = {
  id: string;
  contract_number: number;
  title: string;
  owner_client: string;
  contractor: string;
  status: string;
  erp_status: string | null;
  executed: boolean;
  original_contract_amount: number;
  approved_change_orders: number;
  pending_change_orders: number;
  draft_change_orders: number;
  invoiced: number;
  payments_received: number;
  is_private: boolean;
  attachments_count?: number;
};

function fmt(val: number | null | undefined) {
  if (val == null) return "$0.00";
  return val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Approved: "border-green-500 text-green-600",
    Draft: "border-gray-400 text-gray-600",
    Executed: "border-blue-500 text-blue-600",
    Pending: "border-yellow-500 text-yellow-600",
    Void: "border-red-400 text-red-600",
  };
  const cls = map[status] ?? "border-gray-400 text-gray-600";
  return (
    <span className={`px-2 py-0.5 rounded border text-[11px] font-medium bg-white ${cls}`}>
      {status}
    </span>
  );
}

const COLUMNS = [
  { key: "number",                   label: "Number",                          right: false },
  { key: "owner_client",             label: "Owner/Client",                    right: false },
  { key: "title",                    label: "Title",                           right: false },
  { key: "erp_status",               label: "ERP Status",                      right: false },
  { key: "status",                   label: "Status",                          right: false },
  { key: "executed",                 label: "Executed",                        right: false },
  { key: "original_contract_amount", label: "Original\nContract\nAmount",      right: true  },
  { key: "approved_change_orders",   label: "Approved\nChange Orders",         right: true  },
  { key: "revised_contract_amount",  label: "Revised\nContract\nAmount",       right: true  },
  { key: "pending_change_orders",    label: "Pending Change\nOrders",          right: true  },
  { key: "draft_change_orders",      label: "Draft Change\nOrders",            right: true  },
  { key: "invoiced",                 label: "Invoiced",                        right: true  },
  { key: "payments_received",        label: "Payments\nReceived",              right: true  },
  { key: "pct_paid",                 label: "%\nPaid",                         right: true  },
  { key: "remaining_balance",        label: "Remaining\nBalance\nOutstanding", right: true  },
  { key: "private",                  label: "Private",                         right: false },
  { key: "attachments",              label: "Attach-\nments",                  right: true  },
];

export default function PrimeContractsClient({
  projectId,
  role,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const router = useRouter();
  const [contracts, setContracts] = useState<PrimeContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${projectId}/prime-contracts`)
      .then((r) => r.json())
      .then((data) => {
        setContracts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      String(c.contract_number ?? "").toLowerCase().includes(q) ||
      (c.title ?? "").toLowerCase().includes(q) ||
      (c.owner_client ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ProjectNav projectId={projectId} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          <h1 className="text-sm font-semibold text-gray-900">Prime Contracts</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors">
            Export <ChevronDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => router.push(`/projects/${projectId}/prime-contracts/new`)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded font-medium transition-colors"
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
                <th className="w-6 px-2 py-2" />
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`px-2 py-2 font-medium text-gray-500 whitespace-pre-line leading-tight ${col.right ? "text-right" : "text-left"}`}
                  >
                    {col.label}
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
                filtered.map((contract) => {
                  const original = contract.original_contract_amount ?? 0;
                  const approved = contract.approved_change_orders ?? 0;
                  const revised = original + approved;
                  const pending = contract.pending_change_orders ?? 0;
                  const draft = contract.draft_change_orders ?? 0;
                  const invoiced = contract.invoiced ?? 0;
                  const payments = contract.payments_received ?? 0;
                  const pctPaid = revised > 0 ? ((payments / revised) * 100).toFixed(2) : "0.00";
                  const remaining = revised - payments;

                  return (
                    <tr
                      key={contract.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/projects/${projectId}/prime-contracts/${contract.id}`)}
                    >
                      <td className="px-2 py-1.5 text-gray-400">
                        <ChevronRight className="w-3 h-3" />
                      </td>
                      <td className="px-2 py-1.5 text-blue-600 hover:underline">
                        {contract.contract_number}
                      </td>
                      <td className="px-2 py-1.5 text-blue-600 hover:underline max-w-[9rem] truncate">
                        {contract.owner_client}
                      </td>
                      <td className="px-2 py-1.5 text-gray-700 max-w-[10rem] truncate">
                        {contract.title}
                      </td>
                      <td className="px-2 py-1.5 text-gray-500">
                        {contract.erp_status ?? <span className="text-gray-400">— Not Ready</span>}
                      </td>
                      <td className="px-2 py-1.5">
                        <StatusBadge status={contract.status} />
                      </td>
                      <td className="px-2 py-1.5 text-gray-700">{contract.executed ? "Yes" : "No"}</td>
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(original)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(approved)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(revised)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(pending)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(draft)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(invoiced)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(payments)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-700">{pctPaid}%</td>
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(remaining)}</td>
                      <td className="px-2 py-1.5 text-gray-700">{contract.is_private ? "Yes" : "No"}</td>
                      <td className="px-2 py-1.5 text-right text-gray-700">{contract.attachments_count ?? 0}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
