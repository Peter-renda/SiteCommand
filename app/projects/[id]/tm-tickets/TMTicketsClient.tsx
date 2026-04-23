"use client";

import { useState } from "react";
import ProjectNav from "@/components/ProjectNav";

type TabKey = "all_tickets" | "recycle_bin";

function EmptyTicketIcon() {
  return (
    <svg width="118" height="118" viewBox="0 0 118 118" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="31" y="18" width="54" height="69" rx="4" fill="white" stroke="#1F2937" strokeWidth="2" />
      <rect x="35" y="21" width="54" height="69" rx="4" fill="#F5F5F5" stroke="#111827" strokeWidth="2" />
      <line x1="43" y1="33" x2="77" y2="33" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
      <line x1="43" y1="43" x2="74" y2="43" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round" />
      <line x1="43" y1="51" x2="72" y2="51" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round" />
      <line x1="43" y1="59" x2="70" y2="59" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round" />
      <line x1="43" y1="67" x2="68" y2="67" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round" />
      <circle cx="43" cy="43" r="4.5" stroke="#F97316" strokeWidth="2" />
      <rect x="38.5" y="54.5" width="9" height="9" stroke="#F97316" strokeWidth="2" />
      <path d="M39.5 71.5L42.5 64.5H45L48.5 72M41 68.5H46.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M53 78.5C53.8333 77.5 55.4 75.5 57 75.5C59 75.5 59.5 78.5 61.5 78.5C63.1 78.5 64.1667 77.1667 64.5 76.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
      <rect x="44" y="16" width="2" height="8" rx="1" fill="#111827" />
      <rect x="58" y="16" width="2" height="8" rx="1" fill="#111827" />
      <rect x="72" y="16" width="2" height="8" rx="1" fill="#111827" />
    </svg>
  );
}

export default function TMTicketsClient({ projectId, username }: { projectId: string; username: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>("all_tickets");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="px-6 py-5">
        <div className="bg-white border border-gray-200 min-h-[560px]">
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h1 className="text-3xl leading-none font-semibold text-gray-900 tracking-tight">T&amp;M Tickets</h1>
              </div>

              <div className="flex items-end gap-4 pt-4">
                <button
                  onClick={() => setActiveTab("all_tickets")}
                  className={`text-sm leading-none pb-1 border-b-4 transition-colors ${
                    activeTab === "all_tickets"
                      ? "border-orange-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  All Tickets
                </button>
                <button
                  onClick={() => setActiveTab("recycle_bin")}
                  className={`text-sm leading-none pb-1 border-b-4 transition-colors ${
                    activeTab === "recycle_bin"
                      ? "border-orange-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Recycle Bin
                </button>
              </div>
            </div>

            <a href={`/projects/${projectId}/tm-tickets/new`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-sm transition-colors">
              <span className="text-base leading-none">+</span>
              <span>Create</span>
            </a>
          </div>

          <div className="flex items-center justify-center min-h-[520px]">
            <div className="text-center">
              <div className="mb-8 flex justify-center">
                <EmptyTicketIcon />
              </div>
              <p className="text-4xl leading-tight font-semibold text-gray-900">
                {activeTab === "all_tickets"
                  ? "No T&M Tickets have been created yet"
                  : "Recycle Bin is empty"}
              </p>
              {activeTab === "all_tickets" && (
                <div className="mt-6 rounded border border-orange-100 bg-orange-50 px-4 py-3 text-left text-sm text-gray-700 max-w-xl">
                  <p className="font-semibold text-gray-900">Bulk Actions workflow</p>
                  <p className="mt-1">
                    Select one or more T&amp;M tickets and use <span className="font-medium">Bulk Actions</span> &gt;{" "}
                    <span className="font-medium">Create Change Event</span> to generate a new change event from the selected tickets.
                  </p>
                  <p className="mt-1">
                    You can also use <span className="font-medium">Bulk Actions</span> &gt; <span className="font-medium">Add to an Existing Change Event</span> to append ticket details to an in-flight change event.
                  </p>
                  <p className="mt-1">
                    Include ticket links and attachments in the change event description so reviewers can trace supporting backup.
                  </p>
                  <a
                    href={`/projects/${projectId}/change-events/workflows`}
                    className="mt-3 inline-flex items-center rounded border border-orange-200 bg-white px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100"
                  >
                    Open workflow guides
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
