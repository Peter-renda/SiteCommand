import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => navigate("/dashboard"));
  }, [navigate]);
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">SiteCommand Admin</span>
        <button onClick={() => navigate("/dashboard")} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Back to Dashboard</button>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">System Users</h1>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Username</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Company ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 text-gray-900 font-medium">{u.username}</td>
                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 text-gray-500 capitalize">{u.role}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{u.company_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
