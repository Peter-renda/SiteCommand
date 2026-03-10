import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
const TOOL_SECTIONS = [
  {
    label: "Core Tools",
    items: [
      { name: "Home", slug: "" },
      { name: "Reporting", slug: "reporting" },
      { name: "Documents", slug: "documents" },
      { name: "Directory", slug: "directory" },
      { name: "Tasks", slug: "tasks" },
      { name: "Admin", slug: "admin" },
    ],
  },
  {
    label: "Project Tools",
    items: [
      { name: "Insights", slug: "insights" },
      { name: "RFIs", slug: "rfis" },
      { name: "Submittals", slug: "submittals" },
      { name: "Punch List", slug: "punch-list" },
      { name: "Schedule", slug: "schedule" },
      { name: "Daily Log", slug: "daily-log" },
      { name: "Photos", slug: "photos" },
      { name: "Drawings", slug: "drawings" },
    ],
  },
];
export default function ProjectNav({
  projectId,
  showBackToProject = true,
}: {
  projectId: string;
  showBackToProject?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  return (
    <nav className="bg-white border-b border-gray-100 w-full px-6 flex items-center gap-4 overflow-visible relative">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1.5 py-2.5 text-sm text-gray-400 hover:text-gray-700 transition-colors shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All Projects
      </button>
      {showBackToProject && (
        <>
          <div className="w-px h-4 bg-gray-200" />
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center gap-1.5 py-2.5 text-sm text-gray-400 hover:text-gray-700 transition-colors shrink-0"
          >
            ← Back to Project
          </button>
        </>
      )}
      <div className="w-px h-4 bg-gray-200" />
      <div ref={toolsRef} className="relative inline-block">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Tools
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 w-[400px] bg-white border border-gray-100 rounded-xl shadow-xl z-[9999] p-5">
            <div className="grid grid-cols-2 gap-6">
              {TOOL_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <button
                        key={item.slug}
                        onClick={() => {
                          navigate(`/projects/${projectId}${item.slug ? `/${item.slug}` : ""}`);
                          setOpen(false);
                        }}
                        className="block w-full text-left px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
