import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";
export default function PunchList() {
  const { id } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/projects/${id}/punch-list`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  }, [id]);
  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={id!} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Punch List</h1>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-6 py-4 text-gray-400 font-mono">{i.item_number}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{i.title}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium capitalize">{i.status}</span>
                    </td>
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
