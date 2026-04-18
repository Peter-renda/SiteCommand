"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Company = {
  id: string;
  name: string;
  subscription_plan: string | null;
  subscription_status: string | null;
  seat_limit: number | null;
  enabled_features: string[];
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  billing_owner_id: string | null;
};

type Member = {
  id: string;
  role: string;
  created_at: string;
  users: {
    id: string;
    email: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    user_type: string;
  } | null;
};

const ALL_FEATURES: { key: string; label: string; group: string }[] = [
  // Project Management
  { key: "rfis", label: "RFIs", group: "Project Management" },
  { key: "submittals", label: "Submittals", group: "Project Management" },
  { key: "transmittals", label: "Transmittals", group: "Project Management" },
  { key: "punch-list", label: "Punch List", group: "Project Management" },
  { key: "meetings", label: "Meetings", group: "Project Management" },
  { key: "schedule", label: "Schedule", group: "Project Management" },
  { key: "daily-log", label: "Daily Log", group: "Project Management" },
  { key: "tasks", label: "Tasks", group: "Project Management" },
  { key: "quick-notes", label: "Quick Notes", group: "Project Management" },
  // Documents & Media
  { key: "documents", label: "Documents", group: "Documents & Media" },
  { key: "drawings", label: "Drawings", group: "Documents & Media" },
  { key: "photos", label: "Photos", group: "Documents & Media" },
  { key: "specifications", label: "Specifications", group: "Documents & Media" },
  { key: "bim", label: "BIM", group: "Documents & Media" },
  // Financial
  { key: "budget", label: "Budget", group: "Financial" },
  { key: "commitments", label: "Commitments", group: "Financial" },
  { key: "prime-contracts", label: "Prime Contracts", group: "Financial" },
  { key: "change-orders", label: "Change Orders", group: "Financial" },
  { key: "change-events", label: "Change Events", group: "Financial" },
  { key: "scope-of-work", label: "Scope of Work", group: "Financial" },
  // Workforce Management
  { key: "tm-tickets", label: "T&M Tickets", group: "Workforce Management" },
  { key: "timesheets", label: "Timesheets", group: "Workforce Management" },
  // Preconstruction
  { key: "preconstruction", label: "Preconstruction", group: "Preconstruction" },
  { key: "bid-management", label: "Bid Management", group: "Preconstruction" },
  { key: "estimating", label: "Estimating", group: "Preconstruction" },
  { key: "prequalification", label: "Prequalification", group: "Preconstruction" },
  // Other
  { key: "reporting", label: "Reporting", group: "Other" },
  { key: "directory", label: "Directory", group: "Other" },
];

const GROUPS = Array.from(new Set(ALL_FEATURES.map((f) => f.group)));

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-indigo-500/20 text-indigo-300",
  admin: "bg-blue-500/20 text-blue-300",
  member: "bg-gray-700 text-gray-400",
};

export default function AdminCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch(`/api/admin/companies/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.company) {
          setCompany(d.company);
          setMembers(d.members ?? []);
        } else {
          setError(d.error ?? "Failed to load");
        }
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  function toggleFeature(key: string) {
    if (!company) return;
    const has = company.enabled_features.includes(key);
    setCompany({
      ...company,
      enabled_features: has
        ? company.enabled_features.filter((f) => f !== key)
        : [...company.enabled_features, key],
    });
    setSaveMsg("");
  }

  async function saveFeatures() {
    if (!company) return;
    setSaving(true);
    setSaveMsg("");
    const res = await fetch(`/api/admin/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled_features: company.enabled_features }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setSaveMsg(data.error ?? "Failed to save");
    } else {
      setCompany(data);
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(""), 2000);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }
  if (error || !company) {
    return <p className="text-sm text-red-400">{error || "Company not found"}</p>;
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/subscriptions"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mb-6"
      >
        ← Back to Subscriptions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">{company.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {company.subscription_plan ?? "free"} &middot; {company.subscription_status ?? "—"} &middot; {members.length} / {company.seat_limit ?? "∞"} seats
          </p>
        </div>
        <button
          onClick={() => router.push(`/admin/subscriptions`)}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          Edit subscription →
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Feature Toggles ─────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">Tool Access</h2>
            <div className="flex items-center gap-3">
              {saveMsg && (
                <span className={`text-xs ${saveMsg === "Saved" ? "text-green-400" : "text-red-400"}`}>
                  {saveMsg}
                </span>
              )}
              <button
                onClick={saveFeatures}
                disabled={saving}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>

          <div className="px-4 py-4 space-y-5">
            {GROUPS.map((group) => (
              <div key={group}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {group}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {ALL_FEATURES.filter((f) => f.group === group).map((feature) => {
                    const enabled = company.enabled_features.includes(feature.key);
                    return (
                      <label
                        key={feature.key}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                          enabled
                            ? "bg-indigo-500/10 border border-indigo-500/30"
                            : "bg-gray-800/50 border border-gray-700/50 opacity-60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => toggleFeature(feature.key)}
                          className="accent-indigo-500 w-3.5 h-3.5 shrink-0"
                        />
                        <span className="text-xs text-gray-200">{feature.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Seat Holders ────────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden self-start">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">
              Seat Holders
              <span className="ml-2 text-xs text-gray-500">
                {members.length}{company.seat_limit ? ` / ${company.seat_limit}` : ""} used
              </span>
            </h2>
          </div>

          {members.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">No members found.</p>
          ) : (
            <ul className="divide-y divide-gray-800">
              {members.map((m) => {
                const u = m.users;
                const displayName = u
                  ? (u.first_name || u.last_name
                    ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                    : u.username)
                  : "Unknown";
                return (
                  <li key={m.id} className="px-4 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{u?.email ?? "—"}</p>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                        ROLE_COLORS[m.role] ?? "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {m.role.replace("_", " ")}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
