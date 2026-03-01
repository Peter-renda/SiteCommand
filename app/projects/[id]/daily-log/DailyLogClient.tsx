"use client";

import { useState, useEffect, useRef } from "react";

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function parseLocalDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function shiftDay(iso: string, n: number) {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function calcDurationHours(start: string, end: string): string {
  if (!start || !end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diffMin = eh * 60 + em - (sh * 60 + sm);
  if (diffMin <= 0) return "0";
  return (diffMin / 60).toFixed(2);
}

// ── Types ────────────────────────────────────────────────────────────────────

type InspectionEntry = {
  id: string;
  start_time: string;
  end_time: string;
  inspection_type: string;
  inspecting_entity: string;
  inspector_name: string;
  location: string;
  inspection_area: string;
  comments: string;
};

type DeliveryEntry = {
  id: string;
  time: string;
  delivery_from: string;
  tracking_number: string;
  contents: string;
  comments: string;
};

type VisitorEntry = {
  id: string;
  visitor: string;
  start_time: string;
  end_time: string;
  comments: string;
};

type SafetyViolationEntry = {
  id: string;
  time: string;
  subject: string;
  safety_notice: string;
  issued_to: string;
  compliance_due: string;
  comments: string;
};

type AccidentEntry = {
  id: string;
  time: string;
  party_involved: string;
  company_involved: string;
  comments: string;
};

type DelayEntry = {
  id: string;
  delay_type: string;
  start_time: string;
  end_time: string;
  duration_hours: string;
  location: string;
  comments: string;
};

type NoteEntry = {
  id: string;
  is_issue: boolean;
  location: string;
  comments: string;
};

type ManpowerEntry = {
  id: string;
  company: string;
  workers: string;
  hours: string;
  location: string;
  cost_code: string;
  comments: string;
};

type WeatherObservation = {
  id: string;
  time_observed: string;
  delay: boolean;
  sky: string;
  temperature: string;
  calamity: string;
  avg_precipitation: string;
  wind: string;
  ground_sea: string;
  comments: string;
};

type PhotoEntry = {
  id: string;
  description: string;
};

type LogForm = {
  log_date: string;
  weather_conditions: string;
  weather_temp: string;
  weather_wind: string;
  weather_humidity: string;
  inspections: InspectionEntry[];
  deliveries: DeliveryEntry[];
  visitors: VisitorEntry[];
  safety_violations: SafetyViolationEntry[];
  accidents: AccidentEntry[];
  delays: DelayEntry[];
  manpower: ManpowerEntry[];
  note_entries: NoteEntry[];
  photos: PhotoEntry[];
  weather_observations: WeatherObservation[];
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
    note_entries: [],
    photos: [],
    weather_observations: [],
  };
}

// ── Constants ────────────────────────────────────────────────────────────────

const WEATHER_CONDITIONS = [
  "Clear", "Partly Cloudy", "Cloudy", "Light Rain",
  "Heavy Rain", "Snow", "Fog", "Windy", "Other",
];
const SKY_OPTIONS = ["", "Clear", "Partly Cloudy", "Cloudy", "Overcast", "Fog"];
const DELAY_TYPES = [
  "", "Weather", "Labor", "Material", "Equipment",
  "Design", "Owner", "Subcontractor", "Other",
];

// ── Nav ──────────────────────────────────────────────────────────────────────

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
      <a
        href={`/projects/${projectId}`}
        className="flex items-center gap-1.5 py-2.5 text-sm text-gray-400 hover:text-gray-700 transition-colors shrink-0"
      >
        ← Back to Project
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
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
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

// ── Shared UI primitives ─────────────────────────────────────────────────────

function SectionCard({
  title, badge, onAdd, addLabel = "Create", children,
}: {
  title: string;
  badge?: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {badge && <span className="text-xs text-gray-400">{badge}</span>}
        </div>
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
      <div>{children}</div>
    </div>
  );
}

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-400";
const textareaCls =
  "w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none";
const selectCls =
  "w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white";

function CreateForm({ onSubmit, onCancel, children }: {
  onSubmit: () => void; onCancel: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 p-4 bg-gray-50/60 space-y-3">
      {children}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onSubmit}
          className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
        >
          Create
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          className="ml-auto px-3 py-1.5 text-xs font-medium text-gray-400 border border-dashed border-gray-300 rounded-md hover:border-gray-500 hover:text-gray-600 transition-colors"
        >
          Attach File(s)
        </button>
      </div>
    </div>
  );
}

function EntryRow({ children, onDelete }: {
  children: React.ReactNode; onDelete: () => void;
}) {
  return (
    <div className="px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">{children}</div>
        <button
          onClick={onDelete}
          className="shrink-0 mt-0.5 p-1 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-xs text-gray-300 text-center py-6">{text}</p>;
}

// ── Inspections ──────────────────────────────────────────────────────────────

const emptyInspection = (): Omit<InspectionEntry, "id"> => ({
  start_time: "", end_time: "", inspection_type: "", inspecting_entity: "",
  inspector_name: "", location: "", inspection_area: "", comments: "",
});

function InspectionsSection({ entries, onAdd, onDelete }: {
  entries: InspectionEntry[];
  onAdd: (e: InspectionEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyInspection());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptyInspection());
    setCreating(false);
  }

  return (
    <SectionCard title="Inspections" onAdd={() => setCreating((c) => !c)}>
      {creating && (
        <CreateForm onSubmit={handleCreate} onCancel={() => setCreating(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start" required>
              <input type="time" value={draft.start_time} onChange={(e) => set("start_time", e.target.value)} className={inputCls} />
            </Field>
            <Field label="End" required>
              <input type="time" value={draft.end_time} onChange={(e) => set("end_time", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Inspection Type">
              <input value={draft.inspection_type} onChange={(e) => set("inspection_type", e.target.value)} placeholder="e.g. Fire Safety" className={inputCls} />
            </Field>
            <Field label="Inspecting Entity">
              <input value={draft.inspecting_entity} onChange={(e) => set("inspecting_entity", e.target.value)} placeholder="e.g. City Inspector" className={inputCls} />
            </Field>
            <Field label="Inspector Name">
              <input value={draft.inspector_name} onChange={(e) => set("inspector_name", e.target.value)} placeholder="Full name" className={inputCls} />
            </Field>
            <Field label="Location">
              <input value={draft.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Level 3" className={inputCls} />
            </Field>
            <Field label="Inspection Area">
              <input value={draft.inspection_area} onChange={(e) => set("inspection_area", e.target.value)} placeholder="e.g. Electrical" className={inputCls} />
            </Field>
          </div>
          <Field label="Comments">
            <textarea value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Additional details..." rows={3} className={textareaCls} />
          </Field>
        </CreateForm>
      )}
      {entries.length === 0 && !creating ? (
        <EmptyState text="No inspections logged" />
      ) : (
        entries.map((e) => (
          <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              {e.inspection_type && <span className="text-gray-800 font-medium col-span-2">{e.inspection_type}</span>}
              {e.start_time && <span className="text-gray-500"><span className="font-medium">Start:</span> {e.start_time}</span>}
              {e.end_time && <span className="text-gray-500"><span className="font-medium">End:</span> {e.end_time}</span>}
              {e.inspecting_entity && <span className="text-gray-500"><span className="font-medium">Entity:</span> {e.inspecting_entity}</span>}
              {e.inspector_name && <span className="text-gray-500"><span className="font-medium">Inspector:</span> {e.inspector_name}</span>}
              {e.location && <span className="text-gray-500"><span className="font-medium">Location:</span> {e.location}</span>}
              {e.inspection_area && <span className="text-gray-500"><span className="font-medium">Area:</span> {e.inspection_area}</span>}
              {e.comments && <span className="text-gray-500 col-span-2 mt-0.5">{e.comments}</span>}
            </div>
          </EntryRow>
        ))
      )}
    </SectionCard>
  );
}

// ── Deliveries ───────────────────────────────────────────────────────────────

const emptyDelivery = (): Omit<DeliveryEntry, "id"> => ({
  time: "", delivery_from: "", tracking_number: "", contents: "", comments: "",
});

function DeliveriesSection({ entries, onAdd, onDelete }: {
  entries: DeliveryEntry[];
  onAdd: (e: DeliveryEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDelivery());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptyDelivery());
    setCreating(false);
  }

  return (
    <SectionCard title="Deliveries" onAdd={() => setCreating((c) => !c)}>
      {creating && (
        <CreateForm onSubmit={handleCreate} onCancel={() => setCreating(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time" required>
              <input type="time" value={draft.time} onChange={(e) => set("time", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Delivery From">
              <input value={draft.delivery_from} onChange={(e) => set("delivery_from", e.target.value)} placeholder="Supplier / vendor" className={inputCls} />
            </Field>
            <Field label="Tracking Number">
              <input value={draft.tracking_number} onChange={(e) => set("tracking_number", e.target.value)} placeholder="Optional" className={inputCls} />
            </Field>
            <Field label="Contents">
              <input value={draft.contents} onChange={(e) => set("contents", e.target.value)} placeholder="Material description" className={inputCls} />
            </Field>
          </div>
          <Field label="Comments">
            <textarea value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Additional details..." rows={3} className={textareaCls} />
          </Field>
        </CreateForm>
      )}
      {entries.length === 0 && !creating ? (
        <EmptyState text="No deliveries logged" />
      ) : (
        entries.map((e) => (
          <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              {e.time && <span className="text-gray-500"><span className="font-medium">Time:</span> {e.time}</span>}
              {e.delivery_from && <span className="text-gray-500"><span className="font-medium">From:</span> {e.delivery_from}</span>}
              {e.tracking_number && <span className="text-gray-500"><span className="font-medium">Tracking:</span> {e.tracking_number}</span>}
              {e.contents && <span className="text-gray-800 col-span-2 font-medium">{e.contents}</span>}
              {e.comments && <span className="text-gray-500 col-span-2 mt-0.5">{e.comments}</span>}
            </div>
          </EntryRow>
        ))
      )}
    </SectionCard>
  );
}

// ── Visitors ─────────────────────────────────────────────────────────────────

const emptyVisitor = (): Omit<VisitorEntry, "id"> => ({
  visitor: "", start_time: "", end_time: "", comments: "",
});

function VisitorsSection({ entries, onAdd, onDelete }: {
  entries: VisitorEntry[];
  onAdd: (e: VisitorEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyVisitor());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptyVisitor());
    setCreating(false);
  }

  return (
    <SectionCard title="Visitors" onAdd={() => setCreating((c) => !c)}>
      {creating && (
        <CreateForm onSubmit={handleCreate} onCancel={() => setCreating(false)}>
          <Field label="Visitor">
            <input value={draft.visitor} onChange={(e) => set("visitor", e.target.value)} placeholder="Name and company" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start" required>
              <input type="time" value={draft.start_time} onChange={(e) => set("start_time", e.target.value)} className={inputCls} />
            </Field>
            <Field label="End" required>
              <input type="time" value={draft.end_time} onChange={(e) => set("end_time", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Comments">
            <textarea value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Purpose of visit, observations..." rows={3} className={textareaCls} />
          </Field>
        </CreateForm>
      )}
      {entries.length === 0 && !creating ? (
        <EmptyState text="No visitors logged" />
      ) : (
        entries.map((e) => (
          <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
            <div className="space-y-0.5 text-xs">
              {e.visitor && <p className="text-gray-800 font-medium">{e.visitor}</p>}
              <div className="flex gap-4">
                {e.start_time && <span className="text-gray-500"><span className="font-medium">Start:</span> {e.start_time}</span>}
                {e.end_time && <span className="text-gray-500"><span className="font-medium">End:</span> {e.end_time}</span>}
              </div>
              {e.comments && <p className="text-gray-500 mt-0.5">{e.comments}</p>}
            </div>
          </EntryRow>
        ))
      )}
    </SectionCard>
  );
}

// ── Safety Violations ────────────────────────────────────────────────────────

const emptySafetyViolation = (): Omit<SafetyViolationEntry, "id"> => ({
  time: "", subject: "", safety_notice: "", issued_to: "", compliance_due: "", comments: "",
});

function SafetyViolationsSection({ entries, onAdd, onDelete }: {
  entries: SafetyViolationEntry[];
  onAdd: (e: SafetyViolationEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptySafetyViolation());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptySafetyViolation());
    setCreating(false);
  }

  return (
    <SectionCard title="Safety Violations" onAdd={() => setCreating((c) => !c)}>
      {creating && (
        <CreateForm onSubmit={handleCreate} onCancel={() => setCreating(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time" required>
              <input type="time" value={draft.time} onChange={(e) => set("time", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Issued To">
              <input value={draft.issued_to} onChange={(e) => set("issued_to", e.target.value)} placeholder="Person / company" className={inputCls} />
            </Field>
            <Field label="Subject">
              <input value={draft.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Brief description" className={inputCls} />
            </Field>
            <Field label="Safety Notice">
              <input value={draft.safety_notice} onChange={(e) => set("safety_notice", e.target.value)} placeholder="Notice # or type" className={inputCls} />
            </Field>
            <Field label="Compliance Due">
              <input type="date" value={draft.compliance_due} onChange={(e) => set("compliance_due", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Comments">
            <textarea value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Details..." rows={3} className={textareaCls} />
          </Field>
        </CreateForm>
      )}
      {entries.length === 0 && !creating ? (
        <EmptyState text="No safety violations logged" />
      ) : (
        entries.map((e) => (
          <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              {e.subject && <span className="text-gray-800 font-medium col-span-2">{e.subject}</span>}
              {e.time && <span className="text-gray-500"><span className="font-medium">Time:</span> {e.time}</span>}
              {e.compliance_due && <span className="text-gray-500"><span className="font-medium">Due:</span> {e.compliance_due}</span>}
              {e.safety_notice && <span className="text-gray-500"><span className="font-medium">Notice:</span> {e.safety_notice}</span>}
              {e.issued_to && <span className="text-gray-500"><span className="font-medium">Issued To:</span> {e.issued_to}</span>}
              {e.comments && <span className="text-gray-500 col-span-2 mt-0.5">{e.comments}</span>}
            </div>
          </EntryRow>
        ))
      )}
    </SectionCard>
  );
}

// ── Accidents ────────────────────────────────────────────────────────────────

const emptyAccident = (): Omit<AccidentEntry, "id"> => ({
  time: "", party_involved: "", company_involved: "", comments: "",
});

function AccidentsSection({ entries, onAdd, onDelete }: {
  entries: AccidentEntry[];
  onAdd: (e: AccidentEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyAccident());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptyAccident());
    setCreating(false);
  }

  return (
    <SectionCard title="Accidents" onAdd={() => setCreating((c) => !c)}>
      {creating && (
        <CreateForm onSubmit={handleCreate} onCancel={() => setCreating(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time" required>
              <input type="time" value={draft.time} onChange={(e) => set("time", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Party Involved">
              <input value={draft.party_involved} onChange={(e) => set("party_involved", e.target.value)} placeholder="Person's name" className={inputCls} />
            </Field>
            <Field label="Company Involved">
              <input value={draft.company_involved} onChange={(e) => set("company_involved", e.target.value)} placeholder="Company name" className={inputCls} />
            </Field>
          </div>
          <Field label="Comments">
            <textarea value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Describe the accident or near-miss..." rows={3} className={textareaCls} />
          </Field>
        </CreateForm>
      )}
      {entries.length === 0 && !creating ? (
        <EmptyState text="No accidents logged" />
      ) : (
        entries.map((e) => (
          <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              {e.time && <span className="text-gray-500"><span className="font-medium">Time:</span> {e.time}</span>}
              {e.party_involved && <span className="text-gray-500"><span className="font-medium">Party:</span> {e.party_involved}</span>}
              {e.company_involved && <span className="text-gray-500 col-span-2"><span className="font-medium">Company:</span> {e.company_involved}</span>}
              {e.comments && <span className="text-gray-500 col-span-2 mt-0.5">{e.comments}</span>}
            </div>
          </EntryRow>
        ))
      )}
    </SectionCard>
  );
}

// ── Delays ───────────────────────────────────────────────────────────────────

const emptyDelay = (): Omit<DelayEntry, "id"> => ({
  delay_type: "", start_time: "", end_time: "", duration_hours: "", location: "", comments: "",
});

function DelaysSection({ entries, onAdd, onDelete }: {
  entries: DelayEntry[];
  onAdd: (e: DelayEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDelay());

  function setField(f: keyof typeof draft, v: string) {
    setDraft((d) => {
      const updated = { ...d, [f]: v };
      if (f === "start_time" || f === "end_time") {
        updated.duration_hours = calcDurationHours(
          f === "start_time" ? v : d.start_time,
          f === "end_time" ? v : d.end_time,
        );
      }
      return updated;
    });
  }

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptyDelay());
    setCreating(false);
  }

  const totalHours = entries.reduce((sum, e) => sum + (parseFloat(e.duration_hours) || 0), 0);

  return (
    <SectionCard
      title="Delays"
      badge={`${totalHours.toFixed(2)} Total Hours`}
      onAdd={() => setCreating((c) => !c)}
    >
      {creating && (
        <CreateForm onSubmit={handleCreate} onCancel={() => setCreating(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Delay Type">
              <select value={draft.delay_type} onChange={(e) => setField("delay_type", e.target.value)} className={selectCls}>
                {DELAY_TYPES.map((t) => <option key={t} value={t}>{t || "— Select —"}</option>)}
              </select>
            </Field>
            <Field label="Location">
              <input value={draft.location} onChange={(e) => setField("location", e.target.value)} placeholder="Area affected" className={inputCls} />
            </Field>
            <Field label="Start Time">
              <input type="time" value={draft.start_time} onChange={(e) => setField("start_time", e.target.value)} className={inputCls} />
            </Field>
            <Field label="End Time">
              <input type="time" value={draft.end_time} onChange={(e) => setField("end_time", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Duration (Hours)">
              <input value={draft.duration_hours} readOnly disabled placeholder="Auto-calculated" className={inputCls} />
            </Field>
          </div>
          <Field label="Comments">
            <textarea value={draft.comments} onChange={(e) => setField("comments", e.target.value)} placeholder="Cause and impact..." rows={3} className={textareaCls} />
          </Field>
        </CreateForm>
      )}
      {entries.length === 0 && !creating ? (
        <EmptyState text="No delays logged" />
      ) : (
        entries.map((e) => (
          <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              {e.delay_type && <span className="text-gray-800 font-medium">{e.delay_type}</span>}
              {e.duration_hours && <span className="text-gray-500"><span className="font-medium">Duration:</span> {e.duration_hours}h</span>}
              {e.start_time && <span className="text-gray-500"><span className="font-medium">Start:</span> {e.start_time}</span>}
              {e.end_time && <span className="text-gray-500"><span className="font-medium">End:</span> {e.end_time}</span>}
              {e.location && <span className="text-gray-500 col-span-2"><span className="font-medium">Location:</span> {e.location}</span>}
              {e.comments && <span className="text-gray-500 col-span-2 mt-0.5">{e.comments}</span>}
            </div>
          </EntryRow>
        ))
      )}
    </SectionCard>
  );
}

// ── Notes ────────────────────────────────────────────────────────────────────

const emptyNoteEntry = (): Omit<NoteEntry, "id"> => ({
  is_issue: false, location: "", comments: "",
});

function NoteEntriesSection({ entries, onAdd, onDelete }: {
  entries: NoteEntry[];
  onAdd: (e: NoteEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyNoteEntry());

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptyNoteEntry());
    setCreating(false);
  }

  return (
    <SectionCard title="Notes" onAdd={() => setCreating((c) => !c)}>
      {creating && (
        <CreateForm onSubmit={handleCreate} onCancel={() => setCreating(false)}>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-600">
            <input
              type="checkbox"
              checked={draft.is_issue}
              onChange={(e) => setDraft((d) => ({ ...d, is_issue: e.target.checked }))}
              className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            Mark as Issue
          </label>
          <Field label="Location">
            <input
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              placeholder="Area or location relevant to note"
              className={inputCls}
            />
          </Field>
          <Field label="Comments">
            <textarea
              value={draft.comments}
              onChange={(e) => setDraft((d) => ({ ...d, comments: e.target.value }))}
              placeholder="Note details..."
              rows={3}
              className={textareaCls}
            />
          </Field>
        </CreateForm>
      )}
      {entries.length === 0 && !creating ? (
        <EmptyState text="No notes added" />
      ) : (
        entries.map((e) => (
          <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
            <div className="space-y-0.5 text-xs">
              <div className="flex items-center gap-2">
                {e.is_issue && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                    Issue
                  </span>
                )}
                {e.location && <span className="text-gray-500"><span className="font-medium">Location:</span> {e.location}</span>}
              </div>
              {e.comments && <p className="text-gray-600">{e.comments}</p>}
            </div>
          </EntryRow>
        ))
      )}
    </SectionCard>
  );
}

// ── Manpower ─────────────────────────────────────────────────────────────────

const emptyManpower = (): Omit<ManpowerEntry, "id"> => ({
  company: "", workers: "", hours: "", location: "", cost_code: "", comments: "",
});

function ManpowerSection({ entries, onAdd, onDelete, companySuggestions }: {
  entries: ManpowerEntry[];
  onAdd: (e: ManpowerEntry) => void;
  onDelete: (id: string) => void;
  companySuggestions: string[];
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyManpower());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptyManpower());
    setCreating(false);
  }

  const totalWorkers = entries.reduce((sum, e) => sum + (parseInt(e.workers) || 0), 0);
  const totalHours = entries.reduce(
    (sum, e) => sum + (parseInt(e.workers) || 0) * (parseFloat(e.hours) || 0),
    0,
  );
  const draftTotalHours =
    draft.workers && draft.hours
      ? ((parseInt(draft.workers) || 0) * (parseFloat(draft.hours) || 0)).toFixed(1)
      : "";

  return (
    <SectionCard
      title="Manpower"
      badge={`${totalWorkers} Workers | ${totalHours.toFixed(1)} Total Hours`}
      onAdd={() => setCreating((c) => !c)}
    >
      {creating && (
        <CreateForm onSubmit={handleCreate} onCancel={() => setCreating(false)}>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Company">
              <input
                list="manpower-companies"
                value={draft.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Trade / company name"
                className={inputCls}
              />
              <datalist id="manpower-companies">
                {companySuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </Field>
            <Field label="Workers" required>
              <input type="number" min="0" value={draft.workers} onChange={(e) => set("workers", e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Hours" required>
              <input type="number" min="0" step="0.5" value={draft.hours} onChange={(e) => set("hours", e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Location">
              <input value={draft.location} onChange={(e) => set("location", e.target.value)} placeholder="Work area" className={inputCls} />
            </Field>
            <Field label="Cost Code">
              <input value={draft.cost_code} onChange={(e) => set("cost_code", e.target.value)} placeholder="Optional" className={inputCls} />
            </Field>
            <Field label="Total Hours">
              <input value={draftTotalHours} readOnly disabled placeholder="Auto-calculated" className={inputCls} />
            </Field>
          </div>
          <Field label="Comments">
            <textarea value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Optional notes..." rows={2} className={textareaCls} />
          </Field>
        </CreateForm>
      )}
      {entries.length === 0 && !creating ? (
        <EmptyState text="No manpower entries logged" />
      ) : (
        entries.map((e) => (
          <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
            <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-xs">
              {e.company && <span className="text-gray-800 font-medium col-span-3">{e.company}</span>}
              {e.workers && <span className="text-gray-500"><span className="font-medium">Workers:</span> {e.workers}</span>}
              {e.hours && <span className="text-gray-500"><span className="font-medium">Hours/worker:</span> {e.hours}</span>}
              <span className="text-gray-500">
                <span className="font-medium">Total:</span>{" "}
                {((parseInt(e.workers) || 0) * (parseFloat(e.hours) || 0)).toFixed(1)}h
              </span>
              {e.location && <span className="text-gray-500 col-span-2"><span className="font-medium">Location:</span> {e.location}</span>}
              {e.cost_code && <span className="text-gray-500"><span className="font-medium">Cost Code:</span> {e.cost_code}</span>}
              {e.comments && <span className="text-gray-500 col-span-3 mt-0.5">{e.comments}</span>}
            </div>
          </EntryRow>
        ))
      )}
    </SectionCard>
  );
}

// ── Observed Weather ─────────────────────────────────────────────────────────

const emptyWeatherObs = (): Omit<WeatherObservation, "id"> => ({
  time_observed: "", delay: false, sky: "", temperature: "",
  calamity: "", avg_precipitation: "", wind: "", ground_sea: "", comments: "",
});

function WeatherSection({
  form, patch, observations, onAddObs, onDeleteObs,
}: {
  form: LogForm;
  patch: <K extends keyof LogForm>(key: K, value: LogForm[K]) => void;
  observations: WeatherObservation[];
  onAddObs: (o: WeatherObservation) => void;
  onDeleteObs: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyWeatherObs());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAddObs({ id: uid(), ...draft });
    setDraft(emptyWeatherObs());
    setCreating(false);
  }

  return (
    <SectionCard title="Observed Weather">
      {/* General conditions */}
      <div className="p-4 border-b border-gray-100">
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
          <Field label="Temperature">
            <input value={form.weather_temp} onChange={(e) => patch("weather_temp", e.target.value)} placeholder="e.g. 72°F" className={inputCls} />
          </Field>
          <Field label="Wind">
            <input value={form.weather_wind} onChange={(e) => patch("weather_wind", e.target.value)} placeholder="e.g. 10 mph NW" className={inputCls} />
          </Field>
          <Field label="Humidity / Other">
            <input value={form.weather_humidity} onChange={(e) => patch("weather_humidity", e.target.value)} placeholder="e.g. 65%" className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Time-based observations */}
      <div>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Observed Weather Conditions
          </span>
          <button
            onClick={() => setCreating((c) => !c)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create
          </button>
        </div>

        {creating && (
          <CreateForm onSubmit={handleCreate} onCancel={() => setCreating(false)}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Time Observed" required>
                <input type="time" value={draft.time_observed} onChange={(e) => set("time_observed", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Sky">
                <select value={draft.sky} onChange={(e) => set("sky", e.target.value)} className={selectCls}>
                  {SKY_OPTIONS.map((s) => <option key={s} value={s}>{s || "— Select —"}</option>)}
                </select>
              </Field>
              <Field label="Temperature">
                <input value={draft.temperature} onChange={(e) => set("temperature", e.target.value)} placeholder="e.g. 68°F" className={inputCls} />
              </Field>
              <Field label="Wind">
                <input value={draft.wind} onChange={(e) => set("wind", e.target.value)} placeholder="e.g. 15 mph NE" className={inputCls} />
              </Field>
              <Field label="Avg Precipitation">
                <input value={draft.avg_precipitation} onChange={(e) => set("avg_precipitation", e.target.value)} placeholder="e.g. Light rain" className={inputCls} />
              </Field>
              <Field label="Ground / Sea">
                <input value={draft.ground_sea} onChange={(e) => set("ground_sea", e.target.value)} placeholder="e.g. Wet" className={inputCls} />
              </Field>
              <Field label="Calamity">
                <input value={draft.calamity} onChange={(e) => set("calamity", e.target.value)} placeholder="e.g. Flooding risk" className={inputCls} />
              </Field>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={draft.delay}
                    onChange={(e) => setDraft((d) => ({ ...d, delay: e.target.checked }))}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  Weather Delay
                </label>
              </div>
            </div>
            <Field label="Comments">
              <textarea value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Additional observations..." rows={2} className={textareaCls} />
            </Field>
          </CreateForm>
        )}

        {observations.length === 0 && !creating ? (
          <EmptyState text="No weather observations logged" />
        ) : (
          observations.map((o) => (
            <EntryRow key={o.id} onDelete={() => onDeleteObs(o.id)}>
              <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-xs">
                {o.time_observed && <span className="text-gray-800 font-medium"><span className="font-medium">Time:</span> {o.time_observed}</span>}
                {o.sky && <span className="text-gray-500"><span className="font-medium">Sky:</span> {o.sky}</span>}
                {o.temperature && <span className="text-gray-500"><span className="font-medium">Temp:</span> {o.temperature}</span>}
                {o.wind && <span className="text-gray-500"><span className="font-medium">Wind:</span> {o.wind}</span>}
                {o.avg_precipitation && <span className="text-gray-500"><span className="font-medium">Precip:</span> {o.avg_precipitation}</span>}
                {o.ground_sea && <span className="text-gray-500"><span className="font-medium">Ground:</span> {o.ground_sea}</span>}
                {o.calamity && <span className="text-gray-500 col-span-3"><span className="font-medium">Calamity:</span> {o.calamity}</span>}
                {o.delay && (
                  <span className="col-span-3">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700">
                      Weather Delay
                    </span>
                  </span>
                )}
                {o.comments && <span className="text-gray-500 col-span-3 mt-0.5">{o.comments}</span>}
              </div>
            </EntryRow>
          ))
        )}
      </div>
    </SectionCard>
  );
}

// ── Photos ───────────────────────────────────────────────────────────────────

function PhotosSection({ entries, onAdd, onDelete }: {
  entries: PhotoEntry[];
  onAdd: (e: PhotoEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [desc, setDesc] = useState("");

  function handleCreate() {
    if (!desc.trim()) return;
    onAdd({ id: uid(), description: desc.trim() });
    setDesc("");
    setCreating(false);
  }

  return (
    <SectionCard title="Photos" onAdd={() => setCreating((c) => !c)}>
      {creating && (
        <CreateForm onSubmit={handleCreate} onCancel={() => setCreating(false)}>
          <Field label="Description / Reference">
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Photo caption or file reference..."
              className={inputCls}
            />
          </Field>
        </CreateForm>
      )}
      {entries.length === 0 && !creating ? (
        <EmptyState text="No photos logged" />
      ) : (
        entries.map((e) => (
          <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
            <span className="text-xs text-gray-600">{e.description}</span>
          </EntryRow>
        ))
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
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadLog(date);
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch(`/api/projects/${projectId}/directory`)
      .then((r) => r.ok ? r.json() : [])
      .then((contacts: { type: string; company: string | null }[]) => {
        const names = Array.from(
          new Set(
            contacts
              .map((c) => c.company)
              .filter((name): name is string => !!name),
          ),
        ).sort((a, b) => a.localeCompare(b));
        setCompanySuggestions(names);
      })
      .catch(() => {});
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

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
          setForm({
            ...emptyForm(d),
            ...data,
            note_entries: data.note_entries ?? [],
            weather_observations: data.weather_observations ?? [],
          });
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

  function addToList(key: keyof LogForm, entry: unknown) {
    setForm((prev) => ({ ...prev, [key]: [...(prev[key] as unknown[]), entry] }));
    setDirty(true);
  }

  function removeFromList(key: keyof LogForm, id: string) {
    setForm((prev) => ({
      ...prev,
      [key]: (prev[key] as { id: string }[]).filter((e) => e.id !== id),
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
                {loading
                  ? "Loading..."
                  : logId
                  ? dirty
                    ? "Unsaved changes"
                    : "Log saved"
                  : "No log for this date"}
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
            <WeatherSection
              form={form}
              patch={patch}
              observations={form.weather_observations}
              onAddObs={(o) => addToList("weather_observations", o)}
              onDeleteObs={(id) => removeFromList("weather_observations", id)}
            />

            <ManpowerSection
              entries={form.manpower}
              onAdd={(e) => addToList("manpower", e)}
              onDelete={(id) => removeFromList("manpower", id)}
              companySuggestions={companySuggestions}
            />

            <InspectionsSection
              entries={form.inspections}
              onAdd={(e) => addToList("inspections", e)}
              onDelete={(id) => removeFromList("inspections", id)}
            />

            <DeliveriesSection
              entries={form.deliveries}
              onAdd={(e) => addToList("deliveries", e)}
              onDelete={(id) => removeFromList("deliveries", id)}
            />

            <VisitorsSection
              entries={form.visitors}
              onAdd={(e) => addToList("visitors", e)}
              onDelete={(id) => removeFromList("visitors", id)}
            />

            <SafetyViolationsSection
              entries={form.safety_violations}
              onAdd={(e) => addToList("safety_violations", e)}
              onDelete={(id) => removeFromList("safety_violations", id)}
            />

            <AccidentsSection
              entries={form.accidents}
              onAdd={(e) => addToList("accidents", e)}
              onDelete={(id) => removeFromList("accidents", id)}
            />

            <DelaysSection
              entries={form.delays}
              onAdd={(e) => addToList("delays", e)}
              onDelete={(id) => removeFromList("delays", id)}
            />

            <NoteEntriesSection
              entries={form.note_entries}
              onAdd={(e) => addToList("note_entries", e)}
              onDelete={(id) => removeFromList("note_entries", id)}
            />

            <PhotosSection
              entries={form.photos}
              onAdd={(e) => addToList("photos", e)}
              onDelete={(id) => removeFromList("photos", id)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
