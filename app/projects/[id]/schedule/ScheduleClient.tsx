"use client";

import { useState, useEffect, useRef, DragEvent, useCallback } from "react";
import ProjectNav from "@/components/ProjectNav";

// ── Types ─────────────────────────────────────────────────────────────────────

type Task = {
  uid: number;
  id: number;
  name: string;
  outlineLevel: number;
  isSummary: boolean;
  isMilestone: boolean;
  start: string;
  finish: string;
  percentComplete: number;
  predecessorUids: number[];
};

type ScheduleMeta = {
  id: string;
  filename: string;
  uploaded_by_name: string;
  uploaded_at: string;
};

type ChangeEntry = {
  taskId: number;
  taskName: string;
  field: "start" | "finish";
  oldValue: string;
  newValue: string;
  delta: number; // positive = pushed out, negative = pulled in
  timestamp: string; // ISO string
};

// ── Nav ───────────────────────────────────────────────────────────────────────


// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

// ── Gantt Helpers ─────────────────────────────────────────────────────────────

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function weekLabel(sundayDate: Date): string {
  const month = sundayDate.toLocaleDateString("en-US", { month: "short" });
  const day = sundayDate.getDate();
  const yr = String(sundayDate.getFullYear()).slice(2);
  return `${month} ${day}, '${yr}`;
}

// ── Table View ────────────────────────────────────────────────────────────────

type EditingCell = { uid: number; field: "start" | "finish" };

function TableView({
  tasks,
  onUpdateTask,
}: {
  tasks: Task[];
  onUpdateTask: (uid: number, field: "start" | "finish", value: string) => void;
}) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No tasks found in schedule.
      </div>
    );
  }

  // Build a UID → task ID map so predecessor column shows task IDs (not UIDs)
  const uidToId = new Map<number, number>(tasks.map((t) => [t.uid, t.id]));

  function commitEdit(uid: number, field: "start" | "finish", value: string) {
    if (value) onUpdateTask(uid, field, value);
    setEditingCell(null);
  }

  function DateCell({ task, field }: { task: Task; field: "start" | "finish" }) {
    const isEditing = editingCell?.uid === task.uid && editingCell?.field === field;
    const value = task[field];

    if (isEditing) {
      return (
        <input
          type="date"
          autoFocus
          defaultValue={value}
          className="border border-blue-400 rounded px-1.5 py-0.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          onBlur={(e) => commitEdit(task.uid, field, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit(task.uid, field, e.currentTarget.value);
            if (e.key === "Escape") setEditingCell(null);
          }}
        />
      );
    }

    return (
      <span
        className="cursor-default hover:bg-blue-50 hover:text-blue-700 rounded px-1 -mx-1 transition-colors"
        title="Double-click to edit"
        onDoubleClick={() => setEditingCell({ uid: task.uid, field })}
      >
        {value || "—"}
      </span>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-14">ID</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-600">Task Name</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap">Start</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap">Finish</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap">Duration (days)</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap">Predecessors</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap">% Complete</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const duration = task.start && task.finish ? daysBetween(task.start, task.finish) : 0;
            const predecessorIds = task.predecessorUids
              .map((uid) => uidToId.get(uid) ?? uid)
              .join(", ");
            return (
              <tr
                key={task.uid}
                className={`border-b border-gray-100 ${task.isSummary ? "bg-gray-50" : "hover:bg-gray-50"}`}
              >
                <td className="px-4 py-2 text-gray-400">{task.id}</td>
                <td className="px-4 py-2">
                  <span
                    style={{ paddingLeft: `${task.outlineLevel * 16}px` }}
                    className={`inline-block ${task.isSummary ? "font-semibold text-gray-800" : "text-gray-700"} ${task.isMilestone ? "italic" : ""}`}
                  >
                    {task.isMilestone && <span className="mr-1 text-amber-500">◆</span>}
                    {task.name}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                  <DateCell task={task} field="start" />
                </td>
                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                  <DateCell task={task} field="finish" />
                </td>
                <td className="px-4 py-2 text-gray-500">{task.isMilestone ? "—" : duration}</td>
                <td className="px-4 py-2 text-gray-500">{predecessorIds || "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      task.percentComplete === 100
                        ? "bg-green-100 text-green-700"
                        : task.percentComplete > 0
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {task.percentComplete}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Gantt View ────────────────────────────────────────────────────────────────

function GanttView({ tasks }: { tasks: Task[] }) {
  const validTasks = tasks.filter((t) => t.start && t.finish);
  if (validTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No tasks with date information to display.
      </div>
    );
  }

  const allStarts = validTasks.map((t) => new Date(t.start).getTime());
  const allFinishes = validTasks.map((t) => new Date(t.finish).getTime());
  const projectStartDate = new Date(Math.min(...allStarts));
  const projectEndDate = new Date(Math.max(...allFinishes));

  // Snap range to week boundaries: start on Sunday, end on Saturday
  const rangeStart = new Date(projectStartDate);
  rangeStart.setDate(rangeStart.getDate() - rangeStart.getDay());
  rangeStart.setHours(0, 0, 0, 0);

  const rangeEnd = new Date(projectEndDate);
  rangeEnd.setDate(rangeEnd.getDate() + (6 - rangeEnd.getDay()));
  rangeEnd.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / msPerDay) + 1;
  const numWeeks = Math.ceil(totalDays / 7);

  const DAY_W = 20; // px per day column
  const WEEK_ROW_H = 24;
  const DAY_ROW_H = 20;
  const HEADER_H = WEEK_ROW_H + DAY_ROW_H;
  const ROW_HEIGHT = 36;
  const LEFT_PANE_W = 280;
  const totalW = totalDays * DAY_W;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left pane — task names */}
      <div
        style={{ width: `${LEFT_PANE_W}px`, minWidth: `${LEFT_PANE_W}px` }}
        className="bg-white border-r border-gray-200 flex flex-col overflow-hidden shrink-0"
      >
        <div
          style={{ height: `${HEADER_H}px` }}
          className="border-b border-gray-200 bg-gray-50 shrink-0 px-3 flex items-end pb-1"
        >
          <span className="text-xs font-medium text-gray-500">Task Name</span>
        </div>
        <div className="overflow-y-auto flex-1">
          {tasks.map((task) => (
            <div
              key={task.uid}
              style={{ height: `${ROW_HEIGHT}px` }}
              className={`flex items-center border-b border-gray-100 px-3 ${task.isSummary ? "bg-gray-50" : ""}`}
            >
              <span
                style={{ paddingLeft: `${task.outlineLevel * 12}px` }}
                className={`truncate text-xs ${task.isSummary ? "font-semibold text-gray-800" : "text-gray-700"} ${task.isMilestone ? "italic" : ""}`}
                title={task.name}
              >
                {task.isMilestone && <span className="mr-1 text-amber-500">◆</span>}
                {task.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right pane — timeline */}
      <div className="flex-1 overflow-x-auto overflow-y-auto flex flex-col">
        {/* Two-row header: week labels + day letters */}
        <div style={{ minWidth: `${totalW}px` }} className="shrink-0 sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
          {/* Row 1 — week start dates */}
          <div style={{ height: `${WEEK_ROW_H}px` }} className="flex border-b border-gray-100">
            {Array.from({ length: numWeeks }, (_, w) => {
              const sunday = new Date(rangeStart.getTime() + w * 7 * msPerDay);
              return (
                <div
                  key={w}
                  style={{ width: `${7 * DAY_W}px`, minWidth: `${7 * DAY_W}px` }}
                  className="border-r border-gray-200 flex items-center px-1.5 overflow-hidden"
                >
                  <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                    {weekLabel(sunday)}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Row 2 — day letters */}
          <div style={{ height: `${DAY_ROW_H}px` }} className="flex">
            {Array.from({ length: totalDays }, (_, i) => {
              const dow = (rangeStart.getDay() + i) % 7;
              const isWeekend = dow === 0 || dow === 6;
              const isWeekBoundary = dow === 0 && i > 0;
              return (
                <div
                  key={i}
                  style={{ width: `${DAY_W}px`, minWidth: `${DAY_W}px` }}
                  className={`flex items-center justify-center text-xs border-r ${
                    isWeekBoundary ? "border-gray-200" : "border-gray-100"
                  } ${isWeekend ? "text-gray-400 bg-gray-100/60" : "text-gray-500"}`}
                >
                  {DAY_LETTERS[dow]}
                </div>
              );
            })}
          </div>
        </div>

        {/* Task rows */}
        <div style={{ minWidth: `${totalW}px` }}>
          {tasks.map((task) => {
            const hasDate = task.start && task.finish;
            const taskStartMs = hasDate ? new Date(task.start).getTime() : 0;
            const taskFinishMs = hasDate ? new Date(task.finish).getTime() : 0;
            const rangeStartMs = rangeStart.getTime();

            const leftDays = hasDate ? Math.max(0, (taskStartMs - rangeStartMs) / msPerDay) : 0;
            const widthDays = hasDate ? Math.max(0, (taskFinishMs - taskStartMs) / msPerDay) : 0;

            const leftPct = (leftDays / totalDays) * 100;
            const widthPct = Math.max(widthDays > 0 ? (widthDays / totalDays) * 100 : 0.3, 0.3);

            return (
              <div
                key={task.uid}
                style={{ height: `${ROW_HEIGHT}px` }}
                className={`relative border-b border-gray-100 flex items-center ${task.isSummary ? "bg-gray-50" : ""}`}
              >
                {/* Weekly gridlines */}
                {Array.from({ length: numWeeks }, (_, w) => (
                  <div
                    key={w}
                    style={{
                      position: "absolute",
                      left: `${(w * 7 / totalDays) * 100}%`,
                      width: `${(7 / totalDays) * 100}%`,
                      top: 0,
                      bottom: 0,
                      borderRight: "1px solid #f0f0f0",
                    }}
                  />
                ))}

                {hasDate && (
                  task.isMilestone ? (
                    <div
                      style={{
                        position: "absolute",
                        left: `calc(${leftPct}% - 6px)`,
                        width: "12px",
                        height: "12px",
                        background: "#f59e0b",
                        transform: "rotate(45deg)",
                      }}
                      title={`${task.name}\n${task.start}`}
                    />
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        height: task.isSummary ? "100%" : "60%",
                        background: task.isSummary ? "#4b5563" : "#3b82f6",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                      title={`${task.name}\n${task.start} → ${task.finish}\n${task.percentComplete}% complete`}
                    >
                      {task.percentComplete > 0 && (
                        <div
                          style={{
                            width: `${task.percentComplete}%`,
                            height: "100%",
                            background: task.isSummary ? "#374151" : "#1d4ed8",
                          }}
                        />
                      )}
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────

function UploadZone({
  projectId,
  uploading,
  onUploaded,
}: {
  projectId: string;
  uploading: boolean;
  onUploaded: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File) {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      setError("Only .xml files are accepted.");
      return;
    }
    setError(null);
    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/projects/${projectId}/schedule`, { method: "POST", body: fd });
    setIsUploading(false);
    if (res.ok) {
      onUploaded();
    } else {
      const data = await res.json();
      setError(data.error ?? "Upload failed.");
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 text-center transition-colors ${
          isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white"
        }`}
      >
        {isUploading || uploading ? (
          <>
            <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-sm text-gray-500">Uploading schedule…</p>
          </>
        ) : (
          <>
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-700">Drop your MS Project XML file here</p>
              <p className="text-xs text-gray-400 mt-1">or</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,text/xml,application/xml"
              className="hidden"
              onChange={handleFileInput}
            />
            <p className="text-xs text-gray-400 leading-relaxed">
              In MS Project: <span className="font-medium">File → Save As → XML Format (*.xml)</span>
            </p>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ScheduleClient({
  projectId,
  role,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const [schedule, setSchedule] = useState<ScheduleMeta | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<"table" | "gantt">("table");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const fileReplaceRef = useRef<HTMLInputElement>(null);
  const [changeHistory, setChangeHistory] = useState<ChangeEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/schedule`);
    if (res.ok) {
      const data = await res.json();
      setSchedule(data.schedule ?? null);
      setTasks(data.tasks ?? []);
      setChangeHistory(data.changeHistory ?? []);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  function handleUpdateTask(uid: number, field: "start" | "finish", value: string) {
    const task = tasks.find((t) => t.uid === uid);
    if (task) {
      const oldValue = task[field];
      if (oldValue && value && oldValue !== value) {
        const delta = daysBetween(oldValue, value);
        const entry: ChangeEntry = {
          taskId: task.id,
          taskName: task.name,
          field,
          oldValue,
          newValue: value,
          delta,
          timestamp: new Date().toISOString(),
        };
        setChangeHistory((prev) => [entry, ...prev]);
        // Auto-save the date change and history entry to the server
        fetch(`/api/projects/${projectId}/schedule`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, field, value, changeEntry: entry }),
        });
      }
    }
    setTasks((prev) => prev.map((t) => t.uid === uid ? { ...t, [field]: value } : t));
  }

  async function handleReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.name.toLowerCase().endsWith(".xml")) {
      setReplaceError("Only .xml files are accepted.");
      return;
    }
    setReplaceError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/projects/${projectId}/schedule`, { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      fetchSchedule();
    } else {
      const data = await res.json().catch(() => ({}));
      setReplaceError(data.error ?? "Upload failed. Please try again.");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0">
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

      {/* Body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <svg className="w-6 h-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : !schedule ? (
        <UploadZone
          projectId={projectId}
          uploading={uploading}
          onUploaded={fetchSchedule}
        />
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Schedule header bar */}
          <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium text-gray-800">{schedule.filename}</span>
              <span className="text-gray-300">·</span>
              <span>Uploaded by {schedule.uploaded_by_name}</span>
              <span className="text-gray-300">·</span>
              <span>{formatDate(schedule.uploaded_at)}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-400">{tasks.length} tasks</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => { setReplaceError(null); fileReplaceRef.current?.click(); }}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {uploading ? "Replacing…" : "Replace Schedule"}
              </button>
              {replaceError && <p className="text-xs text-red-600">{replaceError}</p>}
            </div>
            <input
              ref={fileReplaceRef}
              type="file"
              accept=".xml,text/xml,application/xml"
              className="hidden"
              onChange={handleReplaceFile}
            />
          </div>

          {/* Tab bar */}
          <div className="bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              {(["table", "gantt"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "table" ? "Table" : "Gantt Chart"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                showHistory
                  ? "bg-gray-100 text-gray-800"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Change History
              {changeHistory.length > 0 && (
                <span className="ml-0.5 bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none">
                  {changeHistory.length}
                </span>
              )}
            </button>
          </div>

          {/* Change history panel */}
          {showHistory && (
            <div className="bg-white border-b border-gray-200 shrink-0">
              <div className="px-6 py-2 flex items-center justify-between border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Change History</span>
                {changeHistory.length > 0 && (
                  <button
                    onClick={() => {
                      setChangeHistory([]);
                      fetch(`/api/projects/${projectId}/schedule`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ clearHistory: true }),
                      });
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-44 overflow-y-auto divide-y divide-gray-50">
                {changeHistory.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-gray-400 italic">No changes recorded yet. Edit start or finish dates in the Table view to track changes.</p>
                ) : (
                  changeHistory.map((entry, i) => {
                    const direction =
                      entry.delta > 0
                        ? `pushed ${entry.delta} day${entry.delta === 1 ? "" : "s"} out`
                        : entry.delta < 0
                        ? `pulled ${Math.abs(entry.delta)} day${Math.abs(entry.delta) === 1 ? "" : "s"} in`
                        : "date changed (same day count)";
                    return (
                      <div key={i} className="px-6 py-2.5 flex items-baseline justify-between gap-4">
                        <span className="text-sm text-gray-700">
                          <span className="font-medium text-gray-900">Task {entry.taskId}</span>
                          <span className="text-gray-400 mx-1">–</span>
                          <span className="text-gray-600">{entry.taskName}</span>
                          <span className="text-gray-400 mx-1">–</span>
                          <span>{entry.field} date </span>
                          <span className={entry.delta > 0 ? "text-amber-600 font-medium" : entry.delta < 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                            {direction}
                          </span>
                          <span className="text-gray-400 ml-1.5">({formatDate(entry.oldValue)} → {formatDate(entry.newValue)})</span>
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                          {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "table" ? (
              <div className="h-full overflow-auto">
                <TableView tasks={tasks} onUpdateTask={handleUpdateTask} />
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <GanttView tasks={tasks} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
