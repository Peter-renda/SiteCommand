"use client";

import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from "react";
// Note: useRef/useCallback used by other parts of this file (folder tree, modals)
import ProjectNav from "@/components/ProjectNav";

type DocItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  size: number | null;
  mime_type: string | null;
  url: string | null;
  created_at: string;
  created_by_name: string | null;
  parent_id: string | null;
  is_private: boolean;
};

type BreadcrumbItem = { id: string | null; name: string };

type FolderOption = { id: string | null; name: string; depth: number };

function formatDate(ts: string, createdByName?: string | null): string {
  if (!ts) return "—";
  const date = new Date(ts);
  const datePart = date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const base = `${datePart} at ${timePart}`;
  return createdByName ? `${base} by ${createdByName}` : base;
}

function isPdf(item: DocItem): boolean {
  return (
    item.mime_type === "application/pdf" ||
    item.name.toLowerCase().endsWith(".pdf")
  );
}

function getFileIcon(item: DocItem): React.ReactElement {
  if (item.type === "folder") {
    return (
      <svg className="w-5 h-5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    );
  }

  const mime = item.mime_type ?? "";
  const name = item.name.toLowerCase();

  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    return (
      <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  if (
    mime.startsWith("image/") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".gif") ||
    name.endsWith(".webp") ||
    name.endsWith(".svg")
  ) {
    return (
      <svg className="w-5 h-5 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    );
  }

  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv")
  ) {
    return (
      <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
      </svg>
    );
  }

  return (
    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  );
}

function buildFolderTree(
  folders: { id: string; name: string; parent_id: string | null }[],
  parentId: string | null,
  depth: number
): FolderOption[] {
  const result: FolderOption[] = [];
  const children = folders.filter((f) => f.parent_id === parentId);
  for (const child of children) {
    result.push({ id: child.id, name: child.name, depth });
    result.push(...buildFolderTree(folders, child.id, depth + 1));
  }
  return result;
}

// ── PDF Viewer Modal ─────────────────────────────────────────────────────────

// Annotation types
type AnnotationTool = "pen" | "rect" | "circle" | "line" | "text" | "eraser" | "select";

type AnnotationStroke = {
  id: string;
  tool: "pen" | "rect" | "circle" | "line" | "text";
  color: string;
  lineWidth: number;
  // pen
  points?: { x: number; y: number }[];
  // rect / circle
  x?: number; y?: number; w?: number; h?: number;
  // line
  x1?: number; y1?: number; x2?: number; y2?: number;
  // text
  text?: string; tx?: number; ty?: number;
};

type AnnotationSet = {
  created_by: string;
  created_by_name: string | null;
  role: string | null;
  annotation_data: AnnotationStroke[];
};

const ANNOTATION_COLORS = [
  { label: "Red",    value: "#ef4444" },
  { label: "Blue",   value: "#3b82f6" },
  { label: "Green",  value: "#22c55e" },
  { label: "Yellow", value: "#eab308" },
  { label: "Black",  value: "#111827" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "#3b82f6",
  member: "#22c55e",
  external_viewer: "#f97316",
};

function roleColor(role: string | null): string {
  return ROLE_COLORS[role ?? ""] ?? "#9ca3af";
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function findStrokeNear(strokes: AnnotationStroke[], rx: number, ry: number): string | null {
  const THRESHOLD = 0.04;
  for (const stroke of [...strokes].reverse()) {
    if (stroke.tool === "text") {
      if (Math.abs((stroke.tx ?? 0) - rx) < THRESHOLD && Math.abs((stroke.ty ?? 0) - ry) < THRESHOLD * 2) return stroke.id;
    } else if (stroke.tool === "rect" || stroke.tool === "circle") {
      // Hit-test inside the bounding box (with a small padding)
      const x0 = Math.min(stroke.x ?? 0, (stroke.x ?? 0) + (stroke.w ?? 0)) - THRESHOLD;
      const x1 = Math.max(stroke.x ?? 0, (stroke.x ?? 0) + (stroke.w ?? 0)) + THRESHOLD;
      const y0 = Math.min(stroke.y ?? 0, (stroke.y ?? 0) + (stroke.h ?? 0)) - THRESHOLD;
      const y1 = Math.max(stroke.y ?? 0, (stroke.y ?? 0) + (stroke.h ?? 0)) + THRESHOLD;
      if (rx >= x0 && rx <= x1 && ry >= y0 && ry <= y1) return stroke.id;
    } else if (stroke.tool === "line") {
      // Hit-test near any point along the line segment
      const x1 = stroke.x1 ?? 0, y1 = stroke.y1 ?? 0;
      const x2 = stroke.x2 ?? 0, y2 = stroke.y2 ?? 0;
      const dx = x2 - x1, dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      const t = lenSq > 0 ? Math.max(0, Math.min(1, ((rx - x1) * dx + (ry - y1) * dy) / lenSq)) : 0;
      const nearX = x1 + t * dx, nearY = y1 + t * dy;
      if (Math.abs(nearX - rx) < THRESHOLD && Math.abs(nearY - ry) < THRESHOLD) return stroke.id;
    } else if (stroke.tool === "pen" && stroke.points?.length) {
      // Hit-test near any point in the pen stroke
      const hit = stroke.points.some(
        (p) => Math.abs(p.x - rx) < THRESHOLD && Math.abs(p.y - ry) < THRESHOLD
      );
      if (hit) return stroke.id;
    }
  }
  return null;
}

function PdfViewerModal({
  url,
  name,
  onClose,
  docId,
  projectId,
  userRole,
  userName,
}: {
  url: string;
  name: string;
  onClose: () => void;
  docId: string;
  projectId: string;
  userRole: string;
  userName: string;
}) {
  const [loading, setLoading] = useState(true);

  // ── Annotation state ────────────────────────────────────────────────────────
  const [annotationMode, setAnnotationMode] = useState(false);
  const [annotationsLoaded, setAnnotationsLoaded] = useState(false);
  const [activeTool, setActiveTool] = useState<AnnotationTool>("pen");
  const [activeColor, setActiveColor] = useState("#ef4444");
  const [strokes, setStrokes] = useState<AnnotationStroke[]>([]);
  const [allAnnotations, setAllAnnotations] = useState<AnnotationSet[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Drawing tracking refs (not state — no re-render needed mid-draw)
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<AnnotationStroke | null>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
  const selectedStrokeIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);

  // Keyboard: Esc to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Load annotations when annotation mode is first enabled ─────────────────
  useEffect(() => {
    if (!annotationMode || annotationsLoaded) return;
    async function fetchAnnotations() {
      try {
        const res = await fetch(`/api/projects/${projectId}/documents/${docId}/annotations`);
        if (!res.ok) return;
        const data: AnnotationSet[] = await res.json();
        setAllAnnotations(data);
        // Pre-populate current user's strokes from their record (if any)
        // We identify the user's record by checking if any annotation came from "me"
        // We expose userName and match by name as a fallback (no userId in client)
        const myRecord = data.find((a) => a.created_by_name === userName);
        if (myRecord && Array.isArray(myRecord.annotation_data)) {
          setStrokes(myRecord.annotation_data);
        }
      } catch {
        // silently ignore
      } finally {
        setAnnotationsLoaded(true);
      }
    }
    fetchAnnotations();
  }, [annotationMode, annotationsLoaded, docId, projectId, userName]);

  // ── Render annotations onto canvas whenever strokes/allAnnotations change ──
  useEffect(() => {
    if (!annotationMode) return;
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderAnnotations(ctx, canvas.width, canvas.height);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, allAnnotations, annotationMode]);

  // Keep canvas sized to its container
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!annotationMode) return;
    function resize() {
      const canvas = annotationCanvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) renderAnnotations(ctx, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotationMode]);

  // ── Coordinate helpers (percentage-based so they scale with container) ──────
  function toRel(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }

  function toAbs(canvas: HTMLCanvasElement, rx: number, ry: number) {
    return { x: rx * canvas.width, y: ry * canvas.height };
  }

  // ── Render all annotations ──────────────────────────────────────────────────
  function renderAnnotations(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    ctx.clearRect(0, 0, cw, ch);

    // Render other users first, then current user on top
    const othersAnnotations = allAnnotations.filter((a) => a.created_by_name !== userName);
    for (const set of othersAnnotations) {
      const color = roleColor(set.role);
      renderStrokeSet(ctx, cw, ch, set.annotation_data, color, false);
    }
    // Current user's strokes — use each stroke's own color
    renderStrokeSet(ctx, cw, ch, strokes, activeColor, true);
  }

  function renderStrokeSet(
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    strokeList: AnnotationStroke[],
    fallbackColor: string,
    useStrokeColor: boolean
  ) {
    for (const stroke of strokeList) {
      const color = useStrokeColor ? stroke.color : fallbackColor;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = stroke.lineWidth ?? 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.tool === "pen" && stroke.points && stroke.points.length > 1) {
        ctx.beginPath();
        const first = toAbs(annotationCanvasRef.current!, stroke.points[0].x, stroke.points[0].y);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = toAbs(annotationCanvasRef.current!, stroke.points[i].x, stroke.points[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      } else if (stroke.tool === "rect" && stroke.x !== undefined) {
        const p = toAbs(annotationCanvasRef.current!, stroke.x!, stroke.y!);
        ctx.beginPath();
        ctx.strokeRect(p.x, p.y, stroke.w! * cw, stroke.h! * ch);
      } else if (stroke.tool === "circle" && stroke.x !== undefined) {
        const p = toAbs(annotationCanvasRef.current!, stroke.x!, stroke.y!);
        const rx = (stroke.w! * cw) / 2;
        const ry = (stroke.h! * ch) / 2;
        ctx.beginPath();
        ctx.ellipse(p.x + rx, p.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (stroke.tool === "line" && stroke.x1 !== undefined) {
        const a = toAbs(annotationCanvasRef.current!, stroke.x1!, stroke.y1!);
        const b = toAbs(annotationCanvasRef.current!, stroke.x2!, stroke.y2!);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      } else if (stroke.tool === "text" && stroke.text && stroke.tx !== undefined) {
        const p = toAbs(annotationCanvasRef.current!, stroke.tx!, stroke.ty!);
        ctx.font = `${14 * (stroke.lineWidth ?? 1)}px sans-serif`;
        ctx.fillText(stroke.text, p.x, p.y);
      }
    }
  }

  // ── Drawing event handlers ──────────────────────────────────────────────────
  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (userRole === "external_viewer") return;
    const canvas = annotationCanvasRef.current!;
    const rel = toRel(canvas, e.clientX, e.clientY);

    if (activeTool === "select") {
      const foundId = findStrokeNear(strokes, rel.x, rel.y);
      if (foundId) {
        setSelectedStrokeId(foundId);
        selectedStrokeIdRef.current = foundId;
        const stroke = strokes.find((s) => s.id === foundId);
        if (stroke) {
          let anchorX = 0;
          let anchorY = 0;
          if (stroke.tool === "text") { anchorX = stroke.tx ?? 0; anchorY = stroke.ty ?? 0; }
          else if (stroke.tool === "rect" || stroke.tool === "circle") { anchorX = stroke.x ?? 0; anchorY = stroke.y ?? 0; }
          else if (stroke.tool === "line") { anchorX = stroke.x1 ?? 0; anchorY = stroke.y1 ?? 0; }
          else if (stroke.tool === "pen" && stroke.points?.length) { anchorX = stroke.points[0].x; anchorY = stroke.points[0].y; }
          dragOffsetRef.current = { dx: rel.x - anchorX, dy: rel.y - anchorY };
        }
        isDrawingRef.current = true;
      } else {
        setSelectedStrokeId(null);
        selectedStrokeIdRef.current = null;
        dragOffsetRef.current = null;
      }
      return;
    }

    if (activeTool === "eraser") {
      eraseAt(rel.x, rel.y);
      isDrawingRef.current = true;
      return;
    }

    if (activeTool === "text") {
      const text = window.prompt("Enter annotation text:");
      if (!text) return;
      const newStroke: AnnotationStroke = {
        id: genId(),
        tool: "text",
        color: activeColor,
        lineWidth: 2,
        text,
        tx: rel.x,
        ty: rel.y,
      };
      setStrokes((prev) => [...prev, newStroke]);
      return;
    }

    isDrawingRef.current = true;

    if (activeTool === "pen") {
      currentStrokeRef.current = {
        id: genId(),
        tool: "pen",
        color: activeColor,
        lineWidth: 2,
        points: [{ x: rel.x, y: rel.y }],
      };
    } else if (activeTool === "rect" || activeTool === "circle") {
      currentStrokeRef.current = {
        id: genId(),
        tool: activeTool,
        color: activeColor,
        lineWidth: 2,
        x: rel.x,
        y: rel.y,
        w: 0,
        h: 0,
      };
    } else if (activeTool === "line") {
      currentStrokeRef.current = {
        id: genId(),
        tool: "line",
        color: activeColor,
        lineWidth: 2,
        x1: rel.x,
        y1: rel.y,
        x2: rel.x,
        y2: rel.y,
      };
    }
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const canvas = annotationCanvasRef.current!;
    const rel = toRel(canvas, e.clientX, e.clientY);

    const movingId = selectedStrokeIdRef.current;
    if (activeTool === "select" && movingId && dragOffsetRef.current) {
      const { dx, dy } = dragOffsetRef.current;
      const nx = rel.x - dx;
      const ny = rel.y - dy;
      setStrokes((prev) =>
        prev.map((s) => {
          if (s.id !== movingId) return s;
          if (s.tool === "text") return { ...s, tx: nx, ty: ny };
          if (s.tool === "rect" || s.tool === "circle") return { ...s, x: nx, y: ny };
          if (s.tool === "line") {
            const origDx = (s.x2 ?? 0) - (s.x1 ?? 0);
            const origDy = (s.y2 ?? 0) - (s.y1 ?? 0);
            return { ...s, x1: nx, y1: ny, x2: nx + origDx, y2: ny + origDy };
          }
          if (s.tool === "pen" && s.points?.length) {
            const ox = s.points[0].x;
            const oy = s.points[0].y;
            return { ...s, points: s.points.map((p) => ({ x: p.x + (nx - ox), y: p.y + (ny - oy) })) };
          }
          return s;
        })
      );
      return;
    }

    if (!currentStrokeRef.current) return;

    if (activeTool === "eraser") {
      eraseAt(rel.x, rel.y);
      return;
    }

    const stroke = currentStrokeRef.current;

    if (stroke.tool === "pen") {
      stroke.points = [...(stroke.points ?? []), { x: rel.x, y: rel.y }];
    } else if (stroke.tool === "rect" || stroke.tool === "circle") {
      stroke.w = rel.x - (stroke.x ?? 0);
      stroke.h = rel.y - (stroke.y ?? 0);
    } else if (stroke.tool === "line") {
      stroke.x2 = rel.x;
      stroke.y2 = rel.y;
    }

    // Live preview — render in-progress stroke with current committed strokes
    const ctx = canvas.getContext("2d")!;
    renderAnnotations(ctx, canvas.width, canvas.height);
    // Draw current stroke on top as a preview
    renderStrokeSet(ctx, canvas.width, canvas.height, [stroke], activeColor, true);
  }

  function endDraw() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (activeTool === "select") {
      dragOffsetRef.current = null;
      // keep selectedStrokeIdRef/selectedStrokeId so the selection is visible after drag
      return;
    }

    if (activeTool === "eraser") return;

    if (currentStrokeRef.current) {
      setStrokes((prev) => [...prev, { ...currentStrokeRef.current! }]);
      currentStrokeRef.current = null;
    }
  }

  function eraseAt(rx: number, ry: number) {
    const THRESHOLD = 0.02; // ~2% of canvas size
    setStrokes((prev) =>
      prev.filter((stroke) => {
        if (stroke.tool === "pen" && stroke.points) {
          return !stroke.points.some(
            (p) => Math.abs(p.x - rx) < THRESHOLD && Math.abs(p.y - ry) < THRESHOLD
          );
        }
        if (stroke.tool === "rect" || stroke.tool === "circle") {
          const cx = (stroke.x ?? 0) + (stroke.w ?? 0) / 2;
          const cy = (stroke.y ?? 0) + (stroke.h ?? 0) / 2;
          return Math.abs(cx - rx) > THRESHOLD * 2 || Math.abs(cy - ry) > THRESHOLD * 2;
        }
        if (stroke.tool === "line") {
          const cx = ((stroke.x1 ?? 0) + (stroke.x2 ?? 0)) / 2;
          const cy = ((stroke.y1 ?? 0) + (stroke.y2 ?? 0)) / 2;
          return Math.abs(cx - rx) > THRESHOLD * 2 || Math.abs(cy - ry) > THRESHOLD * 2;
        }
        if (stroke.tool === "text") {
          return Math.abs((stroke.tx ?? 0) - rx) > THRESHOLD * 2 || Math.abs((stroke.ty ?? 0) - ry) > THRESHOLD * 2;
        }
        return true;
      })
    );
  }

  // ── Save annotations ────────────────────────────────────────────────────────
  async function saveAnnotations() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/documents/${docId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annotation_data: strokes }),
      });
      if (res.ok) {
        setSaveMsg("Saved");
        setTimeout(() => setSaveMsg(null), 2000);
        // Update allAnnotations to reflect the saved state for the current user
        setAllAnnotations((prev) => {
          const exists = prev.some((a) => a.created_by_name === userName);
          if (exists) {
            return prev.map((a) =>
              a.created_by_name === userName
                ? { ...a, annotation_data: strokes }
                : a
            );
          } else {
            return [
              ...prev,
              {
                created_by: "",
                created_by_name: userName,
                role: userRole,
                annotation_data: strokes,
              },
            ];
          }
        });
      } else {
        setSaveMsg("Error saving");
        setTimeout(() => setSaveMsg(null), 3000);
      }
    } catch {
      setSaveMsg("Error saving");
      setTimeout(() => setSaveMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  const canAnnotate = userRole !== "external_viewer";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 shrink-0 gap-4 flex-wrap">
        {/* Filename */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-white truncate">{name}</span>
        </div>

        {/* Annotation controls (shown when annotationMode is on) */}
        {annotationMode && (
          <div className="flex items-center gap-1 flex-wrap shrink-0">
            {canAnnotate ? (
              <>
                {/* Tool buttons */}
                {(["select", "pen", "rect", "circle", "line", "text", "eraser"] as AnnotationTool[]).map((tool) => {
                  const labels: Record<AnnotationTool, string> = {
                    select: "↖", pen: "✏️", rect: "□", circle: "○", line: "/", text: "T", eraser: "⌫",
                  };
                  const titles: Record<AnnotationTool, string> = {
                    select: "Select / Move", pen: "Pen", rect: "Rectangle", circle: "Circle", line: "Line", text: "Text", eraser: "Eraser",
                  };
                  return (
                    <button
                      key={tool}
                      onClick={() => setActiveTool(tool)}
                      title={titles[tool]}
                      className={`px-2 py-1 text-sm rounded transition-colors ${
                        activeTool === tool
                          ? "bg-gray-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      {labels[tool]}
                    </button>
                  );
                })}

                <div className="w-px h-5 bg-gray-700 mx-1" />

                {/* Color swatches */}
                {ANNOTATION_COLORS.map((c) => (
                  <button
                    key={c.value}
                    title={c.label}
                    onClick={() => setActiveColor(c.value)}
                    className={`w-5 h-5 rounded-full border-2 transition-colors ${
                      activeColor === c.value ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}

                <div className="w-px h-5 bg-gray-700 mx-1" />

                {/* Save */}
                <button
                  onClick={saveAnnotations}
                  disabled={saving}
                  className="px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : saveMsg ?? "Save"}
                </button>

                {/* Clear Mine */}
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to clear all your annotations? This cannot be undone.")) {
                      setStrokes([]);
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-gray-400 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                >
                  Clear Mine
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-400 px-2 py-1 border border-gray-700 rounded">
                View Only
              </span>
            )}
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Annotate toggle */}
          <button
            onClick={() => setAnnotationMode((m) => !m)}
            title="Toggle Annotations"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              annotationMode
                ? "bg-yellow-500 border-yellow-400 text-gray-900"
                : "text-gray-300 border-gray-600 hover:bg-gray-700"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Annotate
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download={name}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
            title="Close (Esc)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* PDF iframe with annotation canvas overlay */}
      <div ref={containerRef} className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
            <svg className="w-8 h-8 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        <iframe
          src={url}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title={name}
        />
        {annotationMode && (
          <canvas
            ref={annotationCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{
              cursor: activeTool === "eraser" ? "cell" : activeTool === "select" ? "default" : canAnnotate ? "crosshair" : "default",
              zIndex: 10,
              pointerEvents: canAnnotate ? "auto" : "none",
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
          />
        )}
      </div>
    </div>
  );
}

// ── Modals ───────────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function InputModal({
  title,
  placeholder,
  defaultValue,
  onConfirm,
  onCancel,
}: {
  title: string;
  placeholder: string;
  defaultValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onConfirm(value.trim());
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4"
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MoveModal({
  folders,
  excludeId,
  onConfirm,
  onCancel,
}: {
  folders: { id: string; name: string; parent_id: string | null }[];
  excludeId: string;
  onConfirm: (targetParentId: string | null) => void;
  onCancel: () => void;
}) {
  // browsing state: null = root
  const [browsing, setBrowsing] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Documents" },
  ]);

  function getDescendantIds(id: string): Set<string> {
    const ids = new Set<string>([id]);
    for (const child of folders.filter((f) => f.parent_id === id)) {
      getDescendantIds(child.id).forEach((cid) => ids.add(cid));
    }
    return ids;
  }

  const excludedIds = getDescendantIds(excludeId);
  const visibleFolders = folders.filter(
    (f) => !excludedIds.has(f.id) && f.parent_id === browsing
  );

  function enter(folder: { id: string; name: string }) {
    setBrowsing(folder.id);
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
  }

  function navigateTo(index: number) {
    const crumb = breadcrumb[index];
    setBrowsing(crumb.id);
    setBreadcrumb((prev) => prev.slice(0, index + 1));
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Move To</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 px-5 py-2 border-b border-gray-50 flex-wrap">
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-gray-300 text-xs">/</span>}
              <button
                onClick={() => navigateTo(i)}
                className={`text-xs px-1 py-0.5 rounded transition-colors ${
                  i === breadcrumb.length - 1
                    ? "text-gray-900 font-medium"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Folder list */}
        <div className="min-h-[120px] max-h-64 overflow-y-auto py-2">
          {visibleFolders.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400">No subfolders here</p>
          ) : (
            visibleFolders.map((folder) => {
              const hasChildren = folders.some(
                (f) => f.parent_id === folder.id && !excludedIds.has(f.id)
              );
              return (
                <div key={folder.id} className="flex items-center group px-4 py-1.5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <span className="text-sm text-gray-700 truncate">{folder.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onConfirm(folder.id)}
                      className="text-xs px-2.5 py-1 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Move here
                    </button>
                    {hasChildren && (
                      <button
                        onClick={() => enter(folder)}
                        className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                        title="Open folder"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-between px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => onConfirm(null)}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Move to root
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Folder info panel ────────────────────────────────────────────────────────

function FolderInfoPanel({
  folder,
  projectName,
  breadcrumb,
  onClose,
  onTogglePrivate,
}: {
  folder: DocItem;
  projectName: string;
  breadcrumb: BreadcrumbItem[];
  onClose: () => void;
  onTogglePrivate: (folderId: string, isPrivate: boolean) => void;
}) {
  const [permissionsOpen, setPermissionsOpen] = useState(true);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [changeHistoryOpen, setChangeHistoryOpen] = useState(false);
  const [emailsOpen, setEmailsOpen] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const locationPath = breadcrumb.map((b) => b.name).join(" / ") + " / " + folder.name;

  async function handleToggle() {
    setSaving(true);
    onTogglePrivate(folder.id, !folder.is_private);
    setSaving(false);
  }

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span className="text-sm font-semibold text-gray-900 truncate">{folder.name}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* General Information */}
        <div className="px-4 py-4 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">General Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Title</p>
              <p className="text-sm text-gray-900">{folder.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Created On</p>
              <p className="text-sm text-gray-900">{formatDate(folder.created_at, folder.created_by_name)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Location</p>
              <p className="text-sm text-gray-900 break-words">{locationPath}</p>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => setPermissionsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Permissions</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${permissionsOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {permissionsOpen && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-700 font-medium">Make Private</span>
                  <div className="relative">
                    <button
                      onMouseEnter={() => setTooltipVisible(true)}
                      onMouseLeave={() => setTooltipVisible(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      type="button"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {tooltipVisible && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 bg-gray-900 text-white text-xs rounded-md px-2.5 py-1.5 shadow-lg z-50 pointer-events-none">
                        Private folders are only visible to company employees, not external subcontractors.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleToggle}
                  disabled={saving}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1 disabled:opacity-50 ${
                    folder.is_private ? "bg-gray-900" : "bg-gray-200"
                  }`}
                  role="switch"
                  aria-checked={folder.is_private}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      folder.is_private ? "translate-x-[18px]" : "translate-x-[2px]"
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                {folder.is_private
                  ? "This folder is private. Only company employees can view it."
                  : `This folder is public to everybody in: ${projectName}`}
              </p>
            </div>
          )}
        </div>

        {/* Tracking */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => setTrackingOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${trackingOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {trackingOpen && (
            <div className="px-4 pb-4"><p className="text-xs text-gray-400">No tracking data available.</p></div>
          )}
        </div>

        {/* Change History */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => setChangeHistoryOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Change History</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${changeHistoryOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {changeHistoryOpen && (
            <div className="px-4 pb-4"><p className="text-xs text-gray-400">No changes recorded.</p></div>
          )}
        </div>

        {/* Emails */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => setEmailsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Emails</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${emailsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {emailsOpen && (
            <div className="px-4 pb-4"><p className="text-xs text-gray-400">No emails sent.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function DocumentsClient({
  projectId,
  projectName,
  role,
  username,
}: {
  projectId: string;
  projectName: string;
  role: string;
  username: string;
}) {
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: "Documents" }]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DocItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocItem | null>(null);
  const [moveTarget, setMoveTarget] = useState<DocItem | null>(null);
  const [allFolders, setAllFolders] = useState<{ id: string; name: string; parent_id: string | null }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [infoPanelFolder, setInfoPanelFolder] = useState<DocItem | null>(null);
  const [pdfPreview, setPdfPreview] = useState<DocItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "");
    }
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleClick() {
      setOpenMenuId(null);
      setMenuPos(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    loadItems(null);
  }, [projectId]);

  async function loadItems(parentId: string | null) {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const url =
        parentId !== null
          ? `/api/projects/${projectId}/documents?parent_id=${parentId}`
          : `/api/projects/${projectId}/documents`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function openFolder(folder: DocItem) {
    setInfoPanelFolder(null);
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentParentId(folder.id);
    loadItems(folder.id);
  }

  function navigateToBreadcrumb(index: number) {
    const crumb = breadcrumb[index];
    setBreadcrumb((prev) => prev.slice(0, index + 1));
    setCurrentParentId(crumb.id);
    setInfoPanelFolder(null);
    loadItems(crumb.id);
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5MB Vercel limit
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE) {
        errors.push(`${file.name} exceeds the 4.5MB upload limit. Please compress the file and try again.`);
        continue;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("parent_id", currentParentId ?? "null");
      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        if (res.status === 413) {
          errors.push(`${file.name} is too large to upload (exceeds server limit).`);
        } else {
          const data = await res.json().catch(() => ({}));
          errors.push(data.error ?? `Failed to upload ${file.name} (server error ${res.status}).`);
        }
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (errors.length > 0) setUploadError(errors.join("; "));
    await loadItems(currentParentId);
  }

  async function handleFolderUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    const fileArray = Array.from(files) as (File & { webkitRelativePath: string })[];

    const folderPathSet = new Set<string>();
    for (const file of fileArray) {
      const parts = file.webkitRelativePath.split("/");
      for (let i = 1; i < parts.length; i++) {
        folderPathSet.add(parts.slice(0, i).join("/"));
      }
    }

    const folderPaths = Array.from(folderPathSet).sort(
      (a, b) => a.split("/").length - b.split("/").length
    );

    const pathToId = new Map<string, string>();

    for (const folderPath of folderPaths) {
      const parts = folderPath.split("/");
      const name = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join("/");
      const parentId = parentPath ? (pathToId.get(parentPath) ?? currentParentId) : currentParentId;

      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id: parentId }),
      });

      if (res.ok) {
        const data = await res.json();
        pathToId.set(folderPath, data.id);
      }
    }

    for (const file of fileArray) {
      const parts = file.webkitRelativePath.split("/");
      const parentPath = parts.slice(0, -1).join("/");
      const parentId = parentPath ? (pathToId.get(parentPath) ?? currentParentId) : currentParentId;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("parent_id", parentId ?? "null");
      await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body: formData,
      });
    }

    setUploading(false);
    if (folderInputRef.current) folderInputRef.current.value = "";
    await loadItems(currentParentId);
  }

  async function handleCreateFolder(name: string) {
    setShowNewFolder(false);
    await fetch(`/api/projects/${projectId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parent_id: currentParentId }),
    });
    await loadItems(currentParentId);
  }

  async function handleRename(name: string) {
    if (!renameTarget) return;
    setRenameTarget(null);
    const res = await fetch(`/api/projects/${projectId}/documents/${renameTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((item) => (item.id === renameTarget.id ? { ...item, name } : item))
      );
      setInfoPanelFolder((prev) =>
        prev?.id === renameTarget.id ? { ...prev, name } : prev
      );
    }
  }

  async function handleMove(targetParentId: string | null) {
    if (!moveTarget) return;
    setMoveTarget(null);
    await fetch(`/api/projects/${projectId}/documents/${moveTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parent_id: targetParentId }),
    });
    setItems((prev) => prev.filter((item) => item.id !== moveTarget.id));
  }

  async function handleCopy(item: DocItem) {
    setOpenMenuId(null);
    await fetch(`/api/projects/${projectId}/documents/${item.id}/copy`, {
      method: "POST",
    });
    await loadItems(currentParentId);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await fetch(`/api/projects/${projectId}/documents/${id}`, {
      method: "DELETE",
    });
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (infoPanelFolder?.id === id) setInfoPanelFolder(null);
  }

  async function handleDownload(item: DocItem) {
    if (item.type === "file") {
      if (!item.url) return;
      const a = document.createElement("a");
      a.href = item.url;
      a.download = item.name;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const res = await fetch(`/api/projects/${projectId}/documents/${item.id}/files`);
      if (!res.ok) return;
      const files: { name: string; url: string }[] = await res.json();
      for (let i = 0; i < files.length; i++) {
        await new Promise<void>((resolve) => setTimeout(() => resolve(), i === 0 ? 0 : 500));
        const a = document.createElement("a");
        a.href = files[i].url;
        a.download = files[i].name;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  }

  async function handleEmail(item: DocItem) {
    if (item.type === "file") {
      const subject = encodeURIComponent(`Sharing: ${item.name}`);
      const body = encodeURIComponent(`Download link: ${item.url}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    } else {
      const res = await fetch(`/api/projects/${projectId}/documents/${item.id}/files`);
      if (!res.ok) return;
      const files: { name: string; url: string }[] = await res.json();
      const subject = encodeURIComponent(`Sharing: ${item.name}`);
      const bodyText = files.map((f) => `${f.name}: ${f.url}`).join("\n");
      const body = encodeURIComponent(`Files from ${item.name}:\n\n${bodyText}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
  }

  async function openMoveModal(item: DocItem) {
    setOpenMenuId(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/documents?all_folders=true`);
      if (res.ok) {
        const data = await res.json();
        setAllFolders(Array.isArray(data) ? data : []);
      }
    } catch {
      setAllFolders([]);
    }
    setMoveTarget(item);
  }

  async function handleTogglePrivate(folderId: string, isPrivate: boolean) {
    const res = await fetch(`/api/projects/${projectId}/documents/${folderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_private: isPrivate }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((item) => (item.id === folderId ? { ...item, is_private: isPrivate } : item))
      );
      setInfoPanelFolder((prev) =>
        prev?.id === folderId ? { ...prev, is_private: isPrivate } : prev
      );
    }
  }

  function handleItemClick(item: DocItem) {
    if (item.type === "folder") {
      openFolder(item);
    } else if (isPdf(item) && item.url) {
      setPdfPreview(item);
    } else {
      handleDownload(item);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

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
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <main className={`mx-auto px-6 py-8 transition-all ${infoPanelFolder ? "max-w-4xl" : "max-w-6xl"}`}
        style={infoPanelFolder ? { marginRight: "320px" } : undefined}>
        {/* Page title + breadcrumb + add button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Documents</h1>
            <nav className="flex items-center gap-1 mt-1">
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300 text-xs">/</span>}
                  <button
                    onClick={() => navigateToBreadcrumb(i)}
                    className={`text-xs hover:text-gray-900 transition-colors ${
                      i === breadcrumb.length - 1 ? "text-gray-700 font-medium" : "text-gray-400"
                    }`}
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </nav>
          </div>

          <div ref={addMenuRef} className="relative">
            <button
              onClick={() => setShowAddMenu((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add
              <svg
                className={`w-4 h-4 transition-transform ${showAddMenu ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20">
                <button
                  onClick={() => { fileInputRef.current?.click(); setShowAddMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Upload Files
                </button>
                <button
                  onClick={() => { folderInputRef.current?.click(); setShowAddMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Upload Folder
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { setShowNewFolder(true); setShowAddMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  New Folder
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
        <input ref={folderInputRef} type="file" className="hidden" onChange={handleFolderUpload} />

        {/* Uploading indicator */}
        {uploading && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading files…
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="ml-auto shrink-0 text-red-400 hover:text-red-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* File list */}
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : items.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-16 text-center">
            <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <p className="text-sm text-gray-400">No files or folders yet</p>
            <p className="text-xs text-gray-300 mt-1">Use the Add button to upload files or create a folder</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {/* Checkbox column */}
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Created On / Latest Version
                  </th>
                  <th className="px-4 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-50 last:border-b-0 transition-colors ${
                      selectedIds.has(item.id) ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                      />
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleItemClick(item)}
                          className="flex items-center gap-2.5 text-sm text-gray-900 hover:text-blue-600 transition-colors text-left min-w-0"
                        >
                          {getFileIcon(item)}
                          <span className="truncate">{item.name}</span>
                        </button>
                        {item.type === "folder" && (
                          <>
                            {item.is_private && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 shrink-0">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Private
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setInfoPanelFolder(infoPanelFolder?.id === item.id ? null : item);
                              }}
                              title="Folder info"
                              className={`p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 ${
                                infoPanelFolder?.id === item.id ? "text-gray-700 bg-gray-100" : ""
                              }`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Created On */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(item.created_at, item.created_by_name)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => handleDownload(item)}
                          title="Download"
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleEmail(item)}
                          title="Email"
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>

                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openMenuId === item.id) {
                              setOpenMenuId(null);
                              setMenuPos(null);
                            } else {
                              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              setOpenMenuId(item.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="5" cy="12" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="19" cy="12" r="1.5" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modals */}
      {showNewFolder && (
        <InputModal
          title="New Folder"
          placeholder="Folder name"
          defaultValue=""
          onConfirm={handleCreateFolder}
          onCancel={() => setShowNewFolder(false)}
        />
      )}
      {renameTarget && (
        <InputModal
          title="Rename"
          placeholder="New name"
          defaultValue={renameTarget.name}
          onConfirm={handleRename}
          onCancel={() => setRenameTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This will permanently delete all contents.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {moveTarget && (
        <MoveModal
          folders={allFolders}
          excludeId={moveTarget.id}
          onConfirm={handleMove}
          onCancel={() => setMoveTarget(null)}
        />
      )}

      {/* Fixed-position three-dot dropdown */}
      {openMenuId && menuPos && (() => {
        const item = items.find((i) => i.id === openMenuId);
        if (!item) return null;
        return (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
            className="w-44 bg-white border border-gray-100 rounded-lg shadow-lg py-1"
          >
            <button
              onMouseDown={() => { setRenameTarget(item); setOpenMenuId(null); setMenuPos(null); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Rename
            </button>
            <button
              onMouseDown={() => openMoveModal(item)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Move
            </button>
            <button
              onMouseDown={() => handleCopy(item)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Copy
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onMouseDown={() => { setDeleteTarget(item); setOpenMenuId(null); setMenuPos(null); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        );
      })()}

      {/* Folder info panel */}
      {infoPanelFolder && (
        <FolderInfoPanel
          folder={infoPanelFolder}
          projectName={projectName}
          breadcrumb={breadcrumb}
          onClose={() => setInfoPanelFolder(null)}
          onTogglePrivate={handleTogglePrivate}
        />
      )}

      {/* PDF preview */}
      {pdfPreview && pdfPreview.url && (
        <PdfViewerModal
          url={pdfPreview.url}
          name={pdfPreview.name}
          onClose={() => setPdfPreview(null)}
          docId={pdfPreview.id}
          projectId={projectId}
          userRole={role}
          userName={username}
        />
      )}
    </div>
  );
}
