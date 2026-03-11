import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
type Project = {
  id: string;
  name: string;
  description: string;
  address: string;
  value: number;
  status: string;
  created_at: string;
};
export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("bidding");
  const navigate = useNavigate();
  async function loadProjects() {
    const res = await fetch("/api/projects");
    if (res.status === 401) {
      navigate("/login");
      return;
    }
    const data = await res.json();
    setProjects(Array.isArray(data) ? data : []);
    setLoading(false);
  }
  useEffect(() => {
    loadProjects();
  }, []);
  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, address, value, status }),
    });
    if (res.ok) {
      loadProjects();
      setShowModal(false);
      setName(""); setDescription(""); setAddress(""); setValue(""); setStatus("bidding");
    }
  }
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">SiteCommand</span>
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            New Project
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-16 text-center">
            <p className="text-sm text-gray-400">No projects yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="bg-white border border-gray-100 rounded-xl px-5 py-4 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">{p.name}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full capitalize">{p.status}</span>
                </div>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{p.description}</p>
                <div className="flex items-end justify-between">
                  <p className="text-lg font-semibold text-gray-900">${(p.value || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Value ($)</label>
                  <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                    <option value="bidding">Bidding</option>
                    <option value="pre-construction">Pre-Construction</option>
                    <option value="course of construction">Course of Construction</option>
                    <option value="post-construction">Post-Construction</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
