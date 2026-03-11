"use client";

import { useState, useEffect, useRef, useCallback, DragEvent } from "react";
import ProjectNav from "@/components/ProjectNav";

// ── Types ─────────────────────────────────────────────────────────────────────

type DrawingUpload = {
  id: string;
  filename: string;
  page_count: number;
  storage_path: string;
  uploaded_by_name: string;
  uploaded_at: string;
};

type DrawingPage = {
  id: string;
  upload_id: string;
  page_number: number;
  drawing_no: string | null;
  title: string | null;
  revision: string | null;
  drawing_date: string | null;
  received_date: string | null;
  discipline: string | null;
  set_name: string | null;
  status: string;
  updated_at: string;
  // joined from drawing_uploads
  storage_path: string;
  filename: string;
  uploaded_by_name: string;
  uploaded_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "numeric", day: "numeric", year: "numeric",
  });
}

function drawingLabel(d: DrawingPage) {
  if (d.drawing_no || d.title) {
    return `${d.drawing_no ?? ""}${d.drawing_no && d.title ? " — " : ""}${d.title ?? ""}`.trim();
  }
  return `Page ${d.page_number} of ${d.filename}`;
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-50 text-green-700 border border-green-200",
  draft: "bg-gray-100 text-gray-600",
  superseded: "bg-amber-50 text-amber-700",
  void: "bg-red-50 text-red-600",
};

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── PDF.js lazy loader ────────────────────────────────────────────────────────

let pdfJsLoaded = false;

async function ensurePdfJs() {
  if (pdfJsLoaded) return;
  const { GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  pdfJsLoaded = true;
}

async function countPages(file: File): Promise<number> {
  await ensurePdfJs();
  const { getDocument } = await import("pdfjs-dist");
  const buf = await file.arrayBuffer();
  const pdf = await getDocument({ data: buf }).promise;
  return pdf.numPages;
}

async function renderPage(storagePath: string, pageNumber: number, scale: number): Promise<string> {
  await ensurePdfJs();
  const { getDocument } = await import("pdfjs-dist");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "";
  const url = `${supabaseUrl}/storage/v1/object/public/project-drawings/${storagePath}`;
  const pdf = await getDocument(url).promise;
  const page = await pdf.getPage(pageNumber);
  const vp = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = vp.width;
  canvas.height = vp.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return canvas.toDataURL();
}

// ── Title-block text extraction ───────────────────────────────────────────────

type ExtractedMeta = {
  drawing_no?: string;
  title?: string;
  revision?: string;
  drawing_date?: string;
};

type TItem = { str: string; x: number; y: number; w: number };

const LABEL_PATTERNS: Record<keyof ExtractedMeta, RegExp> = {
  drawing_no:   /^(dwg\.?\s*no\.?|drawing\s*no\.?|drawing\s*number|sheet\s*no\.?|drg\.?\s*no\.?|sheet\s*number)$/i,
  title:        /^(title|drawing\s*title|sheet\s*title|project\s*title|description)$/i,
  revision:     /^(rev\.?|revision|rev\.?\s*no\.?|rev\s*#)$/i,
  drawing_date: /^(date|dwg\.?\s*date|drawing\s*date|issue\s*date|dated?)$/i,
};

function parseIsoDate(str: string): string {
  const mdy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return "";
}

async function extractMetaFromPage(storagePath: string, pageNumber: number): Promise<ExtractedMeta> {
  await ensurePdfJs();
  const { getDocument } = await import("pdfjs-dist");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return {};

  const url = `${supabaseUrl}/storage/v1/object/public/project-drawings/${storagePath}`;
  const pdf = await getDocument(url).promise;
  const page = await pdf.getPage(pageNumber);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textContent = await (page as any).getTextContent();

  const items: TItem[] = (textContent.items as Array<{ str: string; transform: number[]; width: number }>)
    .filter((i) => i.str?.trim())
    .map((i) => ({ str: i.str.trim(), x: i.transform[4], y: i.transform[5], w: i.width ?? 0 }));

  const result: ExtractedMeta = {};

  for (const item of items) {
    for (const field of Object.keys(LABEL_PATTERNS) as Array<keyof ExtractedMeta>) {
      if (result[field]) continue;
      if (!LABEL_PATTERNS[field].test(item.str)) continue;

      const sameRow = items
        .filter((i) => Math.abs(i.y - item.y) < 4 && i.x > item.x + item.w - 1 && i.str.length > 0)
        .sort((a, b) => a.x - b.x);

      const rowCandidate = sameRow.find((i) => !Object.values(LABEL_PATTERNS).some((p) => p.test(i.str)));
      if (rowCandidate) {
        result[field] = field === "drawing_date" ? (parseIsoDate(rowCandidate.str) || rowCandidate.str) : rowCandidate.str;
        continue;
      }

      const below = items
        .filter((i) => i.y < item.y && i.y > item.y - 30 && i.x >= item.x - 10 && i.x <= item.x + Math.max(item.w, 60) + 10 && i.str.length > 0)
        .sort((a, b) => b.y - a.y);

      const belowCandidate = below.find((i) => !Object.values(LABEL_PATTERNS).some((p) => p.test(i.str)));
      if (belowCandidate) {
        result[field] = field === "drawing_date" ? (parseIsoDate(belowCandidate.str) || belowCandidate.str) : belowCandidate.str;
      }
    }
  }

  return result;
}

// ── Full-Screen Preview ───────────────────────────────────────────────────────

function FullScreenPreview({
  drawing,
  allDrawings,
  onClose,
  onNavigate,
}: {
  drawing: DrawingPage;
  allDrawings: DrawingPage[];
  onClose: () => void;
  onNavigate: (d: DrawingPage) => void;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loadingHiRes, setLoadingHiRes] = useState(true);

  const currentIdx = allDrawings.findIndex((d) => d.id === drawing.id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < allDrawings.length - 1;

  // Render high-res PDF page
  useEffect(() => {
    let cancelled = false;
    setImgUrl(null);
    setLoadingHiRes(true);

    renderPage(drawing.storage_path, drawing.page_number, 2.0)
      .then((url) => {
        if (!cancelled && url) {
          setImgUrl(url);
          setLoadingHiRes(false);
        }
      })
      .catch(() => { if (!cancelled) setLoadingHiRes(false); });

    return () => { cancelled = true; };
  }, [drawing.id, drawing.storage_path, drawing.page_number]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && hasNext) onNavigate(allDrawings[currentIdx + 1]);
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(allDrawings[currentIdx - 1]);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, onNavigate, allDrawings, currentIdx, hasPrev, hasNext]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/60 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {drawing.drawing_no && (
            <span className="text-white font-semibold text-sm">{drawing.drawing_no}</span>
          )}
          {drawing.title && (
            <span className="text-gray-300 text-sm truncate">{drawing.title}</span>
          )}
          {drawing.revision && (
            <span className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded">
              Rev {drawing.revision}
            </span>
          )}
          {!drawing.drawing_no && !drawing.title && (
            <span className="text-gray-400 text-sm">Page {drawing.page_number} · {drawing.filename}</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className="text-gray-400 text-xs">
            {currentIdx + 1} / {allDrawings.length}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close (Esc)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {loadingHiRes && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-8 h-8 animate-spin text-white/40" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-white/40 text-sm">Loading drawing…</span>
            </div>
          </div>
        )}
        {imgUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt={drawingLabel(drawing)}
            className="max-w-full max-h-full object-contain"
            style={{ opacity: loadingHiRes ? 0 : 1, transition: "opacity 0.2s" }}
          />
        )}

        {/* Prev/Next arrows */}
        {hasPrev && (
          <button
            onClick={() => onNavigate(allDrawings[currentIdx - 1])}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            title="Previous (←)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {hasNext && (
          <button
            onClick={() => onNavigate(allDrawings[currentIdx + 1])}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            title="Next (→)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Footer bar */}
      <div className="shrink-0 px-6 py-2 bg-black/60 border-t border-white/10 flex items-center gap-4 text-xs text-gray-400">
        {drawing.drawing_date && <span>Drawing date: {formatDate(drawing.drawing_date)}</span>}
        {drawing.received_date && <span>Received: {formatDate(drawing.received_date)}</span>}
        {drawing.discipline && <span>Discipline: {drawing.discipline}</span>}
        {drawing.set_name && <span>Set: {drawing.set_name}</span>}
        <span className="ml-auto">{drawing.filename} · Page {drawing.page_number}</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DrawingsClient({
  projectId,
  role,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const [drawings, setDrawings] = useState<DrawingPage[]>([]);
  const [uploads, setUploads] = useState<DrawingUpload[]>([]);

  // Selected drawing for the metadata editing panel (triggered by info icon)
  const [selected, setSelected] = useState<DrawingPage | null>(null);

  // Preview drawing for full-screen overlay (triggered by row click)
  const [preview, setPreview] = useState<DrawingPage | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("");
  const [setFilter, setSetFilter] = useState("");
  const [showUploadsPanel, setShowUploadsPanel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Edit panel fields
  const [editNo, setEditNo] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editRevision, setEditRevision] = useState("");
  const [editDrawingDate, setEditDrawingDate] = useState("");
  const [editReceivedDate, setEditReceivedDate] = useState("");
  const [editDiscipline, setEditDiscipline] = useState("");
  const [editSetName, setEditSetName] = useState("");
  const [editStatus, setEditStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadsPanelRef = useRef<HTMLDivElement>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/drawings`);
    if (res.ok) {
      const data = await res.json();
      setDrawings(data.drawings ?? []);
      setUploads(data.uploads ?? []);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Sync edit panel when selection changes
  useEffect(() => {
    if (selected) {
      setEditNo(selected.drawing_no ?? "");
      setEditTitle(selected.title ?? "");
      setEditRevision(selected.revision ?? "");
      setEditDrawingDate(selected.drawing_date ?? "");
      setEditReceivedDate(selected.received_date ?? "");
      setEditDiscipline(selected.discipline ?? "");
      setEditSetName(selected.set_name ?? "");
      setEditStatus(selected.status || "draft");
      setDeleteConfirm(false);
    }
  }, [selected]);

  // Dismiss uploads panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (uploadsPanelRef.current && !uploadsPanelRef.current.contains(e.target as Node)) {
        setShowUploadsPanel(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────────

  const disciplines = Array.from(new Set(drawings.map((d) => d.discipline ?? "").filter(Boolean))).sort();
  const sets = Array.from(new Set(drawings.map((d) => d.set_name ?? "").filter(Boolean))).sort();

  const filteredDrawings = drawings.filter((d) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !(d.drawing_no ?? "").toLowerCase().includes(q) &&
        !(d.title ?? "").toLowerCase().includes(q) &&
        !(d.revision ?? "").toLowerCase().includes(q) &&
        !d.filename.toLowerCase().includes(q)
      ) return false;
    }
    if (disciplineFilter && (d.discipline ?? "") !== disciplineFilter) return false;
    if (setFilter && (d.set_name ?? "") !== setFilter) return false;
    return true;
  });

  // Group by discipline
  const grouped = new Map<string, DrawingPage[]>();
  for (const d of filteredDrawings) {
    const key = d.discipline ?? "(No Discipline)";
    const group = grouped.get(key) ?? [];
    group.push(d);
    grouped.set(key, group);
  }
  const groupKeys = Array.from(grouped.keys()).sort((a, b) =>
    a === "(No Discipline)" ? 1 : b === "(No Discipline)" ? -1 : a.localeCompare(b)
  );

  // ── Upload ────────────────────────────────────────────────────────────────────

  async function handleUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are accepted.");
      return;
    }
    setUploading(true);
    setUploadStatus("Detecting pages…");

    let pageCount = 1;
    try { pageCount = await countPages(file); } catch { /* fallback */ }

    setUploadStatus(`Uploading ${pageCount} page${pageCount !== 1 ? "s" : ""}…`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("pageCount", String(pageCount));

    const res = await fetch(`/api/projects/${projectId}/drawings`, { method: "POST", body: formData });
    setUploading(false);
    setUploadStatus("");

    if (res.ok) {
      const data = await res.json();
      const newDrawings = (data.drawings ?? []).map((d: DrawingPage) => ({
        ...d,
        storage_path: data.upload.storage_path,
        filename: data.upload.filename,
        uploaded_by_name: data.upload.uploaded_by_name,
        uploaded_at: data.upload.uploaded_at,
      }));
      setDrawings((prev) => [...newDrawings, ...prev]);
      setUploads((prev) => [data.upload, ...prev]);
    } else {
      const err = await res.json();
      alert(err.error ?? "Upload failed");
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) { handleUpload(e.target.files[0]); e.target.value = ""; }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  // ── Save metadata ─────────────────────────────────────────────────────────────

  async function saveDetail() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/drawings/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drawing_no: editNo || null,
        title: editTitle || null,
        revision: editRevision || null,
        drawing_date: editDrawingDate || null,
        received_date: editReceivedDate || null,
        discipline: editDiscipline || null,
        set_name: editSetName || null,
        status: editStatus || "draft",
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      const merged = { ...selected, ...updated };
      setDrawings((prev) => prev.map((d) => d.id === merged.id ? merged : d));
      setSelected(merged);
    }
    setSaving(false);
  }

  async function autoFill() {
    if (!selected) return;
    setExtracting(true);
    try {
      const meta = await extractMetaFromPage(selected.storage_path, selected.page_number);
      if (meta.drawing_no) setEditNo(meta.drawing_no);
      if (meta.title) setEditTitle(meta.title);
      if (meta.revision) setEditRevision(meta.revision);
      if (meta.drawing_date) setEditDrawingDate(meta.drawing_date);
    } catch { /* silently fail */ }
    setExtracting(false);
  }

  async function deleteDrawing() {
    if (!selected) return;
    await fetch(`/api/projects/${projectId}/drawings/${selected.id}`, { method: "DELETE" });
    setDrawings((prev) => prev.filter((d) => d.id !== selected.id));
    const remaining = drawings.filter((d) => d.id !== selected.id && d.upload_id === selected.upload_id);
    if (remaining.length === 0) setUploads((prev) => prev.filter((u) => u.id !== selected.upload_id));
    setSelected(null);
  }

  async function deleteUpload(uploadId: string) {
    const res = await fetch(`/api/projects/${projectId}/drawings/uploads/${uploadId}`, { method: "DELETE" });
    if (res.ok) {
      setDrawings((prev) => prev.filter((d) => d.upload_id !== uploadId));
      setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      if (selected?.upload_id === uploadId) setSelected(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── Empty state ───────────────────────────────────────────────────────────────

  if (!loading && drawings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0">
          <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">SiteCommand</a>
          <div className="flex items-center gap-5">
            {role === "admin" && <a href="/admin" className="text-xs font-medium text-gray-500 hover:text-gray-900">Admin</a>}
            <span className="text-sm text-gray-400">{username}</span>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900">Logout</button>
          </div>
        </header>
        <ProjectNav projectId={projectId} />
        <div
          className={`flex-1 flex items-center justify-center ${isDragging ? "bg-blue-50" : ""}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
        >
          <div className={`border-2 border-dashed rounded-2xl p-12 text-center max-w-md w-full transition-colors ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white"}`}>
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-base font-semibold text-gray-700 mb-1">Drop a PDF drawing set here</p>
            <p className="text-sm text-gray-400 mb-6">Each page becomes a drawing you can tag with No., Title, Rev…</p>
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {uploadStatus}
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                Choose File
              </button>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileInput} />
          </div>
        </div>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">SiteCommand</a>
        <div className="flex items-center gap-5">
          {role === "admin" && <a href="/admin" className="text-xs font-medium text-gray-500 hover:text-gray-900">Admin</a>}
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900">Logout</button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <div
        className="flex flex-1 overflow-hidden"
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
      >
        {/* Main content */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isDragging ? "ring-2 ring-blue-400 ring-inset" : ""}`}>

          {/* Toolbar */}
          <div className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-2 shrink-0 flex-wrap">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
              />
            </div>

            {/* Filters button */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded text-gray-600 hover:bg-gray-50">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters
            </button>

            {/* Discipline filter */}
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600"
            >
              <option value="">Discipline</option>
              {disciplines.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* Set filter */}
            <select
              value={setFilter}
              onChange={(e) => setSetFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600"
            >
              <option value="">Set</option>
              {sets.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="flex-1" />

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {uploadStatus || "Uploading…"}
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload PDF
                </>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileInput} />

            {/* Uploads panel */}
            <div ref={uploadsPanelRef} className="relative">
              <button
                onClick={() => setShowUploadsPanel((v) => !v)}
                className={`flex items-center gap-1 p-2 border rounded text-sm transition-colors ${showUploadsPanel ? "bg-gray-100 border-gray-300 text-gray-900" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                title={`Uploads (${uploads.length})`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              {showUploadsPanel && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-100 rounded-xl shadow-xl z-30 p-2">
                  {uploads.length === 0 ? (
                    <p className="text-sm text-gray-400 px-3 py-2">No uploads</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {uploads.map((u) => (
                        <li key={u.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 group">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{u.filename}</p>
                            <p className="text-xs text-gray-400">{u.page_count} page{u.page_count !== 1 ? "s" : ""} · {formatDate(u.uploaded_at)}</p>
                          </div>
                          <button
                            onClick={() => deleteUpload(u.id)}
                            className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
            ) : filteredDrawings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500">No drawings match your search</p>
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                {/* Column headers */}
                <thead className="sticky top-0 bg-white z-10 border-b border-gray-200">
                  <tr>
                    <th className="w-8 px-2 py-2.5 border-b border-gray-200" />
                    <th className="w-6 px-2 py-2.5 border-b border-gray-200" />
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200 w-32">Drawing No.</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200">Drawing Title</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200 w-28">Revision</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200 w-32">Drawing Date</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200 w-32">Received Date</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200 w-28">Set</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-700 border-b border-gray-200 w-28">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {groupKeys.map((groupKey) => {
                    const groupDrawings = grouped.get(groupKey) ?? [];
                    const collapsed = collapsedGroups.has(groupKey);
                    return [
                      // Group header row
                      <tr key={`group-${groupKey}`} className="bg-white border-b border-gray-200">
                        <td colSpan={9} className="px-3 py-2">
                          <button
                            onClick={() => toggleGroup(groupKey)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                          >
                            <svg
                              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                            {groupKey}
                            <span className="text-gray-400 font-normal">({groupDrawings.length})</span>
                          </button>
                        </td>
                      </tr>,
                      // Data rows (hidden when collapsed)
                      ...(!collapsed ? groupDrawings.map((d) => (
                        <tr
                          key={d.id}
                          onClick={() => setPreview(d)}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer group"
                        >
                          {/* Checkbox column */}
                          <td className="px-2 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300" />
                          </td>
                          {/* Info icon → opens edit panel */}
                          <td className="px-2 py-2.5 text-center" onClick={(e) => { e.stopPropagation(); setSelected(d); }}>
                            <button
                              className="text-gray-300 hover:text-blue-500 transition-colors"
                              title="Edit metadata"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </td>
                          {/* Drawing No. */}
                          <td className="px-3 py-2.5">
                            <span className="text-blue-600 font-medium text-sm">
                              {d.drawing_no ?? <span className="text-gray-300">—</span>}
                            </span>
                          </td>
                          {/* Title */}
                          <td className="px-3 py-2.5 text-gray-800 text-sm">
                            {d.title ?? <span className="text-gray-300 text-sm">Page {d.page_number}</span>}
                          </td>
                          {/* Revision */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              {d.revision ? (
                                <span className="text-gray-700 text-sm">{d.revision}</span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                              {d.revision && (
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded transition-colors"
                                >
                                  See All
                                </button>
                              )}
                            </div>
                          </td>
                          {/* Drawing Date */}
                          <td className="px-3 py-2.5 text-gray-600 text-sm">
                            {d.drawing_date ? formatDate(d.drawing_date) : <span className="text-gray-300">—</span>}
                          </td>
                          {/* Received Date */}
                          <td className="px-3 py-2.5 text-gray-600 text-sm">
                            {d.received_date ? formatDate(d.received_date) : <span className="text-gray-300">—</span>}
                          </td>
                          {/* Set */}
                          <td className="px-3 py-2.5">
                            {d.set_name ? (
                              <span className="text-blue-600 text-sm">{d.set_name}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          {/* Status */}
                          <td className="px-3 py-2.5">
                            {d.status && d.status !== "draft" ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[d.status] ?? "bg-gray-100 text-gray-600"}`}>
                                {statusLabel(d.status)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                Draft
                              </span>
                            )}
                          </td>
                        </tr>
                      )) : []),
                    ];
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Metadata edit panel (triggered by info icon) */}
        {selected && (
          <div className="w-72 shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 truncate pr-2">
                {selected.drawing_no ?? `Page ${selected.page_number}`}
              </h3>
              <button onClick={() => setSelected(null)} className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Source info */}
              <div className="text-xs text-gray-500">
                <p className="font-medium text-gray-700 truncate">{selected.filename} — page {selected.page_number}</p>
                <p>Uploaded by {selected.uploaded_by_name} · {formatDate(selected.uploaded_at)}</p>
              </div>

              {/* View full screen button */}
              <button
                onClick={() => { setPreview(selected); setSelected(null); }}
                className="w-full flex items-center justify-center gap-2 py-1.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                View Full Screen
              </button>

              {/* Auto-fill */}
              <button
                onClick={autoFill}
                disabled={extracting}
                className="w-full flex items-center justify-center gap-2 py-1.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {extracting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Reading title block…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Auto-fill from PDF
                  </>
                )}
              </button>

              <div className="space-y-3 pt-1 border-t border-gray-100">
                {[
                  { label: "Drawing No.", value: editNo, setter: setEditNo, placeholder: "e.g. A-101" },
                  { label: "Title", value: editTitle, setter: setEditTitle, placeholder: "e.g. Floor Plan" },
                  { label: "Revision", value: editRevision, setter: setEditRevision, placeholder: "e.g. 2" },
                  { label: "Discipline", value: editDiscipline, setter: setEditDiscipline, placeholder: "e.g. Civil" },
                  { label: "Set", value: editSetName, setter: setEditSetName, placeholder: "e.g. Bid Set" },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Drawing Date</label>
                  <input type="date" value={editDrawingDate} onChange={(e) => setEditDrawingDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Received Date</label>
                  <input type="date" value={editReceivedDate} onChange={(e) => setEditReceivedDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="superseded">Superseded</option>
                    <option value="void">Void</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button onClick={saveDetail} disabled={saving}
                  className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving…" : "Save"}
                </button>
                {deleteConfirm ? (
                  <div className="flex gap-2">
                    <button onClick={deleteDrawing} className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Confirm Delete</button>
                    <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(true)} className="w-full py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50">
                    Delete Drawing
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-blue-500/10 border-4 border-dashed border-blue-400 pointer-events-none">
          <p className="text-blue-600 text-xl font-semibold">Drop PDF to upload</p>
        </div>
      )}

      {/* Full-Screen Preview */}
      {preview && (
        <FullScreenPreview
          drawing={preview}
          allDrawings={filteredDrawings}
          onClose={() => setPreview(null)}
          onNavigate={(d) => setPreview(d)}
        />
      )}
    </div>
  );
}
