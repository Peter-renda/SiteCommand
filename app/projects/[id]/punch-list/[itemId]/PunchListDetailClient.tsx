"use client";

import { useState, useEffect, useRef } from "react";

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

function getContactNameById(directory: DirectoryContact[], id: string | null): string {
  if (!id) return "—";
  const c = directory.find((x) => x.id === id);
  return c ? contactDisplayName(c) : "—";
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  );
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

export default function PunchListDetailClient({ projectId, itemId, role, username, userId }: { projectId: string; itemId: string; role: string; username: string; userId: string }) {
  const [item, setItem] = useState<PunchListItem | null>(null);
  const [directory, setDirectory] = useState<DirectoryContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/punch-list/${itemId}`),
      fetch(`/api/projects/${projectId}/directory`),
    ]).then(async ([itemRes, dirRes]) => {
      if (!itemRes.ok) { setNotFound(true); setLoading(false); return; }
      const [itemData, dirData] = await Promise.all([itemRes.json(), dirRes.json()]);
      setItem(itemData);
      setDirectory(Array.isArray(dirData) ? dirData : []);
      setLoading(false);
    });
  }, [projectId, itemId]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
          <a href="/dashboard" className="text-sm font-semibold text-gray-900">SiteCommand</a>
          <span className="text-sm text-gray-400">{username}</span>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8"><p className="text-sm text-gray-400">Loading...</p></main>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
          <a href="/dashboard" className="text-sm font-semibold text-gray-900">SiteCommand</a>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8"><p className="text-sm text-gray-500">Item not found.</p></main>
      </div>
    );
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

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <a href={`/projects/${projectId}/punch-list`} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Punch List
          </a>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Item #{item.item_number}
                  {item.type && <span className="ml-2 text-gray-400">· {item.type}</span>}
                  {item.private && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Private</span>}
                </p>
                <h1 className="text-xl font-semibold text-gray-900">{item.title}</h1>
                {item.location && <p className="text-sm text-gray-500 mt-1">{item.location}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.priority && (
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[item.priority] ?? "bg-gray-50 text-gray-600"}`}>{item.priority}</span>
                )}
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <Section title="Description">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.description}</p>
            </Section>
          )}

          {/* Attachments */}
          <Section title="Attachments">
            {(item.attachments ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">No attachments</p>
            ) : (
              <ul className="space-y-2">
                {item.attachments.map((att, i) => (
                  <li key={i}>
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:text-gray-900 underline flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {att.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* General Info */}
          <Section title="General Information">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Punch Item Manager</dt>
                <dd className="mt-0.5 text-gray-900">{getContactNameById(directory, item.punch_item_manager_id)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Final Approver</dt>
                <dd className="mt-0.5 text-gray-900">{getContactNameById(directory, item.final_approver_id)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trade</dt>
                <dd className="mt-0.5 text-gray-900">{item.trade || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</dt>
                <dd className="mt-0.5 text-gray-900">{formatDate(item.due_date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</dt>
                <dd className="mt-0.5 text-gray-900">{item.reference || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule Impact</dt>
                <dd className="mt-0.5 text-gray-900">{item.schedule_impact || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Impact</dt>
                <dd className="mt-0.5 text-gray-900">{item.cost_impact || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Codes</dt>
                <dd className="mt-0.5 text-gray-900">{item.cost_codes || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</dt>
                <dd className="mt-0.5 text-gray-900">{formatDate(item.created_at)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assignees</dt>
                <dd className="mt-0.5 text-gray-900">{(item.assignees ?? []).map((a) => a.name).join(", ") || "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Distribution List</dt>
                <dd className="mt-0.5 text-gray-900">{(item.distribution_list ?? []).map((d) => d.name).join(", ") || "—"}</dd>
              </div>
            </dl>
          </Section>
        </div>
      </main>
    </div>
  );
}
