"use client";

import { useState, useEffect, useRef, useCallback, DragEvent } from "react";

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
  updated_at: string;
  // joined from drawing_uploads
  storage_path: string;
  filename: string;
  uploaded_by_name: string;
  uploaded_at: string;
};

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function drawingLabel(d: DrawingPage) {
  if (d.drawing_no || d.title) {
    return `${d.drawing_no ?? ""}${d.drawing_no && d.title ? " — " : ""}${d.title ?? ""}`.trim();
  }
  return `Page ${d.page_number} of ${d.filename}`;
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
  // MM/DD/YYYY or MM-DD-YYYY
  const mdy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Try JS Date (handles "Jan 15 2024" etc.)
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
    .map((i) => ({
      str: i.str.trim(),
      x: i.transform[4],
      y: i.transform[5],
      w: i.width ?? 0,
    }));

  const result: ExtractedMeta = {};

  for (const item of items) {
    for (const field of Object.keys(LABEL_PATTERNS) as Array<keyof ExtractedMeta>) {
      if (result[field]) continue;
      if (!LABEL_PATTERNS[field].test(item.str)) continue;

      // 1. Same row, immediately to the right
      const sameRow = items
        .filter((i) => Math.abs(i.y - item.y) < 4 && i.x > item.x + item.w - 1 && i.str.length > 0)
        .sort((a, b) => a.x - b.x);

      const rowCandidate = sameRow.find(
        (i) => !Object.values(LABEL_PATTERNS).some((p) => p.test(i.str))
      );
      if (rowCandidate) {
        result[field] = field === "drawing_date" ? (parseIsoDate(rowCandidate.str) || rowCandidate.str) : rowCandidate.str;
        continue;
      }

      // 2. Directly below the label (PDF y goes up, so below = smaller y)
      const below = items
        .filter(
          (i) =>
            i.y < item.y &&
            i.y > item.y - 30 &&
            i.x >= item.x - 10 &&
            i.x <= item.x + Math.max(item.w, 60) + 10 &&
            i.str.length > 0
        )
        .sort((a, b) => b.y - a.y);

      const belowCandidate = below.find(
        (i) => !Object.values(LABEL_PATTERNS).some((p) => p.test(i.str))
      );
      if (belowCandidate) {
        result[field] = field === "drawing_date" ? (parseIsoDate(belowCandidate.str) || belowCandidate.str) : belowCandidate.str;
      }
    }
  }

  return result;
}

async function renderPageFromDoc(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf: any,
  pageNumber: number
): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const vp = page.getViewport({ scale: 0.4 });
  const canvas = document.createElement("canvas");
  canvas.width = vp.width;
  canvas.height = vp.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return canvas.toDataURL();
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
  const [selected, setSelected] = useState<DrawingPage | null>(null);
  const [activeView, setActiveView] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadsPanel, setShowUploadsPanel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Edit panel fields
  const [editNo, setEditNo] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editRevision, setEditRevision] = useState("");
  const [editDrawingDate, setEditDrawingDate] = useState("");
  const [editReceivedDate, setEditReceivedDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Thumbnail cache: drawingId → dataUrl
  const thumbnails = useRef<Map<string, string>>(new Map());
  const [thumbVersion, setThumbVersion] = useState(0); // force re-render when thumb ready

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

  // ── Thumbnail rendering ──────────────────────────────────────────────────────

  useEffect(() => {
    if (drawings.length === 0) return;

    async function renderAll() {
      await ensurePdfJs();
      const { getDocument } = await import("pdfjs-dist");

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) return;

      // Group pages by storage_path so we load each PDF document only once
      const byPath = new Map<string, DrawingPage[]>();
      for (const d of drawings) {
        if (thumbnails.current.has(d.id)) continue;
        const group = byPath.get(d.storage_path) ?? [];
        group.push(d);
        byPath.set(d.storage_path, group);
      }

      for (const [storagePath, pages] of byPath) {
        const url = `${supabaseUrl}/storage/v1/object/public/project-drawings/${storagePath}`;
        try {
          const pdf = await getDocument(url).promise;
          for (const d of pages) {
            try {
              const dataUrl = await renderPageFromDoc(pdf, d.page_number);
              thumbnails.current.set(d.id, dataUrl);
              setThumbVersion((v) => v + 1);
            } catch (pageErr) {
              console.warn(`Failed to render page ${d.page_number}:`, pageErr);
            }
          }
        } catch (docErr) {
          console.error(`Failed to load PDF for rendering (${storagePath}):`, docErr);
        }
      }
    }

    renderAll();
  }, [drawings]);

  // ── Upload ───────────────────────────────────────────────────────────────────

  async function handleUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are accepted.");
      return;
    }

    setUploading(true);
    setUploadStatus("Detecting pages…");

    let pageCount = 1;
    try {
      pageCount = await countPages(file);
    } catch {
      // fallback to 1
    }

    setUploadStatus(`Uploading ${pageCount} page${pageCount !== 1 ? "s" : ""}…`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("pageCount", String(pageCount));

    const res = await fetch(`/api/projects/${projectId}/drawings`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    setUploadStatus("");

    if (res.ok) {
      const data = await res.json();
      // Prepend new drawings and upload
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
    if (e.target.files?.[0]) {
      handleUpload(e.target.files[0]);
      e.target.value = "";
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  // ── Save metadata ────────────────────────────────────────────────────────────

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

  // ── Auto-fill from PDF text layer ────────────────────────────────────────────

  async function autoFill() {
    if (!selected) return;
    setExtracting(true);
    try {
      const meta = await extractMetaFromPage(selected.storage_path, selected.page_number);
      if (meta.drawing_no) setEditNo(meta.drawing_no);
      if (meta.title) setEditTitle(meta.title);
      if (meta.revision) setEditRevision(meta.revision);
      if (meta.drawing_date) setEditDrawingDate(meta.drawing_date);
    } catch {
      // silently fail — user can fill manually
    }
    setExtracting(false);
  }

  // ── Delete drawing ───────────────────────────────────────────────────────────

  async function deleteDrawing() {
    if (!selected) return;
    await fetch(`/api/projects/${projectId}/drawings/${selected.id}`, { method: "DELETE" });
    setDrawings((prev) => prev.filter((d) => d.id !== selected.id));
    thumbnails.current.delete(selected.id);
    // If no drawings remain for that upload, remove it from uploads list
    const remaining = drawings.filter((d) => d.id !== selected.id && d.upload_id === selected.upload_id);
    if (remaining.length === 0) {
      setUploads((prev) => prev.filter((u) => u.id !== selected.upload_id));
    }
    setSelected(null);
  }

  // ── Delete upload ────────────────────────────────────────────────────────────

  async function deleteUpload(uploadId: string) {
    const res = await fetch(`/api/projects/${projectId}/drawings/uploads/${uploadId}`, { method: "DELETE" });
    if (res.ok) {
      // Remove all drawings for this upload and the upload itself
      const removedIds = drawings.filter((d) => d.upload_id === uploadId).map((d) => d.id);
      removedIds.forEach((id) => thumbnails.current.delete(id));
      setDrawings((prev) => prev.filter((d) => d.upload_id !== uploadId));
      setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      if (selected?.upload_id === uploadId) setSelected(null);
    }
  }

  // ── Logout ───────────────────────────────────────────────────────────────────

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  // ── Filter ───────────────────────────────────────────────────────────────────

  const filteredDrawings = drawings.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.drawing_no ?? "").toLowerCase().includes(q) ||
      (d.title ?? "").toLowerCase().includes(q) ||
      (d.revision ?? "").toLowerCase().includes(q) ||
      d.filename.toLowerCase().includes(q)
    );
  });

  // ── Thumbnail helper ─────────────────────────────────────────────────────────

  function Thumb({ drawing, size = "full" }: { drawing: DrawingPage; size?: "full" | "panel" }) {
    // thumbVersion dependency ensures re-render when thumbnail arrives
    void thumbVersion;
    const dataUrl = thumbnails.current.get(drawing.id);
    const cls = size === "panel"
      ? "w-full aspect-[3/4] object-contain bg-gray-100 rounded-lg"
      : "w-full h-full object-contain";

    if (dataUrl) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={dataUrl} alt={drawingLabel(drawing)} className={cls} />;
    }
    return (
      <div className={`flex items-center justify-center text-gray-300 bg-gray-100 ${size === "panel" ? "w-full aspect-[3/4] rounded-lg" : "w-full h-full"}`}>
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    );
  }

  // ── Empty state drop-zone ────────────────────────────────────────────────────

  if (!loading && drawings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0">
          <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
            SiteCommand
          </a>
          <div className="flex items-center gap-5">
            {role === "admin" && (
              <a href="/admin" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">Admin</a>
            )}
            <span className="text-sm text-gray-400">{username}</span>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button>
          </div>
        </header>
        <ProjectNav projectId={projectId} />
        <div
          className={`flex-1 flex items-center justify-center ${isDragging ? "bg-blue-50" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center max-w-md w-full transition-colors ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white"}`}
          >
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
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose File
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Main layout ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          SiteCommand
        </a>
        <div className="flex items-center gap-5">
          {role === "admin" && (
            <a href="/admin" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">Admin</a>
          )}
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <div
        className="flex flex-1 overflow-hidden"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Main content */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isDragging ? "ring-2 ring-blue-400 ring-inset" : ""}`}>
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shrink-0 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {/* Upload PDF button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {uploadStatus || "Uploading…"}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload PDF
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileInput}
              />

              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search drawings…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
                />
              </div>

              {/* Uploads panel */}
              <div ref={uploadsPanelRef} className="relative">
                <button
                  onClick={() => setShowUploadsPanel((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                    showUploadsPanel ? "bg-gray-100 border-gray-300 text-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Uploads ({uploads.length})
                </button>
                {showUploadsPanel && (
                  <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-gray-100 rounded-xl shadow-xl z-30 p-2">
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
                              title="Delete this upload"
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

            {/* View toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView("grid")}
                title="Grid view"
                className={`p-1.5 rounded-md transition-colors ${activeView === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setActiveView("table")}
                title="Table view"
                className={`p-1.5 rounded-md transition-colors ${activeView === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
            ) : filteredDrawings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-500">No drawings match your search</p>
              </div>
            ) : activeView === "grid" ? (
              // ── Grid ──
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredDrawings.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className={`group relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden border-2 transition-all text-left focus:outline-none ${
                      selected?.id === d.id ? "border-blue-500" : "border-transparent hover:border-blue-300"
                    }`}
                  >
                    <Thumb drawing={d} />
                    {/* Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 py-2">
                      {d.drawing_no && (
                        <p className="text-white text-xs font-bold truncate">{d.drawing_no}</p>
                      )}
                      <p className="text-white/80 text-xs truncate">
                        {d.title ?? `Page ${d.page_number} of ${d.filename}`}
                      </p>
                      {d.revision && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-white/20 rounded text-white text-[10px] font-medium">
                          Rev {d.revision}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              // ── Table ──
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Drawing No.</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revision</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Drawing Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Received Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrawings.map((d) => (
                      <tr
                        key={d.id}
                        onClick={() => setSelected(d)}
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${
                          selected?.id === d.id ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{d.drawing_no ?? <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-700">{d.title ?? <span className="text-gray-300">Page {d.page_number}</span>}</td>
                        <td className="px-4 py-3">
                          {d.revision ? (
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-700">
                              Rev {d.revision}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{d.drawing_date ? formatDate(d.drawing_date) : <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-600">{d.received_date ? formatDate(d.received_date) : <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[160px]">{d.filename}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 truncate pr-2">
                {selected.drawing_no ?? `Page ${selected.page_number}`}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Thumbnail */}
              <div className="w-full">
                <Thumb drawing={selected} size="panel" />
              </div>

              {/* Source info */}
              <div className="text-xs text-gray-500 space-y-0.5">
                <p className="font-medium text-gray-700 truncate">{selected.filename} — page {selected.page_number}</p>
                <p>Uploaded by {selected.uploaded_by_name} · {formatDate(selected.uploaded_at)}</p>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <button
                  onClick={autoFill}
                  disabled={extracting}
                  className="w-full flex items-center justify-center gap-2 py-1.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 mb-3"
                  title="Read text from the PDF title block and fill fields automatically"
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
              </div>

              <div className="space-y-3">
                {/* Drawing No. */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Drawing No.</label>
                  <input
                    type="text"
                    value={editNo}
                    onChange={(e) => setEditNo(e.target.value)}
                    placeholder="e.g. A-101"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Floor Plan"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Revision */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Revision</label>
                  <input
                    type="text"
                    value={editRevision}
                    onChange={(e) => setEditRevision(e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Drawing Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Drawing Date</label>
                  <input
                    type="date"
                    value={editDrawingDate}
                    onChange={(e) => setEditDrawingDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Received Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Received Date</label>
                  <input
                    type="date"
                    value={editReceivedDate}
                    onChange={(e) => setEditReceivedDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={saveDetail}
                  disabled={saving}
                  className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>

                {deleteConfirm ? (
                  <div className="flex gap-2">
                    <button
                      onClick={deleteDrawing}
                      className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="flex-1 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="w-full py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                  >
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
    </div>
  );
}
