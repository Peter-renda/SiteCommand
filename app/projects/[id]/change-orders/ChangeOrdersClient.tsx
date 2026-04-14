"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";
import { Settings, ChevronDown, FileText, Lock, XCircle } from "lucide-react";

type ChangeOrder = {
  id: string;
  contract_name: string;
  number: string;
  revision: number;
  title: string;
  date_initiated: string | null;
  contract_company: string | null;
  designated_reviewer: string | null;
  due_date: string | null;
  review_date: string | null;
  status: string;
  amount: number;
  has_attachments: boolean;
  is_locked: boolean;
  type?: "prime" | "commitment";
};

type DirectoryContact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

function fmt(val: number) {
  return val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function fmtDate(d: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return `${(dt.getMonth() + 1).toString().padStart(2, "0")}/${dt.getDate().toString().padStart(2, "0")}/${dt.getFullYear().toString().slice(2)}`;
}

type Tab = "prime" | "commitment";

export default function ChangeOrdersClient({
  projectId,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("prime");
  const [orders, setOrders] = useState<ChangeOrder[]>([]);
  const [directoryContacts, setDirectoryContacts] = useState<DirectoryContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/change-orders?type=${activeTab}`)
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId, activeTab]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/directory`)
      .then((r) => r.json())
      .then((data) => setDirectoryContacts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [projectId]);

  function getContactNameByEmail(email: string | null) {
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) return "";
    const contact = directoryContacts.find((c) => String(c.email || "").trim().toLowerCase() === normalized);
    if (!contact) return email || "";
    const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();
    return fullName || contact.email || "";
  }

  const total = orders.reduce((s, o) => s + (o.amount ?? 0), 0);
  const pendingReviewStatuses = new Set([
    "Pending - In Review",
    "Pending - Revised",
    "Pending - Pricing",
    "Pending - Not Pricing",
    "Pending - Proceeding",
    "Pending - Not Proceeding",
  ]);

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/projects/${projectId}/change-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          review_date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (res.ok) {
        setOrders((curr) => curr.map((o) => (o.id === orderId ? { ...o, status, review_date: new Date().toISOString().slice(0, 10) } : o)));
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteOrder(order: ChangeOrder) {
    if (String(order.status || "").trim().toLowerCase() === "approved") {
      window.alert("Approved change orders cannot be deleted.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this change order?");
    if (!confirmed) return;

    const res = await fetch(`/api/projects/${projectId}/change-orders/${order.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      window.alert(payload.error || "Failed to delete change order.");
      return;
    }

    setOrders((curr) => curr.filter((o) => o.id !== order.id));
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ProjectNav projectId={projectId} />

      {/* Page header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-orange-500" />
            <h1 className="text-sm font-semibold text-gray-900">Change Orders</h1>
          </div>
          {/* Tabs */}
          <div className="flex items-center ml-2">
            <button
              onClick={() => setActiveTab("prime")}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "prime"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Prime Contract
            </button>
            <button
              onClick={() => setActiveTab("commitment")}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "commitment"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Commitments
            </button>
          </div>
        </div>

        {/* Top-right buttons */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors">
            Export <ChevronDown className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors">
            Reports <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-4 py-2 border-b border-gray-100 bg-white shrink-0">
        <div className="relative inline-block">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Add Filter <ChevronDown className="w-3 h-3" />
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 w-48 py-1">
              {["Contract", "Status", "Designated Reviewer", "Date Initiated"].map((f) => (
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

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading change orders...</div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-t border-gray-200 bg-white">
                <th className="px-3 py-2.5 w-16" />
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Contract</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">#</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Revision</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Title</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 whitespace-nowrap">
                  Date<br />Initiated
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 whitespace-nowrap">
                  Contract<br />Company
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 whitespace-nowrap">
                  Designated<br />Reviewer
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 whitespace-nowrap">
                  Due<br />Date
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 whitespace-nowrap">
                  Review<br />Date
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Status</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Amount</th>
                <th className="px-3 py-2.5 w-20" />
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-20 text-gray-400">
                    No change orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2">
                      <button
                        onClick={() => router.push(`/projects/${projectId}/change-orders/${order.id}`)}
                        className="px-2.5 py-0.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        View
                      </button>
                    </td>
                    <td className="px-3 py-2 text-blue-600 hover:underline cursor-pointer whitespace-nowrap">
                      {order.contract_name}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{order.number}</td>
                    <td className="px-3 py-2 text-gray-700">{order.revision}</td>
                    <td className="px-3 py-2 text-blue-600 hover:underline cursor-pointer max-w-xs">
                      <button
                        onClick={() => router.push(`/projects/${projectId}/change-orders/${order.id}`)}
                        className="text-left"
                      >
                        {order.title}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{fmtDate(order.date_initiated)}</td>
                    <td className="px-3 py-2 text-gray-700">{order.contract_company ?? ""}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {order.designated_reviewer
                        ? getContactNameByEmail(order.designated_reviewer)
                        : <span className="text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{fmtDate(order.due_date)}</td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{fmtDate(order.review_date)}</td>
                    <td className="px-3 py-2 text-gray-700">{order.status}</td>
                    <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">{fmt(order.amount)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {activeTab === "commitment" &&
                          pendingReviewStatuses.has(order.status) &&
                          !!order.designated_reviewer &&
                          order.designated_reviewer.trim().toLowerCase() === username.trim().toLowerCase() && (
                            <>
                              <button
                                disabled={updatingId === order.id}
                                onClick={() => updateStatus(order.id, "Approved")}
                                className="px-2 py-0.5 border border-green-200 text-green-700 rounded hover:bg-green-50 disabled:opacity-50"
                                title="Approve"
                              >
                                Approve
                              </button>
                              <button
                                disabled={updatingId === order.id}
                                onClick={() => updateStatus(order.id, "Rejected")}
                                className="px-2 py-0.5 border border-red-200 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
                                title="Reject"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        <button className="text-gray-400 hover:text-gray-600 transition-colors" title="Documents">
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        {order.is_locked && (
                          <button className="text-gray-400 hover:text-gray-600 transition-colors" title="Locked">
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteOrder(order)}
                          disabled={String(order.status || "").trim().toLowerCase() === "approved"}
                          className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={String(order.status || "").trim().toLowerCase() === "approved" ? "Approved change orders cannot be deleted" : "Delete"}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {orders.length > 0 && (
              <tfoot>
                <tr className="border-t border-gray-200 bg-white">
                  <td colSpan={11} className="px-3 py-2 text-right text-xs font-semibold text-gray-700">
                    Total:
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900 whitespace-nowrap">
                    {fmt(total)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
}
