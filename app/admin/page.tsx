"use client";

import { useState, useEffect } from "react";

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

const SUPER_ADMIN_EMAIL = "ptrenda1@gmail.com";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add user modal
  const [showAddUser, setShowAddUser] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCompanyId, setInviteCompanyId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Project access modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [savingProjects, setSavingProjects] = useState(false);

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

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  async function handleRoleChange(id: string, role: string) {
    const res = await fetch("/api/admin/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    if (res.ok) loadUsers();
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");

    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, company_id: inviteCompanyId }),
    });

    const data = await res.json();
    setInviting(false);

    if (!res.ok) {
      setInviteError(data.error || "Failed to send invitation");
      return;
    }

    setInviteSuccess(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviteCompanyId("");
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
    <div className="min-h-screen bg-white px-6 py-16 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage users, roles, and project access.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setShowAddUser(true);
              setInviteError("");
              setInviteSuccess("");
              setInviteEmail("");
              setInviteCompanyId(companies[0]?.id ?? "");
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
                className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 transition-colors ${
                  user.company_id ? "hover:bg-gray-50 cursor-pointer" : ""
                }`}
                onClick={() => openUserProjects(user)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                    {user.email === SUPER_ADMIN_EMAIL && (
                      <span className="text-xs font-medium px-1.5 py-0.5 bg-gray-900 text-white rounded">
                        Owner
                      </span>
                    )}
                    {user.company_role && (
                      <span className="text-xs font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {user.company_role}
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
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  {user.email !== SUPER_ADMIN_EMAIL && (
                    <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
                      <button
                        onClick={() => handleRoleChange(user.id, "user")}
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
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                          user.role === "admin"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                  )}
                  {user.company_id && (
                    <svg
                      className="w-4 h-4 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-8 text-xs text-gray-400">
        Note: users must log out and back in for role changes to take effect.
      </p>

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
                  required
                  value={inviteCompanyId}
                  onChange={(e) => setInviteCompanyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  <option value="">Select company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-600">No companies found. Have users sign up first.</p>
              )}
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

      {/* Project Access Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-0.5">Project Access</h2>
            <p className="text-sm text-gray-500 mb-4">{selectedUser.username}</p>
            {loadingProjects ? (
              <p className="text-sm text-gray-400 py-4 text-center">Loading projects...</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No projects for this company yet.</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto mb-4">
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
                    <span className="text-sm text-gray-900">{project.name}</span>
                    <span className="text-xs text-gray-400 ml-auto capitalize">{project.status}</span>
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
      )}
    </div>
  );
}
