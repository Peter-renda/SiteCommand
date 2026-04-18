"use client";

import { useEffect, useMemo, useState } from "react";
import ProjectNav from "@/components/ProjectNav";

type Quantity = { id?: string; units_installed: number; uom?: string | null; notes?: string | null };
type Entry = {
  id: string;
  resource_name: string;
  resource_id?: string | null;
  resource_type: "employee" | "equipment";
  total_hours: number;
  start_time?: string | null;
  stop_time?: string | null;
  lunch_minutes: number;
  time_type: string;
  billable: boolean;
  location_path?: string | null;
  location_id?: string | null;
  description?: string | null;
  status: "draft" | "submitted" | "approved" | "completed";
  quantity?: Quantity[] | Quantity | null;
};
type Timesheet = {
  id: string;
  work_date: string;
  status: "draft" | "submitted" | "approved" | "completed";
  notes?: string | null;
  entries: Entry[];
};
type Location = { id: string; parent_id?: string | null; name: string; path: string };
type DirectoryContact = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  email?: string | null;
};

const TIME_TYPES = ["regular", "overtime", "double_time", "holiday", "pto", "vacation", "salary", "exempt"];

export default function TimesheetsClient({ projectId, username }: { projectId: string; username: string }) {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [directory, setDirectory] = useState<Array<{ id: string; name: string }>>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [locationParent, setLocationParent] = useState("");
  const [resourceIds, setResourceIds] = useState<string[]>([]);
  const [bulk, setBulk] = useState({ total_hours: "8", time_type: "regular", billable: true, description: "" });
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  const selected = useMemo(() => timesheets.find((t) => t.id === selectedId) || null, [timesheets, selectedId]);

  async function loadAll() {
    setLoading(true);
    try {
      const [sheetsRes, dirRes, locRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/timesheets`),
        fetch(`/api/projects/${projectId}/directory`),
        fetch(`/api/projects/${projectId}/locations`),
      ]);
      if (sheetsRes.status === 401 || dirRes.status === 401 || locRes.status === 401) window.location.href = "/";

      const [sheets, dir, locs] = await Promise.all([sheetsRes.json(), dirRes.json(), locRes.json()]);
      setTimesheets(Array.isArray(sheets) ? sheets : []);
      setDirectory(
        Array.isArray(dir)
          ? (dir as DirectoryContact[]).map((d) => ({
              id: d.id,
              name:
                `${d.first_name || ""} ${d.last_name || ""}`.trim() ||
                d.company ||
                d.email ||
                "Unknown",
            }))
          : [],
      );
      setLocations(Array.isArray(locs) ? locs : []);
      if (!selectedId && Array.isArray(sheets) && sheets.length) setSelectedId(sheets[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function createTimesheet(copyFromTimesheetId?: string) {
    const res = await fetch(`/api/projects/${projectId}/timesheets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ work_date: newDate, copy_from_timesheet_id: copyFromTimesheetId || null }),
    });
    if (!res.ok) {
      alert((await res.json()).error || "Unable to create timesheet");
      return;
    }
    const created = await res.json();
    setTimesheets((prev) => [created, ...prev.filter((x) => x.id !== created.id)]);
    setSelectedId(created.id);
  }

  async function addResources() {
    if (!selected || !resourceIds.length) return;
    const resources = directory.filter((d) => resourceIds.includes(d.id)).map((d) => ({ id: d.id, name: d.name, type: "employee" }));
    const res = await fetch(`/api/projects/${projectId}/timesheets/${selected.id}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_resources", resources }),
    });
    if (!res.ok) return alert((await res.json()).error || "Unable to add resources");
    const entries = await res.json();
    setTimesheets((prev) => prev.map((t) => (t.id === selected.id ? { ...t, entries } : t)));
    setResourceIds([]);
  }

  async function applyBulk() {
    if (!selected || !selectedEntries.length) return;
    const res = await fetch(`/api/projects/${projectId}/timesheets/${selected.id}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "bulk_apply",
        entry_ids: selectedEntries,
        total_hours: Number(bulk.total_hours) || 0,
        time_type: bulk.time_type,
        billable: bulk.billable,
        description: bulk.description || null,
      }),
    });
    if (!res.ok) return alert((await res.json()).error || "Unable to bulk update entries");
    const entries = await res.json();
    setTimesheets((prev) => prev.map((t) => (t.id === selected.id ? { ...t, entries } : t)));
  }

  async function saveEntry(entry: Entry, patch: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${projectId}/timesheets/${selected?.id}/entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return alert((await res.json()).error || "Unable to save entry");
    const updated = await res.json();
    setTimesheets((prev) =>
      prev.map((t) =>
        t.id === selected?.id ? { ...t, entries: t.entries.map((e) => (e.id === entry.id ? { ...e, ...updated } : e)) } : t,
      ),
    );
  }

  async function deleteEntry(entryId: string) {
    if (!selected || !confirm("Delete this timecard entry?")) return;
    const res = await fetch(`/api/projects/${projectId}/timesheets/${selected.id}/entries/${entryId}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error || "Unable to delete entry");
    setTimesheets((prev) => prev.map((t) => (t.id === selected.id ? { ...t, entries: t.entries.filter((e) => e.id !== entryId) } : t)));
  }

  async function addQuantity(entry: Entry) {
    const units = prompt("Units Installed", String(Array.isArray(entry.quantity) ? entry.quantity[0]?.units_installed || 0 : (entry.quantity as Quantity | null)?.units_installed || 0));
    if (units === null) return;
    const uom = prompt("Unit of Measure (optional)", Array.isArray(entry.quantity) ? entry.quantity[0]?.uom || "" : (entry.quantity as Quantity | null)?.uom || "") || "";
    const notes = prompt("Quantity notes (optional)", Array.isArray(entry.quantity) ? entry.quantity[0]?.notes || "" : (entry.quantity as Quantity | null)?.notes || "") || "";
    await saveEntry(entry, { quantity: { units_installed: Number(units) || 0, uom: uom || null, notes: notes || null } });
  }

  async function deleteQuantity(entry: Entry) {
    if (!confirm("Delete quantity for this timecard entry?")) return;
    await saveEntry(entry, { quantity: null });
  }

  async function saveTimesheetStatus(status: Timesheet["status"]) {
    if (!selected) return;
    const res = await fetch(`/api/projects/${projectId}/timesheets/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return alert((await res.json()).error || "Unable to update timesheet");
    const updated = await res.json();
    setTimesheets((prev) => prev.map((t) => (t.id === selected.id ? updated : t)));
  }

  async function removeTimesheet(id: string) {
    if (!confirm("Delete this timesheet and all its timecards?")) return;
    const res = await fetch(`/api/projects/${projectId}/timesheets/${id}`, { method: "DELETE" });
    if (!res.ok) return alert((await res.json()).error || "Unable to delete timesheet");
    setTimesheets((prev) => prev.filter((t) => t.id !== id));
    if (selectedId === id) setSelectedId("");
  }

  async function addLocation() {
    if (!newLocationName.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newLocationName.trim(), parent_id: locationParent || null }),
    });
    if (!res.ok) return alert((await res.json()).error || "Unable to add location");
    const loc = await res.json();
    setLocations((prev) => [...prev, loc].sort((a, b) => a.path.localeCompare(b.path)));
    setNewLocationName("");
    setLocationParent("");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">SiteCommand</a>
        <div className="flex items-center gap-5"><span className="text-sm text-gray-400">{username}</span><button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button></div>
      </header>
      <ProjectNav projectId={projectId} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Work Date</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="border rounded-md px-2 py-1 text-sm" />
            </div>
            <button onClick={() => createTimesheet()} className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm">Create Timesheet</button>
            <button onClick={() => createTimesheet(selected?.id)} disabled={!selected} className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-40">Create from Previous</button>
            <button onClick={loadAll} className="px-3 py-1.5 rounded-md border text-sm">Refresh</button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <section className="col-span-12 lg:col-span-4 bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-sm mb-3">Timesheets</h2>
            <div className="space-y-2 max-h-[620px] overflow-auto">
              {loading && <p className="text-sm text-gray-500">Loading…</p>}
              {!loading && !timesheets.length && <p className="text-sm text-gray-500">No timesheets yet.</p>}
              {timesheets.map((sheet) => (
                <button key={sheet.id} onClick={() => setSelectedId(sheet.id)} className={`w-full text-left border rounded-md px-3 py-2 ${selectedId === sheet.id ? "border-gray-900 bg-gray-50" : "border-gray-200"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{sheet.work_date}</span>
                    <span className="text-xs uppercase text-gray-500">{sheet.status}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{sheet.entries?.length || 0} resources</div>
                  <button onClick={(e) => { e.stopPropagation(); void removeTimesheet(sheet.id); }} className="mt-1 text-xs text-red-600">Delete</button>
                </button>
              ))}
            </div>
          </section>

          <section className="col-span-12 lg:col-span-8 space-y-4">
            {!selected && <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-500">Choose a timesheet to manage resources and timecards.</div>}
            {selected && (
              <>
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <h2 className="font-semibold">Timesheet {selected.work_date}</h2>
                    <div className="flex gap-2">
                      {(["draft", "submitted", "approved", "completed"] as const).map((status) => (
                        <button key={status} onClick={() => saveTimesheetStatus(status)} className={`px-2 py-1 text-xs rounded-md border ${selected.status === status ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200"}`}>{status}</button>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-md p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Add Resources</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-28 overflow-auto">
                      {directory.map((d) => (
                        <label key={d.id} className="text-xs flex items-center gap-1"><input type="checkbox" checked={resourceIds.includes(d.id)} onChange={(e) => setResourceIds((prev) => e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id))} />{d.name}</label>
                      ))}
                    </div>
                    <button onClick={addResources} className="mt-2 px-2 py-1 text-xs border rounded-md">Add selected resources</button>
                  </div>

                  <div className="border rounded-md p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Bulk Time Entry</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                      <input value={bulk.total_hours} onChange={(e) => setBulk((b) => ({ ...b, total_hours: e.target.value }))} placeholder="Hours" className="border rounded px-2 py-1 text-sm" />
                      <select value={bulk.time_type} onChange={(e) => setBulk((b) => ({ ...b, time_type: e.target.value }))} className="border rounded px-2 py-1 text-sm">{TIME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                      <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={bulk.billable} onChange={(e) => setBulk((b) => ({ ...b, billable: e.target.checked }))} />Billable</label>
                      <input value={bulk.description} onChange={(e) => setBulk((b) => ({ ...b, description: e.target.value }))} placeholder="Description" className="border rounded px-2 py-1 text-sm" />
                      <button onClick={applyBulk} className="px-2 py-1 border rounded text-sm">Apply to selected</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-2"></th><th className="py-2 pr-2">Resource</th><th className="py-2 pr-2">Hours</th><th className="py-2 pr-2">Time Type</th><th className="py-2 pr-2">Location</th><th className="py-2 pr-2">Qty</th><th className="py-2 pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.entries.map((entry) => {
                        const qty = Array.isArray(entry.quantity) ? entry.quantity[0] : entry.quantity as Quantity | null;
                        return (
                          <tr key={entry.id} className="border-b align-top">
                            <td className="py-2 pr-2"><input type="checkbox" checked={selectedEntries.includes(entry.id)} onChange={(e) => setSelectedEntries((prev) => e.target.checked ? [...prev, entry.id] : prev.filter((x) => x !== entry.id))} /></td>
                            <td className="py-2 pr-2"><div className="font-medium">{entry.resource_name}</div><div className="text-xs text-gray-500">{entry.resource_type}</div></td>
                            <td className="py-2 pr-2"><input type="number" step="0.25" defaultValue={entry.total_hours} onBlur={(e) => saveEntry(entry, { total_hours: Number(e.target.value) || 0 })} className="w-20 border rounded px-1 py-0.5" /></td>
                            <td className="py-2 pr-2"><select defaultValue={entry.time_type} onChange={(e) => saveEntry(entry, { time_type: e.target.value })} className="border rounded px-1 py-0.5">{TIME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></td>
                            <td className="py-2 pr-2"><select value={entry.location_id || ""} onChange={(e) => { const loc = locations.find((l) => l.id === e.target.value); void saveEntry(entry, { location_id: loc?.id || null, location_path: loc?.path || null }); }} className="border rounded px-1 py-0.5"><option value="">—</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.path}</option>)}</select></td>
                            <td className="py-2 pr-2 text-xs">{qty ? `${qty.units_installed}${qty.uom ? ` ${qty.uom}` : ""}` : "—"}</td>
                            <td className="py-2 pr-2 space-x-2 text-xs">
                              <button onClick={() => addQuantity(entry)} className="underline">{qty ? "Edit Qty" : "Add Qty"}</button>
                              {qty && <button onClick={() => deleteQuantity(entry)} className="underline">Delete Qty</button>}
                              <button onClick={() => deleteEntry(entry.id)} className="text-red-600 underline">Delete</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-2">Multi-Tiered Locations</h3>
                  <div className="flex flex-wrap gap-2 items-end">
                    <select value={locationParent} onChange={(e) => setLocationParent(e.target.value)} className="border rounded px-2 py-1 text-sm">
                      <option value="">Top level</option>
                      {locations.map((l) => <option key={l.id} value={l.id}>{l.path}</option>)}
                    </select>
                    <input value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} placeholder="Location name" className="border rounded px-2 py-1 text-sm" />
                    <button onClick={addLocation} className="px-2 py-1 text-sm border rounded">Add New Location</button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
