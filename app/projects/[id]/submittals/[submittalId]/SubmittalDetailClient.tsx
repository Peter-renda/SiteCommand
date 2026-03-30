"use client";

import { useState, useEffect } from "react";
import ProjectNav from "@/components/ProjectNav";

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
  created_by: string | null;
  created_at: string;
};

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
  const [submittal, setSubmittal] = useState<Submittal | null>(null);
  const [directory, setDirectory] = useState<DirectoryContact[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [distOpen, setDistOpen] = useState(true);
  const [workflowOpen, setWorkflowOpen] = useState(true);
  const [generalOpen, setGeneralOpen] = useState(true);
  const [showAllRecipients, setShowAllRecipients] = useState(false);

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
  const approverContact = getContactById(directory, submittal.approver_name_id);

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
            Submittal #{submittal.submittal_number}{submittal.revision ? `-${submittal.revision}` : ""}: {submittal.title}
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
            <a
              href={`/projects/${projectId}/submittals/${submittal.id}/edit`}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Edit
            </a>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-4">

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
                  {submittal.description ? (
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
                      <span className="text-xs font-semibold text-gray-700">General Information Attachments</span>
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
                      <button className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors whitespace-nowrap">
                        Set Ball in Court
                      </button>
                    </td>
                  </tr>

                  {/* Approver row */}
                  {approverContact ? (
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-1.5">
                          <span className="text-yellow-400 text-sm leading-none mt-0.5">★</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900 leading-snug">
                              {contactDisplayName(approverContact)}
                            </p>
                            {approverContact.company && (
                              <p className="text-xs text-gray-500">{approverContact.company}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(submittal.issue_date)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(submittal.final_due_date)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(submittal.received_date)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{statusLabel}</td>
                      <td className="px-3 py-3 text-sm text-gray-400">--</td>
                      <td className="px-3 py-3 text-sm text-gray-400">--</td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded border border-green-300 uppercase">
                          Current
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-gray-400">—</span>
                      </td>
                    </tr>
                  ) : (
                    <tr className="border-b border-gray-100">
                      <td colSpan={9} className="px-4 py-3 text-sm text-gray-400 italic">No reviewer assigned</td>
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
                <p className="text-sm text-blue-600 font-medium">{submittal.title}</p>
              </div>

              {/* 4-column details grid */}
              <dl className="grid grid-cols-4 gap-x-8 gap-y-5 text-sm pt-5">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Specification</dt>
                  <dd className="text-gray-700">{getSpecName(specifications, submittal.specification_id)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Number &amp; Revision</dt>
                  <dd className="text-gray-700">{submittal.revision || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Submittal Type</dt>
                  <dd className="text-gray-700">{submittal.submittal_type || "—"}</dd>
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
                  <dd className="text-gray-700">{statusLabel}</dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Submit By</dt>
                  <dd className="text-gray-700">{formatDate(submittal.submit_by)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Received Date</dt>
                  <dd className="text-gray-700">{formatDate(submittal.received_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Issue Date</dt>
                  <dd className="text-gray-700">{formatDate(submittal.issue_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Final Due Date</dt>
                  <dd className="text-gray-700">{formatDate(submittal.final_due_date)}</dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Cost Code</dt>
                  <dd className="text-gray-700">{submittal.cost_code || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Location</dt>
                  <dd className="text-gray-700">—</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Linked Drawings</dt>
                  <dd className="text-gray-700">{submittal.linked_drawings || "—"}</dd>
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

      </main>
    </div>
  );
}
