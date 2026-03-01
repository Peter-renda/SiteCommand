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

export default function SubmittalDetailClient({ projectId, submittalId, role, username, userId }: { projectId: string; submittalId: string; role: string; username: string; userId: string }) {
  const [submittal, setSubmittal] = useState<Submittal | null>(null);
  const [directory, setDirectory] = useState<DirectoryContact[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/submittals/${submittalId}`),
      fetch(`/api/projects/${projectId}/directory`),
      fetch(`/api/projects/${projectId}/specifications`),
    ]).then(async ([sRes, dirRes, specRes]) => {
      if (!sRes.ok) { setNotFound(true); setLoading(false); return; }
      const [sData, dirData, specData] = await Promise.all([sRes.json(), dirRes.json(), specRes.json()]);
      setSubmittal(sData);
      setDirectory(Array.isArray(dirData) ? dirData : []);
      setSpecifications(Array.isArray(specData) ? specData : []);
      setLoading(false);
    });
  }, [projectId, submittalId]);

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

  if (notFound || !submittal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
          <a href="/dashboard" className="text-sm font-semibold text-gray-900">SiteCommand</a>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8"><p className="text-sm text-gray-500">Submittal not found.</p></main>
      </div>
    );
  }

  const canEdit = role === "admin" || submittal.created_by === userId;

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
          <a href={`/projects/${projectId}/submittals`} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            All Submittals
          </a>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Submittal #{submittal.submittal_number}{submittal.revision ? `-${submittal.revision}` : ""}
                  {submittal.private && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Private</span>}
                </p>
                <h1 className="text-xl font-semibold text-gray-900">{submittal.title}</h1>
                {submittal.submittal_type && <p className="text-sm text-gray-500 mt-1">{submittal.submittal_type}</p>}
              </div>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[submittal.status] ?? "bg-gray-100 text-gray-600"}`}>
                {STATUS_LABELS[submittal.status] ?? submittal.status}
              </span>
            </div>
          </div>

          {/* Description */}
          {submittal.description && (
            <Section title="Description">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{submittal.description}</p>
            </Section>
          )}

          {/* Attachments */}
          <Section title="Attachments">
            {(submittal.attachments ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">No attachments</p>
            ) : (
              <ul className="space-y-2">
                {submittal.attachments.map((att, i) => (
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
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Specification</dt>
                <dd className="mt-0.5 text-gray-900">{getSpecName(specifications, submittal.specification_id)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Submittal Manager</dt>
                <dd className="mt-0.5 text-gray-900">{getContactNameById(directory, submittal.submittal_manager_id)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Responsible Contractor</dt>
                <dd className="mt-0.5 text-gray-900">{getContactNameById(directory, submittal.responsible_contractor_id)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Received From</dt>
                <dd className="mt-0.5 text-gray-900">{getContactNameById(directory, submittal.received_from_id)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ball In Court</dt>
                <dd className="mt-0.5 text-gray-900">{getContactNameById(directory, submittal.ball_in_court_id)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Submit By</dt>
                <dd className="mt-0.5 text-gray-900">{formatDate(submittal.submit_by)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Received Date</dt>
                <dd className="mt-0.5 text-gray-900">{formatDate(submittal.received_date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</dt>
                <dd className="mt-0.5 text-gray-900">{formatDate(submittal.issue_date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Final Due Date</dt>
                <dd className="mt-0.5 text-gray-900">{formatDate(submittal.final_due_date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Required On-Site Date</dt>
                <dd className="mt-0.5 text-gray-900">{formatDate(submittal.required_on_site_date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Time</dt>
                <dd className="mt-0.5 text-gray-900">{submittal.lead_time != null ? `${submittal.lead_time} days` : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Code</dt>
                <dd className="mt-0.5 text-gray-900">{submittal.cost_code || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Drawings</dt>
                <dd className="mt-0.5 text-gray-900">{submittal.linked_drawings || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</dt>
                <dd className="mt-0.5 text-gray-900">{formatDate(submittal.created_at)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Distribution List</dt>
                <dd className="mt-0.5 text-gray-900">{(submittal.distribution_list ?? []).map((d) => d.name).join(", ") || "—"}</dd>
              </div>
            </dl>
          </Section>
        </div>
      </main>
    </div>
  );
}
