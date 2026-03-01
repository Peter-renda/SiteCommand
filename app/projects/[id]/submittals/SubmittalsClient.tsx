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
type Specification = { id: string; name: string; code: string | null };

type Submittal = {
  id: string;
  submittal_number: number;
  revision: string | null;
  title: string;
  specification_id: string | null;
  submittal_type: string | null;
  status: string;
  responsible_contractor_id: string | null;
  received_from_id: string | null;
  submittal_manager_id: string | null;
  submit_by: string | null;
  received_date: string | null;
  issue_date: string | null;
  final_due_date: string | null;
  cost_code: string | null;
  linked_drawings: string | null;
  distribution_list: DirContact[];
  ball_in_court_id: string | null;
  lead_time: number | null;
  required_on_site_date: string | null;
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

const SUBMITTAL_TYPES = ["Shop Drawing", "Product Data", "Sample", "O&M Manual", "Warranty", "Certificate", "Other"];
const STATUSES = ["draft", "pending_review", "approved", "rejected", "revise_and_resubmit", "closed"];
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  revise_and_resubmit: "Revise & Resubmit",
  closed: "Closed",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700",
  pending_review: "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  revise_and_resubmit: "bg-orange-50 text-orange-700",
  closed: "bg-gray-100 text-gray-600",
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

function getSpecName(specifications: Specification[], id: string | null): string {
  if (!id) return "—";
  const s = specifications.find((x) => x.id === id);
  return s ? s.name + (s.code ? ` (${s.code})` : "") : "—";
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
        Project Home
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
  directory, selectedId, onChange, placeholder = "Select...", filterType,
}: {
  directory: DirectoryContact[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  filterType?: "user" | "company" | "distribution_group";
}) {
  let list = directory;
  if (filterType) list = list.filter((c) => c.type === filterType);
  return (
    <select value={selectedId ?? ""} onChange={(e) => onChange(e.target.value || null)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
      <option value="">{placeholder}</option>
      {list.map((c) => <option key={c.id} value={c.id}>{contactDisplayName(c)}</option>)}
    </select>
  );
}

function CreateSubmittalModal({
  nextNumber, directory, specifications, onConfirm, onCancel,
}: {
  nextNumber: number;
  directory: DirectoryContact[];
  specifications: Specification[];
  onConfirm: (data: Record<string, unknown>, sendEmails: boolean) => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [title, setTitle] = useState("");
  const [revision, setRevision] = useState("A");
  const [specificationId, setSpecificationId] = useState<string | null>(null);
  const [submittalType, setSubmittalType] = useState("");
  const [status, setStatus] = useState("draft");
  const [responsibleContractorId, setResponsibleContractorId] = useState<string | null>(null);
  const [receivedFromId, setReceivedFromId] = useState<string | null>(null);
  const [submittalManagerId, setSubmittalManagerId] = useState<string | null>(null);
  const [submitBy, setSubmitBy] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [finalDueDate, setFinalDueDate] = useState("");
  const [costCode, setCostCode] = useState("");
  const [linkedDrawings, setLinkedDrawings] = useState("");
  const [distributionList, setDistributionList] = useState<DirContact[]>([]);
  const [ballInCourtId, setBallInCourtId] = useState<string | null>(null);
  const [leadTime, setLeadTime] = useState("");
  const [requiredOnSiteDate, setRequiredOnSiteDate] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [description, setDescription] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function buildData() {
    return {
      title, revision, specification_id: specificationId, submittal_type: submittalType || null,
      status, responsible_contractor_id: responsibleContractorId, received_from_id: receivedFromId,
      submittal_manager_id: submittalManagerId, submit_by: submitBy || null,
      received_date: receivedDate || null, issue_date: issueDate || null,
      final_due_date: finalDueDate || null, cost_code: costCode || null,
      linked_drawings: linkedDrawings || null, distribution_list: distributionList,
      ball_in_court_id: ballInCourtId, lead_time: leadTime ? Number(leadTime) : null,
      required_on_site_date: requiredOnSiteDate || null, private: isPrivate,
      description: description || null, attachmentFile, attachments: [],
    };
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-gray-900">Create Submittal</h2>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title <span className="text-red-500">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Submittal title" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          {/* Number & Revision / Submittal Type */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Number</label>
              <input type="text" readOnly value={nextNumber} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Revision <span className="text-red-500">*</span></label>
              <input type="text" value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="A" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Submittal Type</label>
              <select value={submittalType} onChange={(e) => setSubmittalType(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                <option value="">Select type...</option>
                {SUBMITTAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Specification */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Specification</label>
            <select value={specificationId ?? ""} onChange={(e) => setSpecificationId(e.target.value || null)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option value="">Select specification...</option>
              {specifications.map((s) => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ""}</option>)}
            </select>
          </div>

          {/* Status / Submittal Manager */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status <span className="text-red-500">*</span></label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Submittal Manager <span className="text-red-500">*</span></label>
              <SingleContactPicker directory={directory} selectedId={submittalManagerId} onChange={setSubmittalManagerId} placeholder="Select..." />
            </div>
          </div>

          {/* Responsible Contractor / Received From */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Responsible Contractor</label>
              <SingleContactPicker directory={directory} selectedId={responsibleContractorId} onChange={setResponsibleContractorId} filterType="company" placeholder="Select company..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Received From</label>
              <SingleContactPicker directory={directory} selectedId={receivedFromId} onChange={setReceivedFromId} placeholder="Select..." />
            </div>
          </div>

          {/* Submit By / Received Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Submit By</label>
              <input type="date" value={submitBy} onChange={(e) => setSubmitBy(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Received Date</label>
              <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
            </div>
          </div>

          {/* Issue Date / Final Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Issue Date</label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Final Due Date</label>
              <input type="date" value={finalDueDate} onChange={(e) => setFinalDueDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
            </div>
          </div>

          {/* Cost Code / Linked Drawings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cost Code</label>
              <input type="text" value={costCode} onChange={(e) => setCostCode(e.target.value)} placeholder="Cost code" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Linked Drawings</label>
              <input type="text" value={linkedDrawings} onChange={(e) => setLinkedDrawings(e.target.value)} placeholder="Drawing numbers" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          {/* Ball In Court */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ball In Court</label>
            <SingleContactPicker directory={directory} selectedId={ballInCourtId} onChange={setBallInCourtId} placeholder="Select..." />
          </div>

          {/* Lead Time / Required On-Site Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Lead Time (days)</label>
              <input type="number" min="0" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Required On-Site Date</label>
              <input type="date" value={requiredOnSiteDate} onChange={(e) => setRequiredOnSiteDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
            </div>
          </div>

          {/* Distribution List */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Distribution List</label>
            <MultiContactPicker directory={directory} selected={distributionList} onChange={setDistributionList} placeholder="Search directory..." />
          </div>

          {/* Private */}
          <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-md">
            <input type="checkbox" id="submittal-private" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="rounded border-gray-300 text-gray-900" />
            <label htmlFor="submittal-private" className="text-sm text-gray-700 cursor-pointer">Visible only to admins, workflow, and distribution list members</label>
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
            <button type="button" onClick={() => onConfirm(buildData(), false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">Create</button>
            <button type="button" onClick={() => onConfirm(buildData(), true)} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors">Create and send emails</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function exportSubmittalsPDF(submittals: Submittal[], directory: DirectoryContact[], specifications: Specification[]) {
  const rows = submittals.map((s) => [
    `${s.submittal_number}${s.revision ? `-${s.revision}` : ""}`,
    s.title,
    s.submittal_type ?? "—",
    STATUS_LABELS[s.status] ?? s.status,
    getSpecName(specifications, s.specification_id),
    getContactNameById(directory, s.submittal_manager_id),
    getContactNameById(directory, s.responsible_contractor_id),
    formatDate(s.submit_by),
    formatDate(s.final_due_date),
  ]);
  const headers = ["#", "Title", "Type", "Status", "Specification", "Manager", "Contractor", "Submit By", "Final Due"];
  const thRow = headers.map((h) => `<th>${h}</th>`).join("");
  const tableRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${String(cell).replace(/</g, "&lt;")}</td>`).join("")}</tr>`).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Submittals</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px;}h1{font-size:16px;margin-bottom:16px;}table{width:100%;border-collapse:collapse;}th{background:#f3f4f6;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;}td{padding:8px 10px;border-bottom:1px solid #e5e7eb;}@media print{body{padding:0;}}</style></head><body>
    <h1>Submittals</h1><table><thead><tr>${thRow}</tr></thead><tbody>${tableRows}</tbody></table>
    <script>window.onload=()=>{window.print();}<\/script></body></html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

export default function SubmittalsClient({ projectId, role, username, userId }: { projectId: string; role: string; username: string; userId: string }) {
  const [submittals, setSubmittals] = useState<Submittal[]>([]);
  const [directory, setDirectory] = useState<DirectoryContact[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/submittals`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/directory`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/specifications`).then((r) => r.json()),
    ]).then(([sData, dirData, specData]) => {
      setSubmittals(Array.isArray(sData) ? sData : []);
      setDirectory(Array.isArray(dirData) ? dirData : []);
      setSpecifications(Array.isArray(specData) ? specData : []);
      setLoading(false);
    });
  }, [projectId]);

  const nextNumber = submittals.length > 0 ? Math.max(...submittals.map((s) => s.submittal_number)) + 1 : 1;

  async function handleCreate(data: Record<string, unknown>, sendEmails: boolean) {
    setShowCreate(false);
    setCreating(true);
    const { attachmentFile, ...rest } = data;
    const res = await fetch(`/api/projects/${projectId}/submittals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rest),
    });
    if (res.ok) {
      const newSubmittal: Submittal = await res.json();
      if (attachmentFile instanceof File) {
        const formData = new FormData();
        formData.append("file", attachmentFile);
        const attRes = await fetch(`/api/projects/${projectId}/submittals/${newSubmittal.id}/attachment`, { method: "POST", body: formData });
        if (attRes.ok) {
          const updated = await attRes.json();
          newSubmittal.attachments = updated.attachments ?? [];
        }
      }
      setSubmittals((prev) => [...prev, newSubmittal]);
      if (sendEmails) {
        const distList = (rest.distribution_list as DirContact[]) ?? [];
        const emails = distList.map((d) => d.email).filter(Boolean) as string[];
        if (emails.length) {
          await fetch(`/api/projects/${projectId}/submittals/${newSubmittal.id}/notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ distribution_emails: emails, submittal_summary: `Submittal #${newSubmittal.submittal_number}: ${rest.title}` }),
          });
        }
      }
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
          <h1 className="text-xl font-semibold text-gray-900">Submittals</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => exportSubmittalsPDF(submittals, directory, specifications)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export as PDF
            </button>
            <button onClick={() => setShowCreate(true)} disabled={creating} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              {creating ? "Creating..." : "Create submittal"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : submittals.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-16 text-center">
            <p className="text-sm text-gray-400">No submittals yet</p>
            <p className="text-xs text-gray-300 mt-1">Click Create submittal to add the first one</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-10"></th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Specification</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Manager</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Submit By</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Final Due</th>
                </tr>
              </thead>
              <tbody>
                {submittals.map((s) => (
                  <tr
                    key={s.id}
                    onClick={(e) => { if ((e.target as HTMLElement).closest("button,a")) return; window.location.href = `/projects/${projectId}/submittals/${s.id}`; }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-b-0 cursor-pointer"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <a href={`/projects/${projectId}/submittals/${s.id}`} className="inline-flex p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{s.submittal_number}{s.revision ? `-${s.revision}` : ""}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{s.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.submittal_type ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getSpecName(specifications, s.specification_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getContactNameById(directory, s.submittal_manager_id)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(s.submit_by)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(s.final_due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showCreate && (
        <CreateSubmittalModal
          nextNumber={nextNumber}
          directory={directory}
          specifications={specifications}
          onConfirm={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
