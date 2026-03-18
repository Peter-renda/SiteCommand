"use client";

import { useState, useEffect, useRef } from "react";

type User = {
  id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
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

type ProjectMember = {
  id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  role: string;
};

type ProjectWithUsers = {
  id: string;
  name: string;
  status: string;
  company_id: string | null;
  members: ProjectMember[];
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

function displayName(u: { first_name?: string | null; last_name?: string | null; username: string }) {
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ");
  return full || u.username;
}

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
  const [inviteCompanyId, setInviteCompanyId] = useState("");
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

  // Projects with users
  const [projectsWithUsers, setProjectsWithUsers] = useState<ProjectWithUsers[]>([]);

  // New Project modal
  type CompanyUser = { id: string; username: string; first_name?: string | null; last_name?: string | null; email: string };
  const [showNewProject, setShowNewProject] = useState(false);
  const [npCompanyId, setNpCompanyId] = useState("");
  const [npName, setNpName] = useState("");
  const [npProjectNumber, setNpProjectNumber] = useState("");
  const [npSector, setNpSector] = useState("");
  const [npAddress, setNpAddress] = useState("");
  const [npCity, setNpCity] = useState("");
  const [npState, setNpState] = useState("");
  const [npZip, setNpZip] = useState("");
  const [npCounty, setNpCounty] = useState("");
  const [npDescription, setNpDescription] = useState("");
  const [npValue, setNpValue] = useState("");
  const [npStatus, setNpStatus] = useState("bidding");
  const [npMembers, setNpMembers] = useState<CompanyUser[]>([]);
  const [npCompanyUsers, setNpCompanyUsers] = useState<CompanyUser[]>([]);
  const [npSaving, setNpSaving] = useState(false);
  const [npError, setNpError] = useState("");
  const [npMemberSearch, setNpMemberSearch] = useState("");
  const [npMemberOpen, setNpMemberOpen] = useState(false);
  const npMemberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (npMemberRef.current && !npMemberRef.current.contains(e.target as Node)) setNpMemberOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function onNpCompanyChange(companyId: string) {
    setNpCompanyId(companyId);
    setNpMembers([]);
    setNpCompanyUsers([]);
    if (!companyId) return;
    const res = await fetch(`/api/users?company_id=${companyId}`);
    if (res.ok) setNpCompanyUsers(await res.json());
  }

  function openNewProject() {
    setNpCompanyId(companies[0]?.id ?? "");
    setNpName(""); setNpProjectNumber(""); setNpSector("");
    setNpAddress(""); setNpCity(""); setNpState(""); setNpZip(""); setNpCounty("");
    setNpDescription(""); setNpValue(""); setNpStatus("bidding");
    setNpMembers([]); setNpCompanyUsers([]); setNpError("");
    setShowNewProject(true);
    if (companies[0]?.id) onNpCompanyChange(companies[0].id);
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setNpSaving(true);
    setNpError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: npName, project_number: npProjectNumber, sector: npSector,
        address: npAddress, city: npCity, state: npState, zip_code: npZip, county: npCounty,
        description: npDescription, value: npValue, status: npStatus,
        company_id: npCompanyId || null,
        memberIds: npMembers.map((m) => m.id),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setNpSaving(false);
    if (!res.ok) { setNpError(data.error || "Failed to create project"); return; }
    setShowNewProject(false);
    loadProjectsWithUsers();
  }

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

  async function loadProjectsWithUsers() {
    const res = await fetch("/api/projects");
    if (!res.ok) return;
    const allProjects: Array<{ id: string; name: string; status: string; company_id: string | null }> = await res.json();
    // Fetch members for each project in parallel
    const projectsData = await Promise.all(
      allProjects.map(async (p) => {
        const membRes = await fetch(`/api/projects/${p.id}/members`);
        const memberships = membRes.ok ? await membRes.json() : [];
        const members: ProjectMember[] = (memberships as Array<{ role: string; users: { id: string; username: string; first_name?: string | null; last_name?: string | null; email: string } | null }>)
          .filter((m) => m.users)
          .map((m) => ({
            id: m.users!.id,
            username: m.users!.username,
            first_name: m.users!.first_name,
            last_name: m.users!.last_name,
            email: m.users!.email,
            role: m.role,
          }));
        return { id: p.id, name: p.name, status: p.status, company_id: p.company_id, members };
      })
    );
    setProjectsWithUsers(projectsData);
  }

  useEffect(() => {
    loadUsers();
    loadCompanies();
    loadLessonUploads();
    loadProjectsWithUsers();
  }, []);

  // If companies finish loading while the Add User modal is already open, auto-select the first one
  useEffect(() => {
    if (showAddUser && !inviteCompanyId && companies.length > 0) {
      setInviteCompanyId(companies[0].id);
    }
  }, [companies, showAddUser, inviteCompanyId]);

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
    setInviteError("");
    setInviteSuccess("");

    const resolvedCompanyId = inviteCompanyId || companies[0]?.id || "";

    setInviting(true);

    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        company_id: resolvedCompanyId || undefined,
        company_name: resolvedCompanyId ? undefined : inviteCompanyName.trim() || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setInviting(false);

    if (!res.ok) {
      setInviteError(data.error || `Server error (${res.status})`);
      return;
    }

    setInviteSuccess(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
  }

  async function openUserProjects(user: User) {
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
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openNewProject}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            + New Project
          </button>
          <button
            onClick={() => {
              setShowAddUser(true);
              setInviteError("");
              setInviteSuccess("");
              setInviteEmail("");
              setInviteCompanyId(companies[0]?.id ?? "");
            }}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
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
                      <p className="text-sm font-medium text-gray-900">
                        {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}
                      </p>
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

      {/* Projects */}
      <section className="mt-14">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              All Projects ({projectsWithUsers.length})
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Projects and their assigned members.</p>
          </div>
        </div>
        {projectsWithUsers.length === 0 ? (
          <p className="text-sm text-gray-400">No projects yet.</p>
        ) : (
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {projectsWithUsers.map((project) => {
              const company = companies.find((c) => c.id === project.company_id);
              return (
                <div key={project.id} className="px-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/projects/${project.id}/admin`}
                          className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
                        >
                          {project.name}
                        </a>
                        <span className="text-xs text-gray-400 capitalize">{project.status}</span>
                      </div>
                      {company && (
                        <p className="text-xs text-gray-300 mt-0.5">{company.name}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {project.members.length === 0 ? (
                        <p className="text-xs text-gray-300">No members</p>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-1 max-w-xs">
                          {project.members.map((m) => (
                            <span
                              key={m.id}
                              title={`${m.email} (${m.role})`}
                              className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5"
                            >
                              {displayName(m)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
              {companies.length > 0 ? (
                <select
                  value={inviteCompanyId}
                  onChange={(e) => setInviteCompanyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={inviteCompanyName}
                  onChange={(e) => setInviteCompanyName(e.target.value)}
                  placeholder="Company name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              )}
              {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}
              {inviteSuccess && <p className="text-xs text-green-600">{inviteSuccess}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAddUser(false); setInviteCompanyName(""); }}
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

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl flex flex-col max-h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-sm font-semibold text-gray-900">New Project</h2>
              <button onClick={() => setShowNewProject(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="px-6 py-5 space-y-6 overflow-y-auto">

              {/* Company */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                <select
                  required
                  value={npCompanyId}
                  onChange={(e) => onNpCompanyChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">Select a company…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* General Info */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">General Information</p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text" required value={npName} onChange={(e) => setNpName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="e.g. 123 Main St Renovation"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Project Number <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="text" value={npProjectNumber} onChange={(e) => setNpProjectNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="e.g. 2024-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={npStatus} onChange={(e) => setNpStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="bidding">Bidding</option>
                      <option value="pre-construction">Pre-Construction</option>
                      <option value="course of construction">Course of Construction</option>
                      <option value="post-construction">Post-Construction</option>
                      <option value="warranty">Warranty</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sector <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="text" value={npSector} onChange={(e) => setNpSector(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="e.g. Commercial"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Value ($)</label>
                    <input
                      type="number" min="0" step="0.01" value={npValue} onChange={(e) => setNpValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    rows={2} value={npDescription} onChange={(e) => setNpDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                    placeholder="Brief description..."
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Location</p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="text" value={npAddress} onChange={(e) => setNpAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="text" value={npCity} onChange={(e) => setNpCity(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="City" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="text" value={npState} onChange={(e) => setNpState(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="State" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ZIP Code <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="text" value={npZip} onChange={(e) => setNpZip(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="e.g. 10001" maxLength={5} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">County <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="text" value={npCounty} onChange={(e) => setNpCounty(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="County" />
                  </div>
                </div>
              </div>

              {/* Team */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Team</p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project Members <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div ref={npMemberRef} className="relative">
                    {npMembers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {npMembers.map((u) => (
                          <span key={u.id} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-gray-100 text-xs text-gray-700 rounded-full">
                            {displayName(u)}
                            <button type="button" onClick={() => setNpMembers((p) => p.filter((m) => m.id !== u.id))} className="text-gray-400 hover:text-gray-700 ml-0.5">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      value={npMemberSearch}
                      onChange={(e) => { setNpMemberSearch(e.target.value); setNpMemberOpen(true); }}
                      onFocus={() => setNpMemberOpen(true)}
                      placeholder={npCompanyId ? "Search by name or email..." : "Select a company first"}
                      disabled={!npCompanyId}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    {npMemberOpen && npCompanyId && (() => {
                      const filtered = npCompanyUsers.filter(
                        (u) => !npMembers.find((m) => m.id === u.id) &&
                          (displayName(u).toLowerCase().includes(npMemberSearch.toLowerCase()) ||
                           u.email.toLowerCase().includes(npMemberSearch.toLowerCase()))
                      );
                      return filtered.length > 0 ? (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg max-h-40 overflow-y-auto z-20">
                          {filtered.map((u) => (
                            <button key={u.id} type="button" onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { setNpMembers((p) => [...p, u]); setNpMemberSearch(""); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                                {displayName(u)[0].toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">{displayName(u)}</span>
                              <span className="text-gray-400 text-xs">{u.email}</span>
                            </button>
                          ))}
                        </div>
                      ) : npMemberSearch ? (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg px-3 py-2 z-20">
                          <p className="text-xs text-gray-400">No matching team members</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>

              {npError && <p className="text-sm text-red-600">{npError}</p>}

              <div className="flex gap-3 pt-1 pb-1">
                <button type="button" onClick={() => setShowNewProject(false)} className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={npSaving} className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50">
                  {npSaving ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
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
                <p className="text-sm text-gray-500">{displayName(selectedUser)}</p>
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
