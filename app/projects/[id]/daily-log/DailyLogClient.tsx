"use client";

import { useState, useEffect, useRef } from "react";
import ProjectNav from "@/components/ProjectNav";
import { Skeleton } from "@/app/components/Skeleton";

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

function weatherCodeToCondition(code: number): string {
  if (code <= 1) return "Clear";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 67) return code >= 63 ? "Heavy Rain" : "Light Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code === 80 || code === 81) return "Light Rain";
  if (code === 82) return "Heavy Rain";
  if (code === 85 || code === 86) return "Snow";
  if (code >= 95) return "Heavy Rain";
  return "Other";
}
const SKY_OPTIONS = ["", "Clear", "Partly Cloudy", "Cloudy", "Overcast", "Fog"];
const DELAY_TYPES = [
  "", "Weather", "Labor", "Material", "Equipment",
  "Design", "Owner", "Subcontractor", "Other",
];

// ── Shared UI primitives ─────────────────────────────────────────────────────

function SectionCard({
  title, badge, children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {badge && <span className="text-xs text-gray-400">{badge}</span>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

// Shared input styles (compact, for inline form rows)
const inCls =
  "w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-400 bg-white";
const selCls =
  "w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white";

// Label + input column used in both display rows and form rows
function Col({ label, minW, children }: { label: string; minW: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5" style={{ minWidth: minW }}>
      <span className="text-gray-400 font-medium uppercase tracking-wide text-[10px]">{label}</span>
      {children}
    </div>
  );
}

// A row that displays saved data (with delete button on hover)
function EntryRow({ children, onDelete }: {
  children: React.ReactNode; onDelete: () => void;
}) {
  return (
    <div className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 group">
      <div className="flex items-center justify-between gap-3">
        <div className="overflow-x-auto flex-1 min-w-0">
          <div className="inline-flex gap-6 text-xs">
            {children}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="shrink-0 p-1 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// An always-visible form row at the bottom of a section
function FormRow({ onSubmit, children }: {
  onSubmit: () => void; children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/40">
      <div className="overflow-x-auto">
        <div className="inline-flex items-end gap-4 text-xs">
          {children}
          <div className="shrink-0 pb-0.5">
            <button
              onClick={onSubmit}
              className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Add Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [draft, setDraft] = useState(emptyInspection());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptyInspection());
  }

  return (
    <SectionCard title="Inspections">
      {entries.map((e) => (
        <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
          {e.inspection_type && <Col label="Type" minW="120px"><span className="text-gray-800 font-medium">{e.inspection_type}</span></Col>}
          {e.start_time && <Col label="Start" minW="60px"><span className="text-gray-700">{e.start_time}</span></Col>}
          {e.end_time && <Col label="End" minW="60px"><span className="text-gray-700">{e.end_time}</span></Col>}
          {e.inspecting_entity && <Col label="Entity" minW="110px"><span className="text-gray-700">{e.inspecting_entity}</span></Col>}
          {e.inspector_name && <Col label="Inspector" minW="110px"><span className="text-gray-700">{e.inspector_name}</span></Col>}
          {e.location && <Col label="Location" minW="100px"><span className="text-gray-700">{e.location}</span></Col>}
          {e.inspection_area && <Col label="Area" minW="100px"><span className="text-gray-700">{e.inspection_area}</span></Col>}
          {e.comments && <Col label="Comments" minW="140px"><span className="text-gray-500">{e.comments}</span></Col>}
        </EntryRow>
      ))}
      <FormRow onSubmit={handleCreate}>
        <Col label="Type" minW="120px"><input value={draft.inspection_type} onChange={(e) => set("inspection_type", e.target.value)} placeholder="e.g. Fire Safety" className={inCls} /></Col>
        <Col label="Start" minW="90px"><input type="time" value={draft.start_time} onChange={(e) => set("start_time", e.target.value)} className={inCls} /></Col>
        <Col label="End" minW="90px"><input type="time" value={draft.end_time} onChange={(e) => set("end_time", e.target.value)} className={inCls} /></Col>
        <Col label="Entity" minW="120px"><input value={draft.inspecting_entity} onChange={(e) => set("inspecting_entity", e.target.value)} placeholder="City Inspector" className={inCls} /></Col>
        <Col label="Inspector" minW="120px"><input value={draft.inspector_name} onChange={(e) => set("inspector_name", e.target.value)} placeholder="Full name" className={inCls} /></Col>
        <Col label="Location" minW="110px"><input value={draft.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Level 3" className={inCls} /></Col>
        <Col label="Area" minW="110px"><input value={draft.inspection_area} onChange={(e) => set("inspection_area", e.target.value)} placeholder="e.g. Electrical" className={inCls} /></Col>
        <Col label="Comments" minW="160px"><input value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Notes..." className={inCls} /></Col>
      </FormRow>
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
  const [draft, setDraft] = useState(emptyDelivery());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptyDelivery());
  }

  return (
    <SectionCard title="Deliveries">
      {entries.map((e) => (
        <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
          {e.time && <Col label="Time" minW="60px"><span className="text-gray-700">{e.time}</span></Col>}
          {e.delivery_from && <Col label="From" minW="110px"><span className="text-gray-800 font-medium">{e.delivery_from}</span></Col>}
          {e.contents && <Col label="Contents" minW="120px"><span className="text-gray-700">{e.contents}</span></Col>}
          {e.tracking_number && <Col label="Tracking #" minW="100px"><span className="text-gray-700">{e.tracking_number}</span></Col>}
          {e.comments && <Col label="Comments" minW="140px"><span className="text-gray-500">{e.comments}</span></Col>}
        </EntryRow>
      ))}
      <FormRow onSubmit={handleCreate}>
        <Col label="Time" minW="90px"><input type="time" value={draft.time} onChange={(e) => set("time", e.target.value)} className={inCls} /></Col>
        <Col label="From" minW="130px"><input value={draft.delivery_from} onChange={(e) => set("delivery_from", e.target.value)} placeholder="Supplier / vendor" className={inCls} /></Col>
        <Col label="Contents" minW="140px"><input value={draft.contents} onChange={(e) => set("contents", e.target.value)} placeholder="Material description" className={inCls} /></Col>
        <Col label="Tracking #" minW="120px"><input value={draft.tracking_number} onChange={(e) => set("tracking_number", e.target.value)} placeholder="Optional" className={inCls} /></Col>
        <Col label="Comments" minW="160px"><input value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Notes..." className={inCls} /></Col>
      </FormRow>
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
  const [draft, setDraft] = useState(emptyVisitor());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptyVisitor());
  }

  return (
    <SectionCard title="Visitors">
      {entries.map((e) => (
        <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
          {e.visitor && <Col label="Visitor" minW="140px"><span className="text-gray-800 font-medium">{e.visitor}</span></Col>}
          {e.start_time && <Col label="Start" minW="60px"><span className="text-gray-700">{e.start_time}</span></Col>}
          {e.end_time && <Col label="End" minW="60px"><span className="text-gray-700">{e.end_time}</span></Col>}
          {e.comments && <Col label="Comments" minW="140px"><span className="text-gray-500">{e.comments}</span></Col>}
        </EntryRow>
      ))}
      <FormRow onSubmit={handleCreate}>
        <Col label="Visitor" minW="160px"><input value={draft.visitor} onChange={(e) => set("visitor", e.target.value)} placeholder="Name and company" className={inCls} /></Col>
        <Col label="Start" minW="90px"><input type="time" value={draft.start_time} onChange={(e) => set("start_time", e.target.value)} className={inCls} /></Col>
        <Col label="End" minW="90px"><input type="time" value={draft.end_time} onChange={(e) => set("end_time", e.target.value)} className={inCls} /></Col>
        <Col label="Comments" minW="180px"><input value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Purpose of visit..." className={inCls} /></Col>
      </FormRow>
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
  const [draft, setDraft] = useState(emptySafetyViolation());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptySafetyViolation());
  }

  return (
    <SectionCard title="Safety Violations">
      {entries.map((e) => (
        <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
          {e.subject && <Col label="Subject" minW="140px"><span className="text-gray-800 font-medium">{e.subject}</span></Col>}
          {e.time && <Col label="Time" minW="60px"><span className="text-gray-700">{e.time}</span></Col>}
          {e.issued_to && <Col label="Issued To" minW="110px"><span className="text-gray-700">{e.issued_to}</span></Col>}
          {e.safety_notice && <Col label="Notice" minW="90px"><span className="text-gray-700">{e.safety_notice}</span></Col>}
          {e.compliance_due && <Col label="Due" minW="90px"><span className="text-gray-700">{e.compliance_due}</span></Col>}
          {e.comments && <Col label="Comments" minW="140px"><span className="text-gray-500">{e.comments}</span></Col>}
        </EntryRow>
      ))}
      <FormRow onSubmit={handleCreate}>
        <Col label="Subject" minW="140px"><input value={draft.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Brief description" className={inCls} /></Col>
        <Col label="Time" minW="90px"><input type="time" value={draft.time} onChange={(e) => set("time", e.target.value)} className={inCls} /></Col>
        <Col label="Issued To" minW="120px"><input value={draft.issued_to} onChange={(e) => set("issued_to", e.target.value)} placeholder="Person / company" className={inCls} /></Col>
        <Col label="Notice #" minW="100px"><input value={draft.safety_notice} onChange={(e) => set("safety_notice", e.target.value)} placeholder="Notice # or type" className={inCls} /></Col>
        <Col label="Due" minW="110px"><input type="date" value={draft.compliance_due} onChange={(e) => set("compliance_due", e.target.value)} className={inCls} /></Col>
        <Col label="Comments" minW="160px"><input value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Details..." className={inCls} /></Col>
      </FormRow>
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
  const [draft, setDraft] = useState(emptyAccident());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptyAccident());
  }

  return (
    <SectionCard title="Accidents">
      {entries.map((e) => (
        <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
          {e.time && <Col label="Time" minW="60px"><span className="text-gray-700">{e.time}</span></Col>}
          {e.party_involved && <Col label="Party Involved" minW="110px"><span className="text-gray-800 font-medium">{e.party_involved}</span></Col>}
          {e.company_involved && <Col label="Company" minW="110px"><span className="text-gray-700">{e.company_involved}</span></Col>}
          {e.comments && <Col label="Comments" minW="140px"><span className="text-gray-500">{e.comments}</span></Col>}
        </EntryRow>
      ))}
      <FormRow onSubmit={handleCreate}>
        <Col label="Time" minW="90px"><input type="time" value={draft.time} onChange={(e) => set("time", e.target.value)} className={inCls} /></Col>
        <Col label="Party Involved" minW="140px"><input value={draft.party_involved} onChange={(e) => set("party_involved", e.target.value)} placeholder="Person's name" className={inCls} /></Col>
        <Col label="Company" minW="130px"><input value={draft.company_involved} onChange={(e) => set("company_involved", e.target.value)} placeholder="Company name" className={inCls} /></Col>
        <Col label="Comments" minW="180px"><input value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Describe the incident..." className={inCls} /></Col>
      </FormRow>
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
  }

  const totalHours = entries.reduce((sum, e) => sum + (parseFloat(e.duration_hours) || 0), 0);

  return (
    <SectionCard title="Delays" badge={`${totalHours.toFixed(2)} Total Hours`}>
      {entries.map((e) => (
        <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
          {e.delay_type && <Col label="Type" minW="110px"><span className="text-gray-800 font-medium">{e.delay_type}</span></Col>}
          {e.start_time && <Col label="Start" minW="60px"><span className="text-gray-700">{e.start_time}</span></Col>}
          {e.end_time && <Col label="End" minW="60px"><span className="text-gray-700">{e.end_time}</span></Col>}
          {e.duration_hours && <Col label="Duration" minW="70px"><span className="text-gray-700">{e.duration_hours}h</span></Col>}
          {e.location && <Col label="Location" minW="100px"><span className="text-gray-700">{e.location}</span></Col>}
          {e.comments && <Col label="Comments" minW="140px"><span className="text-gray-500">{e.comments}</span></Col>}
        </EntryRow>
      ))}
      <FormRow onSubmit={handleCreate}>
        <Col label="Type" minW="130px">
          <select value={draft.delay_type} onChange={(e) => setField("delay_type", e.target.value)} className={selCls}>
            {DELAY_TYPES.map((t) => <option key={t} value={t}>{t || "— Select —"}</option>)}
          </select>
        </Col>
        <Col label="Start" minW="90px"><input type="time" value={draft.start_time} onChange={(e) => setField("start_time", e.target.value)} className={inCls} /></Col>
        <Col label="End" minW="90px"><input type="time" value={draft.end_time} onChange={(e) => setField("end_time", e.target.value)} className={inCls} /></Col>
        <Col label="Duration" minW="90px"><input value={draft.duration_hours} readOnly disabled placeholder="Auto" className={inCls} /></Col>
        <Col label="Location" minW="120px"><input value={draft.location} onChange={(e) => setField("location", e.target.value)} placeholder="Area affected" className={inCls} /></Col>
        <Col label="Comments" minW="160px"><input value={draft.comments} onChange={(e) => setField("comments", e.target.value)} placeholder="Cause and impact..." className={inCls} /></Col>
      </FormRow>
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
  const [draft, setDraft] = useState(emptyNoteEntry());

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptyNoteEntry());
  }

  return (
    <SectionCard title="Notes">
      {entries.map((e) => (
        <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
          <Col label="Flag" minW="50px">
            {e.is_issue
              ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">Issue</span>
              : <span className="text-gray-400">—</span>
            }
          </Col>
          {e.location && <Col label="Location" minW="110px"><span className="text-gray-700">{e.location}</span></Col>}
          {e.comments && <Col label="Note" minW="200px"><span className="text-gray-600">{e.comments}</span></Col>}
        </EntryRow>
      ))}
      <FormRow onSubmit={handleCreate}>
        <Col label="Issue?" minW="60px">
          <label className="flex items-center gap-1.5 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={draft.is_issue}
              onChange={(e) => setDraft((d) => ({ ...d, is_issue: e.target.checked }))}
              className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-xs text-gray-600">Yes</span>
          </label>
        </Col>
        <Col label="Location" minW="140px"><input value={draft.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} placeholder="Area or location" className={inCls} /></Col>
        <Col label="Note" minW="240px"><input value={draft.comments} onChange={(e) => setDraft((d) => ({ ...d, comments: e.target.value }))} placeholder="Note details..." className={inCls} /></Col>
      </FormRow>
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
  const [draft, setDraft] = useState(emptyManpower());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAdd({ id: uid(), ...draft });
    setDraft(emptyManpower());
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
    >
      {entries.map((e) => (
        <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
          {e.company && <Col label="Company" minW="120px"><span className="text-gray-800 font-medium">{e.company}</span></Col>}
          <Col label="Workers" minW="60px"><span className="text-gray-700">{e.workers || "—"}</span></Col>
          <Col label="Hrs/Worker" minW="70px"><span className="text-gray-700">{e.hours || "—"}</span></Col>
          <Col label="Total Hrs" minW="70px"><span className="text-gray-700">{((parseInt(e.workers) || 0) * (parseFloat(e.hours) || 0)).toFixed(1)}h</span></Col>
          {e.location && <Col label="Location" minW="100px"><span className="text-gray-700">{e.location}</span></Col>}
          {e.cost_code && <Col label="Cost Code" minW="80px"><span className="text-gray-700">{e.cost_code}</span></Col>}
          {e.comments && <Col label="Comments" minW="140px"><span className="text-gray-500">{e.comments}</span></Col>}
        </EntryRow>
      ))}
      <FormRow onSubmit={handleCreate}>
        <Col label="Company" minW="150px">
          <input
            list="manpower-companies"
            value={draft.company}
            onChange={(e) => set("company", e.target.value)}
            placeholder="Trade / company"
            className={inCls}
          />
          <datalist id="manpower-companies">
            {companySuggestions.map((name) => <option key={name} value={name} />)}
          </datalist>
        </Col>
        <Col label="Workers" minW="70px"><input type="number" min="0" value={draft.workers} onChange={(e) => set("workers", e.target.value)} placeholder="0" className={inCls} /></Col>
        <Col label="Hrs/Worker" minW="80px"><input type="number" min="0" step="0.5" value={draft.hours} onChange={(e) => set("hours", e.target.value)} placeholder="0" className={inCls} /></Col>
        <Col label="Total Hrs" minW="80px"><input value={draftTotalHours} readOnly disabled placeholder="Auto" className={inCls} /></Col>
        <Col label="Location" minW="120px"><input value={draft.location} onChange={(e) => set("location", e.target.value)} placeholder="Work area" className={inCls} /></Col>
        <Col label="Cost Code" minW="100px"><input value={draft.cost_code} onChange={(e) => set("cost_code", e.target.value)} placeholder="Optional" className={inCls} /></Col>
        <Col label="Comments" minW="160px"><input value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Optional notes..." className={inCls} /></Col>
      </FormRow>
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
  const [draft, setDraft] = useState(emptyWeatherObs());
  const set = (f: keyof typeof draft, v: string) => setDraft((d) => ({ ...d, [f]: v }));

  function handleCreate() {
    onAddObs({ id: uid(), ...draft });
    setDraft(emptyWeatherObs());
  }

  // Inline input style for general weather (full-width)
  const inputCls =
    "w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-400";

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
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Temperature</label>
            <input value={form.weather_temp} onChange={(e) => patch("weather_temp", e.target.value)} placeholder="e.g. 72°F" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Wind</label>
            <input value={form.weather_wind} onChange={(e) => patch("weather_wind", e.target.value)} placeholder="e.g. 10 mph NW" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Humidity / Other</label>
            <input value={form.weather_humidity} onChange={(e) => patch("weather_humidity", e.target.value)} placeholder="e.g. 65%" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Time-based observations */}
      <div>
        <div className="flex items-center px-4 py-2.5 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Observed Weather Conditions
          </span>
        </div>

        {observations.map((o) => (
          <EntryRow key={o.id} onDelete={() => onDeleteObs(o.id)}>
            {o.time_observed && <Col label="Time" minW="60px"><span className="text-gray-800 font-medium">{o.time_observed}</span></Col>}
            {o.sky && <Col label="Sky" minW="80px"><span className="text-gray-700">{o.sky}</span></Col>}
            {o.temperature && <Col label="Temp" minW="70px"><span className="text-gray-700">{o.temperature}</span></Col>}
            {o.wind && <Col label="Wind" minW="80px"><span className="text-gray-700">{o.wind}</span></Col>}
            {o.avg_precipitation && <Col label="Precip" minW="80px"><span className="text-gray-700">{o.avg_precipitation}</span></Col>}
            {o.ground_sea && <Col label="Ground" minW="70px"><span className="text-gray-700">{o.ground_sea}</span></Col>}
            {o.calamity && <Col label="Calamity" minW="90px"><span className="text-gray-700">{o.calamity}</span></Col>}
            {o.delay && (
              <Col label="Delay" minW="70px">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700">Weather</span>
              </Col>
            )}
            {o.comments && <Col label="Comments" minW="140px"><span className="text-gray-500">{o.comments}</span></Col>}
          </EntryRow>
        ))}

        <FormRow onSubmit={handleCreate}>
          <Col label="Time" minW="90px"><input type="time" value={draft.time_observed} onChange={(e) => set("time_observed", e.target.value)} className={inCls} /></Col>
          <Col label="Sky" minW="110px">
            <select value={draft.sky} onChange={(e) => set("sky", e.target.value)} className={selCls}>
              {SKY_OPTIONS.map((s) => <option key={s} value={s}>{s || "— Select —"}</option>)}
            </select>
          </Col>
          <Col label="Temp" minW="90px"><input value={draft.temperature} onChange={(e) => set("temperature", e.target.value)} placeholder="e.g. 68°F" className={inCls} /></Col>
          <Col label="Wind" minW="110px"><input value={draft.wind} onChange={(e) => set("wind", e.target.value)} placeholder="e.g. 15 mph NE" className={inCls} /></Col>
          <Col label="Precip" minW="110px"><input value={draft.avg_precipitation} onChange={(e) => set("avg_precipitation", e.target.value)} placeholder="e.g. Light rain" className={inCls} /></Col>
          <Col label="Ground" minW="90px"><input value={draft.ground_sea} onChange={(e) => set("ground_sea", e.target.value)} placeholder="e.g. Wet" className={inCls} /></Col>
          <Col label="Calamity" minW="110px"><input value={draft.calamity} onChange={(e) => set("calamity", e.target.value)} placeholder="e.g. Flooding" className={inCls} /></Col>
          <Col label="Delay?" minW="60px">
            <label className="flex items-center gap-1.5 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={draft.delay}
                onChange={(e) => setDraft((d) => ({ ...d, delay: e.target.checked }))}
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-xs text-gray-600">Yes</span>
            </label>
          </Col>
          <Col label="Comments" minW="160px"><input value={draft.comments} onChange={(e) => set("comments", e.target.value)} placeholder="Additional notes..." className={inCls} /></Col>
        </FormRow>
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
  const [desc, setDesc] = useState("");

  function handleCreate() {
    if (!desc.trim()) return;
    onAdd({ id: uid(), description: desc.trim() });
    setDesc("");
  }

  return (
    <SectionCard title="Photos">
      {entries.map((e) => (
        <EntryRow key={e.id} onDelete={() => onDelete(e.id)}>
          <Col label="Description" minW="200px"><span className="text-xs text-gray-600">{e.description}</span></Col>
        </EntryRow>
      ))}
      <FormRow onSubmit={handleCreate}>
        <Col label="Description / Reference" minW="280px">
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Photo caption or file reference..." className={inCls} />
        </Col>
      </FormRow>
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

  const formRef = useRef<LogForm>(emptyForm(todayISO()));
  const logIdRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    logIdRef.current = null;
    setDirty(false);
    setSavedOnce(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/daily-log?date=${d}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const loaded: LogForm = {
            ...emptyForm(d),
            ...data,
            note_entries: data.note_entries ?? [],
            weather_observations: data.weather_observations ?? [],
          };
          setForm(loaded);
          formRef.current = loaded;
          setLogId(data.id);
          logIdRef.current = data.id;
          setSavedOnce(true);
          if (d === todayISO() && !loaded.weather_conditions && !loaded.weather_temp) {
            fetchAndPrefillWeather(d, data.id, loaded);
          }
        } else {
          const empty = emptyForm(d);
          setForm(empty);
          formRef.current = empty;
          if (d === todayISO()) {
            fetchAndPrefillWeather(d, null, empty);
          }
        }
      } else {
        const empty = emptyForm(d);
        setForm(empty);
        formRef.current = empty;
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchAndPrefillWeather(d: string, currentLogId: string | null, currentForm: LogForm) {
    try {
      const projRes = await fetch(`/api/projects/${projectId}`);
      if (!projRes.ok) return;
      const proj = await projRes.json();
      const location = [proj.city, proj.state].filter(Boolean).join(", ");
      if (!location) return;

      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
        { headers: { "User-Agent": "SiteCommand/1.0" } },
      );
      if (!geoRes.ok) return;
      const geoData = await geoRes.json();
      if (!geoData.length) return;
      const { lat, lon } = geoData[0];

      const wxRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph`,
      );
      if (!wxRes.ok) return;
      const wxData = await wxRes.json();
      const c = wxData.current;

      const next: LogForm = {
        ...currentForm,
        weather_conditions: weatherCodeToCondition(c.weather_code),
        weather_temp: `${Math.round(c.temperature_2m)}°F`,
        weather_wind: `${Math.round(c.wind_speed_10m)} mph`,
        weather_humidity: `${Math.round(c.relative_humidity_2m)}%`,
      };
      setForm(next);
      formRef.current = next;
      await saveFormData(next, currentLogId);
    } catch {
      // silently fail — weather prefill is best-effort
    }
  }

  function patch<K extends keyof LogForm>(key: K, value: LogForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      formRef.current = next;
      return next;
    });
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveFormData(formRef.current, logIdRef.current);
    }, 800);
  }

  async function saveFormData(formData: LogForm, currentLogId: string | null) {
    setSaving(true);
    try {
      const payload = { ...formData, log_date: date };
      const res = currentLogId
        ? await fetch(`/api/projects/${projectId}/daily-log`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: currentLogId, ...payload }),
          })
        : await fetch(`/api/projects/${projectId}/daily-log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (res.ok) {
        const data = await res.json();
        setLogId(data.id);
        logIdRef.current = data.id;
        setDirty(false);
        setSavedOnce(true);
      }
    } finally {
      setSaving(false);
    }
  }

  function addToList(key: keyof LogForm, entry: unknown) {
    const newForm = { ...form, [key]: [...(form[key] as unknown[]), entry] };
    setForm(newForm);
    saveFormData(newForm, logId);
  }

  function removeFromList(key: keyof LogForm, id: string) {
    const newForm = {
      ...form,
      [key]: (form[key] as { id: string }[]).filter((e) => e.id !== id),
    };
    setForm(newForm);
    saveFormData(newForm, logId);
  }

  async function handleSave() {
    await saveFormData(form, logId);
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
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
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
