"use client";

import { useState, useEffect, useRef } from "react";

const TOOL_SECTIONS = [
  {
    label: "Core Tools",
    items: [
      { name: "Home", slug: "" },
      { name: "Reporting", slug: "reporting" },
      { name: "Documents", slug: "documents" },
      { name: "Directory", slug: "directory" },
      { name: "Tasks", slug: "tasks" },
      { name: "Admin", slug: "admin" },
    ],
  },
  {
    label: "Project Tools",
    items: [
      { name: "RFIs", slug: "rfis" },
      { name: "Submittals", slug: "submittals" },
      { name: "Transmittals", slug: "transmittals" },
      { name: "Punch List", slug: "punch-list" },
      { name: "Meetings", slug: "meetings" },
      { name: "Schedule", slug: "schedule" },
      { name: "Daily Log", slug: "daily-log" },
      { name: "Photos", slug: "photos" },
      { name: "Drawings", slug: "drawings" },
      { name: "Specifications", slug: "specifications" },
    ],
  },
  {
    label: "Financial Management",
    items: [
      { name: "Prime Contracts", slug: "prime-contracts" },
      { name: "Budget", slug: "budget" },
      { name: "Commitments", slug: "commitments" },
      { name: "Change Orders", slug: "change-orders" },
      { name: "Change Events", slug: "change-events" },
    ],
  },
];

export default function ProjectNav({
  projectId,
  showBackToProject = true,
}: {
  projectId: string;
  showBackToProject?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"password" | "phone" | "favorites">("password");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  // Click outside for tools dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch favorites on mount
  useEffect(() => {
    fetch("/api/user/favorites")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.favorites)) setFavorites(d.favorites);
        setFavoritesLoaded(true);
      })
      .catch(() => setFavoritesLoaded(true));
  }, []);

  async function openSettings() {
    setSettingsError("");
    setSettingsSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    const r = await fetch("/api/user/profile");
    const d = await r.json();
    setPhone(d.phone ?? "");
    setShowSettings(true);
  }

  async function handleSavePassword() {
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      setSettingsError("Passwords do not match");
      return;
    }
    setSaving(true);
    setSettingsError("");
    setSettingsSuccess("");
    const r = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) setSettingsError(d.error || "Failed to update password");
    else {
      setSettingsSuccess("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function handleSavePhone() {
    setSaving(true);
    setSettingsError("");
    setSettingsSuccess("");
    const r = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) setSettingsError(d.error || "Failed to update phone");
    else setSettingsSuccess("Phone number updated");
  }

  async function handleSaveFavorites() {
    setSaving(true);
    setSettingsError("");
    setSettingsSuccess("");
    const r = await fetch("/api/user/favorites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorites }),
    });
    setSaving(false);
    if (!r.ok) setSettingsError("Failed to save favorites");
    else setSettingsSuccess("Favorites saved");
  }

  function toggleFavorite(slug: string) {
    setFavorites((prev) =>
      prev.includes(slug) ? prev.filter((f) => f !== slug) : [...prev, slug]
    );
  }

  const allToolItems = TOOL_SECTIONS.flatMap((s) => s.items).filter((i) => i.slug);
  const favoritedItems = favoritesLoaded
    ? allToolItems.filter((i) => favorites.includes(i.slug))
    : [];

  return (
    <>
      <nav className="bg-white border-b border-gray-100 w-full px-6 flex items-center gap-4">
        {/* All Projects */}
        <a
          href="/dashboard"
          className="flex items-center gap-1.5 py-2.5 text-sm text-gray-400 hover:text-gray-700 transition-colors shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All Projects
        </a>

        {showBackToProject && (
          <>
            <div className="w-px h-4 bg-gray-200" />
            <a
              href={`/projects/${projectId}`}
              className="flex items-center gap-1.5 py-2.5 text-sm text-gray-400 hover:text-gray-700 transition-colors shrink-0"
            >
              ← Back to Project
            </a>
          </>
        )}

        <div className="w-px h-4 bg-gray-200" />

        {/* Tools dropdown */}
        <div ref={toolsRef} className="relative inline-block">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Tools
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open && (
            <div className="absolute left-0 top-full mt-1 w-[580px] bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-5">
              <div className="grid grid-cols-3 gap-6">
                {TOOL_SECTIONS.map((section) => (
                  <div key={section.label}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      {section.label}
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <a
                          key={item.slug}
                          href={`/projects/${projectId}${item.slug ? `/${item.slug}` : ""}`}
                          onClick={() => setOpen(false)}
                          className="block px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Favorite links */}
        {favoritedItems.length > 0 && (
          <>
            <div className="w-px h-4 bg-gray-200" />
            {favoritedItems.map((item) => (
              <a
                key={item.slug}
                href={`/projects/${projectId}/${item.slug}`}
                className="py-2.5 text-sm text-gray-500 hover:text-gray-900 transition-colors shrink-0"
              >
                {item.name}
              </a>
            ))}
          </>
        )}

        {/* Gear / Settings icon */}
        <button
          onClick={openSettings}
          className="ml-auto p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-50"
          title="Settings"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Account Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6">
              {(["password", "phone", "favorites"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setSettingsTab(tab); setSettingsError(""); setSettingsSuccess(""); }}
                  className={`py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
                    settingsTab === tab
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {tab === "password" ? "Password" : tab === "phone" ? "Phone" : "Favorites"}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="px-6 py-5 overflow-y-auto">
              {settingsError && (
                <p className="text-xs text-red-500 mb-3">{settingsError}</p>
              )}
              {settingsSuccess && (
                <p className="text-xs text-green-600 mb-3">{settingsSuccess}</p>
              )}

              {settingsTab === "password" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button
                    onClick={handleSavePassword}
                    disabled={saving}
                    className="w-full py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 mt-1"
                  >
                    {saving ? "Saving..." : "Update Password"}
                  </button>
                </div>
              )}

              {settingsTab === "phone" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="(555) 000-0000"
                    />
                  </div>
                  <button
                    onClick={handleSavePhone}
                    disabled={saving}
                    className="w-full py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 mt-1"
                  >
                    {saving ? "Saving..." : "Save Phone Number"}
                  </button>
                </div>
              )}

              {settingsTab === "favorites" && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400">Select pages to pin in your project navigation bar.</p>
                  {TOOL_SECTIONS.map((section) => (
                    <div key={section.label}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                        {section.label}
                      </p>
                      <div className="space-y-1">
                        {section.items
                          .filter((item) => item.slug)
                          .map((item) => (
                            <label
                              key={item.slug}
                              className="flex items-center gap-2.5 cursor-pointer py-1"
                            >
                              <input
                                type="checkbox"
                                checked={favorites.includes(item.slug)}
                                onChange={() => toggleFavorite(item.slug)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                              />
                              <span className="text-sm text-gray-700">{item.name}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleSaveFavorites}
                    disabled={saving}
                    className="w-full py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 mt-2"
                  >
                    {saving ? "Saving..." : "Save Favorites"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
