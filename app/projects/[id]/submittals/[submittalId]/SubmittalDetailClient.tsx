"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import ProjectNav from "@/components/ProjectNav";
import { useRouter } from "next/navigation";

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
  approver_name_id: string | null;
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
  workflow_steps: {
    step: number;
    person_id: string | null;
    role: string;
    due_date: string | null;
    sent_date?: string | null;
    returned_date?: string | null;
    response?: string | null;
    comments?: string | null;
    attachments?: { name: string; url: string }[];
  }[];
  related_items: { type: string; title: string; href: string }[];
  distributed_at: string | null;
  closed_at: string | null;
  created_by: string | null;
  created_at: string;
};

type EditableSubmittalFields = Pick<
  Submittal,
  "title" | "revision" | "submittal_type" | "status" | "submit_by" | "issue_date" | "cost_code" | "linked_drawings" | "description"
>;

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  revise_and_resubmit: "Revise & Resubmit",
  revise_and_resubmit_2: "Revise & Resubmit 2",
  closed: "Closed",
  open: "Open",
  approved_as_noted: "Approved as Noted",
  for_the_record: "For the Record",
  make_corrections: "Make Corrections",
  no_exceptions_taken: "No Exceptions Taken",
  not_reviewed: "Not Reviewed",
  note_markings: "Note Markings",
  resubmitted: "Resubmitted",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700",
  pending_review: "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  revise_and_resubmit: "bg-orange-50 text-orange-700",
  revise_and_resubmit_2: "bg-orange-50 text-orange-700",
  closed: "bg-gray-100 text-gray-600",
  open: "bg-blue-50 text-blue-700",
  approved_as_noted: "bg-green-50 text-green-700",
};

function contactDisplayName(c: DirectoryContact): string {
  if (c.type === "company") return c.company ?? "Unnamed Company";
  if (c.type === "distribution_group") return c.group_name ?? "Unnamed Group";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed";
}

function contactWithCompany(c: DirectoryContact): string {
  const name = contactDisplayName(c);
  if (c.company && c.type !== "company") return `${name} (${c.company})`;
  return name;
}

function getContactById(directory: DirectoryContact[], id: string | null): DirectoryContact | null {
  if (!id) return null;
  return directory.find((x) => x.id === id) ?? null;
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
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${open ? "" : "-rotate-90"}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

const DIST_SHOW_LIMIT = 4;
const tabs: { key: "general" | "related" | "emails" | "history"; label: string }[] = [
  { key: "general", label: "General" },
  { key: "related", label: "Related" },
  { key: "emails", label: "Emails" },
  { key: "history", label: "History" },
];

export default function SubmittalDetailClient({
  projectId,
  submittalId,
  role,
  username,
  userId,
}: {
  projectId: string;
  submittalId: string;
  role: string;
  username: string;
  userId: string;
}) {
  const router = useRouter();
  const [submittal, setSubmittal] = useState<Submittal | null>(null);
  const [directory, setDirectory] = useState<DirectoryContact[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [distOpen, setDistOpen] = useState(true);
  const [workflowOpen, setWorkflowOpen] = useState(true);
  const [generalOpen, setGeneralOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"general" | "related" | "emails" | "history">("general");
  const [showAllRecipients, setShowAllRecipients] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [responseModal, setResponseModal] = useState<{ personId: string } | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editValues, setEditValues] = useState<EditableSubmittalFields | null>(null);

  function startEdit() {
    if (!submittal) return;
    setEditValues({
      title: submittal.title,
      revision: submittal.revision,
      submittal_type: submittal.submittal_type,
      status: submittal.status,
      submit_by: submittal.submit_by,
      issue_date: submittal.issue_date,
      cost_code: submittal.cost_code,
      linked_drawings: submittal.linked_drawings,
      description: submittal.description,
    });
    setIsEditing(true);
    setMenuOpen(false);
  }

  async function saveEdits() {
    if (!editValues) return;
    setEditSaving(true);
    const res = await fetch(`/api/projects/${projectId}/submittals/${submittalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editValues),
    });
    const data = await res.json().catch(() => ({}));
    setEditSaving(false);
    if (!res.ok) {
      alert((data as { error?: string }).error || "Failed to save changes");
      return;
    }
    setSubmittal(data as Submittal);
    setIsEditing(false);
    setEditValues(null);
    router.refresh();
  }

  async function runAction(action: string, payload?: Record<string, unknown>) {
    setActionLoading(action);
    const res = await fetch(`/api/projects/${projectId}/submittals/${submittalId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload: payload ?? {} }),
    });
    const data = await res.json();
    setActionLoading(null);
    if (!res.ok) {
      alert(data.error || "Action failed");
      return;
    }
    if (action === "duplicate" || action === "create_revision") {
      router.push(`/projects/${projectId}/submittals/${data.id}`);
      return;
    }
    if (action === "distribute" && data.revision?.id) {
      router.push(`/projects/${projectId}/submittals/${data.revision.id}`);
      return;
    }
    router.refresh();
  }

  async function deleteSubmittal() {
    if (!confirm("Send this submittal to Recycle Bin?")) return;
    setActionLoading("delete");
    const res = await fetch(`/api/projects/${projectId}/submittals/${submittalId}`, { method: "DELETE" });
    setActionLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Delete failed");
      return;
    }
    router.push(`/projects/${projectId}/submittals`);
  }

  async function submitResponse(personId: string, response: string, comments: string, files: File[]) {
    setActionLoading("edit_response");
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("person_id", personId);
      const upRes = await fetch(`/api/projects/${projectId}/submittals/${submittalId}/response-attachment`, { method: "POST", body: formData });
      if (!upRes.ok) {
        const data = await upRes.json().catch(() => ({}));
        setActionLoading(null);
        alert(data.error || "Attachment upload failed");
        return;
      }
    }
    const res = await fetch(`/api/projects/${projectId}/submittals/${submittalId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "edit_response",
        payload: {
          person_id: personId,
          response: response.trim() || null,
          comments: comments.trim() || null,
          sent_date: new Date().toISOString().slice(0, 10),
          returned_date: new Date().toISOString().slice(0, 10),
        },
      }),
    });
    const data = await res.json();
    setActionLoading(null);
    if (!res.ok) {
      alert(data.error || "Action failed");
      return;
    }
    setResponseModal(null);
    router.refresh();
  }

  async function uploadGeneralAttachments(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setUploadingAttachment(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/projects/${projectId}/submittals/${submittalId}/attachment`, { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Attachment upload failed");
        setUploadingAttachment(false);
        return;
      }
      const updated = await res.json();
      setSubmittal((prev) => (prev ? { ...prev, attachments: updated.attachments ?? [] } : prev));
    }
    setUploadingAttachment(false);
  }

  async function forwardForReview() {
    const toPersonId = prompt("Forward to contact ID (from directory):");
    if (!toPersonId) return;
    const comments = prompt("Forward comments (optional):") ?? "";
    await runAction("forward_for_review", {
      to_person_id: toPersonId.trim(),
      actor_contact_id: submittal?.ball_in_court_id ?? null,
      comments: comments.trim() || null,
      sent_date: new Date().toISOString().slice(0, 10),
    });
  }

  async function removeWorkflowPerson(personId: string) {
    if (!confirm("Remove this submitter/approver from the workflow?")) return;
    await runAction("remove_workflow_person", { person_id: personId });
  }

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

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
          <a href="/dashboard" className="text-sm font-semibold text-gray-900">SiteCommand</a>
          <span className="text-sm text-gray-400">{username}</span>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-sm text-gray-400">Loading...</p>
        </main>
      </div>
    );
  }

  if (notFound || !submittal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
          <a href="/dashboard" className="text-sm font-semibold text-gray-900">SiteCommand</a>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-sm text-gray-500">Submittal not found.</p>
        </main>
      </div>
    );
  }

  const canEdit = submittal.created_by === userId;
  const distList = submittal.distribution_list ?? [];
  const attachments = submittal.attachments ?? [];
  const visibleRecipients = showAllRecipients ? distList : distList.slice(0, DIST_SHOW_LIMIT);
  const statusLabel = STATUS_LABELS[submittal.status] ?? submittal.status;

  const fromContact = getContactById(directory, submittal.received_from_id);
  const workflowSteps = (submittal.workflow_steps ?? []).slice().sort((a, b) => a.step - b.step);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
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

      {/* Submittal title bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <a
            href={`/projects/${projectId}/submittals`}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All Submittals
          </a>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-semibold text-gray-900 truncate">
            Submittal #{submittal.submittal_number} Revision {submittal.revision ?? "0"}: {submittal.title}
          </h1>
          {submittal.private && (
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex-shrink-0">Private</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[submittal.status] ?? "bg-gray-100 text-gray-600"}`}>
            {statusLabel}
          </span>
          {canEdit && (
            <>
              <button onClick={() => runAction("redistribute")} disabled={actionLoading !== null} className="px-3 py-1.5 text-sm font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors disabled:opacity-50">Redistribute</button>
              <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors">Export</button>
              {!isEditing ? (
                <button onClick={startEdit} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors">Edit</button>
              ) : (
                <>
                  <button onClick={saveEdits} disabled={editSaving} className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-700 transition-colors disabled:opacity-50">{editSaving ? "Saving..." : "Save"}</button>
                  <button onClick={() => { setIsEditing(false); setEditValues(null); }} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">Cancel</button>
                </>
              )}
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="px-2 py-1.5 text-xl leading-none text-gray-700 hover:text-gray-900"
                  aria-label="More actions"
                >
                  ⋮
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1 text-sm">
                    <button onClick={() => runAction("create_revision")} className="w-full text-left px-3 py-2 hover:bg-gray-50">Create Revision</button>
                    <button onClick={() => runAction("redistribute")} className="w-full text-left px-3 py-2 hover:bg-gray-50">Email</button>
                    <button onClick={deleteSubmittal} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50">Delete</button>
                    <button onClick={() => router.push(`/projects/${projectId}/submittals`)} className="w-full text-left px-3 py-2 hover:bg-gray-50">Create New Submittal</button>
                    <button onClick={() => runAction("duplicate")} className="w-full text-left px-3 py-2 hover:bg-gray-50">Duplicate Submittal</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "general" | "related" | "emails" | "history")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {activeTab === "emails" && (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-12 text-center">
            <p className="text-sm text-gray-400">Email activity feed is coming soon.</p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-12 text-center">
            <p className="text-sm text-gray-400">Change history is coming soon.</p>
          </div>
        )}

        {activeTab === "related" && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Related Items</h3>
            {(submittal.related_items ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">No related items added.</p>
            ) : (
              <ul className="space-y-2">
                {(submittal.related_items ?? []).map((item, idx) => (
                  <li key={`${item.href}-${idx}`} className="text-sm">
                    <a href={item.href} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{item.title || item.href}</a>
                    <span className="text-gray-500"> · {item.type || "link"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "general" && (
          <>
        {/* ── Distribution Summary ───────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setDistOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <ChevronDown open={distOpen} />
            <span className="text-base font-semibold text-gray-900">Distribution Summary</span>
          </button>

          {distOpen && (
            <div className="border-t border-gray-100 px-6 pb-5">
              {/* From / To row */}
              <div className="flex gap-16 py-4">
                <div className="w-56 flex-shrink-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">From</p>
                  {fromContact ? (
                    <p className="text-sm text-gray-700">{contactWithCompany(fromContact)}</p>
                  ) : (
                    <p className="text-sm text-gray-400">—</p>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">To</p>
                  {distList.length === 0 ? (
                    <p className="text-sm text-gray-400">—</p>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        {visibleRecipients.map((c) => (
                          <p key={c.id} className="text-sm text-blue-600">{c.name}</p>
                        ))}
                      </div>
                      {distList.length > DIST_SHOW_LIMIT && (
                        <button
                          onClick={() => setShowAllRecipients((v) => !v)}
                          className="mt-2 px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          {showAllRecipients ? "Show Less" : "Show More"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Message + Attachments */}
              <div className="border-t border-gray-100 pt-4 flex gap-16">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">Message</p>
                  {isEditing ? (
                    <textarea
                      value={editValues?.description ?? ""}
                      onChange={(e) => setEditValues((prev) => ({ ...(prev ?? {}), description: e.target.value || null }))}
                      className="w-full min-h-24 px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  ) : submittal.description ? (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{submittal.description}</p>
                  ) : (
                    <p className="text-sm text-gray-400">--</p>
                  )}
                </div>
                <div className="w-56 flex-shrink-0">
                  <p className="text-sm font-medium text-gray-700 mb-1">Attachments</p>
                  <p className="text-sm text-gray-400">--</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Submittal Workflow ─────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setWorkflowOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <ChevronDown open={workflowOpen} />
            <span className="text-base font-semibold text-gray-900">Submittal Workflow</span>
          </button>

          {workflowOpen && (
            <div className="border-t border-gray-100 overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-44">Name</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Sent Date</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Due Date</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Returned Date</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Response</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Comments</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Attachments</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Version</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* General Information Attachments group */}
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td colSpan={9} className="px-4 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-gray-700">General Information Attachments</span>
                        {canEdit && (
                          <>
                            <input
                              ref={attachmentInputRef}
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const list = e.target.files;
                                if (list && list.length > 0) uploadGeneralAttachments(list);
                                e.target.value = "";
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => attachmentInputRef.current?.click()}
                              disabled={uploadingAttachment}
                              className="px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                              {uploadingAttachment ? "Uploading..." : "Add Attachment"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {attachments.length === 0 ? (
                    <tr className="border-b border-gray-100">
                      <td colSpan={9} className="px-4 py-3 text-sm text-gray-400">No attachments</td>
                    </tr>
                  ) : (
                    attachments.map((att, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td colSpan={6} />
                        <td className="px-3 py-3">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {att.name}
                          </a>
                        </td>
                        <td />
                        <td className="px-3 py-3">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            <DownloadIcon />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}

                  {/* #1 round header row */}
                  <tr className="border-b border-gray-200 bg-white">
                    <td className="px-4 py-2.5">
                      <span className="text-sm font-bold text-gray-900">
                        #{submittal.submittal_number}
                      </span>
                    </td>
                    <td colSpan={7} />
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => {
                          const contactId = prompt("Set Ball in Court to contact ID:");
                          if (!contactId) return;
                          runAction("change_ball_in_court", { ball_in_court_id: contactId.trim() });
                        }}
                        className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        Set Ball in Court
                      </button>
                    </td>
                  </tr>

                  {workflowSteps.length > 0 ? (
                    workflowSteps.map((step) => {
                      const stepContact = getContactById(directory, step.person_id);
                      const isBallInCourt = submittal.ball_in_court_id && step.person_id === submittal.ball_in_court_id;
                      return (
                        <tr key={`${step.step}-${step.person_id ?? "unassigned"}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            {stepContact ? (
                              <div className="flex items-start gap-1.5">
                                <span className={`${isBallInCourt ? "text-yellow-400" : "text-gray-300"} text-sm leading-none mt-0.5`}>★</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 leading-snug">
                                    {contactDisplayName(stepContact)}
                                  </p>
                                  <p className="text-xs text-gray-500">{step.role}</p>
                                  {stepContact.company && (
                                    <p className="text-xs text-gray-500">{stepContact.company}</p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 italic">Unassigned</p>
                            )}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(step.sent_date ?? submittal.issue_date)}</td>
                          <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(step.due_date)}</td>
                          <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(step.returned_date)}</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{step.response ?? "—"}</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{step.comments ?? "—"}</td>
                          <td className="px-3 py-3 text-sm text-gray-600">
                            {(step.attachments ?? []).length === 0 ? (
                              <span className="text-gray-400">--</span>
                            ) : (
                              <ul className="space-y-0.5">
                                {(step.attachments ?? []).map((att, ai) => (
                                  <li key={`${att.url}-${ai}`}>
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                      {att.name}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {isBallInCourt ? (
                              <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded border border-green-300 uppercase">
                                Current
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Step {step.step}</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {canEdit && step.person_id && isBallInCourt && (
                                <button
                                  onClick={() => setResponseModal({ personId: step.person_id! })}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Edit Response
                                </button>
                              )}
                              {canEdit && step.person_id && isBallInCourt && (
                                <button onClick={forwardForReview} className="text-xs text-blue-600 hover:underline">Forward</button>
                              )}
                              {canEdit && step.person_id && (
                                <button
                                  onClick={() => removeWorkflowPerson(step.person_id!)}
                                  className="text-xs text-red-600 hover:underline"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="border-b border-gray-100">
                      <td colSpan={9} className="px-4 py-3 text-sm text-gray-400 italic">No workflow steps configured</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── General Information ────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setGeneralOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <ChevronDown open={generalOpen} />
            <span className="text-base font-semibold text-gray-900">General Information</span>
          </button>

          {generalOpen && (
            <div className="border-t border-gray-100 px-6 pb-6">
              {/* Title */}
              <div className="py-4 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Title</p>
                {isEditing ? (
                  <input
                    value={editValues?.title ?? ""}
                    onChange={(e) => setEditValues((prev) => ({ ...(prev ?? {}), title: e.target.value }))}
                    className="w-full max-w-xl px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="text-sm text-blue-600 font-medium">{submittal.title}</p>
                )}
              </div>

              {/* 4-column details grid */}
              <dl className="grid grid-cols-4 gap-x-8 gap-y-5 text-sm pt-5">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Specification</dt>
                  <dd className="text-gray-700">{getSpecName(specifications, submittal.specification_id)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Number &amp; Revision</dt>
                  <dd className="text-gray-700">
                    {isEditing ? (
                      <input
                        value={editValues?.revision ?? ""}
                        onChange={(e) => setEditValues((prev) => ({ ...(prev ?? {}), revision: e.target.value || null }))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      submittal.revision || "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Submittal Type</dt>
                  <dd className="text-gray-700">
                    {isEditing ? (
                      <input
                        value={editValues?.submittal_type ?? ""}
                        onChange={(e) => setEditValues((prev) => ({ ...(prev ?? {}), submittal_type: e.target.value || null }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      submittal.submittal_type || "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Submittal Package</dt>
                  <dd className="text-gray-700">—</dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Responsible Contractor</dt>
                  <dd className="text-blue-600">{getContactNameById(directory, submittal.responsible_contractor_id)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Received From</dt>
                  <dd className="text-blue-600">{getContactNameById(directory, submittal.received_from_id)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Submittal Manager</dt>
                  <dd className="text-gray-700">{getContactNameById(directory, submittal.submittal_manager_id)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Status</dt>
                  <dd className="text-gray-700">
                    {isEditing ? (
                      <select
                        value={String(editValues?.status ?? submittal.status)}
                        onChange={(e) => setEditValues((prev) => ({ ...(prev ?? {}), status: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      statusLabel
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Submit By</dt>
                  <dd className="text-gray-700">
                    {isEditing ? (
                      <input
                        type="date"
                        value={String(editValues?.submit_by ?? "")}
                        onChange={(e) => setEditValues((prev) => ({ ...(prev ?? {}), submit_by: e.target.value || null }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : formatDate(submittal.submit_by)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Received Date</dt>
                  <dd className="text-gray-700">{formatDate(submittal.received_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Issue Date</dt>
                  <dd className="text-gray-700">
                    {isEditing ? (
                      <input
                        type="date"
                        value={String(editValues?.issue_date ?? "")}
                        onChange={(e) => setEditValues((prev) => ({ ...(prev ?? {}), issue_date: e.target.value || null }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : formatDate(submittal.issue_date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Final Due Date</dt>
                  <dd className="text-gray-700">{formatDate(submittal.final_due_date)}</dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Cost Code</dt>
                  <dd className="text-gray-700">
                    {isEditing ? (
                      <input
                        value={editValues?.cost_code ?? ""}
                        onChange={(e) => setEditValues((prev) => ({ ...(prev ?? {}), cost_code: e.target.value || null }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      submittal.cost_code || "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Location</dt>
                  <dd className="text-gray-700">—</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Linked Drawings</dt>
                  <dd className="text-gray-700">
                    {isEditing ? (
                      <input
                        value={editValues?.linked_drawings ?? ""}
                        onChange={(e) => setEditValues((prev) => ({ ...(prev ?? {}), linked_drawings: e.target.value || null }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      submittal.linked_drawings || "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Distribution List</dt>
                  <dd>
                    {distList.length > 0 ? (
                      <div className="space-y-0.5">
                        {distList.map((d) => (
                          <p key={d.id} className="text-blue-600">{d.name}</p>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-700">—</span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Ball In Court</dt>
                  <dd className="text-gray-700">{getContactNameById(directory, submittal.ball_in_court_id)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Lead Time</dt>
                  <dd className="text-gray-700">{submittal.lead_time != null ? `${submittal.lead_time} days` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Required On-Site Date</dt>
                  <dd className="text-gray-700">{formatDate(submittal.required_on_site_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Private</dt>
                  <dd className="text-gray-700">{submittal.private ? "Yes" : "No"}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
          </>
        )}
      </main>

      {responseModal && (
        <ResponseModal
          personId={responseModal.personId}
          saving={actionLoading === "edit_response"}
          onCancel={() => setResponseModal(null)}
          onSubmit={(response, comments, files) => submitResponse(responseModal.personId, response, comments, files)}
        />
      )}
    </div>
  );
}

function ResponseModal({
  personId,
  saving,
  onCancel,
  onSubmit,
}: {
  personId: string;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (response: string, comments: string, files: File[]) => void;
}) {
  void personId;
  const [response, setResponse] = useState("");
  const [comments, setComments] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Edit Response</h2>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Response</label>
            <select value={response} onChange={(e) => setResponse(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value=""></option>
              <option value="Approved">Approved</option>
              <option value="Approved as Noted">Approved as Noted</option>
              <option value="Make Corrections Noted">Make Corrections Noted</option>
              <option value="No Exceptions Taken">No Exceptions Taken</option>
              <option value="Rejected">Rejected</option>
              <option value="Revise and Resubmit">Revise and Resubmit</option>
              <option value="Sub Specified Item">Sub Specified Item</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Comments</label>
            <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Attachments</label>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const list = e.target.files ? Array.from(e.target.files) : [];
                if (list.length > 0) setFiles((prev) => [...prev, ...list]);
                e.target.value = "";
              }}
            />
            <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50">
              Add files
            </button>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between px-2 py-1 text-xs bg-gray-50 rounded">
                    <span className="truncate text-gray-700">{f.name}</span>
                    <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-gray-700 ml-2">×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={saving} className="px-3 py-1.5 text-sm text-gray-700 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(response, comments, files)}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
