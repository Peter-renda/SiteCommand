"use client";

import { useState } from "react";

type Member = {
  id: string;
  username: string;
  email: string;
  company_role: string;
  created_at: string;
};

type Invite = {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
};

type Company = {
  id: string;
  name: string;
  subscription_plan: string | null;
  subscription_status: string;
  seat_limit: number;
} | null;

type Project = {
  id: string;
  name: string;
  status: string;
  hasAccess: boolean;
};

export default function CompanyClient({
  company,
  members: initialMembers,
  invites: initialInvites,
  currentUserId,
}: {
  company: Company;
  members: Member[];
  invites: Invite[];
  currentUserId: string;
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [invites, setInvites] = useState<Invite[]>(initialInvites);

  // Add user modal
  const [showAddUser, setShowAddUser] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Project access modal
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [savingProjects, setSavingProjects] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");

    const res = await fetch("/api/company/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });

    const data = await res.json();
    setInviting(false);

    if (!res.ok) {
      setInviteError(data.error || "Failed to send invitation");
      return;
    }

    setInviteEmail("");
    setShowAddUser(false);

    const res2 = await fetch("/api/company/invites");
    if (res2.ok) {
      const newInvites = await res2.json();
      setInvites(newInvites);
    }
  }

  async function handleRevokeInvite(id: string) {
    const res = await fetch(`/api/company/invites/${id}`, { method: "DELETE" });
    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.id !== id));
    }
  }

  async function handleRemoveMember(userId: string) {
    const res = await fetch(`/api/company/members/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      if (selectedMember?.id === userId) setSelectedMember(null);
    }
  }

  async function openMemberProjects(member: Member) {
    setSelectedMember(member);
    setLoadingProjects(true);
    setProjects([]);
    const res = await fetch(`/api/company/members/${member.id}/projects`);
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
    if (!selectedMember) return;
    setSavingProjects(true);
    const projectIds = projects.filter((p) => p.hasAccess).map((p) => p.id);
    await fetch(`/api/company/members/${selectedMember.id}/projects`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectIds }),
    });
    setSavingProjects(false);
    setSelectedMember(null);
  }

  const seatCount = members.length;
  const seatLimit = company?.seat_limit ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">SiteCommand</span>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
          ← Dashboard
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">{company?.name ?? "Team"}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500 capitalize">
              {company?.subscription_plan ?? "No plan"} plan
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">
              {seatCount} / {seatLimit} seats used
            </span>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-xl border border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">User Management</h2>
            <button
              onClick={() => {
                setShowAddUser(true);
                setInviteError("");
                setInviteSuccess("");
                setInviteEmail("");
              }}
              className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              + Add User
            </button>
          </div>

          {members.length === 0 ? (
            <p className="text-sm text-gray-400">No members yet.</p>
          ) : (
            <div className="space-y-1">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => openMemberProjects(member)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{member.username}</p>
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          member.company_role === "admin"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-gray-50 text-gray-400"
                        }`}
                      >
                        {member.company_role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {member.id !== currentUserId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMember(member.id);
                        }}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                    <svg
                      className="w-4 h-4 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending invitations */}
          {invites.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Pending invitations
              </p>
              <div className="space-y-1">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between py-2 px-3"
                  >
                    <div>
                      <p className="text-sm text-gray-500">{invite.email}</p>
                      <p className="text-xs text-gray-300">
                        Expires{" "}
                        {new Date(invite.expires_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeInvite(invite.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

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
                placeholder="colleague@company.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
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
      {selectedMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-0.5">Project Access</h2>
            <p className="text-sm text-gray-500 mb-4">{selectedMember.username}</p>
            {loadingProjects ? (
              <p className="text-sm text-gray-400 py-4 text-center">Loading projects...</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No projects yet.</p>
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
                onClick={() => setSelectedMember(null)}
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
