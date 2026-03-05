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

  return (
    <div className="min-h-screen bg-white px-6 py-16 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage user roles and company affiliations.</p>
        </div>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
          ← Dashboard
        </a>
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
              <div key={user.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
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
                    <p className="text-xs text-gray-300 mt-0.5">Company: {user.company_id}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
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
