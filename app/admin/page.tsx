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
  created_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

function planBadge(plan: string | null) {
  const p = plan ?? "free";
  const colors: Record<string, string> = {
    pro: "bg-indigo-500/20 text-indigo-300",
    starter: "bg-blue-500/20 text-blue-300",
    free: "bg-gray-700 text-gray-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[p] ?? colors.free}`}>
      {p}
    </span>
  );
}

function statusBadge(status: string | null) {
  const s = status ?? "—";
  const colors: Record<string, string> = {
    active: "bg-green-500/20 text-green-300",
    trialing: "bg-yellow-500/20 text-yellow-300",
    past_due: "bg-orange-500/20 text-orange-300",
    canceled: "bg-red-500/20 text-red-300",
    inactive: "bg-gray-700 text-gray-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[s] ?? "bg-gray-700 text-gray-400"}`}>
      {s}
    </span>
  );
}

export default function AdminOverviewPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const totalUsers = companies.reduce((sum, c) => sum + c.user_count, 0);
  const activeCount = companies.filter((c) => c.subscription_status === "active").length;
  const proCount = companies.filter((c) => c.subscription_plan === "pro").length;

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-6">Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Companies", value: companies.length },
          { label: "Total Users", value: totalUsers },
          { label: "Active Subscriptions", value: activeCount },
          { label: "Pro Plans", value: proCount },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Companies table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="text-sm font-medium text-gray-300">All Companies</h2>
        </div>
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
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Users</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Seats</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                        <Link href={`/admin/companies/${c.id}`} className="text-white font-medium hover:text-indigo-300 transition-colors">
                          {c.name}
                        </Link>
                      </td>
                    <td className="px-4 py-3">{planBadge(c.subscription_plan)}</td>
                    <td className="px-4 py-3">{statusBadge(c.subscription_status)}</td>
                    <td className="px-4 py-3 text-gray-300">{c.user_count}</td>
                    <td className="px-4 py-3 text-gray-300">{c.seat_limit ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
