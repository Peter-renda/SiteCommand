"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";

type DirContact = { id: string; name: string; email: string | null };
type DirectoryContact = {
  id: string;
  type: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  group_name: string | null;
  email: string | null;
};

type PunchListItem = {
  id: string;
  item_number: number;
  title: string;
  status: string;
  punch_item_manager_id: string | null;
  type: string | null;
  assignees: DirContact[];
  due_date: string | null;
  final_approver_id: string | null;
  distribution_list: DirContact[];
  location: string | null;
  priority: string | null;
  trade: string | null;
  reference: string | null;
  schedule_impact: string | null;
  cost_impact: string | null;
  cost_codes: string | null;
  private: boolean;
  description: string | null;
  attachments: { name: string; url: string }[];
  created_by: string | null;
  created_at: string;
};

const TOOL_SECTIONS = [
  { label: "Core Tools", items: [{ name: "Home", slug: "" }, { name: "Reporting", slug: "reporting" }, { name: "Documents", slug: "documents" }, { name: "Directory", slug: "directory" }, { name: "Tasks", slug: "tasks" }, { name: "Admin", slug: "admin" }] },
  { label: "Project Tools", items: [{ name: "RFIs", slug: "rfis" }, { name: "Submittals", slug: "submittals" }, { name: "Transmittals", slug: "transmittals" }, { name: "Punch List", slug: "punch-list" }, { name: "Meetings", slug: "meetings" }, { name: "Schedule", slug: "schedule" }, { name: "Daily Log", slug: "daily-log" }, { name: "Photos", slug: "photos" }, { name: "Drawings", slug: "drawings" }, { name: "Specifications", slug: "specifications" }] },
  { label: "Financial Management", items: [{ name: "Prime Contracts", slug: "prime-contracts" }, { name: "Budget", slug: "budget" }, { name: "Commitments", slug: "commitments" }, { name: "Change Orders", slug: "change-orders" }, { name: "Change Events", slug: "change-events" }] },
];

const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES = ["open", "in_progress", "closed"];
const STATUS_LABELS: Record<string, string> = { open: "Open", in_progress: "In Progress", closed: "Closed" };
const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  closed: "bg-gray-100 text-gray-600",
};
const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-gray-50 text-gray-600",
  Medium: "bg-yellow-50 text-yellow-700",
  High: "bg-red-50 text-red-700",
};

function contactDisplayName(c: DirectoryContact): string {
  if (c.type === "company") return c.company ?? "Unnamed Company";
  if (c.type === "distribution_group") return c.group_name ?? "Unnamed Group";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed";
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getContactNameById(directory: DirectoryContact[], id: string | null): string {
  if (!id) return "—";
  const c = directory.find((x) => x.id === id);
  return c ? contactDisplayName(c) : "—";
}

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
      <a href="/dashboard" className="flex items-center gap-1.5 py-2.5 text-sm text-gray-400 hover:text-gray-700 transition-colors shrink-0">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
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
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
          Tools
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 w-[580px] bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-5">
            <div className="grid grid-cols-3 gap-6">
              {TOOL_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{section.label}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <a key={item.slug} href={`/projects/${projectId}${item.slug ? `/${item.slug}` : ""}`} onClick={() => setOpen(false)} className="block px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors">{item.name}</a>
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

function MultiContactPicker({
  directory, selected, onChange, placeholder = "Search directory...",
}: {
  directory: DirectoryContact[];
  selected: DirContact[];
  onChange: (v: DirContact[]) => void;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const selectedIds = new Set(selected.map((s) => s.id));
  const filtered = directory.filter(
    (c) => !selectedIds.has(c.id) &&
      (contactDisplayName(c).toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? "").toLowerCase().includes(search.toLowerCase()))
  );
  function add(c: DirectoryContact) {
    onChange([...selected, { id: c.id, name: contactDisplayName(c), email: c.email }]);
    setSearch("");
  }
  function remove(id: string) { onChange(selected.filter((s) => s.id !== id)); }
  return (
    <div ref={ref} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((s) => (
            <span key={s.id} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-gray-100 text-xs text-gray-700 rounded-full">
              {s.name}
              <button type="button" onClick={() => remove(s.id)} className="text-gray-400 hover:text-gray-700 ml-0.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg max-h-40 overflow-y-auto z-20">
          {filtered.map((c) => (
            <button key={c.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(c)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
              <span className="font-medium text-gray-900">{contactDisplayName(c)}</span>
              {c.email && <span className="text-gray-400 text-xs">{c.email}</span>}
            </button>
          ))}
        </div>
      )}
      {open && search && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg px-3 py-2 z-20"><p className="text-xs text-gray-400">No matching contacts</p></div>
      )}
    </div>
  );
}

function SingleContactPicker({
  directory, selectedId, onChange, placeholder = "Select...",
}: {
  directory: DirectoryContact[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
}) {
  return (
    <select value={selectedId ?? ""} onChange={(e) => onChange(e.target.value || null)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
      <option value="">{placeholder}</option>
      {directory.map((c) => <option key={c.id} value={c.id}>{contactDisplayName(c)}</option>)}
    </select>
  );
}

function CreatePunchListModal({
  nextNumber, directory, onConfirm, onCancel,
}: {
  nextNumber: number;
  directory: DirectoryContact[];
  onConfirm: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [punchItemManagerId, setPunchItemManagerId] = useState<string | null>(null);
  const [type, setType] = useState("");
  const [assignees, setAssignees] = useState<DirContact[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [finalApproverId, setFinalApproverId] = useState<string | null>(null);
  const [distributionList, setDistributionList] = useState<DirContact[]>([]);
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("");
  const [trade, setTrade] = useState("");
  const [reference, setReference] = useState("");
  const [scheduleImpact, setScheduleImpact] = useState("");
  const [costImpact, setCostImpact] = useState("");
  const [costCodes, setCostCodes] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [description, setDescription] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function buildData() {
    return {
      title, punch_item_manager_id: punchItemManagerId, type: type || null,
      assignees, due_date: dueDate || null, final_approver_id: finalApproverId,
      distribution_list: distributionList, location: location || null,
      priority: priority || null, trade: trade || null, reference: reference || null,
      schedule_impact: scheduleImpact || null, cost_impact: costImpact || null,
      cost_codes: costCodes || null, private: isPrivate,
      description: description || null, attachmentFile, attachments: [],
    };
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-gray-900">New Punch List Item</h2>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Title / Number */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Title <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Item title" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Number <span className="text-red-500">*</span></label>
              <input type="text" readOnly value={nextNumber} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>
          </div>

          {/* Punch Item Manager / Final Approver */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Punch Item Manager <span className="text-red-500">*</span></label>
              <SingleContactPicker directory={directory} selectedId={punchItemManagerId} onChange={setPunchItemManagerId} placeholder="Select..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Final Approver <span className="text-red-500">*</span></label>
              <SingleContactPicker directory={directory} selectedId={finalApproverId} onChange={setFinalApproverId} placeholder="Select..." />
            </div>
          </div>

          {/* Type / Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <input type="text" value={type} onChange={(e) => setType(e.target.value)} placeholder="Item type" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                <option value="">Select priority...</option>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assignee(s)</label>
            <MultiContactPicker directory={directory} selected={assignees} onChange={setAssignees} placeholder="Select assignees..." />
          </div>

          {/* Due Date / Trade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Trade</label>
              <input type="text" value={trade} onChange={(e) => setTrade(e.target.value)} placeholder="Trade" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          {/* Location / Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Reference</label>
              <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          {/* Schedule Impact / Cost Impact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Schedule Impact</label>
              <input type="text" value={scheduleImpact} onChange={(e) => setScheduleImpact(e.target.value)} placeholder="Schedule impact" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cost Impact</label>
              <input type="text" value={costImpact} onChange={(e) => setCostImpact(e.target.value)} placeholder="Cost impact" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          {/* Cost Codes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cost Codes</label>
            <input type="text" value={costCodes} onChange={(e) => setCostCodes(e.target.value)} placeholder="Cost codes" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          {/* Distribution List */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Distribution List</label>
            <MultiContactPicker directory={directory} selected={distributionList} onChange={setDistributionList} placeholder="Search directory..." />
          </div>

          {/* Private */}
          <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-md">
            <input type="checkbox" id="punch-private" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="rounded border-gray-300 text-gray-900" />
            <label htmlFor="punch-private" className="text-sm text-gray-700 cursor-pointer">Private</label>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Description..." className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Attachments</label>
            <input ref={fileInputRef} type="file" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setAttachmentFile(f); }} />
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) setAttachmentFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragOver ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
            >
              {attachmentFile ? (
                <p className="text-sm text-gray-700">{attachmentFile.name}</p>
              ) : (
                <p className="text-sm text-gray-500">Drag and drop a file or click to attach</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="button" onClick={() => onConfirm(buildData())} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors">Create</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function exportPunchListPDF(items: PunchListItem[], directory: DirectoryContact[]) {
  const rows = items.map((item) => [
    item.item_number,
    item.title,
    item.type ?? "—",
    STATUS_LABELS[item.status] ?? item.status,
    item.priority ?? "—",
    getContactNameById(directory, item.punch_item_manager_id),
    item.location ?? "—",
    item.trade ?? "—",
    formatDate(item.due_date),
  ]);
  const headers = ["#", "Title", "Type", "Status", "Priority", "Manager", "Location", "Trade", "Due Date"];
  const thRow = headers.map((h) => `<th>${h}</th>`).join("");
  const tableRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${String(cell).replace(/</g, "&lt;")}</td>`).join("")}</tr>`).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Punch List</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px;}h1{font-size:16px;margin-bottom:16px;}table{width:100%;border-collapse:collapse;}th{background:#f3f4f6;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;}td{padding:8px 10px;border-bottom:1px solid #e5e7eb;}@media print{body{padding:0;}}</style></head><body>
    <h1>Punch List</h1><table><thead><tr>${thRow}</tr></thead><tbody>${tableRows}</tbody></table>
    <script>window.onload=()=>{window.print();}<\/script></body></html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

export default function PunchListClient({ projectId, role, username, userId }: { projectId: string; role: string; username: string; userId: string }) {
  const [items, setItems] = useState<PunchListItem[]>([]);
  const [directory, setDirectory] = useState<DirectoryContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/punch-list`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/directory`).then((r) => r.json()),
    ]).then(([itemsData, dirData]) => {
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setDirectory(Array.isArray(dirData) ? dirData : []);
      setLoading(false);
    });
  }, [projectId]);

  const nextNumber = items.length > 0 ? Math.max(...items.map((i) => i.item_number)) + 1 : 1;

  async function handleCreate(data: Record<string, unknown>) {
    setShowCreate(false);
    setCreating(true);
    const { attachmentFile, ...rest } = data;
    const res = await fetch(`/api/projects/${projectId}/punch-list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rest),
    });
    if (res.ok) {
      const newItem: PunchListItem = await res.json();
      if (attachmentFile instanceof File) {
        const formData = new FormData();
        formData.append("file", attachmentFile);
        const attRes = await fetch(`/api/projects/${projectId}/punch-list/${newItem.id}/attachment`, { method: "POST", body: formData });
        if (attRes.ok) {
          const updated = await attRes.json();
          newItem.attachments = updated.attachments ?? [];
        }
      }
      setItems((prev) => [...prev, newItem]);
    }
    setCreating(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">SiteCommand</a>
        <div className="flex items-center gap-5">
          {role === "admin" && <a href="/admin" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">Admin</a>}
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Punch List</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => exportPunchListPDF(items, directory)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export as PDF
            </button>
            <button onClick={() => setShowCreate(true)} disabled={creating} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              {creating ? "Creating..." : "Create item"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : items.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-16 text-center">
            <p className="text-sm text-gray-400">No punch list items yet</p>
            <p className="text-xs text-gray-300 mt-1">Click Create item to add the first one</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-10"></th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Manager</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Trade</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={(e) => { if ((e.target as HTMLElement).closest("button,a")) return; window.location.href = `/projects/${projectId}/punch-list/${item.id}`; }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-b-0 cursor-pointer"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <a href={`/projects/${projectId}/punch-list/${item.id}`} className="inline-flex p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{item.item_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.priority ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[item.priority] ?? "bg-gray-50 text-gray-600"}`}>{item.priority}</span>
                      ) : <span className="text-sm text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getContactNameById(directory, item.punch_item_manager_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.location ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.trade ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(item.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showCreate && (
        <CreatePunchListModal
          nextNumber={nextNumber}
          directory={directory}
          onConfirm={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
