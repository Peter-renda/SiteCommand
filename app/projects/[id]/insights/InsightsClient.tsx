"use client";

import { useState, useEffect } from "react";
import ProjectNav from "@/components/ProjectNav";

type StatCard = {
  label: string;
  total: number;
  breakdown: { label: string; count: number; color: string }[];
  href: string;
};

function countByStatus<T>(items: T[], field: keyof T, statuses: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of statuses) counts[s] = 0;
  for (const item of items) {
    const val = String(item[field] ?? "");
    if (val in counts) counts[val]++;
    else counts[val] = (counts[val] ?? 0) + 1;
  }
  return counts;
}

export default function InsightsClient({
  projectId,
  role,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<StatCard[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [tasks, rfis, submittals, punchList, photos, documents] = await Promise.all([
          fetch(`/api/projects/${projectId}/tasks`).then((r) => r.json()),
          fetch(`/api/projects/${projectId}/rfis`).then((r) => r.json()),
          fetch(`/api/projects/${projectId}/submittals`).then((r) => r.json()),
          fetch(`/api/projects/${projectId}/punch-list`).then((r) => r.json()),
          fetch(`/api/projects/${projectId}/photos`).then((r) => r.json()),
          fetch(`/api/projects/${projectId}/documents`).then((r) => r.json()),
        ]);

        const taskItems = Array.isArray(tasks) ? tasks : [];
        const taskCounts = countByStatus(taskItems, "status", ["open", "in progress", "completed", "closed"]);

        const rfiItems = Array.isArray(rfis) ? rfis : [];
        const rfiCounts = countByStatus(rfiItems, "status", ["open", "draft", "closed"]);

        const submittalItems = Array.isArray(submittals) ? submittals : [];
        const submittalCounts = countByStatus(submittalItems, "status", [
          "draft", "pending_review", "approved", "rejected", "revise_and_resubmit", "closed",
        ]);

        const punchItems = Array.isArray(punchList) ? punchList : [];
        const punchCounts = countByStatus(punchItems, "status", ["open", "in_progress", "closed"]);

        const photoCount = Array.isArray(photos) ? photos.length : (photos?.photos?.length ?? 0);
        const docItems = Array.isArray(documents) ? documents : [];

        setCards([
          {
            label: "Tasks",
            total: taskItems.length,
            href: `/projects/${projectId}/tasks`,
            breakdown: [
              { label: "Open", count: taskCounts["open"] ?? 0, color: "bg-blue-500" },
              { label: "In Progress", count: taskCounts["in progress"] ?? 0, color: "bg-amber-500" },
              { label: "Completed", count: taskCounts["completed"] ?? 0, color: "bg-green-500" },
              { label: "Closed", count: taskCounts["closed"] ?? 0, color: "bg-gray-400" },
            ],
          },
          {
            label: "RFIs",
            total: rfiItems.length,
            href: `/projects/${projectId}/rfis`,
            breakdown: [
              { label: "Open", count: rfiCounts["open"] ?? 0, color: "bg-blue-500" },
              { label: "Draft", count: rfiCounts["draft"] ?? 0, color: "bg-gray-400" },
              { label: "Closed", count: rfiCounts["closed"] ?? 0, color: "bg-green-500" },
            ],
          },
          {
            label: "Submittals",
            total: submittalItems.length,
            href: `/projects/${projectId}/submittals`,
            breakdown: [
              { label: "Draft", count: submittalCounts["draft"] ?? 0, color: "bg-gray-400" },
              { label: "Pending Review", count: submittalCounts["pending_review"] ?? 0, color: "bg-amber-500" },
              { label: "Approved", count: submittalCounts["approved"] ?? 0, color: "bg-green-500" },
              { label: "Rejected", count: submittalCounts["rejected"] ?? 0, color: "bg-red-500" },
              { label: "Revise & Resubmit", count: submittalCounts["revise_and_resubmit"] ?? 0, color: "bg-orange-500" },
              { label: "Closed", count: submittalCounts["closed"] ?? 0, color: "bg-gray-300" },
            ],
          },
          {
            label: "Punch List",
            total: punchItems.length,
            href: `/projects/${projectId}/punch-list`,
            breakdown: [
              { label: "Open", count: punchCounts["open"] ?? 0, color: "bg-blue-500" },
              { label: "In Progress", count: punchCounts["in_progress"] ?? 0, color: "bg-amber-500" },
              { label: "Closed", count: punchCounts["closed"] ?? 0, color: "bg-green-500" },
            ],
          },
          {
            label: "Photos",
            total: photoCount,
            href: `/projects/${projectId}/photos`,
            breakdown: [
              { label: "Total", count: photoCount, color: "bg-indigo-500" },
            ],
          },
          {
            label: "Documents",
            total: docItems.length,
            href: `/projects/${projectId}/documents`,
            breakdown: [
              { label: "Total", count: docItems.length, color: "bg-purple-500" },
            ],
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          SiteCommand
        </a>
        <div className="flex items-center gap-5">
          {role === "admin" && (
            <a href="/admin" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Admin
            </a>
          )}
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      {/* Body */}
      <div className="flex-1 px-6 py-8 max-w-5xl w-full mx-auto">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Insights</h1>
        <p className="text-sm text-gray-400 mb-8">Overview of project activity across all tools.</p>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <svg className="w-6 h-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <a
                key={card.label}
                href={card.href}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow block"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">{card.label}</span>
                  <span className="text-2xl font-semibold text-gray-900">{card.total}</span>
                </div>

                {/* Progress bar */}
                {card.total > 0 && card.breakdown.length > 1 && (
                  <div className="flex h-1.5 rounded-full overflow-hidden mb-3 gap-px">
                    {card.breakdown
                      .filter((b) => b.count > 0)
                      .map((b) => (
                        <div
                          key={b.label}
                          className={`${b.color} transition-all`}
                          style={{ width: `${(b.count / card.total) * 100}%` }}
                          title={`${b.label}: ${b.count}`}
                        />
                      ))}
                  </div>
                )}

                {/* Breakdown */}
                <div className="space-y-1.5 mt-3">
                  {card.breakdown
                    .filter((b) => b.count > 0 || card.breakdown.length <= 2)
                    .map((b) => (
                      <div key={b.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${b.color} shrink-0`} />
                          <span className="text-xs text-gray-500">{b.label}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-700">{b.count}</span>
                      </div>
                    ))}
                </div>

                {card.total === 0 && (
                  <p className="text-xs text-gray-300 mt-2">No items yet</p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
