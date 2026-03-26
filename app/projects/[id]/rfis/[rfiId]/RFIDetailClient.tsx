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
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
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
  const [responseBody, setResponseBody] = useState("");
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [returningCourt, setReturningCourt] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);

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

  const canEdit = rfi && rfi.created_by === userId;

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
    // Responses are newest-first; prepend new response
    setResponses((prev) => [newResp, ...prev]);
    setResponseBody("");
    setResponseFile(null);
    setShowResponseForm(false);
    setSubmittingResponse(false);
  }

  async function handleReturnCourt() {
    if (!rfi) return;
    setReturningCourt(true);
    // Determine who to pass the ball to
    const ballIsWithAssignee = rfi.ball_in_court_id !== null && rfi.ball_in_court_id !== rfi.rfi_manager_id;
    const newBallInCourtId = ballIsWithAssignee ? rfi.rfi_manager_id : (rfi.assignees[0]?.id ?? null);
    const res = await fetch(`/api/projects/${projectId}/rfis/${rfiId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ball_in_court_id: newBallInCourtId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRfi(updated);
    }
    setReturningCourt(false);
  }

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

  if (notFound || !rfi) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
          <a href="/dashboard" className="text-sm font-semibold text-gray-900">SiteCommand</a>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8"><p className="text-sm text-gray-500">RFI not found.</p></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">SiteCommand</a>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <a href={`/projects/${projectId}/rfis`} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            All RFIs
          </a>
          {canEdit && (
            <a href={`/projects/${projectId}/rfis/${rfi.id}`} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Edit</a>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">RFI #{rfi.rfi_number}</p>
            <h1 className="text-xl font-semibold text-gray-900">{rfi.subject || "No subject"}</h1>
          </div>

          {/* Request: Question + Attachments side by side */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Request</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Question</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{rfi.question || "—"}</p>
              </div>
              <div className="md:min-w-[200px]">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Attachments</p>
                {(rfi.attachments ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400">—</p>
                ) : (
                  <ul className="space-y-2">
                    {rfi.attachments.map((att, i) => (
                      <li key={i}>
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <span className="truncate max-w-[160px]">{att.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <Section
            title="Responses"
            action={
              <button
                onClick={() => setShowResponseForm((v) => !v)}
                className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors"
                title="Add response"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            }
          >
            {showResponseForm && (
              <div className={`${responses.length > 0 ? "mb-4 pb-4 border-b border-gray-100" : ""}`}>
                <label className="block text-xs font-medium text-gray-500 mb-1">Add response</label>
                <textarea value={responseBody} onChange={(e) => setResponseBody(e.target.value)} rows={3} placeholder="Write your response..." className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Attachment (optional)</label>
                  <input
                    type="file"
                    onChange={(e) => setResponseFile(e.target.files?.[0] ?? null)}
                    className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {responseFile && <p className="text-xs text-gray-400 mt-1">{responseFile.name}</p>}
                </div>
                {responseError && <p className="text-xs text-red-600 mt-2">{responseError}</p>}
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={handleSubmitResponse} disabled={submittingResponse || !responseBody.trim()} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {submittingResponse ? "Sending..." : "Send response"}
                  </button>
                  <button onClick={() => { setShowResponseForm(false); setResponseBody(""); setResponseFile(null); setResponseError(null); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {responses.length === 0 && !showResponseForm && <p className="text-sm text-gray-400">No responses yet.</p>}
            <div className="space-y-4">
              {responses.map((resp) => (
                <div key={resp.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 pl-4 border-l-2 border-gray-200">
                  <div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{resp.body}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {resp.created_by_name && <span className="font-medium text-gray-500">{resp.created_by_name} &middot; </span>}
                      {formatDateTime(resp.created_at)}
                    </p>
                  </div>
                  {(resp.attachments ?? []).length > 0 && (
                    <div className="md:min-w-[160px]">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Attachments</p>
                      <ul className="space-y-1">
                        {resp.attachments.map((att, i) => (
                          <li key={i}>
                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              <span className="truncate max-w-[140px]">{att.name}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="General Information">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</dt>
                <dd className="mt-0.5 text-gray-900">{formatDate(rfi.due_date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</dt>
                <dd className="mt-0.5"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${rfi.status === "open" ? "bg-blue-50 text-blue-700" : rfi.status === "closed" ? "bg-gray-100 text-gray-600" : "bg-amber-50 text-amber-700"}`}>{rfi.status}</span></dd>
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
          </Section>
        </div>

        {/* Return to court button */}
        {rfi.status !== "closed" && (() => {
          const ballIsWithAssignee = rfi.ball_in_court_id !== null && rfi.ball_in_court_id !== rfi.rfi_manager_id;
          const rfiManagerName = getContactNameById(directory, rfi.rfi_manager_id);
          const firstAssigneeName = rfi.assignees[0]?.name ?? "Assignee";
          const targetName = ballIsWithAssignee ? rfiManagerName : firstAssigneeName;
          const label = `Return to ${targetName}'s Court`;
          return (
            <div className="flex justify-end mt-6">
              <button
                onClick={handleReturnCourt}
                disabled={returningCourt}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {returningCourt ? "Updating..." : label}
              </button>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
