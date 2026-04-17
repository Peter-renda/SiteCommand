"use client";

import { useEffect, useRef, useState } from "react";
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
  ball_in_court_id: string | null;
};

type RFIResponse = {
  id: string;
  body: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  attachments: { name: string; url: string }[];
};

type ChangeHistoryEntry = {
  id: string;
  action: string;
  from_value: string | null;
  to_value: string | null;
  changed_by_name: string | null;
  changed_by_company: string | null;
  created_at: string;
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
  return s ? (s.name + (s.code ? ` (${s.code})` : "")) : "—";
}
function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatDateTime(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 text-gray-500 transition-transform ${open ? "" : "-rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function AttachmentLink({ att }: { att: { name: string; url: string } }) {
  return (
    <div className="space-y-0.5">
      <span className="text-sm text-gray-700 truncate block max-w-[180px]">{att.name}</span>
      <a href={att.url} download={att.name} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download
      </a>
    </div>
  );
}

export default function RFIDetailClient({ projectId, rfiId, role, username, userId, userEmail }: { projectId: string; rfiId: string; role: string; username: string; userId: string; userEmail: string }) {
  const [rfi, setRfi] = useState<RFI | null>(null);
  const [directory, setDirectory] = useState<DirectoryContact[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [responses, setResponses] = useState<RFIResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [requestOpen, setRequestOpen] = useState(true);
  const [responsesOpen, setResponsesOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("general");

  const [responseBody, setResponseBody] = useState("");
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);

  const [closingRFI, setClosingRFI] = useState(false);
  const [returningCourt, setReturningCourt] = useState(false);
  const [history, setHistory] = useState<ChangeHistoryEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [processingAction, setProcessingAction] = useState<"email" | "delete" | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/rfis/${rfiId}`),
      fetch(`/api/projects/${projectId}/directory`),
      fetch(`/api/projects/${projectId}/specifications`),
      fetch(`/api/projects/${projectId}/rfis/${rfiId}/responses`),
    ]).then(async ([rfiRes, dirRes, specRes, respRes]) => {
      if (!rfiRes.ok) { setNotFound(true); setLoading(false); return; }
      const [rfiData, dirData, specData, respData] = await Promise.all([
        rfiRes.json(),
        dirRes.json(),
        specRes.json(),
        respRes.ok ? respRes.json() : [],
      ]);
      setRfi(rfiData);
      setDirectory(Array.isArray(dirData) ? dirData : []);
      setSpecifications(Array.isArray(specData) ? specData : []);
      setResponses(Array.isArray(respData) ? respData : []);
      setLoading(false);
    });
  }, [projectId, rfiId]);

  useEffect(() => {
    if (historyLoaded) return;
    fetch(`/api/projects/${projectId}/rfis/${rfiId}/history`)
      .then((r) => r.json())
      .then((d) => {
        setHistory(Array.isArray(d) ? d : []);
        setHistoryLoaded(true);
      })
      .catch(() => {
        setHistory([]);
        setHistoryLoaded(true);
      });
  }, [historyLoaded, projectId, rfiId]);

  useEffect(() => {
    function onDocumentMouseDown(e: MouseEvent) {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
      }
    }

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, []);

  const canEdit = rfi && rfi.created_by === userId;

  async function handleCloseRFI() {
    if (!rfi) return;
    setClosingRFI(true);
    const newStatus = rfi.status === "closed" ? "open" : "closed";
    const res = await fetch(`/api/projects/${projectId}/rfis/${rfiId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setRfi(await res.json());
    setClosingRFI(false);
  }

  async function handleSubmitResponse() {
    if (!responseBody.trim()) return;
    setSubmittingResponse(true);
    setResponseError(null);
    const res = await fetch(`/api/projects/${projectId}/rfis/${rfiId}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: responseBody }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setResponseError(err.error || "Failed to send response.");
      setSubmittingResponse(false);
      return;
    }
    let newResp = await res.json();
    if (responseFile) {
      const fd = new FormData();
      fd.append("file", responseFile);
      const attRes = await fetch(`/api/projects/${projectId}/rfis/${rfiId}/responses/${newResp.id}/attachment`, {
        method: "POST",
        body: fd,
      });
      if (attRes.ok) {
        const attData = await attRes.json();
        newResp = { ...newResp, attachments: attData.attachments ?? [] };
      } else {
        const attErr = await attRes.json().catch(() => ({}));
        setResponseError(`Response saved but attachment failed: ${attErr.error || "upload error"}`);
      }
    }
    setResponses((prev) => [newResp, ...prev]);
    setResponseBody("");
    setResponseFile(null);
    setShowResponseForm(false);
    setSubmittingResponse(false);
  }

  async function handleReturnCourt() {
    if (!rfi) return;
    setReturningCourt(true);
    const ballIsWithAssignee = rfi.ball_in_court_id !== null && rfi.ball_in_court_id !== rfi.rfi_manager_id;
    const newBallInCourtId = ballIsWithAssignee ? rfi.rfi_manager_id : (rfi.assignees[0]?.id ?? null);
    const res = await fetch(`/api/projects/${projectId}/rfis/${rfiId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ball_in_court_id: newBallInCourtId }),
    });
    if (res.ok) setRfi(await res.json());
    setReturningCourt(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  async function handleEmailRFI() {
    const distributionEmails = (rfi.distribution_list ?? [])
      .map((contact) => contact.email)
      .filter((email): email is string => Boolean(email));

    if (distributionEmails.length === 0) {
      window.alert("This RFI has no distribution list emails.");
      return;
    }

    setProcessingAction("email");
    const res = await fetch(`/api/projects/${projectId}/rfis/${rfiId}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distribution_emails: distributionEmails,
        rfi_summary: `RFI #${rfi.rfi_number}: ${rfi.subject || "No subject"}`,
      }),
    });
    setProcessingAction(null);
    setShowActionsMenu(false);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      window.alert(errorData.error || "Failed to send email notification.");
      return;
    }
    window.alert("Email notification queued for the distribution list.");
  }

  async function handleDeleteRFI() {
    if (!canEdit) {
      window.alert("Only the RFI creator can delete this RFI.");
      return;
    }

    const confirmed = window.confirm("Delete this RFI? This action cannot be undone.");
    if (!confirmed) return;

    setProcessingAction("delete");
    const res = await fetch(`/api/projects/${projectId}/rfis/${rfiId}`, { method: "DELETE" });
    setProcessingAction(null);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      window.alert(errorData.error || "Failed to delete the RFI.");
      return;
    }

    window.location.href = `/projects/${projectId}/rfis`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
          <a href="/dashboard" className="text-sm font-semibold text-gray-900">SiteCommand</a>
          <span className="text-sm text-gray-400">{username}</span>
        </header>
        <main className="px-6 py-8"><p className="text-sm text-gray-400">Loading...</p></main>
      </div>
    );
  }

  if (notFound || !rfi) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
          <a href="/dashboard" className="text-sm font-semibold text-gray-900">SiteCommand</a>
        </header>
        <main className="px-6 py-8"><p className="text-sm text-gray-500">RFI not found.</p></main>
      </div>
    );
  }

  const relatedItemsCount = 0;
  const emailsCount = 0;
  const historyCount = history.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Site header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">SiteCommand</a>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      {/* RFI title bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold text-gray-900 truncate">
          RFI #{rfi.rfi_number}: {rfi.subject || "No subject"}
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={`/projects/${projectId}/change-events/new?sourceType=rfi&sourceId=${rfi.id}`}
            className="px-3 py-1.5 text-sm font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors"
          >
            + Create Change Event
          </a>
          <button
            onClick={handleCloseRFI}
            disabled={closingRFI}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors disabled:opacity-50 ${rfi.status === "closed" ? "bg-gray-600 text-white hover:bg-gray-700" : "bg-orange-500 text-white hover:bg-orange-600"}`}
          >
            {closingRFI ? "..." : rfi.status === "closed" ? "Reopen RFI" : "Close RFI"}
          </button>
          {canEdit && (
            <a
              href={`/projects/${projectId}/rfis/${rfi.id}/edit`}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Edit
            </a>
          )}
          <a
            href={`/projects/${projectId}/rfis`}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            All RFIs
          </a>
          <div className="relative" ref={actionsMenuRef}>
            <button
              type="button"
              onClick={() => setShowActionsMenu((v) => !v)}
              className="w-9 h-9 inline-flex items-center justify-center text-gray-600 bg-white border border-blue-600 rounded hover:bg-blue-50 transition-colors"
              aria-haspopup="menu"
              aria-expanded={showActionsMenu}
              aria-label="More actions"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="5" r="1.75" />
                <circle cx="12" cy="12" r="1.75" />
                <circle cx="12" cy="19" r="1.75" />
              </svg>
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20">
                <button
                  type="button"
                  onClick={handleEmailRFI}
                  disabled={processingAction !== null}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {processingAction === "email" ? "Emailing..." : "Email"}
                </button>
                <a
                  href={`/projects/${projectId}/change-events/new?sourceType=rfi&sourceId=${rfi.id}`}
                  onClick={() => setShowActionsMenu(false)}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Create Change Event
                </a>
                <button
                  type="button"
                  onClick={handleDeleteRFI}
                  disabled={processingAction !== null || !canEdit}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {processingAction === "delete" ? "Deleting..." : "Delete"}
                </button>
                <a
                  href={`/projects/${projectId}/rfis?create=1`}
                  onClick={() => setShowActionsMenu(false)}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Create RFI
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex gap-0 -mb-px">
          {[
            { id: "general", label: "General" },
            { id: "related", label: `Related Items (${relatedItemsCount})` },
            { id: "emails", label: `Emails (${emailsCount})` },
            { id: "history", label: `Change History (${historyCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
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
        {(activeTab === "related" || activeTab === "emails") && (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-12 text-center">
            <p className="text-sm text-gray-400">No content yet.</p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {!historyLoaded ? (
              <p className="px-6 py-8 text-sm text-gray-400">Loading...</p>
            ) : history.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400">No change history yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-44">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">Action By</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-56">Changed</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">From</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">To</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, idx) => (
                    <tr key={entry.id} className={idx < history.length - 1 ? "border-b border-gray-100" : ""}>
                      <td className="px-4 py-4 text-xs text-gray-500 align-top whitespace-nowrap">
                        {formatDateTime(entry.created_at)}
                      </td>
                      <td className="px-4 py-4 align-top">
                        {entry.changed_by_name ? (
                          <span className="text-sm text-blue-600">
                            {entry.changed_by_name}
                            {entry.changed_by_company ? ` (${entry.changed_by_company})` : ""}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 align-top">{entry.action}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 align-top">{entry.from_value ?? "(None)"}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 align-top whitespace-pre-wrap">{entry.to_value ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "general" && (
          <>
            {/* Request card */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setRequestOpen((v) => !v)}
                className="w-full flex items-center gap-2 px-6 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left"
              >
                <ChevronDown open={requestOpen} />
                <span className="text-sm font-semibold text-gray-900">Request</span>
              </button>

              {requestOpen && (
                <div className="px-6 py-4 space-y-3">
                  {/* Subject row */}
                  <div className="flex items-baseline gap-6">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 flex-shrink-0">Subject</span>
                    <span className="text-sm text-gray-900">{rfi.subject || "—"}</span>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Question + Attachments row */}
                  <div className="flex gap-6">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 flex-shrink-0 pt-0.5">Question</span>
                    <p className="flex-1 text-sm text-gray-700 whitespace-pre-wrap">{rfi.question || "—"}</p>
                    <div className="w-52 flex-shrink-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Attachments</p>
                      {(rfi.attachments ?? []).length === 0 ? (
                        <p className="text-sm text-gray-400">—</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {rfi.attachments.map((att, i) => <li key={i}><AttachmentLink att={att} /></li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Responses card */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                <button
                  onClick={() => setResponsesOpen((v) => !v)}
                  className="flex items-center gap-2 hover:text-gray-600 transition-colors"
                >
                  <ChevronDown open={responsesOpen} />
                  <span className="text-sm font-semibold text-gray-900">Responses</span>
                </button>
                <button
                  onClick={() => { setShowResponseForm((v) => !v); setResponsesOpen(true); }}
                  className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors"
                  title="Add response"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {responsesOpen && (
                <>
                  {/* Add response form */}
                  {showResponseForm && (
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Response</label>
                      <textarea
                        value={responseBody}
                        onChange={(e) => setResponseBody(e.target.value)}
                        rows={3}
                        placeholder="Write your response..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none bg-white"
                      />
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Attachment (optional)</label>
                        <input
                          type="file"
                          onChange={(e) => setResponseFile(e.target.files?.[0] ?? null)}
                          className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                        />
                      </div>
                      {responseError && <p className="text-xs text-red-600 mt-2">{responseError}</p>}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={handleSubmitResponse}
                          disabled={submittingResponse || !responseBody.trim()}
                          className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingResponse ? "Sending..." : "Send response"}
                        </button>
                        <button
                          onClick={() => { setShowResponseForm(false); setResponseBody(""); setResponseFile(null); setResponseError(null); }}
                          className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Response rows */}
                  {responses.length === 0 && !showResponseForm && (
                    <p className="px-6 py-6 text-sm text-gray-400">No responses yet.</p>
                  )}
                  {responses.map((resp, idx) => (
                    <div
                      key={resp.id}
                      className={`grid grid-cols-[200px_1fr_220px_130px_40px] gap-4 px-6 py-4 items-start ${idx < responses.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      {/* Author + date */}
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{resp.created_by_name || "—"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(resp.created_at)}</p>
                      </div>

                      {/* Response body */}
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{resp.body}</p>

                      {/* Attachments */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Attachments</p>
                        {(resp.attachments ?? []).length === 0 ? (
                          <p className="text-sm text-gray-400">--</p>
                        ) : (
                          <ul className="space-y-1">
                            {resp.attachments.map((att, i) => <li key={i}><AttachmentLink att={att} /></li>)}
                          </ul>
                        )}
                      </div>

                      {/* Mark Official */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mark Official</p>
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 cursor-pointer" />
                      </div>

                      {/* Delete */}
                      <div className="flex justify-center pt-0.5">
                        <button className="text-gray-300 hover:text-red-500 transition-colors" title="Delete response">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* General Information */}
            <div className="bg-white border border-gray-200 rounded-lg px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">General Information</h2>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</dt>
                  <dd className="mt-0.5 text-gray-900">{formatDate(rfi.due_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</dt>
                  <dd className="mt-0.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${rfi.status === "open" ? "bg-blue-50 text-blue-700" : rfi.status === "closed" ? "bg-gray-100 text-gray-600" : "bg-amber-50 text-amber-700"}`}>
                      {rfi.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">RFI Manager</dt>
                  <dd className="mt-0.5 text-gray-900">{getContactNameById(directory, rfi.rfi_manager_id)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Received From</dt>
                  <dd className="mt-0.5 text-gray-900">{getContactNameById(directory, rfi.received_from_id)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assignees</dt>
                  <dd className="mt-0.5 text-gray-900">{(rfi.assignees ?? []).map((a) => a.name).join(", ") || "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Distribution List</dt>
                  <dd className="mt-0.5 text-gray-900">{(rfi.distribution_list ?? []).map((d) => d.name).join(", ") || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Responsible Contractor</dt>
                  <dd className="mt-0.5 text-gray-900">{getContactNameById(directory, rfi.responsible_contractor_id)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Specification</dt>
                  <dd className="mt-0.5 text-gray-900">{getSpecName(specifications, rfi.specification_id)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Drawing Number</dt>
                  <dd className="mt-0.5 text-gray-900">{rfi.drawing_number || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</dt>
                  <dd className="mt-0.5 text-gray-900">{formatDate(rfi.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ball In Court</dt>
                  <dd className="mt-0.5 text-gray-900">{getContactNameById(directory, rfi.ball_in_court_id)}</dd>
                </div>
              </dl>

              {rfi.status !== "closed" && (() => {
                const ballIsWithAssignee = rfi.ball_in_court_id !== null && rfi.ball_in_court_id !== rfi.rfi_manager_id;
                const targetName = ballIsWithAssignee ? getContactNameById(directory, rfi.rfi_manager_id) : (rfi.assignees[0]?.name ?? "Assignee");
                return (
                  <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleReturnCourt}
                      disabled={returningCourt}
                      className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {returningCourt ? "Updating..." : `Return to ${targetName}'s Court`}
                    </button>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
