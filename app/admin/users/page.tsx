"use client";

import { useEffect, useState, useCallback } from "react";

type User = {
  id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  company_id: string | null;
  company_role: string | null;
  user_type: string;
  created_at: string;
  companies: { id: string; name: string; subscription_plan: string | null; subscription_status: string | null } | null;
};

const ROLES = ["user", "contractor", "site_admin"];
const COMPANY_ROLES = ["member", "admin", "super_admin"];
const USER_TYPES = ["internal", "external", "demo"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("q", search);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.users) {
          setUsers(d.users);
          setTotal(d.total);
        } else {
          setError(d.error ?? "Failed to load");
        }
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function startEdit(user: User) {
    setEditing(user.id);
    setEditValues({
      role: user.role,
      company_role: user.company_role ?? "member",
      user_type: user.user_type,
    });
    setSaveError("");
  }

  async function saveEdit(userId: string) {
    setSaving(true);
    setSaveError("");
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editValues),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setSaveError(data.error ?? "Failed to save");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data } : u)));
    setEditing(null);
  }

  async function deleteUser(userId: string) {
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setTotal((t) => t - 1);
    }
    setConfirmDelete(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-6">Users</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search by name, email, or username…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 max-w-sm px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg"
          >
            Clear
          </button>
        )}
      </form>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-300">
            {total} user{total !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2 py-1 bg-gray-800 rounded disabled:opacity-40 hover:bg-gray-700"
              >
                ←
              </button>
              <span>Page {page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 bg-gray-800 rounded disabled:opacity-40 hover:bg-gray-700"
              >
                →
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <p className="px-4 py-8 text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="px-4 py-8 text-sm text-red-400">{error}</p>
        ) : users.length === 0 ? (
          <p className="px-4 py-8 text-sm text-gray-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">User</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Company</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Role</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Org Role</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Type</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Joined</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isEditing = editing === u.id;
                  const isConfirmingDelete = confirmDelete === u.id;
                  return (
                    <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">
                          {u.first_name || u.last_name
                            ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                            : u.username}
                        </div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        {u.companies?.name ?? <span className="text-gray-600">—</span>}
                        {u.companies?.subscription_plan && (
                          <div className="text-gray-500">{u.companies.subscription_plan}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
                            value={editValues.role ?? "user"}
                            onChange={(e) => setEditValues((v) => ({ ...v, role: e.target.value }))}
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span className={`text-xs ${u.role === "site_admin" ? "text-indigo-300 font-semibold" : "text-gray-300"}`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
                            value={editValues.company_role ?? "member"}
                            onChange={(e) => setEditValues((v) => ({ ...v, company_role: e.target.value }))}
                          >
                            {COMPANY_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span className="text-gray-300 text-xs">{u.company_role ?? "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
                            value={editValues.user_type ?? "internal"}
                            onChange={(e) => setEditValues((v) => ({ ...v, user_type: e.target.value }))}
                          >
                            {USER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : (
                          <span className="text-gray-400 text-xs">{u.user_type}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-400">Delete?</span>
                            <button
                              onClick={() => deleteUser(u.id)}
                              disabled={deleting}
                              className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                            >
                              No
                            </button>
                          </div>
                        ) : isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEdit(u.id)}
                              disabled={saving}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded disabled:opacity-50"
                            >
                              {saving ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                            >
                              Cancel
                            </button>
                            {saveError && <span className="text-xs text-red-400">{saveError}</span>}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(u)}
                              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete(u.id)}
                              className="px-3 py-1 bg-red-900/50 hover:bg-red-800/60 text-red-400 text-xs rounded"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
