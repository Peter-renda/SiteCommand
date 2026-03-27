"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, CheckCircle } from "lucide-react";

type Settings = {
  APS_CLIENT_ID: string | null;
  APS_CLIENT_SECRET: string | null;
  APS_BUCKET_KEY: string | null;
  SAGE_SENDER_ID: string | null;
  SAGE_SENDER_PASSWORD: string | null;
  SAGE_COMPANY_ID: string | null;
  SAGE_USER_ID: string | null;
  SAGE_USER_PASSWORD: string | null;
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

function SaveButton({ saving, saved }: { saving: boolean; saved: boolean }) {
  return (
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
  );
}

export default function IntegrationsClient() {
  const [settings, setSettings] = useState<Settings>({
    APS_CLIENT_ID: null,
    APS_CLIENT_SECRET: null,
    APS_BUCKET_KEY: null,
    SAGE_SENDER_ID: null,
    SAGE_SENDER_PASSWORD: null,
    SAGE_COMPANY_ID: null,
    SAGE_USER_ID: null,
    SAGE_USER_PASSWORD: null,
  });
  const [loading, setLoading] = useState(true);

  // APS form state
  const [apsForm, setApsForm] = useState({ APS_CLIENT_ID: "", APS_CLIENT_SECRET: "", APS_BUCKET_KEY: "" });
  const [apsSaving, setApsSaving] = useState(false);
  const [apsSaved, setApsSaved] = useState(false);
  const [apsError, setApsError] = useState("");

  // Sage form state
  const [sageForm, setSageForm] = useState({
    SAGE_SENDER_ID: "",
    SAGE_SENDER_PASSWORD: "",
    SAGE_COMPANY_ID: "",
    SAGE_USER_ID: "",
    SAGE_USER_PASSWORD: "",
  });
  const [sageSaving, setSageSaving] = useState(false);
  const [sageSaved, setSageSaved] = useState(false);
  const [sageError, setSageError] = useState("");

  useEffect(() => {
    fetch("/api/admin/platform-settings")
      .then((r) => r.json())
      .then((data: Settings) => {
        setSettings(data);
        setApsForm({
          APS_CLIENT_ID: data.APS_CLIENT_ID ?? "",
          APS_CLIENT_SECRET: data.APS_CLIENT_SECRET ?? "",
          APS_BUCKET_KEY: data.APS_BUCKET_KEY ?? "",
        });
        setSageForm({
          SAGE_SENDER_ID: data.SAGE_SENDER_ID ?? "",
          SAGE_SENDER_PASSWORD: data.SAGE_SENDER_PASSWORD ?? "",
          SAGE_COMPANY_ID: data.SAGE_COMPANY_ID ?? "",
          SAGE_USER_ID: data.SAGE_USER_ID ?? "",
          SAGE_USER_PASSWORD: data.SAGE_USER_PASSWORD ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleApsSave(e: React.FormEvent) {
    e.preventDefault();
    setApsSaving(true);
    setApsError("");
    setApsSaved(false);

    const payload: Record<string, string> = {};
    if (apsForm.APS_CLIENT_ID.trim()) payload.APS_CLIENT_ID = apsForm.APS_CLIENT_ID.trim();
    if (apsForm.APS_CLIENT_SECRET.trim()) payload.APS_CLIENT_SECRET = apsForm.APS_CLIENT_SECRET.trim();
    if (apsForm.APS_BUCKET_KEY.trim()) payload.APS_BUCKET_KEY = apsForm.APS_BUCKET_KEY.trim();

    const res = await fetch("/api/admin/platform-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setApsSaving(false);

    if (!res.ok) { setApsError(data.error ?? "Failed to save settings"); return; }

    setApsSaved(true);
    setTimeout(() => setApsSaved(false), 3000);
    setSettings((prev) => ({
      ...prev,
      APS_CLIENT_ID: payload.APS_CLIENT_ID ?? prev.APS_CLIENT_ID,
      APS_CLIENT_SECRET: payload.APS_CLIENT_SECRET ?? prev.APS_CLIENT_SECRET,
      APS_BUCKET_KEY: payload.APS_BUCKET_KEY ?? prev.APS_BUCKET_KEY,
    }));
  }

  async function handleSageSave(e: React.FormEvent) {
    e.preventDefault();
    setSageSaving(true);
    setSageError("");
    setSageSaved(false);

    const payload: Record<string, string> = {};
    if (sageForm.SAGE_SENDER_ID.trim()) payload.SAGE_SENDER_ID = sageForm.SAGE_SENDER_ID.trim();
    if (sageForm.SAGE_SENDER_PASSWORD.trim()) payload.SAGE_SENDER_PASSWORD = sageForm.SAGE_SENDER_PASSWORD.trim();
    if (sageForm.SAGE_COMPANY_ID.trim()) payload.SAGE_COMPANY_ID = sageForm.SAGE_COMPANY_ID.trim();
    if (sageForm.SAGE_USER_ID.trim()) payload.SAGE_USER_ID = sageForm.SAGE_USER_ID.trim();
    if (sageForm.SAGE_USER_PASSWORD.trim()) payload.SAGE_USER_PASSWORD = sageForm.SAGE_USER_PASSWORD.trim();

    const res = await fetch("/api/admin/platform-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSageSaving(false);

    if (!res.ok) { setSageError(data.error ?? "Failed to save settings"); return; }

    setSageSaved(true);
    setTimeout(() => setSageSaved(false), 3000);
    setSettings((prev) => ({
      ...prev,
      SAGE_SENDER_ID: payload.SAGE_SENDER_ID ?? prev.SAGE_SENDER_ID,
      SAGE_SENDER_PASSWORD: payload.SAGE_SENDER_PASSWORD ?? prev.SAGE_SENDER_PASSWORD,
      SAGE_COMPANY_ID: payload.SAGE_COMPANY_ID ?? prev.SAGE_COMPANY_ID,
      SAGE_USER_ID: payload.SAGE_USER_ID ?? prev.SAGE_USER_ID,
      SAGE_USER_PASSWORD: payload.SAGE_USER_PASSWORD ?? prev.SAGE_USER_PASSWORD,
    }));
  }

  const apsConfigured = !!(settings.APS_CLIENT_ID && settings.APS_CLIENT_SECRET);
  const sageConfigured = !!(
    settings.SAGE_SENDER_ID &&
    settings.SAGE_SENDER_PASSWORD &&
    settings.SAGE_COMPANY_ID &&
    settings.SAGE_USER_ID &&
    settings.SAGE_USER_PASSWORD
  );

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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="mb-2">
          <h1 className="text-lg font-semibold text-gray-900">Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure third-party service credentials used across the platform.
          </p>
        </div>

        {loading ? (
          <div className="text-xs text-gray-400 py-8 text-center">Loading...</div>
        ) : (
          <>
            {/* ── APS ──────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
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
                    apsConfigured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {apsConfigured ? "Configured" : "Not configured"}
                </span>
              </div>

              <form onSubmit={handleApsSave} className="space-y-4">
                <div>
                  <label htmlFor="aps-client-id" className="block text-xs font-medium text-gray-700 mb-1">
                    Client ID
                  </label>
                  <MaskedInput
                    id="aps-client-id"
                    value={apsForm.APS_CLIENT_ID}
                    onChange={(v) => setApsForm((f) => ({ ...f, APS_CLIENT_ID: v }))}
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
                    value={apsForm.APS_CLIENT_SECRET}
                    onChange={(v) => setApsForm((f) => ({ ...f, APS_CLIENT_SECRET: v }))}
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
                    value={apsForm.APS_BUCKET_KEY}
                    onChange={(e) => setApsForm((f) => ({ ...f, APS_BUCKET_KEY: e.target.value }))}
                    placeholder={
                      settings.APS_BUCKET_KEY
                        ? settings.APS_BUCKET_KEY
                        : "sitecommand-bim-{auto-generated from Client ID}"
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate from Client ID.</p>
                </div>

                {apsError && <p className="text-xs text-red-600">{apsError}</p>}

                <div className="pt-1">
                  <SaveButton saving={apsSaving} saved={apsSaved} />
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Credentials are stored in the platform settings database and override any{" "}
                  <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">APS_CLIENT_ID</code>
                  {" / "}
                  <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">APS_CLIENT_SECRET</code>{" "}
                  environment variables set on the server.
                </p>
              </div>
            </div>

            {/* ── Sage Intacct ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Sage Intacct</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sync prime contracts, subcontracts, and purchase orders to Sage Intacct in real time.
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-4 ${
                    sageConfigured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {sageConfigured ? "Configured" : "Not configured"}
                </span>
              </div>

              <form onSubmit={handleSageSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sage-sender-id" className="block text-xs font-medium text-gray-700 mb-1">
                      Sender ID
                    </label>
                    <MaskedInput
                      id="sage-sender-id"
                      value={sageForm.SAGE_SENDER_ID}
                      onChange={(v) => setSageForm((f) => ({ ...f, SAGE_SENDER_ID: v }))}
                      placeholder={settings.SAGE_SENDER_ID ? "••••••••••••••••" : "Sage-issued Sender ID"}
                    />
                  </div>
                  <div>
                    <label htmlFor="sage-sender-password" className="block text-xs font-medium text-gray-700 mb-1">
                      Sender Password
                    </label>
                    <MaskedInput
                      id="sage-sender-password"
                      value={sageForm.SAGE_SENDER_PASSWORD}
                      onChange={(v) => setSageForm((f) => ({ ...f, SAGE_SENDER_PASSWORD: v }))}
                      placeholder={settings.SAGE_SENDER_PASSWORD ? "••••••••••••••••" : "Sage-issued Sender Password"}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="sage-company-id" className="block text-xs font-medium text-gray-700 mb-1">
                    Company ID
                  </label>
                  <input
                    id="sage-company-id"
                    type="text"
                    value={sageForm.SAGE_COMPANY_ID}
                    onChange={(e) => setSageForm((f) => ({ ...f, SAGE_COMPANY_ID: e.target.value }))}
                    placeholder={settings.SAGE_COMPANY_ID ? settings.SAGE_COMPANY_ID : "Your Intacct company ID"}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Found under Company &rarr; Company Info in Sage Intacct.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sage-user-id" className="block text-xs font-medium text-gray-700 mb-1">
                      API User ID
                    </label>
                    <input
                      id="sage-user-id"
                      type="text"
                      value={sageForm.SAGE_USER_ID}
                      onChange={(e) => setSageForm((f) => ({ ...f, SAGE_USER_ID: e.target.value }))}
                      placeholder={settings.SAGE_USER_ID ? settings.SAGE_USER_ID : "API web services user"}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="sage-user-password" className="block text-xs font-medium text-gray-700 mb-1">
                      API User Password
                    </label>
                    <MaskedInput
                      id="sage-user-password"
                      value={sageForm.SAGE_USER_PASSWORD}
                      onChange={(v) => setSageForm((f) => ({ ...f, SAGE_USER_PASSWORD: v }))}
                      placeholder={settings.SAGE_USER_PASSWORD ? "••••••••••••••••" : "API user password"}
                    />
                  </div>
                </div>

                {sageError && <p className="text-xs text-red-600">{sageError}</p>}

                <div className="pt-1">
                  <SaveButton saving={sageSaving} saved={sageSaved} />
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Create a dedicated Web Services API user in Sage Intacct with the minimum permissions required
                  (AP &amp; AR modules). The Sender ID and Password are issued by Sage — they are separate from
                  your company login credentials.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
