"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, CheckCircle, ExternalLink } from "lucide-react";

// ── Shared components ─────────────────────────────────────────────────────────

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

// ── Sage Intacct section (company super_admin) ────────────────────────────────

type SageSettings = {
  SAGE_SENDER_ID: string | null;
  SAGE_SENDER_PASSWORD: string | null;
  SAGE_COMPANY_ID: string | null;
  SAGE_USER_ID: string | null;
  SAGE_USER_PASSWORD: string | null;
};

function SageSection() {
  const [settings, setSettings] = useState<SageSettings>({
    SAGE_SENDER_ID: null,
    SAGE_SENDER_PASSWORD: null,
    SAGE_COMPANY_ID: null,
    SAGE_USER_ID: null,
    SAGE_USER_PASSWORD: null,
  });
  const [form, setForm] = useState({
    SAGE_SENDER_ID: "",
    SAGE_SENDER_PASSWORD: "",
    SAGE_COMPANY_ID: "",
    SAGE_USER_ID: "",
    SAGE_USER_PASSWORD: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings/company-integrations")
      .then((r) => r.json())
      .then((data: SageSettings) => {
        setSettings(data);
        setForm({
          SAGE_SENDER_ID: data.SAGE_SENDER_ID ?? "",
          SAGE_SENDER_PASSWORD: data.SAGE_SENDER_PASSWORD ?? "",
          SAGE_COMPANY_ID: data.SAGE_COMPANY_ID ?? "",
          SAGE_USER_ID: data.SAGE_USER_ID ?? "",
          SAGE_USER_PASSWORD: data.SAGE_USER_PASSWORD ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);

    const payload: Record<string, string> = {};
    if (form.SAGE_SENDER_ID.trim()) payload.SAGE_SENDER_ID = form.SAGE_SENDER_ID.trim();
    if (form.SAGE_SENDER_PASSWORD.trim()) payload.SAGE_SENDER_PASSWORD = form.SAGE_SENDER_PASSWORD.trim();
    if (form.SAGE_COMPANY_ID.trim()) payload.SAGE_COMPANY_ID = form.SAGE_COMPANY_ID.trim();
    if (form.SAGE_USER_ID.trim()) payload.SAGE_USER_ID = form.SAGE_USER_ID.trim();
    if (form.SAGE_USER_PASSWORD.trim()) payload.SAGE_USER_PASSWORD = form.SAGE_USER_PASSWORD.trim();

    const res = await fetch("/api/settings/company-integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Failed to save settings"); return; }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSettings((prev) => ({ ...prev, ...payload }));
  }

  const configured = !!(
    settings.SAGE_SENDER_ID &&
    settings.SAGE_SENDER_PASSWORD &&
    settings.SAGE_COMPANY_ID &&
    settings.SAGE_USER_ID &&
    settings.SAGE_USER_PASSWORD
  );

  if (loading) return <div className="text-xs text-gray-400 py-8 text-center">Loading...</div>;

  return (
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
            configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {configured ? "Configured" : "Not configured"}
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="sage-sender-id" className="block text-xs font-medium text-gray-700 mb-1">
              Sender ID
            </label>
            <MaskedInput
              id="sage-sender-id"
              value={form.SAGE_SENDER_ID}
              onChange={(v) => setForm((f) => ({ ...f, SAGE_SENDER_ID: v }))}
              placeholder={settings.SAGE_SENDER_ID ? "••••••••••••••••" : "Sage-issued Sender ID"}
            />
          </div>
          <div>
            <label htmlFor="sage-sender-password" className="block text-xs font-medium text-gray-700 mb-1">
              Sender Password
            </label>
            <MaskedInput
              id="sage-sender-password"
              value={form.SAGE_SENDER_PASSWORD}
              onChange={(v) => setForm((f) => ({ ...f, SAGE_SENDER_PASSWORD: v }))}
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
            value={form.SAGE_COMPANY_ID}
            onChange={(e) => setForm((f) => ({ ...f, SAGE_COMPANY_ID: e.target.value }))}
            placeholder={settings.SAGE_COMPANY_ID ?? "Your Intacct company ID"}
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
              value={form.SAGE_USER_ID}
              onChange={(e) => setForm((f) => ({ ...f, SAGE_USER_ID: e.target.value }))}
              placeholder={settings.SAGE_USER_ID ?? "API web services user"}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label htmlFor="sage-user-password" className="block text-xs font-medium text-gray-700 mb-1">
              API User Password
            </label>
            <MaskedInput
              id="sage-user-password"
              value={form.SAGE_USER_PASSWORD}
              onChange={(v) => setForm((f) => ({ ...f, SAGE_USER_PASSWORD: v }))}
              placeholder={settings.SAGE_USER_PASSWORD ? "••••••••••••••••" : "API user password"}
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="pt-1">
          <SaveButton saving={saving} saved={saved} />
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Create a dedicated Web Services API user in Sage Intacct with minimum permissions (AP &amp; AR
          modules). The Sender ID and Password are issued by Sage — separate from your company login.
        </p>
      </div>
    </div>
  );
}

// ── QuickBooks Online section (company super_admin) ───────────────────────────

const QBO_ERROR_MESSAGES: Record<string, string> = {
  qbo_not_configured:
    "QuickBooks Online is not set up for this platform yet. A Site Command administrator needs to add the app credentials in their Integrations settings before you can connect.",
  qbo_unauthorized: "You must be logged in to connect QuickBooks.",
  qbo_forbidden:    "Only company admins can connect QuickBooks.",
  qbo_no_company:   "Your account is not associated with a company.",
  qbo_denied:       "QuickBooks authorization was cancelled.",
  qbo_invalid_callback: "Invalid response from QuickBooks. Please try again.",
  qbo_token_exchange_failed: "Failed to exchange authorization code. Please try again.",
};

function QuickBooksSection() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings/company-integrations?integration=quickbooks")
      .then((r) => r.json())
      .then((data) => {
        setConnected(!!(data.QBO_REALM_ID && data.QBO_ACCESS_TOKEN));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    const url = new URL(window.location.href);

    if (connected === "quickbooks") {
      setConnected(true);
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());
    } else if (error && error.startsWith("qbo_")) {
      setErrorMsg(QBO_ERROR_MESSAGES[error] ?? "An error occurred connecting to QuickBooks.");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  if (loading) return <div className="text-xs text-gray-400 py-8 text-center">Loading...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">QuickBooks Online</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Sync prime contracts, subcontracts, and purchase orders to QuickBooks Online via OAuth.
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-4 ${
            connected ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>

      <div className="space-y-4">
        {connected ? (
          <div className="flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-sm text-gray-700">
              Your QuickBooks Online account is connected. Sync buttons will appear on
              commitments and prime contracts.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Click below to authorize SiteCommand to access your QuickBooks Online company.
            You will be redirected to Intuit to sign in and approve the connection.
          </p>
        )}

        {errorMsg && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {errorMsg}
          </p>
        )}

        <a
          href="/api/integrations/quickbooks/connect"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2CA01C] text-white text-sm font-medium rounded-md hover:bg-[#237d16] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          {connected ? "Reconnect QuickBooks" : "Connect QuickBooks Online"}
        </a>
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Uses OAuth 2.0 — no passwords stored. Tokens are refreshed automatically.
          Your QuickBooks company data is only accessed when you trigger a sync.
        </p>
      </div>
    </div>
  );
}

// ── Xero section (company super_admin) ────────────────────────────────────────

const XERO_ERROR_MESSAGES: Record<string, string> = {
  xero_not_configured:
    "Xero is not set up for this platform yet. A Site Command administrator needs to add the app credentials in their Integrations settings before you can connect.",
  xero_unauthorized: "You must be logged in to connect Xero.",
  xero_forbidden:    "Only company admins can connect Xero.",
  xero_no_company:   "Your account is not associated with a company.",
  xero_denied:       "Xero authorization was cancelled.",
  xero_invalid_callback: "Invalid response from Xero. Please try again.",
  xero_token_exchange_failed: "Failed to exchange authorization code. Please try again.",
};

function XeroSection() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings/company-integrations?integration=xero")
      .then((r) => r.json())
      .then((data) => {
        setConnected(!!(data.XERO_TENANT_ID && data.XERO_ACCESS_TOKEN));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    const url = new URL(window.location.href);

    if (connected === "xero") {
      setConnected(true);
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());
    } else if (error && error.startsWith("xero_")) {
      setErrorMsg(XERO_ERROR_MESSAGES[error] ?? "An error occurred connecting to Xero.");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  if (loading) return <div className="text-xs text-gray-400 py-8 text-center">Loading...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Xero</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Sync prime contracts, subcontracts, and purchase orders to Xero via OAuth.
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-4 ${
            connected ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>

      <div className="space-y-4">
        {connected ? (
          <div className="flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-sm text-gray-700">
              Your Xero organisation is connected. Sync buttons will appear on
              commitments and prime contracts.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Click below to authorize SiteCommand to access your Xero organisation.
            You will be redirected to Xero to sign in and approve the connection.
          </p>
        )}

        {errorMsg && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {errorMsg}
          </p>
        )}

        <a
          href="/api/integrations/xero/connect"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#13B5EA] text-white text-sm font-medium rounded-md hover:bg-[#0ea0d4] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          {connected ? "Reconnect Xero" : "Connect Xero"}
        </a>
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Uses OAuth 2.0 — no passwords stored. Tokens are refreshed automatically.
          Xero&apos;s unified Contacts model covers both suppliers and customers.
        </p>
      </div>
    </div>
  );
}

// ── APS section (site_admin only) ─────────────────────────────────────────────

type ApsSettings = {
  APS_CLIENT_ID: string | null;
  APS_CLIENT_SECRET: string | null;
  APS_BUCKET_KEY: string | null;
};

function ApsSection() {
  const [settings, setSettings] = useState<ApsSettings>({
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
      .then((data: ApsSettings) => {
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
    setSaving(true); setError(""); setSaved(false);

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

    if (!res.ok) { setError(data.error ?? "Failed to save settings"); return; }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSettings((prev) => ({ ...prev, ...payload }));
  }

  const configured = !!(settings.APS_CLIENT_ID && settings.APS_CLIENT_SECRET);

  if (loading) return <div className="text-xs text-gray-400 py-8 text-center">Loading...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Autodesk Platform Services (APS)</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Required for BIM file uploads and 3D model viewing (.rvt, .dwg, .ifc, and more).
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-4 ${
            configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {configured ? "Configured" : "Not configured"}
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
          <p className="text-xs text-gray-400 mt-1">Found in your Autodesk Developer Portal app settings.</p>
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
            placeholder={settings.APS_BUCKET_KEY ?? "sitecommand-bim-{auto-generated from Client ID}"}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate from Client ID.</p>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="pt-1">
          <SaveButton saving={saving} saved={saved} />
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
  );
}

// ── QBO App Credentials section (site_admin only) ────────────────────────────

type QBOAppSettings = {
  QBO_CLIENT_ID: string | null;
  QBO_CLIENT_SECRET: string | null;
};

function QBOAppSection() {
  const [settings, setSettings] = useState<QBOAppSettings>({
    QBO_CLIENT_ID: null,
    QBO_CLIENT_SECRET: null,
  });
  const [form, setForm] = useState({ QBO_CLIENT_ID: "", QBO_CLIENT_SECRET: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/platform-settings")
      .then((r) => r.json())
      .then((data: QBOAppSettings) => {
        setSettings(data);
        setForm({
          QBO_CLIENT_ID: data.QBO_CLIENT_ID ?? "",
          QBO_CLIENT_SECRET: data.QBO_CLIENT_SECRET ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);

    const payload: Record<string, string> = {};
    if (form.QBO_CLIENT_ID.trim()) payload.QBO_CLIENT_ID = form.QBO_CLIENT_ID.trim();
    if (form.QBO_CLIENT_SECRET.trim()) payload.QBO_CLIENT_SECRET = form.QBO_CLIENT_SECRET.trim();

    const res = await fetch("/api/admin/platform-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to save settings"); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSettings((prev) => ({ ...prev, ...payload }));
  }

  const configured = !!(settings.QBO_CLIENT_ID && settings.QBO_CLIENT_SECRET);
  if (loading) return <div className="text-xs text-gray-400 py-8 text-center">Loading...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">QuickBooks Online — App Credentials</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Platform-level OAuth app credentials. Company admins use these to connect their own QB companies.
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-4 ${configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
          {configured ? "Configured" : "Not configured"}
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="qbo-client-id" className="block text-xs font-medium text-gray-700 mb-1">Client ID</label>
          <MaskedInput
            id="qbo-client-id"
            value={form.QBO_CLIENT_ID}
            onChange={(v) => setForm((f) => ({ ...f, QBO_CLIENT_ID: v }))}
            placeholder={settings.QBO_CLIENT_ID ? "••••••••••••••••" : "Intuit app Client ID"}
          />
          <p className="text-xs text-gray-400 mt-1">Found in the Intuit Developer Portal under your app.</p>
        </div>
        <div>
          <label htmlFor="qbo-client-secret" className="block text-xs font-medium text-gray-700 mb-1">Client Secret</label>
          <MaskedInput
            id="qbo-client-secret"
            value={form.QBO_CLIENT_SECRET}
            onChange={(v) => setForm((f) => ({ ...f, QBO_CLIENT_SECRET: v }))}
            placeholder={settings.QBO_CLIENT_SECRET ? "••••••••••••••••" : "Intuit app Client Secret"}
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="pt-1"><SaveButton saving={saving} saved={saved} /></div>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Set the redirect URI in the Intuit Developer Portal to{" "}
          <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">{"{APP_URL}"}/api/integrations/quickbooks/callback</code>.
          Scopes required: <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">com.intuit.quickbooks.accounting</code>.
        </p>
      </div>
    </div>
  );
}

// ── Xero App Credentials section (site_admin only) ────────────────────────────

type XeroAppSettings = {
  XERO_CLIENT_ID: string | null;
  XERO_CLIENT_SECRET: string | null;
};

function XeroAppSection() {
  const [settings, setSettings] = useState<XeroAppSettings>({
    XERO_CLIENT_ID: null,
    XERO_CLIENT_SECRET: null,
  });
  const [form, setForm] = useState({ XERO_CLIENT_ID: "", XERO_CLIENT_SECRET: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/platform-settings")
      .then((r) => r.json())
      .then((data: XeroAppSettings) => {
        setSettings(data);
        setForm({
          XERO_CLIENT_ID: data.XERO_CLIENT_ID ?? "",
          XERO_CLIENT_SECRET: data.XERO_CLIENT_SECRET ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);

    const payload: Record<string, string> = {};
    if (form.XERO_CLIENT_ID.trim()) payload.XERO_CLIENT_ID = form.XERO_CLIENT_ID.trim();
    if (form.XERO_CLIENT_SECRET.trim()) payload.XERO_CLIENT_SECRET = form.XERO_CLIENT_SECRET.trim();

    const res = await fetch("/api/admin/platform-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to save settings"); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSettings((prev) => ({ ...prev, ...payload }));
  }

  const configured = !!(settings.XERO_CLIENT_ID && settings.XERO_CLIENT_SECRET);
  if (loading) return <div className="text-xs text-gray-400 py-8 text-center">Loading...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Xero — App Credentials</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Platform-level OAuth app credentials. Company admins use these to connect their own Xero organisations.
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-4 ${configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
          {configured ? "Configured" : "Not configured"}
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="xero-client-id" className="block text-xs font-medium text-gray-700 mb-1">Client ID</label>
          <MaskedInput
            id="xero-client-id"
            value={form.XERO_CLIENT_ID}
            onChange={(v) => setForm((f) => ({ ...f, XERO_CLIENT_ID: v }))}
            placeholder={settings.XERO_CLIENT_ID ? "••••••••••••••••" : "Xero app Client ID"}
          />
          <p className="text-xs text-gray-400 mt-1">Found in the Xero Developer Centre under your app.</p>
        </div>
        <div>
          <label htmlFor="xero-client-secret" className="block text-xs font-medium text-gray-700 mb-1">Client Secret</label>
          <MaskedInput
            id="xero-client-secret"
            value={form.XERO_CLIENT_SECRET}
            onChange={(v) => setForm((f) => ({ ...f, XERO_CLIENT_SECRET: v }))}
            placeholder={settings.XERO_CLIENT_SECRET ? "••••••••••••••••" : "Xero app Client Secret"}
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="pt-1"><SaveButton saving={saving} saved={saved} /></div>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Set the redirect URI in the Xero Developer Centre to{" "}
          <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">{"{APP_URL}"}/api/integrations/xero/callback</code>.
          Scopes required:{" "}
          <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">offline_access accounting.transactions accounting.contacts</code>.
        </p>
      </div>
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────

export default function IntegrationsClient({ isSiteAdmin }: { isSiteAdmin: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isSiteAdmin
            ? "Configure platform-level third-party service credentials."
            : "Connect your company's accounting system to sync contracts and commitments."}
        </p>
      </div>

      {isSiteAdmin ? (
        <>
          <ApsSection />
          <QBOAppSection />
          <XeroAppSection />
        </>
      ) : (
        <>
          <SageSection />
          <QuickBooksSection />
          <XeroSection />
        </>
      )}
    </div>
  );
}
