"use client";

import { useEffect, useState } from "react";
import ProjectNav from "@/components/ProjectNav";

export default function CommitmentSettingsClient({
  projectId,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const [alwaysEditable, setAlwaysEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("");

  useEffect(() => {
    fetch(`/api/projects/${projectId}/commitment-settings`)
      .then((r) => r.json())
      .then((data) => {
        setAlwaysEditable(!!data?.enable_always_editable_sov);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/commitment-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable_always_editable_sov: alwaysEditable }),
      });
      if (res.ok) setSavedAt(new Date().toLocaleTimeString());
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600">
          SiteCommand
        </a>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <a
            href={`/projects/${projectId}/commitments`}
            className="text-sm text-gray-400 hover:text-gray-700"
          >
            ← Commitments
          </a>
          <span className="text-gray-200">/</span>
          <h1 className="text-sm font-semibold text-gray-900">Advanced Settings</h1>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-1.5 text-sm font-medium text-white bg-orange-500 rounded hover:bg-orange-600 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8">
        <div className="py-6 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Schedule of Values</h2>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={alwaysEditable}
              onChange={(e) => setAlwaysEditable(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-gray-900"
            />
            <span className="text-sm text-gray-700">
              Enable Always Editable Schedule of Values
              <span className="block text-xs text-gray-500 mt-0.5">
                When turned on, users with edit permission can modify a commitment&apos;s SOV in any
                status. When off, SOVs can only be edited while the commitment is in Draft.
              </span>
            </span>
          </label>
          {savedAt && <p className="mt-3 text-[11px] text-green-600">Saved at {savedAt}</p>}
        </div>
      </div>
    </div>
  );
}
