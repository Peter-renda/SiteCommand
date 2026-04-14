"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type TypeConfig = {
  label: string;
  endpoint?: string;
  // Builds a dropdown label for an instance returned by the endpoint.
  buildLabel?: (row: Record<string, unknown>) => string;
  // Optional query param appended to the endpoint (e.g. for daily-log category filtering).
  query?: string;
};

function pickString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.trim().length > 0) return v;
    if (typeof v === "number") return String(v);
  }
  return null;
}

function withNumber(prefix: string, numberKeys: string[], labelKeys: string[]) {
  return (row: Record<string, unknown>) => {
    const num = pickString(row, numberKeys);
    const label = pickString(row, labelKeys);
    const left = num ? `${prefix} #${num}` : prefix;
    return label ? `${left}: ${label}` : left;
  };
}

const TYPE_CONFIGS: TypeConfig[] = [
  {
    label: "Change Event",
    endpoint: "change-events",
    buildLabel: withNumber("CE", ["number"], ["title"]),
  },
  {
    label: "Change Order Request",
    endpoint: "change-orders",
    buildLabel: withNumber("COR", ["number"], ["title", "subject"]),
  },
  {
    label: "Commitment Contract",
    endpoint: "commitments",
    buildLabel: withNumber("Commitment", ["number"], ["title", "description"]),
  },
  { label: "Commitment Contract Change Order" },
  {
    label: "Company",
    endpoint: "directory",
    buildLabel: (row) => pickString(row, ["company", "company_name", "name"]) ?? "Company",
  },
  {
    label: "Contact",
    endpoint: "directory",
    buildLabel: (row) =>
      pickString(row, ["full_name", "name", "first_name"]) ??
      pickString(row, ["email"]) ??
      "Contact",
  },
  { label: "Cost Code" },
  { label: "Cover Letters" },
  {
    label: "Document",
    endpoint: "documents",
    buildLabel: (row) => pickString(row, ["file_name", "name", "title"]) ?? "Document",
  },
  {
    label: "Drawing",
    endpoint: "drawings",
    buildLabel: (row) => pickString(row, ["title", "number", "name"]) ?? "Drawing",
  },
  { label: "Drawing Revision" },
  { label: "Email" },
  { label: "Field Order" },
  { label: "Image" },
  { label: "Location" },
  {
    label: "Meeting",
    endpoint: "meetings",
    buildLabel: (row) => pickString(row, ["title", "subject", "name"]) ?? "Meeting",
  },
  { label: "Meeting Item" },
  { label: "Owner Invoice" },
  { label: "Potential Change Order" },
  {
    label: "Prime Contract",
    endpoint: "prime-contracts",
    buildLabel: withNumber("Prime", ["number"], ["title", "name"]),
  },
  { label: "Prime Contract Change Order" },
  {
    label: "Punch Item",
    endpoint: "punch-list",
    buildLabel: withNumber("Punch", ["number"], ["title", "description"]),
  },
  { label: "Purchase Order Contract" },
  {
    label: "RFI",
    endpoint: "rfis",
    buildLabel: withNumber("RFI", ["rfi_number", "number"], ["subject", "title"]),
  },
  { label: "Request For Quote" },
  {
    label: "Schedule Task",
    endpoint: "schedule",
    buildLabel: (row) => pickString(row, ["name", "title"]) ?? "Task",
  },
  {
    label: "Specification Section",
    endpoint: "specifications",
    buildLabel: (row) =>
      pickString(row, ["section_number", "number", "title", "name"]) ?? "Section",
  },
  { label: "Specification Section Revision" },
  { label: "Subcontractor Invoice" },
  {
    label: "Submittal Package",
    endpoint: "submittal-packages",
    buildLabel: withNumber("Package", ["number"], ["title", "name"]),
  },
  {
    label: "Submittals",
    endpoint: "submittals",
    buildLabel: withNumber("Submittal", ["number"], ["title", "subject"]),
  },
  {
    label: "Task Item",
    endpoint: "tasks",
    buildLabel: (row) => pickString(row, ["title", "name", "description"]) ?? "Task",
  },
  {
    label: "Transmittals",
    endpoint: "transmittals",
    buildLabel: withNumber("Transmittal", ["number"], ["title", "subject"]),
  },
];

const DAILY_LOG_CATEGORIES = [
  "Accidents Log",
  "Delays Log",
  "Deliveries Log",
  "Inspections Log",
  "Manpower Log",
  "Notes Log",
  "Observed Weather Conditions Log",
  "Safety Violations Log",
  "Visitors Log",
];

for (const category of DAILY_LOG_CATEGORIES) {
  TYPE_CONFIGS.push({
    label: category,
    endpoint: "daily-log",
    query: `category=${encodeURIComponent(category.replace(/ Log$/, "").toLowerCase())}`,
    buildLabel: (row) =>
      pickString(row, ["title", "summary", "description", "date"]) ?? category,
  });
}

const TYPE_CONFIG_MAP: Record<string, TypeConfig> = Object.fromEntries(
  TYPE_CONFIGS.map((t) => [t.label, t]),
);

type Instance = { id: string; label: string };

type RelatedItem = {
  id: string;
  type: string;
  instanceId: string;
  instanceLabel: string;
  date: string;
  notes: string;
};

type RelatedItemRow = {
  id: string;
  item_type: string | null;
  item_id: string | null;
  item_label: string | null;
  item_date: string | null;
  notes: string | null;
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function rowFromServer(row: RelatedItemRow): RelatedItem {
  return {
    id: row.id,
    type: row.item_type ?? "",
    instanceId: row.item_id ?? "",
    instanceLabel: row.item_label ?? "",
    date: row.item_date ?? "",
    notes: row.notes ?? "",
  };
}

export default function RelatedItemsTab({
  projectId,
  eventId,
  canWrite,
}: {
  projectId: string;
  eventId: string;
  canWrite: boolean;
}) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instanceCache, setInstanceCache] = useState<Record<string, Instance[]>>({});
  const [loadingTypes, setLoadingTypes] = useState<Record<string, boolean>>({});
  const notesDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const baseUrl = `/api/projects/${projectId}/change-events/${eventId}/related-items`;

  const loadInstances = useCallback(
    async (type: string) => {
      if (!type) return;
      if (instanceCache[type]) return;
      const cfg = TYPE_CONFIG_MAP[type];
      if (!cfg?.endpoint) {
        setInstanceCache((prev) => ({ ...prev, [type]: [] }));
        return;
      }
      setLoadingTypes((prev) => ({ ...prev, [type]: true }));
      try {
        const url = `/api/projects/${projectId}/${cfg.endpoint}${cfg.query ? `?${cfg.query}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) {
          setInstanceCache((prev) => ({ ...prev, [type]: [] }));
          return;
        }
        const data = await res.json();
        const rows: Record<string, unknown>[] = Array.isArray(data)
          ? data
          : Array.isArray((data as { items?: unknown[] }).items)
            ? ((data as { items: Record<string, unknown>[] }).items)
            : [];
        const instances: Instance[] = rows
          .map((row) => {
            const rawId = row.id ?? row.uuid ?? row.number;
            if (rawId === undefined || rawId === null) return null;
            const label = cfg.buildLabel ? cfg.buildLabel(row) : pickString(row, ["title", "name", "subject"]) ?? String(rawId);
            return { id: String(rawId), label };
          })
          .filter((x): x is Instance => x !== null);
        setInstanceCache((prev) => ({ ...prev, [type]: instances }));
      } catch {
        setInstanceCache((prev) => ({ ...prev, [type]: [] }));
      } finally {
        setLoadingTypes((prev) => ({ ...prev, [type]: false }));
      }
    },
    [projectId, instanceCache, loadingTypes],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(baseUrl)
      .then((r) => r.json())
      .then((data: RelatedItemRow[] | { error: string }) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setItems(data.map(rowFromServer));
        }
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  // Preload instance cache for types that already appear in the saved items
  // so their Description dropdowns render immediately on first render.
  useEffect(() => {
    const neededTypes = new Set(items.map((i) => i.type).filter(Boolean));
    neededTypes.forEach((t) => {
      void loadInstances(t);
    });
  }, [items, loadInstances]);

  async function addRow() {
    if (!canWrite) return;
    setSaving(true);
    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_date: todayISO() }),
      });
      if (!res.ok) return;
      const row: RelatedItemRow = await res.json();
      setItems((prev) => [...prev, rowFromServer(row)]);
    } finally {
      setSaving(false);
    }
  }

  function patchLocal(id: string, patch: Partial<RelatedItem>) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function patchServer(id: string, body: Record<string, unknown>) {
    try {
      await fetch(`${baseUrl}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      /* swallow — UI already updated optimistically */
    }
  }

  async function removeRow(id: string) {
    if (!canWrite) return;
    const prev = items;
    setItems((cur) => cur.filter((r) => r.id !== id));
    try {
      const res = await fetch(`${baseUrl}/${id}`, { method: "DELETE" });
      if (!res.ok) setItems(prev);
    } catch {
      setItems(prev);
    }
  }

  function handleTypeChange(id: string, type: string) {
    patchLocal(id, { type, instanceId: "", instanceLabel: "" });
    if (type) void loadInstances(type);
    void patchServer(id, { item_type: type, item_id: "", item_label: "" });
  }

  function handleInstanceChange(id: string, instanceId: string) {
    const row = items.find((r) => r.id === id);
    const instance = row ? (instanceCache[row.type] ?? []).find((i) => i.id === instanceId) : undefined;
    const instanceLabel = instance?.label ?? "";
    patchLocal(id, { instanceId, instanceLabel });
    void patchServer(id, { item_id: instanceId, item_label: instanceLabel });
  }

  function handleDateChange(id: string, date: string) {
    patchLocal(id, { date });
    void patchServer(id, { item_date: date });
  }

  function handleNotesChange(id: string, notes: string) {
    patchLocal(id, { notes });
    const timers = notesDebounceRef.current;
    if (timers[id]) clearTimeout(timers[id]);
    timers[id] = setTimeout(() => {
      void patchServer(id, { notes });
      delete timers[id];
    }, 500);
  }

  function handleNotesBlur(id: string, notes: string) {
    const timers = notesDebounceRef.current;
    if (timers[id]) {
      clearTimeout(timers[id]);
      delete timers[id];
    }
    void patchServer(id, { notes });
  }

  return (
    <section className="rounded border border-gray-300 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-2xl text-gray-900 font-semibold tracking-wide">RELATED ITEMS</h2>
        {canWrite && (
          <button
            type="button"
            onClick={addRow}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add an Item
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-medium">
              <th className="px-3 py-2 text-left whitespace-nowrap w-1/4">Type</th>
              <th className="px-3 py-2 text-left whitespace-nowrap w-2/5">Description</th>
              <th className="px-3 py-2 text-left whitespace-nowrap w-32">Date</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Notes</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm italic text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm italic text-gray-500">
                  {canWrite ? "No related items. Click \"Add an Item\" to get started." : "No related items."}
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const cfg = row.type ? TYPE_CONFIG_MAP[row.type] : undefined;
                const instances = instanceCache[row.type] ?? [];
                const isLoading = loadingTypes[row.type];
                return (
                  <tr key={row.id} className="border-b border-gray-200 align-top">
                    <td className="px-3 py-2">
                      <select
                        value={row.type}
                        onChange={(e) => handleTypeChange(row.id, e.target.value)}
                        disabled={!canWrite}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">Select an Item:</option>
                        <option value="Change Event">Change Event</option>
                        <option value="Change Order Request">Change Order Request</option>
                        <option value="Commitment Contract">Commitment Contract</option>
                        <option value="Commitment Contract Change Order">Commitment Contract Change Order</option>
                        <option value="Company">Company</option>
                        <option value="Contact">Contact</option>
                        <option value="Cost Code">Cost Code</option>
                        <option value="Cover Letters">Cover Letters</option>
                        <option value="Document">Document</option>
                        <option value="Drawing">Drawing</option>
                        <option value="Drawing Revision">Drawing Revision</option>
                        <option value="Email">Email</option>
                        <option value="Field Order">Field Order</option>
                        <option value="Image">Image</option>
                        <option value="Location">Location</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Meeting Item">Meeting Item</option>
                        <option value="Owner Invoice">Owner Invoice</option>
                        <option value="Potential Change Order">Potential Change Order</option>
                        <option value="Prime Contract">Prime Contract</option>
                        <option value="Prime Contract Change Order">Prime Contract Change Order</option>
                        <option value="Punch Item">Punch Item</option>
                        <option value="Purchase Order Contract">Purchase Order Contract</option>
                        <option value="RFI">RFI</option>
                        <option value="Request For Quote">Request For Quote</option>
                        <option value="Schedule Task">Schedule Task</option>
                        <option value="Specification Section">Specification Section</option>
                        <option value="Specification Section Revision">Specification Section Revision</option>
                        <option value="Subcontractor Invoice">Subcontractor Invoice</option>
                        <option value="Submittal Package">Submittal Package</option>
                        <option value="Submittals">Submittals</option>
                        <option value="Task Item">Task Item</option>
                        <option value="Transmittals">Transmittals</option>
                        <optgroup label="Daily Log Tools">
                          {DAILY_LOG_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      {!row.type ? (
                        <span className="text-xs italic text-gray-400">Select a type first</span>
                      ) : isLoading ? (
                        <span className="text-xs italic text-gray-400">Loading…</span>
                      ) : instances.length === 0 ? (
                        row.instanceLabel ? (
                          <span className="text-sm text-gray-700">{row.instanceLabel}</span>
                        ) : (
                          <span className="text-xs italic text-gray-400">
                            {cfg?.endpoint ? "No items available" : "Not available for this type"}
                          </span>
                        )
                      ) : (
                        <select
                          value={row.instanceId}
                          onChange={(e) => handleInstanceChange(row.id, e.target.value)}
                          disabled={!canWrite}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
                        >
                          <option value="">Select…</option>
                          {instances.map((inst) => (
                            <option key={inst.id} value={inst.id}>
                              {inst.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => handleDateChange(row.id, e.target.value)}
                        disabled={!canWrite}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        value={row.notes}
                        onChange={(e) => handleNotesChange(row.id, e.target.value)}
                        onBlur={(e) => handleNotesBlur(row.id, e.target.value)}
                        placeholder="Add notes…"
                        rows={1}
                        disabled={!canWrite}
                        className="w-full min-h-[34px] resize-y border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {canWrite && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          aria-label="Remove related item"
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
