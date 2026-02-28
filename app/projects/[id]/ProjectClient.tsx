"use client";

import { useState, useEffect } from "react";

type Member = { id: string; username: string; email: string };

type Project = {
  id: string;
  name: string;
  description: string;
  address: string;
  value: number;
  status: string;
  created_at: string;
  members: Member[];
};

export default function ProjectClient({
  projectId,
  role,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => {
        if (!res.ok) { setNotFound(true); setLoading(false); return null; }
        return res.json();
      })
      .then((data) => {
        if (data) { setProject(data); setLoading(false); }
      });
  }, [projectId]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          SiteCommand
        </a>
        <div className="flex items-center gap-5">
          {role === "admin" && (
            <a href="/admin" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Admin
            </a>
          )}
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : notFound ? (
          <p className="text-sm text-gray-500">Project not found.</p>
        ) : project ? (
          <>
            {/* Back link */}
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-8"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              All Projects
            </a>

            {/* Project name + status */}
            <div className="flex items-start justify-between mb-1">
              <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
              <span
                className={`mt-1 ml-4 shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                  project.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {project.status}
              </span>
            </div>

            {project.address && (
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-gray-400">{project.address}</p>
              </div>
            )}

            {project.description && (
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{project.description}</p>
            )}

            <div className="mt-8 border-t border-gray-100 pt-8">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Project Team</h2>
              {project.members.length === 0 ? (
                <p className="text-sm text-gray-400">No team members assigned.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {project.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 py-2.5 px-4 bg-white border border-gray-100 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                        {m.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.username}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
