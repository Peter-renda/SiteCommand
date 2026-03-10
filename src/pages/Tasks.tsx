import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";
export default function Tasks() {
  const { id } = useParams();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("open");
  const [category, setCategory] = useState("Construction");
  async function loadTasks() {
    const res = await fetch(`/api/projects/${id}/tasks`);
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }
  useEffect(() => {
    loadTasks();
  }, [id]);
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/projects/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status, category }),
    });
    if (res.ok) {
      loadTasks();
      setShowModal(false);
      setTitle(""); setStatus("open"); setCategory("Construction");
    }
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={id!} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            New Task
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 text-gray-400 font-mono">{t.task_number}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{t.title}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium capitalize">{t.status}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{t.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Task</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                    <option value="open">Open</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                    <option value="Construction">Construction</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Design">Design</option>
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
