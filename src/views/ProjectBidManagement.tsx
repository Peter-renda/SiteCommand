import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";
import { ChevronDown, Plus } from "lucide-react";

type BidPackage = {
  id: string;
  name: string;
  description: string | null;
  scope_of_work: string | null;
  due_date: string | null;
  status: "draft" | "open" | "leveling" | "awarded" | "cancelled";
  created_at: string;
  bid_count: number;
  low_bid: number | null;
};

type Bid = {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  status: "invited" | "viewed" | "submitted" | "declined" | "awarded";
  base_amount: number | null;
  notes: string | null;
  submitted_at: string | null;
  invited_at: string;
};

function fmtDate(d: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return `${(dt.getMonth() + 1).toString().padStart(2, "0")}/${dt
    .getDate()
    .toString()
    .padStart(2, "0")}/${dt.getFullYear().toString().slice(2)}`;
}

function fmt(val: number | null) {
  if (val == null) return "—";
  return val.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  open: "bg-blue-50 text-blue-700",
  leveling: "bg-yellow-50 text-yellow-700",
  awarded: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-500",
  invited: "bg-gray-100 text-gray-600",
  viewed: "bg-blue-50 text-blue-600",
  submitted: "bg-green-50 text-green-700",
  declined: "bg-red-50 text-red-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function ProjectBidManagement() {
  const { id } = useParams();
  const [packages, setPackages] = useState<BidPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<BidPackage | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${id}/bid-packages`)
      .then((r) => r.json())
      .then((data) => {
        setPackages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  function openPackage(pkg: BidPackage) {
    setSelectedPackage(pkg);
    setBidsLoading(true);
    fetch(`/api/projects/${id}/bid-packages/${pkg.id}/bids`)
      .then((r) => r.json())
      .then((data) => {
        setBids(Array.isArray(data) ? data : []);
        setBidsLoading(false);
      })
      .catch(() => setBidsLoading(false));
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ProjectNav projectId={id!} />

      {selectedPackage ? (
        // Bid detail view
        <>
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedPackage(null)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Bid Packages
              </button>
              <div className="w-px h-4 bg-gray-200" />
              <span className="text-sm font-semibold text-gray-900">{selectedPackage.name}</span>
              <StatusBadge status={selectedPackage.status} />
            </div>
            <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors">
              <Plus className="w-3 h-3" /> Add Bidder
            </button>
          </div>

          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
            <div className="flex gap-8 text-xs text-gray-500">
              {selectedPackage.due_date && (
                <span>
                  <span className="font-medium text-gray-700">Due:</span>{" "}
                  {fmtDate(selectedPackage.due_date)}
                </span>
              )}
              {selectedPackage.description && (
                <span className="max-w-lg truncate">{selectedPackage.description}</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {bidsLoading ? (
              <div className="text-center py-20 text-gray-400 text-sm">Loading bids...</div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-t border-gray-200 bg-white">
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">Company</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">Contact</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">Email</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">Status</th>
                    <th className="px-3 py-2.5 text-right font-medium text-gray-600">Base Amount</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600 whitespace-nowrap">Submitted</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-gray-400">
                        No bidders invited yet.
                      </td>
                    </tr>
                  ) : (
                    bids.map((bid) => (
                      <tr key={bid.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 font-medium text-gray-900">{bid.company_name}</td>
                        <td className="px-3 py-2 text-gray-700">{bid.contact_name ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-700">{bid.contact_email ?? "—"}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={bid.status} />
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                          {fmt(bid.base_amount)}
                        </td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                          {fmtDate(bid.submitted_at)}
                        </td>
                        <td className="px-3 py-2 text-gray-500 max-w-xs truncate">{bid.notes ?? ""}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {bids.length > 1 && (
                  <tfoot>
                    <tr className="border-t border-gray-200 bg-white">
                      <td colSpan={4} className="px-3 py-2 text-right text-xs font-semibold text-gray-700">
                        Low Bid:
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900 whitespace-nowrap">
                        {fmt(
                          Math.min(
                            ...bids
                              .filter((b) => b.base_amount != null)
                              .map((b) => b.base_amount as number)
                          ) || null
                        )}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </>
      ) : (
        // Package list view
        <>
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <h1 className="text-sm font-semibold text-gray-900">Bid Management</h1>
            </div>
            <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors">
              <Plus className="w-3 h-3" /> New Bid Package
            </button>
          </div>

          <div className="px-4 py-2 border-b border-gray-100 bg-white shrink-0">
            <div className="relative inline-block">
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Add Filter <ChevronDown className="w-3 h-3" />
              </button>
              {filterOpen && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 w-40 py-1">
                  {["Status", "Due Date"].map((f) => (
                    <button key={f} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="text-center py-20 text-gray-400 text-sm">Loading bid packages...</div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-t border-gray-200 bg-white">
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">Package Name</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">Status</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600 whitespace-nowrap">Due Date</th>
                    <th className="px-3 py-2.5 text-right font-medium text-gray-600">Bidders</th>
                    <th className="px-3 py-2.5 text-right font-medium text-gray-600">Low Bid</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">Description</th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600 whitespace-nowrap">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-gray-400">
                        No bid packages yet. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    packages.map((pkg) => (
                      <tr
                        key={pkg.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => openPackage(pkg)}
                      >
                        <td className="px-3 py-2 font-medium text-blue-600 hover:underline">{pkg.name}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={pkg.status} />
                        </td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{fmtDate(pkg.due_date)}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{pkg.bid_count ?? 0}</td>
                        <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                          {fmt(pkg.low_bid)}
                        </td>
                        <td className="px-3 py-2 text-gray-500 max-w-xs truncate">{pkg.description ?? ""}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{fmtDate(pkg.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
