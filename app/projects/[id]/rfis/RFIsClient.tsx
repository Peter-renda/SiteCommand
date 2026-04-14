"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import ProjectNav from "@/components/ProjectNav";
import EmptyState from "@/app/components/EmptyState";
import { SkeletonTable } from "@/app/components/Skeleton";
import { useSearchParams } from "next/navigation";

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

type RFI = {
  id: string;
  rfi_number: number;
  subject: string | null;
  question: string | null;
  due_date: string | null;
  status: string;
  rfi_manager_id: string | null;
  received_from_id: string | null;
  assignees: DirContact[];
  distribution_list: DirContact[];
  responsible_contractor_id: string | null;
  specification_id: string | null;
  drawing_number: string | null;
  attachments: { name: string; url: string }[];
  created_by: string | null;
  created_at: string;
};

type RFIResponse = {
  id: string;
  body: string;
  created_by_name: string | null;
  created_at: string;
};


const STATUSES = ["open", "closed", "draft"];
const COLUMN_KEYS = ["rfi_number", "subject", "due_date", "status", "rfi_manager", "received_from", "assignees", "distribution", "responsible_contractor", "specification", "drawing_number", "created_at"] as const;
const COLUMN_LABELS: Record<typeof COLUMN_KEYS[number], string> = {
  rfi_number: "RFI #",
  subject: "Subject",
  due_date: "Due Date",
  status: "Status",
  rfi_manager: "RFI Manager",
  received_from: "Received From",
  assignees: "Assignees",
  distribution: "Distribution",
  responsible_contractor: "Responsible Contractor",
  specification: "Specification",
  drawing_number: "Drawing #",
  created_at: "Created",
};
function contactDisplayName(c: DirectoryContact): string {
  if (c.type === "company") return c.company ?? "Unnamed Company";
  if (c.type === "distribution_group") return c.group_name ?? "Unnamed Group";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed";
}
function MultiContactPicker({
  directory,
  selected,
  onChange,
  placeholder = "Search directory...",
  filterType,
}: {
  directory: DirectoryContact[];
  selected: DirContact[];
  onChange: (v: DirContact[]) => void;
  placeholder?: string;
  filterType?: "user" | "company" | "distribution_group";
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
  let list = directory;
  if (filterType) list = list.filter((c) => c.type === filterType);
  const selectedIds = new Set(selected.map((s) => s.id));
  const filtered = list.filter(
    (c) =>
      !selectedIds.has(c.id) &&
      (contactDisplayName(c).toLowerCase().includes(search.toLowerCase()) || (c.email ?? "").toLowerCase().includes(search.toLowerCase()))
  );
  function add(c: DirectoryContact) {
    onChange([...selected, { id: c.id, name: contactDisplayName(c), email: c.email }]);
    setSearch("");
  }
  function remove(id: string) {
    onChange(selected.filter((s) => s.id !== id));
  }
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
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
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
  directory,
  selectedId,
  onChange,
  placeholder = "Select...",
  filterType,
}: {
  directory: DirectoryContact[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  filterType?: "user" | "company" | "distribution_group";
}) {
  let list = directory;
  if (filterType) list = list.filter((c) => c.type === filterType);
  const selected = list.find((c) => c.id === selectedId);
  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
    >
      <option value="">{placeholder}</option>
      {list.map((c) => (
        <option key={c.id} value={c.id}>{contactDisplayName(c)}</option>
      ))}
    </select>
  );
}

function CreateRFIModal({
  nextNumber,
  directory,
  specifications,
  onConfirm,
  onCancel,
}: {
  nextNumber: number;
  directory: DirectoryContact[];
  specifications: Specification[];
  onConfirm: (data: {
    subject: string;
    question: string;
    due_date: string;
    status: "open" | "draft";
    rfi_manager_id: string | null;
    received_from_id: string | null;
    assignees: DirContact[];
    distribution_list: DirContact[];
    responsible_contractor_id: string | null;
    specification_id: string | null;
    drawing_number: string;
    attachmentFile: File | null;
  }) => void;
  onCancel: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [status, setStatus] = useState("open");
  const [rfiManagerId, setRfiManagerId] = useState<string | null>(null);
  const [receivedFromId, setReceivedFromId] = useState<string | null>(null);
  const [assignees, setAssignees] = useState<DirContact[]>([]);
  const [distributionList, setDistributionList] = useState<DirContact[]>([]);
  const [responsibleContractorId, setResponsibleContractorId] = useState<string | null>(null);
  const [specificationId, setSpecificationId] = useState<string | null>(null);
  const [drawingNumber, setDrawingNumber] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setAttachmentFile(file);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setAttachmentFile(file);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-sm font-semibold text-gray-900">Create RFI</h2>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">RFI Number</label>
              <input type="text" readOnly value={nextNumber} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subject (max 200 characters)</label>
            <input type="text" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <p className="text-xs text-gray-400 mt-0.5">{subject.length}/200</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Question</label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} placeholder="Question..." className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Attachment</label>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragOver ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-300"} ${attachmentFile ? "bg-gray-50" : ""}`}
            >
              {attachmentFile ? (
                <p className="text-sm text-gray-700">{attachmentFile.name}</p>
              ) : (
                <p className="text-sm text-gray-500">Drag and drop a file or click to attach</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">RFI Manager</label>
              <SingleContactPicker directory={directory} selectedId={rfiManagerId} onChange={setRfiManagerId} filterType="user" placeholder="Select user..." />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Received From</label>
            <SingleContactPicker directory={directory} selectedId={receivedFromId} onChange={setReceivedFromId} filterType="user" placeholder="Select user..." />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assignees</label>
            <MultiContactPicker directory={directory} selected={assignees} onChange={setAssignees} filterType="user" placeholder="Select users..." />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Distribution List</label>
            <MultiContactPicker directory={directory} selected={distributionList} onChange={setDistributionList} filterType="user" placeholder="Select users..." />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Responsible Contractor</label>
            <SingleContactPicker directory={directory} selectedId={responsibleContractorId} onChange={setResponsibleContractorId} filterType="company" placeholder="Select company..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Specification</label>
              <select value={specificationId ?? ""} onChange={(e) => setSpecificationId(e.target.value || null)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                <option value="">Select specification...</option>
                {specifications.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Drawing Number</label>
              <input type="text" value={drawingNumber} onChange={(e) => setDrawingNumber(e.target.value)} placeholder="Drawing number" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="button" onClick={() => onConfirm({ subject, question, due_date: dueDate, status: "draft", rfi_manager_id: rfiManagerId, received_from_id: receivedFromId, assignees, distribution_list: distributionList, responsible_contractor_id: responsibleContractorId, specification_id: specificationId, drawing_number: drawingNumber, attachmentFile })} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">Create as Draft</button>
            <button type="button" onClick={() => onConfirm({ subject, question, due_date: dueDate, status: "open", rfi_manager_id: rfiManagerId, received_from_id: receivedFromId, assignees, distribution_list: distributionList, responsible_contractor_id: responsibleContractorId, specification_id: specificationId, drawing_number: drawingNumber, attachmentFile })} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors">Create as Open</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getContactNameById(directory: DirectoryContact[], id: string | null): string {
  if (!id) return "—";
  const c = directory.find((x) => x.id === id);
  return c ? contactDisplayName(c) : "—";
}

function getSpecName(specifications: Specification[], id: string | null): string {
  if (!id) return "—";
  const s = specifications.find((x) => x.id === id);
  return s ? (s.name + (s.code ? ` (${s.code})` : "")) : "—";
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

async function exportRFIsPDF(
  projectId: string,
  rfis: RFI[],
  directory: DirectoryContact[],
  specifications: Specification[],
  visibleColumns: readonly string[]
) {
  const { default: jsPDF } = await import("jspdf");

  const responseEntries = await Promise.all(
    rfis.map(async (rfi) => {
      try {
        const res = await fetch(`/api/projects/${projectId}/rfis/${rfi.id}/responses`);
        if (!res.ok) return [rfi.id, []] as const;
        const data = await res.json();
        return [rfi.id, Array.isArray(data) ? (data as RFIResponse[]) : []] as const;
      } catch {
        return [rfi.id, []] as const;
      }
    })
  );

  const responsesByRfi = new Map<string, RFIResponse[]>(responseEntries);
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const lineHeight = 13;
  let y = margin;

  const ensureSpace = (minBottomSpace = 30) => {
    if (y > pageHeight - minBottomSpace) {
      doc.addPage();
      y = margin;
    }
  };

  const writeWrapped = (text: string, indent = 0) => {
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - indent);
    lines.forEach((line: string) => {
      ensureSpace();
      doc.text(line, margin + indent, y);
      y += lineHeight;
    });
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("RFI Export", margin, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated ${new Date().toLocaleString("en-US")}`, margin, y);
  doc.setTextColor(0);
  y += 24;

  for (const rfi of rfis) {
    ensureSpace(120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`RFI #${rfi.rfi_number} — ${rfi.subject ?? "Untitled"}`, margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    visibleColumns.forEach((key) => {
      let value = "—";
      switch (key) {
        case "rfi_number": value = String(rfi.rfi_number); break;
        case "subject": value = rfi.subject ?? "—"; break;
        case "due_date": value = formatDate(rfi.due_date); break;
        case "status": value = rfi.status; break;
        case "rfi_manager": value = getContactNameById(directory, rfi.rfi_manager_id); break;
        case "received_from": value = getContactNameById(directory, rfi.received_from_id); break;
        case "assignees": value = (rfi.assignees ?? []).map((a) => a.name).join(", ") || "—"; break;
        case "distribution": value = (rfi.distribution_list ?? []).map((d) => d.name).join(", ") || "—"; break;
        case "responsible_contractor": value = getContactNameById(directory, rfi.responsible_contractor_id); break;
        case "specification": value = getSpecName(specifications, rfi.specification_id); break;
        case "drawing_number": value = rfi.drawing_number ?? "—"; break;
        case "created_at": value = formatDate(rfi.created_at); break;
      }
      const label = COLUMN_LABELS[key as typeof COLUMN_KEYS[number]] ?? key;
      writeWrapped(`${label}: ${value}`);
    });

    writeWrapped(`Question: ${rfi.question ?? "—"}`);
    y += 6;

    const responses = responsesByRfi.get(rfi.id) ?? [];
    doc.setFont("helvetica", "bold");
    writeWrapped("Responses:");
    doc.setFont("helvetica", "normal");

    if (responses.length === 0) {
      writeWrapped("No responses.", 10);
    } else {
      responses.forEach((response, idx) => {
        writeWrapped(`${idx + 1}. ${response.created_by_name ?? "Unknown"} — ${formatDateTime(response.created_at)}`, 10);
        writeWrapped(response.body || "—", 20);
        y += 4;
      });
    }

    y += 12;
    ensureSpace(40);
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
  }

  doc.save("rfi_export.pdf");
}

export default function RFIsClient({ projectId, role, username, userId }: { projectId: string; role: string; username: string; userId: string }) {
  const searchParams = useSearchParams();
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [directory, setDirectory] = useState<DirectoryContact[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<readonly string[]>(() => [...COLUMN_KEYS]);
  const exportRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
      if (columnRef.current && !columnRef.current.contains(e.target as Node)) setShowColumnConfig(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/rfis`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/directory`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/specifications`).then((r) => r.json()),
    ]).then(([rfisData, dirData, specData]) => {
      setRfis(Array.isArray(rfisData) ? rfisData : []);
      setDirectory(Array.isArray(dirData) ? dirData : []);
      setSpecifications(Array.isArray(specData) ? specData : []);
      setLoading(false);
    });
  }, [projectId]);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setShowCreate(true);
    }
  }, [searchParams]);

  const nextNumber = rfis.length > 0 ? Math.max(...rfis.map((r) => r.rfi_number)) + 1 : 1;

  async function handleCreate(data: {
    subject: string;
    question: string;
    due_date: string;
    status: "open" | "draft";
    rfi_manager_id: string | null;
    received_from_id: string | null;
    assignees: DirContact[];
    distribution_list: DirContact[];
    responsible_contractor_id: string | null;
    specification_id: string | null;
    drawing_number: string;
    attachmentFile: File | null;
  }) {
    setShowCreate(false);
    setCreating(true);
    setAttachmentError(null);
    const res = await fetch(`/api/projects/${projectId}/rfis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: data.subject.slice(0, 200),
        question: data.question || null,
        due_date: data.due_date || null,
        status: data.status,
        rfi_manager_id: data.rfi_manager_id,
        received_from_id: data.received_from_id,
        assignees: data.assignees,
        distribution_list: data.distribution_list,
        responsible_contractor_id: data.responsible_contractor_id,
        specification_id: data.specification_id,
        drawing_number: data.drawing_number || null,
        attachments: [],
      }),
    });
    if (res.ok) {
      const newRfi: RFI = await res.json();
      if (data.attachmentFile) {
        const formData = new FormData();
        formData.append("file", data.attachmentFile);
        const attRes = await fetch(`/api/projects/${projectId}/rfis/${newRfi.id}/attachment`, { method: "POST", body: formData });
        if (attRes.ok) {
          const updated = await attRes.json();
          newRfi.attachments = updated.attachments ?? [];
        } else {
          const attErr = await attRes.json().catch(() => ({}));
          setAttachmentError(attErr.error ?? "Failed to upload attachment. Please add it again from the RFI detail page.");
        }
      }
      setRfis((prev) => [...prev, newRfi]);
      if (data.status === "open" && data.distribution_list.length > 0) {
        const emails = data.distribution_list.map((d) => d.email).filter(Boolean) as string[];
        if (emails.length) {
          await fetch(`/api/projects/${projectId}/rfis/${newRfi.id}/notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ distribution_emails: emails, rfi_summary: `RFI #${newRfi.rfi_number}: ${data.subject}` }),
          });
        }
      }
    }
    setCreating(false);
  }

  function canEditRfi(rfi: RFI): boolean {
    return rfi.created_by === userId;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function toggleColumn(key: string) {
    setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">SiteCommand</a>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {attachmentError && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span className="flex-1">{attachmentError}</span>
            <button onClick={() => setAttachmentError(null)} className="text-red-400 hover:text-red-600 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">RFIs</h1>
          <div className="flex items-center gap-2">
            <div ref={columnRef} className="relative">
              <button onClick={() => setShowColumnConfig((o) => !o)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors">
                Configure columns
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showColumnConfig ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showColumnConfig && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-20 max-h-64 overflow-y-auto">
                  {COLUMN_KEYS.map((key) => (
                    <label key={key} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={visibleColumns.includes(key)} onChange={() => toggleColumn(key)} className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">{COLUMN_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div ref={exportRef} className="relative">
                <button onClick={() => setShowExportMenu((o) => !o)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors">
                {exportingPdf ? "Exporting PDF..." : "Export RFI as PDF"}
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showExportMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20">
                  <button
                    disabled={exportingPdf}
                    onClick={async () => {
                      setShowExportMenu(false);
                      setExportingPdf(true);
                      try {
                        await exportRFIsPDF(projectId, rfis, directory, specifications, visibleColumns);
                      } finally {
                        setExportingPdf(false);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    Export all as PDF
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setShowCreate(true)} disabled={creating} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              {creating ? "Creating..." : "Create new RFI"}
            </button>
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : rfis.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl">
            <EmptyState
              icon={
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="No RFIs yet"
              description="Click Create new RFI to add the first one."
            />
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-12"></th>
                  {visibleColumns.map((key) => (
                    <th key={key} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {COLUMN_LABELS[key as typeof COLUMN_KEYS[number]]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rfis.map((rfi) => (
                  <tr
                    key={rfi.id}
                    onClick={(e) => { if ((e.target as HTMLElement).closest("button")) return; window.location.href = `/projects/${projectId}/rfis/${rfi.id}`; }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-b-0 cursor-pointer"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {canEditRfi(rfi) ? (
                        <a href={`/projects/${projectId}/rfis/${rfi.id}/edit`} className="inline-flex p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </a>
                      ) : (
                        <span className="inline-block w-6" />
                      )}
                    </td>
                    {visibleColumns.map((key) => {
                      let cell: React.ReactNode = "—";
                      switch (key) {
                        case "rfi_number": cell = <span className="font-mono text-gray-700">{rfi.rfi_number}</span>; break;
                        case "subject": cell = <span className="text-sm text-gray-900">{(rfi.subject ?? "").slice(0, 60)}{(rfi.subject ?? "").length > 60 ? "…" : ""}</span>; break;
                        case "due_date": cell = <span className="text-xs text-gray-500">{formatDate(rfi.due_date)}</span>; break;
                        case "status": cell = <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${rfi.status === "open" ? "bg-blue-50 text-blue-700" : rfi.status === "closed" ? "bg-gray-100 text-gray-600" : "bg-amber-50 text-amber-700"}`}>{rfi.status}</span>; break;
                        case "rfi_manager": cell = getContactNameById(directory, rfi.rfi_manager_id); break;
                        case "received_from": cell = getContactNameById(directory, rfi.received_from_id); break;
                        case "assignees": cell = (rfi.assignees ?? []).map((a) => a.name).join(", ") || "—"; break;
                        case "distribution": cell = (rfi.distribution_list ?? []).map((d) => d.name).join(", ") || "—"; break;
                        case "responsible_contractor": cell = getContactNameById(directory, rfi.responsible_contractor_id); break;
                        case "specification": cell = getSpecName(specifications, rfi.specification_id); break;
                        case "drawing_number": cell = rfi.drawing_number ?? "—"; break;
                        case "created_at": cell = formatDate(rfi.created_at); break;
                      }
                      return <td key={key} className="px-4 py-3 text-sm text-gray-600">{cell}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showCreate && (
        <CreateRFIModal nextNumber={nextNumber} directory={directory} specifications={specifications} onConfirm={handleCreate} onCancel={() => setShowCreate(false)} />
      )}
    </div>
  );
}
