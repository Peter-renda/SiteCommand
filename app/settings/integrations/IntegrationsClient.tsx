"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, CheckCircle } from "lucide-react";

type Settings = {
  APS_CLIENT_ID: string | null;
  APS_CLIENT_SECRET: string | null;
  APS_BUCKET_KEY: string | null;
};

function MaskedInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2.5 text-gray-400 hover:text-gray-700"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function IntegrationsClient() {
  const [settings, setSettings] = useState<Settings>({
    APS_CLIENT_ID: null,
    APS_CLIENT_SECRET: null,
    APS_BUCKET_KEY: null,
  });
  const [form, setForm] = useState({ APS_CLIENT_ID: "", APS_CLIENT_SECRET: "", APS_BUCKET_KEY: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/platform-settings")
      .then((r) => r.json())
      .then((data: Settings) => {
        setSettings(data);
        setForm({
          APS_CLIENT_ID: data.APS_CLIENT_ID ?? "",
          APS_CLIENT_SECRET: data.APS_CLIENT_SECRET ?? "",
          APS_BUCKET_KEY: data.APS_BUCKET_KEY ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const payload: Record<string, string> = {};
    if (form.APS_CLIENT_ID.trim()) payload.APS_CLIENT_ID = form.APS_CLIENT_ID.trim();
    if (form.APS_CLIENT_SECRET.trim()) payload.APS_CLIENT_SECRET = form.APS_CLIENT_SECRET.trim();
    if (form.APS_BUCKET_KEY.trim()) payload.APS_BUCKET_KEY = form.APS_BUCKET_KEY.trim();

    const res = await fetch("/api/admin/platform-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save settings");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSettings((prev) => ({
      ...prev,
      APS_CLIENT_ID: payload.APS_CLIENT_ID ?? prev.APS_CLIENT_ID,
      APS_CLIENT_SECRET: payload.APS_CLIENT_SECRET ?? prev.APS_CLIENT_SECRET,
      APS_BUCKET_KEY: payload.APS_BUCKET_KEY ?? prev.APS_BUCKET_KEY,
    }));
  }

  const isConfigured = !!(settings.APS_CLIENT_ID && settings.APS_CLIENT_SECRET);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors">
            SiteCommand
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">Integrations</span>
        </div>
        <a href="/dashboard" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
          Back to Dashboard
        </a>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900">Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure third-party service credentials used across the platform.
          </p>
        </div>

        {loading ? (
          <div className="text-xs text-gray-400 py-8 text-center">Loading...</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* APS Section */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Autodesk Platform Services (APS)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Required for BIM file uploads and 3D model viewing (.rvt, .dwg, .ifc, and more).
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-4 ${
                  isConfigured
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {isConfigured ? "Configured" : "Not configured"}
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="aps-client-id" className="block text-xs font-medium text-gray-700 mb-1">
                  Client ID
                </label>
                <MaskedInput
                  id="aps-client-id"
                  value={form.APS_CLIENT_ID}
                  onChange={(v) => setForm((f) => ({ ...f, APS_CLIENT_ID: v }))}
                  placeholder={settings.APS_CLIENT_ID ? "••••••••••••••••" : "Enter APS Client ID"}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Found in your Autodesk Developer Portal app settings.
                </p>
              </div>

              <div>
                <label htmlFor="aps-client-secret" className="block text-xs font-medium text-gray-700 mb-1">
                  Client Secret
                </label>
                <MaskedInput
                  id="aps-client-secret"
                  value={form.APS_CLIENT_SECRET}
                  onChange={(v) => setForm((f) => ({ ...f, APS_CLIENT_SECRET: v }))}
                  placeholder={settings.APS_CLIENT_SECRET ? "••••••••••••••••" : "Enter APS Client Secret"}
                />
              </div>

              <div>
                <label htmlFor="aps-bucket-key" className="block text-xs font-medium text-gray-700 mb-1">
                  Bucket Key <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="aps-bucket-key"
                  type="text"
                  value={form.APS_BUCKET_KEY}
                  onChange={(e) => setForm((f) => ({ ...f, APS_BUCKET_KEY: e.target.value }))}
                  placeholder={
                    settings.APS_BUCKET_KEY
                      ? settings.APS_BUCKET_KEY
                      : "sitecommand-bim-{auto-generated from Client ID}"
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Leave blank to auto-generate from Client ID.
                </p>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {saved ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {saving ? "Saving..." : "Save credentials"}
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Credentials are stored in the platform settings database and override any{" "}
                <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                  APS_CLIENT_ID
                </code>{" "}
                /{" "}
                <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                  APS_CLIENT_SECRET
                </code>{" "}
                environment variables set on the server.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
