"use client";

import { useState, useEffect, useRef } from "react";

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  company_id: string | null;
  company_role: string | null;
  created_at: string;
};

type Company = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
  status: string;
  hasAccess: boolean;
};

type LessonUpload = {
  id: string;
  company_id: string;
  filename: string;
  uploaded_by_name: string;
  uploaded_at: string;
  row_count: number;
  columns: string[];
};

const SUPER_ADMIN_EMAIL = "ptrenda1@gmail.com";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Company Lessons
  const [lessonUploads, setLessonUploads] = useState<LessonUpload[]>([]);
  const [showLessonsUpload, setShowLessonsUpload] = useState(false);
  const [lessonCompanyId, setLessonCompanyId] = useState("");
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [uploadingLesson, setUploadingLesson] = useState(false);
  const [lessonUploadError, setLessonUploadError] = useState("");
  const [lessonUploadSuccess, setLessonUploadSuccess] = useState("");
  const [viewingLesson, setViewingLesson] = useState<{ id: string; filename: string; columns: string[]; rows: Record<string, unknown>[] } | null>(null);
  const [loadingLessonRows, setLoadingLessonRows] = useState(false);
  const lessonFileRef = useRef<HTMLInputElement>(null);

  // Add user modal
  const [showAddUser, setShowAddUser] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCompanyName, setInviteCompanyName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Project access modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [savingProjects, setSavingProjects] = useState(false);

  const [myCompanyId, setMyCompanyId] = useState<string | null>(null);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    if (!res.ok) {
      setError("Unauthorized — admin access only.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  async function loadCompanies() {
    const res = await fetch("/api/admin/invite");
    if (res.ok) {
      const data = await res.json();
      setCompanies(data);
    }
  }

  async function loadLessonUploads() {
    const res = await fetch("/api/admin/company-lessons");
    if (res.ok) {
      const data = await res.json();
      setLessonUploads(data.lessons ?? data);
      setMyCompanyId(data.myCompanyId ?? null);
      if (data.myCompanyId) setLessonCompanyId(data.myCompanyId);
    }
  }

  useEffect(() => {
    loadUsers();
    loadCompanies();
    loadLessonUploads();
  }, []);

  // Optimistic system-role update — reflects in the table immediately
  async function handleRoleChange(id: string, role: string) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    const res = await fetch("/api/admin/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    if (!res.ok) loadUsers(); // revert on error
  }

  // Optimistic company-role update
  async function handleCompanyRoleChange(id: string, company_role: string) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, company_role } : u)));
    const res = await fetch("/api/admin/company-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, company_role }),
    });
    if (!res.ok) loadUsers(); // revert on error
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");

    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, company_name: inviteCompanyName }),
    });

    const data = await res.json().catch(() => ({}));
    setInviting(false);

    if (!res.ok) {
      setInviteError(data.error || `Server error (${res.status})`);
      return;
    }

    setInviteSuccess(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviteCompanyName("");
  }

  async function openUserProjects(user: User) {
    if (!user.company_id) return;
    setSelectedUser(user);
    setLoadingProjects(true);
    setProjects([]);
    const res = await fetch(`/api/admin/users/${user.id}/projects`);
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects || []);
    }
    setLoadingProjects(false);
  }

  function toggleProject(projectId: string) {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, hasAccess: !p.hasAccess } : p))
    );
  }

  async function saveProjectAccess() {
    if (!selectedUser) return;
    setSavingProjects(true);
    const projectIds = projects.filter((p) => p.hasAccess).map((p) => p.id);
    await fetch(`/api/admin/users/${selectedUser.id}/projects`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectIds }),
    });
    setSavingProjects(false);
    setSelectedUser(null);
  }

  async function handleLessonUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonFile || !lessonCompanyId) return;
    setUploadingLesson(true);
    setLessonUploadError("");
    setLessonUploadSuccess("");
    const fd = new FormData();
    fd.append("file", lessonFile);
    fd.append("company_id", lessonCompanyId);
    const res = await fetch("/api/admin/company-lessons", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setUploadingLesson(false);
    if (!res.ok) {
      setLessonUploadError(data.error || `Upload failed (${res.status})`);
      return;
    }
    setLessonUploadSuccess(`Uploaded ${data.row_count} lesson${data.row_count !== 1 ? "s" : ""} successfully.`);
    setLessonFile(null);
    if (lessonFileRef.current) lessonFileRef.current.value = "";
    loadLessonUploads();
  }

  async function openLessonRows(upload: LessonUpload) {
    setLoadingLessonRows(true);
    setViewingLesson({ id: upload.id, filename: upload.filename, columns: upload.columns, rows: [] });
    const res = await fetch(`/api/admin/company-lessons/${upload.id}`);
    if (res.ok) {
      const data = await res.json();
      setViewingLesson({ id: upload.id, filename: upload.filename, columns: data.columns, rows: data.rows });
    }
    setLoadingLessonRows(false);
  }

  async function deleteLesson(id: string) {
    await fetch(`/api/admin/company-lessons/${id}`, { method: "DELETE" });
    loadLessonUploads();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 py-12 sm:py-16 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-10 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage users, roles, and project access.</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => {
              setShowAddUser(true);
              setInviteError("");
              setInviteSuccess("");
              setInviteEmail("");
              setInviteCompanyName(companies[0]?.name ?? "");
            }}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            + Add User
          </button>
          <a href="/dashboard" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
            ← Dashboard
          </a>
        </div>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          All Users ({users.length})
        </h2>
        {users.length === 0 ? (
          <p className="text-sm text-gray-400">No users yet.</p>
        ) : (
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {users.map((user) => (
              <div
                key={user.id}
                className="px-4 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* User info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{user.username}</p>
                      {user.email === SUPER_ADMIN_EMAIL && (
                        <span className="text-xs font-medium px-1.5 py-0.5 bg-gray-900 text-white rounded">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    {user.company_id && (
                      <p className="text-xs text-gray-300 mt-0.5">
                        {companies.find((c) => c.id === user.company_id)?.name ?? "Unknown company"}
                      </p>
                    )}
                  </div>

                  {/* Controls — hidden for super admin */}
                  {user.email !== SUPER_ADMIN_EMAIL && (
                    <div
                      className="flex flex-wrap items-end gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Company role toggle (Member / Admin within their company) */}
                      {user.company_id && (
                        <div>
                          <p className="text-[10px] text-gray-300 mb-0.5">Company</p>
                          <div className="flex items-center bg-gray-100 rounded-md p-0.5">
                            <button
                              onClick={() => handleCompanyRoleChange(user.id, "member")}
                              title="Company member — standard access"
                              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                                user.company_role !== "admin"
                                  ? "bg-white text-gray-900 shadow-sm"
                                  : "text-gray-400 hover:text-gray-600"
                              }`}
                            >
                              Member
                            </button>
                            <button
                              onClick={() => handleCompanyRoleChange(user.id, "admin")}
                              title="Company admin — can manage members and projects"
                              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                                user.company_role === "admin"
                                  ? "bg-white text-gray-900 shadow-sm"
                                  : "text-gray-400 hover:text-gray-600"
                              }`}
                            >
                              Admin
                            </button>
                          </div>
                        </div>
                      )}

                      {/* System role toggle (User / System Admin) */}
                      <div>
                        <p className="text-[10px] text-gray-300 mb-0.5">System</p>
                        <div className="flex items-center bg-gray-100 rounded-md p-0.5">
                          <button
                            onClick={() => handleRoleChange(user.id, "user")}
                            title="Regular user"
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                              user.role !== "admin"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            User
                          </button>
                          <button
                            onClick={() => handleRoleChange(user.id, "admin")}
                            title="System admin — full access across all companies"
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                              user.role === "admin"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            Admin
                          </button>
                        </div>
                      </div>

                      {/* Projects button — only for users with a company */}
                      {user.company_id && (
                        <div>
                          <p className="text-[10px] text-gray-300 mb-0.5">&nbsp;</p>
                          <button
                            onClick={() => openUserProjects(user)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            Projects
                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 text-xs text-gray-400">
        Note: users must log out and back in for role changes to take effect on their session.
      </p>

      {/* Company Lessons */}
      <section className="mt-14">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Company Lessons
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Upload Excel files of lessons learned per company.</p>
          </div>
          <button
            onClick={() => {
              setShowLessonsUpload((v) => !v);
              setLessonUploadError("");
              setLessonUploadSuccess("");
              setLessonCompanyId(companies[0]?.id ?? "");
            }}
            className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            + Upload Lessons
          </button>
        </div>

        {showLessonsUpload && (
          <form onSubmit={handleLessonUpload} className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
            {!myCompanyId && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                <select
                  required
                  value={lessonCompanyId}
                  onChange={(e) => setLessonCompanyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">Select a company…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Excel File (.xlsx, .xls, .csv)</label>
              <input
                ref={lessonFileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                required
                onChange={(e) => setLessonFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300"
              />
            </div>
            {lessonUploadError && <p className="text-xs text-red-600">{lessonUploadError}</p>}
            {lessonUploadSuccess && <p className="text-xs text-green-600">{lessonUploadSuccess}</p>}
            <button
              type="submit"
              disabled={uploadingLesson || !lessonFile || (!myCompanyId && !lessonCompanyId)}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {uploadingLesson ? "Uploading…" : "Upload"}
            </button>
          </form>
        )}

        {lessonUploads.length === 0 ? (
          <p className="text-sm text-gray-400">No lesson files uploaded yet.</p>
        ) : (
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {lessonUploads.map((upload) => {
              const company = companies.find((c) => c.id === upload.company_id);
              return (
                <div
                  key={upload.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{upload.filename}</p>
                    <p className="text-xs text-gray-400">
                      {company?.name ?? "Unknown company"} · {upload.row_count} row{upload.row_count !== 1 ? "s" : ""} · Uploaded by {upload.uploaded_by_name} · {new Date(upload.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openLessonRows(upload)}
                      className="text-xs text-gray-500 hover:text-gray-900 px-2.5 py-1 border border-gray-200 rounded-md transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => deleteLesson(upload.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2.5 py-1 border border-red-100 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Add a user</h2>
            <p className="text-sm text-gray-500 mb-4">
              We&apos;ll send them an invite link to create their account.
            </p>
            <form onSubmit={handleInvite} className="space-y-3">
              <input
                type="email"
                required
                autoFocus
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@company.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <input
                type="text"
                required
                list="company-list"
                value={inviteCompanyName}
                onChange={(e) => setInviteCompanyName(e.target.value)}
                placeholder="Company name (type existing or create new)"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <datalist id="company-list">
                {companies.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}
              {inviteSuccess && <p className="text-xs text-green-600">{inviteSuccess}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {inviting ? "Sending..." : "Send invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Rows Modal */}
      {viewingLesson && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{viewingLesson.filename}</h2>
                <p className="text-xs text-gray-400">{viewingLesson.rows.length} row{viewingLesson.rows.length !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={() => setViewingLesson(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-auto flex-1">
              {loadingLessonRows ? (
                <div className="flex items-center justify-center h-40">
                  <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                </div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      {viewingLesson.columns.map((col) => (
                        <th key={col} className="text-left px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap text-xs">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewingLesson.rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        {viewingLesson.columns.map((col) => (
                          <td key={col} className="px-4 py-2.5 text-gray-700 text-xs max-w-xs">
                            <span className="line-clamp-2" title={String(row[col] ?? "")}>
                              {String(row[col] ?? "")}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Access Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Project Access</h2>
                <p className="text-sm text-gray-500">{selectedUser.username}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              {loadingProjects ? (
                <p className="text-sm text-gray-400 py-4 text-center">Loading projects...</p>
              ) : projects.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No projects for this company yet.</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
                  {projects.map((project) => (
                    <label
                      key={project.id}
                      className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={project.hasAccess}
                        onChange={() => toggleProject(project.id)}
                        className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                      />
                      <span className="text-sm text-gray-900 flex-1">{project.name}</span>
                      <span className="text-xs text-gray-400 capitalize">{project.status}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProjectAccess}
                  disabled={savingProjects || loadingProjects}
                  className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {savingProjects ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
