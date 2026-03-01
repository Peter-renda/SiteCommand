"use client";

import { useState, useEffect, useRef } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function parseLocalDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplayDate(iso: string) {
  return parseLocalDate(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function shiftDay(iso: string, n: number) {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Types ─────────────────────────────────────────────────────────────────────

type TextEntry = { id: string; text: string };
type ManpowerEntry = { id: string; trade: string; count: string };
type ListKey = "inspections" | "deliveries" | "visitors" | "safety_violations" | "accidents" | "delays" | "photos";

type LogForm = {
  log_date: string;
  weather_conditions: string;
  weather_temp: string;
  weather_wind: string;
  weather_humidity: string;
  inspections: TextEntry[];
  deliveries: TextEntry[];
  visitors: TextEntry[];
  safety_violations: TextEntry[];
  accidents: TextEntry[];
  delays: TextEntry[];
  manpower: ManpowerEntry[];
  notes: string;
  photos: TextEntry[];
};

function emptyForm(date: string): LogForm {
  return {
    log_date: date,
    weather_conditions: "",
    weather_temp: "",
    weather_wind: "",
    weather_humidity: "",
    inspections: [],
    deliveries: [],
    visitors: [],
    safety_violations: [],
    accidents: [],
    delays: [],
    manpower: [],
    notes: "",
    photos: [],
  };
}

const WEATHER_CONDITIONS = [
  "Clear",
  "Partly Cloudy",
  "Cloudy",
  "Light Rain",
  "Heavy Rain",
  "Snow",
  "Fog",
  "Windy",
  "Other",
];

// ── Nav ───────────────────────────────────────────────────────────────────────

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

function ProjectNav({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="bg-white border-b border-gray-100 w-full px-6 flex items-center gap-4">
      <a
        href="/dashboard"
        className="flex items-center gap-1.5 py-2.5 text-sm text-gray-400 hover:text-gray-700 transition-colors shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All Projects
      </a>
      <div className="w-px h-4 bg-gray-200" />
      <div ref={ref} className="relative inline-block">
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
    </nav>
  );
}

// ── Section components ────────────────────────────────────────────────────────

function SectionCard({ title, onAdd, children, addLabel = "Add" }: {
  title: string;
  onAdd?: () => void;
  children: React.ReactNode;
  addLabel?: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {addLabel}
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function TextListSection({
  title,
  items,
  onAdd,
  onChange,
  onDelete,
  placeholder,
}: {
  title: string;
  items: TextEntry[];
  onAdd: () => void;
  onChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  placeholder?: string;
}) {
  return (
    <SectionCard title={title} onAdd={onAdd}>
      {items.length === 0 ? (
        <p className="text-xs text-gray-300 text-center py-3">No entries yet</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="text"
                value={item.text}
                onChange={(e) => onChange(item.id, e.target.value)}
                placeholder={placeholder ?? "Enter details..."}
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <button
                onClick={() => onDelete(item.id)}
                className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DailyLogClient({
  projectId,
  role,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const [date, setDate] = useState(todayISO());
  const [form, setForm] = useState<LogForm>(emptyForm(todayISO()));
  const [logId, setLogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  useEffect(() => {
    loadLog(date);
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadLog(d: string) {
    setLoading(true);
    setLogId(null);
    setDirty(false);
    setSavedOnce(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/daily-log?date=${d}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setForm(data);
          setLogId(data.id);
          setSavedOnce(true);
        } else {
          setForm(emptyForm(d));
        }
      } else {
        setForm(emptyForm(d));
      }
    } finally {
      setLoading(false);
    }
  }

  function patch<K extends keyof LogForm>(key: K, value: LogForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function addEntry(key: ListKey) {
    setForm((prev) => ({ ...prev, [key]: [...(prev[key] as TextEntry[]), { id: uid(), text: "" }] }));
    setDirty(true);
  }

  function updateEntry(key: ListKey, id: string, text: string) {
    setForm((prev) => ({
      ...prev,
      [key]: (prev[key] as TextEntry[]).map((e) => (e.id === id ? { ...e, text } : e)),
    }));
    setDirty(true);
  }

  function deleteEntry(key: ListKey, id: string) {
    setForm((prev) => ({
      ...prev,
      [key]: (prev[key] as TextEntry[]).filter((e) => e.id !== id),
    }));
    setDirty(true);
  }

  function addManpower() {
    setForm((prev) => ({
      ...prev,
      manpower: [...prev.manpower, { id: uid(), trade: "", count: "" }],
    }));
    setDirty(true);
  }

  function updateManpower(id: string, field: "trade" | "count", value: string) {
    setForm((prev) => ({
      ...prev,
      manpower: prev.manpower.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
    setDirty(true);
  }

  function deleteManpower(id: string) {
    setForm((prev) => ({
      ...prev,
      manpower: prev.manpower.filter((e) => e.id !== id),
    }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, log_date: date };
      const res = logId
        ? await fetch(`/api/projects/${projectId}/daily-log`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: logId, ...payload }),
          })
        : await fetch(`/api/projects/${projectId}/daily-log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (res.ok) {
        const data = await res.json();
        setLogId(data.id);
        setDirty(false);
        setSavedOnce(true);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const isToday = date === todayISO();
  const totalWorkers = form.manpower.reduce((sum, e) => sum + (parseInt(e.count) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Date navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDate(shiftDay(date, -1))}
              className="p-2 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
              title="Previous day"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={date}
                  max={todayISO()}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                  className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none cursor-pointer"
                  style={{ colorScheme: "light" }}
                />
                {isToday && (
                  <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 -mt-0.5">
                {loading ? "Loading..." : logId ? (dirty ? "Unsaved changes" : "Log saved") : "No log for this date"}
              </p>
            </div>

            <button
              onClick={() => setDate(shiftDay(date, 1))}
              disabled={isToday}
              className="p-2 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next day"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                onClick={() => setDate(todayISO())}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
              >
                Today
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : savedOnce && !dirty ? "Saved" : "Save Log"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-5">

            {/* ── Observed Weather ──────────────────────────────────────── */}
            <SectionCard title="Observed Weather">
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">Conditions</label>
                <div className="flex flex-wrap gap-2">
                  {WEATHER_CONDITIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => patch("weather_conditions", form.weather_conditions === c ? "" : c)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        form.weather_conditions === c
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Temperature</label>
                  <input
                    type="text"
                    value={form.weather_temp}
                    onChange={(e) => patch("weather_temp", e.target.value)}
                    placeholder="e.g. 72°F"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Wind</label>
                  <input
                    type="text"
                    value={form.weather_wind}
                    onChange={(e) => patch("weather_wind", e.target.value)}
                    placeholder="e.g. 10 mph NW"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Humidity / Other</label>
                  <input
                    type="text"
                    value={form.weather_humidity}
                    onChange={(e) => patch("weather_humidity", e.target.value)}
                    placeholder="e.g. 65% humidity"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
            </SectionCard>

            {/* ── Manpower ─────────────────────────────────────────────── */}
            <SectionCard title="Manpower" onAdd={addManpower}>
              {form.manpower.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-3">No manpower entries yet</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_96px_32px] gap-2 px-1">
                    <span className="text-xs font-medium text-gray-400">Trade / Company</span>
                    <span className="text-xs font-medium text-gray-400 text-center"># Workers</span>
                    <span />
                  </div>
                  {form.manpower.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-[1fr_96px_32px] gap-2">
                      <input
                        type="text"
                        value={entry.trade}
                        onChange={(e) => updateManpower(entry.id, "trade", e.target.value)}
                        placeholder="e.g. Framing Crew"
                        className="px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                      <input
                        type="number"
                        min="0"
                        value={entry.count}
                        onChange={(e) => updateManpower(entry.id, "count", e.target.value)}
                        placeholder="0"
                        className="px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 text-center"
                      />
                      <button
                        onClick={() => deleteManpower(entry.id)}
                        className="flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div className="grid grid-cols-[1fr_96px_32px] gap-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 px-1">Total</span>
                    <span className="text-sm font-bold text-gray-900 text-center">{totalWorkers}</span>
                    <span />
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ── Inspections + Deliveries ──────────────────────────────── */}
            <div className="grid grid-cols-2 gap-5">
              <TextListSection
                title="Inspections"
                items={form.inspections}
                onAdd={() => addEntry("inspections")}
                onChange={(id, text) => updateEntry("inspections", id, text)}
                onDelete={(id) => deleteEntry("inspections", id)}
                placeholder="Describe inspection..."
              />
              <TextListSection
                title="Deliveries"
                items={form.deliveries}
                onAdd={() => addEntry("deliveries")}
                onChange={(id, text) => updateEntry("deliveries", id, text)}
                onDelete={(id) => deleteEntry("deliveries", id)}
                placeholder="Material, supplier, quantity..."
              />
            </div>

            {/* ── Visitors + Safety Violations ─────────────────────────── */}
            <div className="grid grid-cols-2 gap-5">
              <TextListSection
                title="Visitors"
                items={form.visitors}
                onAdd={() => addEntry("visitors")}
                onChange={(id, text) => updateEntry("visitors", id, text)}
                onDelete={(id) => deleteEntry("visitors", id)}
                placeholder="Name and purpose..."
              />
              <TextListSection
                title="Safety Violations"
                items={form.safety_violations}
                onAdd={() => addEntry("safety_violations")}
                onChange={(id, text) => updateEntry("safety_violations", id, text)}
                onDelete={(id) => deleteEntry("safety_violations", id)}
                placeholder="Describe violation..."
              />
            </div>

            {/* ── Accidents + Delays ───────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-5">
              <TextListSection
                title="Accidents"
                items={form.accidents}
                onAdd={() => addEntry("accidents")}
                onChange={(id, text) => updateEntry("accidents", id, text)}
                onDelete={(id) => deleteEntry("accidents", id)}
                placeholder="Describe accident or injury..."
              />
              <TextListSection
                title="Delays"
                items={form.delays}
                onAdd={() => addEntry("delays")}
                onChange={(id, text) => updateEntry("delays", id, text)}
                onDelete={(id) => deleteEntry("delays", id)}
                placeholder="Cause and duration..."
              />
            </div>

            {/* ── Notes ────────────────────────────────────────────────── */}
            <SectionCard title="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => patch("notes", e.target.value)}
                placeholder="General notes, work summary, progress observations..."
                rows={5}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </SectionCard>

            {/* ── Photos ───────────────────────────────────────────────── */}
            <TextListSection
              title="Photos"
              items={form.photos}
              onAdd={() => addEntry("photos")}
              onChange={(id, text) => updateEntry("photos", id, text)}
              onDelete={(id) => deleteEntry("photos", id)}
              placeholder="Photo description or reference..."
            />

          </div>
        )}
      </main>
    </div>
  );
}
