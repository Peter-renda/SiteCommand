"use client";

import { useRef, useState, useEffect } from "react";

type Project = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  status: string;
  value: number;
  companyId: string;
  companyName: string;
  role: string;
  allowedSections: string[] | null;
};

type Company = {
  id: string;
  name: string;
};

// Human-readable labels for section slugs
const SECTION_LABELS: Record<string, string> = {
  rfis: "RFIs",
  submittals: "Submittals",
  documents: "Documents",
  drawings: "Drawings",
  photos: "Photos",
  schedule: "Schedule",
  tasks: "Tasks",
  punchlist: "Punch List",
  daily_log: "Daily Log",
  directory: "Directory",
};

const ALL_SECTIONS = Object.keys(SECTION_LABELS);

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    "course of construction": "bg-green-50 text-green-700",
    "bidding": "bg-blue-50 text-blue-700",
    "pre-construction": "bg-yellow-50 text-yellow-700",
    "warranty": "bg-purple-50 text-purple-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${classes[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

function SectionAccess({ sections }: { sections: string[] | null }) {
  const available = sections ?? ALL_SECTIONS;
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {ALL_SECTIONS.map((slug) => {
        const hasAccess = available.includes(slug);
        return (
          <span
            key={slug}
            className={`text-xs px-2 py-0.5 rounded-full border ${
              hasAccess
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-gray-50 text-gray-300 border-gray-100 line-through"
            }`}
          >
            {SECTION_LABELS[slug]}
          </span>
        );
      })}
    </div>
  );
}

export default function SubcontractorClient({
  username,
  email,
  projects,
}: {
  username: string;
  email: string;
  projects: Project[];
}) {
  // Derive unique companies from the projects list
  const companies: Company[] = [];
  const seen = new Set<string>();
  for (const p of projects) {
    if (p.companyId && !seen.has(p.companyId)) {
      seen.add(p.companyId);
      companies.push({ id: p.companyId, name: p.companyName });
    }
  }

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    companies[0]?.id ?? ""
  );
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const companyMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (companyMenuRef.current && !companyMenuRef.current.contains(e.target as Node)) {
        setCompanyMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visibleProjects = selectedCompanyId
    ? projects.filter((p) => p.companyId === selectedCompanyId)
    : projects;

  const currentCompany = companies.find((c) => c.id === selectedCompanyId);

  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"password" | "phone">("password");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  async function openSettings() {
    setSettingsError(""); setSettingsSuccess("");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    const res = await fetch("/api/user/profile");
    if (res.ok) {
      const data = await res.json();
      setPhone(data.phone ?? "");
    }
    setShowSettings(true);
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setSettingsError("New passwords do not match"); return; }
    if (newPassword.length < 6) { setSettingsError("Password must be at least 6 characters"); return; }
    setSaving(true); setSettingsError(""); setSettingsSuccess("");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setSettingsError(data.error); return; }
    setSettingsSuccess("Password updated successfully");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
  }

  async function handleSavePhone(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSettingsError(""); setSettingsSuccess("");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setSettingsError(data.error); return; }
    setSettingsSuccess("Phone number updated successfully");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-semibold text-gray-900">SiteCommand</span>

          {/* Company switcher — shown when invited by 2+ companies */}
          {companies.length > 1 && (
            <div ref={companyMenuRef} className="relative">
              <button
                onClick={() => setCompanyMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 text-xs font-medium text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
              >
                <span className="max-w-[140px] truncate">
                  {currentCompany?.name ?? "Select company"}
                </span>
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {companyMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCompanyId(c.id); setCompanyMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${c.id === selectedCompanyId ? "text-gray-900 font-medium" : "text-gray-600"}`}
                    >
                      <span className="truncate">{c.name}</span>
                      {c.id === selectedCompanyId && (
                        <svg className="w-3.5 h-3.5 text-gray-900 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Single-company: just show the badge */}
          {companies.length <= 1 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              Invitee Portal
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <span className="hidden sm:block text-sm text-gray-400 truncate max-w-[140px]">{username}</span>
          <button
            onClick={openSettings}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title="Account Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Welcome banner */}
        <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl px-6 py-5">
          <p className="text-sm font-semibold text-blue-900 mb-0.5">Welcome, {username}</p>
          <p className="text-xs text-blue-600">
            {companies.length > 1
              ? `You are viewing projects from ${currentCompany?.name ?? ""}. Use the company switcher in the top left to switch between organizations.`
              : `You have been invited to collaborate on the project${visibleProjects.length !== 1 ? "s" : ""} below.`}{" "}
            You can view and interact with the sections marked in dark.
          </p>
        </div>

        {visibleProjects.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-16 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">No projects yet</p>
            <p className="text-xs text-gray-400">
              You haven&apos;t been invited to any projects yet. Contact the project team for an invitation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleProjects.map((project) => (
              <div key={project.id} className="bg-white border border-gray-100 rounded-xl px-6 py-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900">{project.name}</h3>
                      <StatusBadge status={project.status} />
                    </div>
                    {project.companyName && (
                      <p className="text-xs text-gray-400 mt-0.5">Invited by {project.companyName}</p>
                    )}
                    {project.address && (
                      <p className="text-xs text-gray-400 mt-0.5">{project.address}</p>
                    )}
                  </div>
                  <a
                    href={`/projects/${project.id}`}
                    className="shrink-0 px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Open project
                  </a>
                </div>

                {project.description && (
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">{project.description}</p>
                )}

                {/* Section access pills */}
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1.5">Your access</p>
                  <SectionAccess sections={project.allowedSections} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info footer */}
        <p className="text-xs text-gray-400 text-center mt-10">
          You are using the Invitee Portal. You do not have access to company settings or billing.
          <br />
          Contact {email} for account support.
        </p>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-sm font-semibold text-gray-900">Account Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs text-gray-500"><span className="font-medium text-gray-700">Username:</span> {username}</p>
              <p className="text-xs text-gray-500 mt-0.5"><span className="font-medium text-gray-700">Email:</span> {email}</p>
            </div>

            <div className="flex border-b border-gray-100 px-6">
              <button
                onClick={() => { setSettingsTab("password"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`py-3 text-xs font-medium mr-5 border-b-2 transition-colors ${settingsTab === "password" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}
              >
                Change Password
              </button>
              <button
                onClick={() => { setSettingsTab("phone"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`py-3 text-xs font-medium border-b-2 transition-colors ${settingsTab === "phone" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}
              >
                Phone Number
              </button>
            </div>

            <div className="px-6 py-5">
              {settingsTab === "password" && (
                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
                    <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Enter current password" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                    <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="At least 6 characters" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Repeat new password" />
                  </div>
                  {settingsError && <p className="text-xs text-red-600">{settingsError}</p>}
                  {settingsSuccess && <p className="text-xs text-green-600">{settingsSuccess}</p>}
                  <button type="submit" disabled={saving} className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50">
                    {saving ? "Saving..." : "Update Password"}
                  </button>
                </form>
              )}
              {settingsTab === "phone" && (
                <form onSubmit={handleSavePhone} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="e.g. (555) 123-4567" />
                  </div>
                  {settingsError && <p className="text-xs text-red-600">{settingsError}</p>}
                  {settingsSuccess && <p className="text-xs text-green-600">{settingsSuccess}</p>}
                  <button type="submit" disabled={saving} className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50">
                    {saving ? "Saving..." : "Save Phone Number"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
