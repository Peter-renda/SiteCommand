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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

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

    setInviteSuccess(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");

    // Refresh invites
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
    }
  }

  const seatCount = members.length;
  const seatLimit = company?.seat_limit ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">SiteCommand</span>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
          ← Dashboard
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
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

        {/* Invite form */}
        <div className="bg-white rounded-xl border border-gray-100 px-6 py-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Invite a team member</h2>
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {inviting ? "Sending..." : "Send invite"}
            </button>
          </form>
          {inviteError && <p className="text-xs text-red-600 mt-2">{inviteError}</p>}
          {inviteSuccess && <p className="text-xs text-green-600 mt-2">{inviteSuccess}</p>}
        </div>

        {/* Pending invites */}
        {invites.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 px-6 py-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Pending invitations</h2>
            <div className="space-y-2">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-900">{invite.email}</p>
                    <p className="text-xs text-gray-400">
                      Expires {new Date(invite.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeInvite(invite.id)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members list */}
        <div className="bg-white rounded-xl border border-gray-100 px-6 py-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Members ({members.length})</h2>
          {members.length === 0 ? (
            <p className="text-sm text-gray-400">No members yet.</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{member.username}</p>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        member.company_role === "admin"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-gray-50 text-gray-400"
                      }`}>
                        {member.company_role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{member.email}</p>
                  </div>
                  {member.id !== currentUserId && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
