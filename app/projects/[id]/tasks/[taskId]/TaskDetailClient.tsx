"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";

type DistributionContact = { id: string; name: string; email: string | null };

type Task = {
  id: string;
  task_number: number;
  title: string;
  status: string;
  category: string | null;
  description: string | null;
  photo_url: string | null;
  distribution_list: DistributionContact[];
  due_date: string | null;
  created_at: string;
};

type DirectoryContact = {
  id: string;
  type: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  group_name: string | null;
  email: string | null;
};

const STATUSES = ["open", "in progress", "completed", "closed"];
const CATEGORIES = ["Administrative", "Closeout", "Contract", "Design", "Miscellaneous", "Construction"];

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-50 text-blue-700",
  "in progress": "bg-amber-50 text-amber-700",
  completed: "bg-green-50 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

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
      <a
        href={`/projects/${projectId}`}
        className="flex items-center gap-1.5 py-2.5 text-sm text-gray-400 hover:text-gray-700 transition-colors shrink-0"
      >
        Project Home
      </a>
      <div className="w-px h-4 bg-gray-200" />
      <div ref={ref} className="relative inline-block">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Tools
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 w-[580px] bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-5">
            <div className="grid grid-cols-3 gap-6">
              {TOOL_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{section.label}</p>
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

function contactDisplayName(c: DirectoryContact): string {
  if (c.type === "company") return c.company ?? "Unnamed Company";
  if (c.type === "distribution_group") return c.group_name ?? "Unnamed Group";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed";
}

function DistributionPicker({
  directory,
  selected,
  onChange,
}: {
  directory: DirectoryContact[];
  selected: DistributionContact[];
  onChange: (v: DistributionContact[]) => void;
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
    (c) =>
      !selectedIds.has(c.id) &&
      (contactDisplayName(c).toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? "").toLowerCase().includes(search.toLowerCase()))
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
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
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
        placeholder="Search directory..."
        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg max-h-40 overflow-y-auto z-20">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(c)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="font-medium text-gray-900">{contactDisplayName(c)}</span>
              {c.email && <span className="text-gray-400 text-xs">{c.email}</span>}
            </button>
          ))}
        </div>
      )}
      {open && search && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg px-3 py-2 z-20">
          <p className="text-xs text-gray-400">No matching contacts</p>
        </div>
      )}
    </div>
  );
}

export default function TaskDetailClient({
  projectId,
  taskId,
  role,
  username,
}: {
  projectId: string;
  taskId: string;
  role: string;
  username: string;
}) {
  const [task, setTask] = useState<Task | null>(null);
  const [directory, setDirectory] = useState<DirectoryContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("open");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [distribution, setDistribution] = useState<DistributionContact[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/tasks/${taskId}`),
      fetch(`/api/projects/${projectId}/directory`),
    ]).then(async ([taskRes, dirRes]) => {
      if (!taskRes.ok) { setNotFound(true); setLoading(false); return; }
      const [taskData, dirData] = await Promise.all([taskRes.json(), dirRes.json()]);
      setTask(taskData);
      setTitle(taskData.title);
      setStatus(taskData.status);
      setCategory(taskData.category ?? "");
      setDescription(taskData.description ?? "");
      setDistribution(taskData.distribution_list ?? []);
      setDueDate(taskData.due_date ?? "");
      setPhotoUrl(taskData.photo_url);
      setDirectory(Array.isArray(dirData) ? dirData : []);
      setLoading(false);
    });
  }, [projectId, taskId]);

  async function handleSave() {
    if (!task) return;
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        status,
        category: category || null,
        description: description || null,
        distribution_list: distribution,
        due_date: dueDate || null,
        photo_url: photoUrl,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTask({ ...updated, distribution_list: distribution });
    }
    setSaving(false);
  }

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !task) return;
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}/photo`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      setPhotoUrl(data.photo_url + `?t=${Date.now()}`);
    }
    setUploadingPhoto(false);
  }

  async function handleDelete() {
    if (!task) return;
    await fetch(`/api/projects/${projectId}/tasks/${task.id}`, { method: "DELETE" });
    window.location.href = `/projects/${projectId}/tasks`;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
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

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : notFound ? (
          <p className="text-sm text-gray-500">Task not found.</p>
        ) : task ? (
          <>
            {/* Back link + actions */}
            <div className="flex items-center justify-between mb-6">
              <a
                href={`/projects/${projectId}/tasks`}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                All Tasks
              </a>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Task header */}
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Task #{task.task_number}
              </p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-bold text-gray-900 bg-transparent border-0 border-b-2 border-transparent focus:border-gray-300 focus:outline-none pb-1 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left column: main fields */}
              <div className="lg:col-span-2 space-y-5">

                {/* Status + Category + Due Date */}
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Details</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                      >
                        <option value="">No category</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Due Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</h2>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    placeholder="Add a description..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  />
                </div>

                {/* Distribution list */}
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Distribution List</h2>
                  <DistributionPicker
                    directory={directory}
                    selected={distribution}
                    onChange={setDistribution}
                  />
                </div>
              </div>

              {/* Right column: photo + meta */}
              <div className="space-y-5">

                {/* Photo */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  {photoUrl ? (
                    <>
                      <img src={photoUrl} alt="Task photo" className="w-full h-44 object-cover" />
                      <div className="px-4 py-3 border-t border-gray-100">
                        <button
                          onClick={() => photoInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="w-full py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          {uploadingPhoto ? "Uploading..." : "Change Photo"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="w-full flex flex-col items-center justify-center gap-2 py-10 text-gray-300 hover:text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 19.5h15a.75.75 0 00.75-.75V6.75A.75.75 0 0019.5 6h-15a.75.75 0 00-.75.75v12c0 .414.336.75.75.75z" />
                      </svg>
                      <span className="text-xs">{uploadingPhoto ? "Uploading..." : "Add Photo"}</span>
                    </button>
                  )}
                </div>

                {/* Meta */}
                <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Info</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-500"}`}>
                        {status}
                      </span>
                    </div>
                    {dueDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Due</span>
                        <span className="text-gray-700 font-medium">
                          {new Date(dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created</span>
                      <span className="text-gray-700">
                        {new Date(task.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Delete Task</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <span className="font-medium text-gray-800">Task #{task?.task_number}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
