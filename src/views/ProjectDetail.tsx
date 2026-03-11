import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";
type Project = {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  value: number;
  status: string;
  created_at: string;
  members: { id: string; username: string; email: string }[];
};
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProject(data);
        setLoading(false);
      });
  }, [id]);
  if (loading) return <div className="p-10 text-gray-400">Loading...</div>;
  if (!project) return <div className="p-10 text-gray-500">Project not found.</div>;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">SiteCommand</span>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Back to Dashboard</button>
        </div>
      </header>
      <ProjectNav projectId={project.id} showBackToProject={false} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white border border-gray-100 rounded-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-500 max-w-2xl">{project.description}</p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium capitalize">{project.status}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-50 pt-8">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Location</h3>
              <p className="text-sm text-gray-700">{project.address}</p>
              <p className="text-sm text-gray-700">{project.city}, {project.state} {project.zip_code}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Details</h3>
              <p className="text-sm text-gray-700"><span className="font-medium">Value:</span> ${(project.value || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-700"><span className="font-medium">Created:</span> {new Date(project.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Team</h3>
              <div className="flex -space-x-2">
                {project.members?.map((m) => (
                  <div key={m.id} title={m.username} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-semibold text-gray-600">
                    {m.username[0].toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Daily Log", slug: "daily-log", icon: "📋" },
            { name: "Directory", slug: "directory", icon: "📇" },
            { name: "Tasks", slug: "tasks", icon: "✅" },
            { name: "RFIs", slug: "rfis", icon: "❓" },
            { name: "Submittals", slug: "submittals", icon: "📑" },
            { name: "Punch List", slug: "punch-list", icon: "📝" },
            { name: "Schedule", slug: "schedule", icon: "📅" },
            { name: "Photos", slug: "photos", icon: "📷" },
            { name: "Drawings", slug: "drawings", icon: "📐" },
          ].map((tool) => (
            <button
              key={tool.slug}
              onClick={() => navigate(`/projects/${project.id}/${tool.slug}`)}
              className="bg-white border border-gray-100 rounded-xl p-6 hover:border-gray-300 transition-colors text-left flex items-center gap-4"
            >
              <span className="text-2xl">{tool.icon}</span>
              <span className="font-medium text-gray-900">{tool.name}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
