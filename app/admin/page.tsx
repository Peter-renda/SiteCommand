"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  username: string;
  email: string;
  approved: boolean;
  role: string;
  created_at: string;
};

const SUPER_ADMIN_EMAIL = "ptrenda1@gmail.com";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => { loadUsers(); }, []);

  async function handleApproval(id: string, approved: boolean) {
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approved }),
    });
    loadUsers();
  }

  async function handleRoleChange(id: string, role: string) {
    const res = await fetch("/api/admin/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    if (res.ok) loadUsers();
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

  const pending = users.filter((u) => !u.approved);
  const approved = users.filter((u) => u.approved);

  return (
    <div className="min-h-screen bg-white px-6 py-16 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-400 mt-1">Approve users and manage roles.</p>
        </div>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
          ← Dashboard
        </a>
      </div>

      {/* Pending Approval */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Pending Approval ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400">No pending users.</p>
        ) : (
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {pending.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproval(user.id, true)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproval(user.id, false)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Users */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Active Users ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <p className="text-sm text-gray-400">No approved users yet.</p>
        ) : (
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {approved.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                    {user.email === SUPER_ADMIN_EMAIL && (
                      <span className="text-xs font-medium px-1.5 py-0.5 bg-gray-900 text-white rounded">
                        Owner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Role toggle */}
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
                  {/* Revoke access */}
                  {user.email !== SUPER_ADMIN_EMAIL && (
                    <button
                      onClick={() => handleApproval(user.id, false)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-100 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Revoke
                    </button>
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
    </div>
  );
}
