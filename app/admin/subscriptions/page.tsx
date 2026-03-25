"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Company = {
  id: string;
  name: string;
  subscription_plan: string | null;
  subscription_status: string | null;
  seat_limit: number | null;
  user_count: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
};

const PLANS = ["free", "starter", "pro"];
const STATUSES = ["active", "trialing", "past_due", "canceled", "inactive"];

export default function AdminSubscriptionsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Company>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetch("/api/admin/companies")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setCompanies(d);
        else setError(d.error ?? "Failed to load");
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  function startEdit(company: Company) {
    setEditing(company.id);
    setEditValues({
      name: company.name,
      subscription_plan: company.subscription_plan ?? "free",
      subscription_status: company.subscription_status ?? "inactive",
      seat_limit: company.seat_limit ?? null,
    });
    setSaveError("");
  }

  async function saveEdit(companyId: string) {
    setSaving(true);
    setSaveError("");
    const res = await fetch(`/api/admin/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editValues),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setSaveError(data.error ?? "Failed to save");
      return;
    }
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, ...data } : c))
    );
    setEditing(null);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-6">Subscriptions</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <p className="px-4 py-8 text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="px-4 py-8 text-sm text-red-400">{error}</p>
        ) : companies.length === 0 ? (
          <p className="px-4 py-8 text-sm text-gray-500">No companies found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Company</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Plan</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Seats</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Stripe Sub ID</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => {
                  const isEditing = editing === c.id;
                  return (
                    <tr key={c.id} className="border-b border-gray-800/50">
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm w-40"
                            value={editValues.name ?? ""}
                            onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                          />
                        ) : (
                          <Link href={`/admin/companies/${c.id}`} className="text-white font-medium hover:text-indigo-300 transition-colors">
                            {c.name}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                            value={editValues.subscription_plan ?? "free"}
                            onChange={(e) =>
                              setEditValues((v) => ({ ...v, subscription_plan: e.target.value }))
                            }
                          >
                            {PLANS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-300">{c.subscription_plan ?? "free"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                            value={editValues.subscription_status ?? "inactive"}
                            onChange={(e) =>
                              setEditValues((v) => ({ ...v, subscription_status: e.target.value }))
                            }
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-300">{c.subscription_status ?? "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm w-20"
                            value={editValues.seat_limit ?? ""}
                            onChange={(e) =>
                              setEditValues((v) => ({
                                ...v,
                                seat_limit: e.target.value ? parseInt(e.target.value) : null,
                              }))
                            }
                          />
                        ) : (
                          <span className="text-gray-300">{c.seat_limit ?? "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {c.stripe_subscription_id
                          ? c.stripe_subscription_id.slice(0, 20) + "…"
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEdit(c.id)}
                              disabled={saving}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded disabled:opacity-50"
                            >
                              {saving ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                            >
                              Cancel
                            </button>
                            {saveError && (
                              <span className="text-xs text-red-400">{saveError}</span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(c)}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
