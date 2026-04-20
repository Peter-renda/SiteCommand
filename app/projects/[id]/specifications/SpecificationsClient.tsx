"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProjectNav from "@/components/ProjectNav";

type Specification = {
  id: string;
  name: string;
  code: string | null;
};

type SpecTab = "specifications" | "all_revisions" | "recycle_bin";

export default function SpecificationsClient({ projectId, username }: { projectId: string; username: string }) {
  const [activeTab, setActiveTab] = useState<SpecTab>("specifications");
  const [search, setSearch] = useState("");
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;

    async function loadSpecs() {
      try {
        const res = await fetch(`/api/projects/${projectId}/specifications`);
        const data = await res.json();
        if (!ignore) setSpecifications(Array.isArray(data) ? data : []);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadSpecs();
    return () => {
      ignore = true;
    };
  }, [projectId]);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function handleOpenSpecBook() {
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Specification Book</title>
          <style>
            body {
              margin: 0;
              background: #000;
              color: #fff;
              font-family: Inter, system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
          </style>
        </head>
        <body>Open Specification Book</body>
      </html>
    `);
    win.document.close();
  }

  const filteredSpecifications = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return specifications;
    return specifications.filter((spec) => `${spec.code ?? ""} ${spec.name}`.toLowerCase().includes(q));
  }, [search, specifications]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          SiteCommand
        </a>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <main className="border-t border-gray-300">
        <section className="bg-white border-b border-gray-300">
          <div className="px-4 py-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-700">⚙️</span>
              <h1 className="text-[38px] leading-none font-semibold text-gray-900 tracking-tight">Specifications</h1>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded"
              >
                Upload
              </button>
              <button
                onClick={handleOpenSpecBook}
                className="px-3 py-1.5 border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm rounded"
              >
                Open Specification Book
              </button>
              <div ref={exportMenuRef} className="relative">
                <button
                  onClick={() => setShowExportMenu((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm rounded"
                >
                  Export
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                    <button onClick={() => setShowExportMenu(false)} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Export as PDF</button>
                    <button onClick={() => setShowExportMenu(false)} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Export as CSV</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-4">
            <div className="flex items-end gap-6">
              {[
                { key: "specifications", label: "Specifications" },
                { key: "all_revisions", label: "All Revisions" },
                { key: "recycle_bin", label: "Recycle Bin" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as SpecTab)}
                  className={`pb-2 text-sm font-medium border-b-2 -mb-px ${
                    activeTab === tab.key ? "border-gray-900 text-gray-900" : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f7f7] border-b border-gray-300 px-4 py-4 flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="w-52 pl-3 pr-8 py-1.5 border border-gray-400 rounded text-sm bg-white"
            />
            <svg className="w-4 h-4 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
          </div>

          <button className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-gray-700">Filters</button>

          <button className="min-w-36 px-3 py-1.5 border border-gray-400 bg-white rounded text-left text-sm text-gray-700 inline-flex items-center justify-between">
            Division
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>

          <button className="min-w-48 px-3 py-1.5 border border-gray-400 bg-white rounded text-left text-sm text-gray-700 inline-flex items-center justify-between">
            Set: Current
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>

          <div className="flex-1" />

          <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-900 hover:text-gray-700">
            <span className="text-base">+</span>
            Create Division
          </button>
          <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-900 hover:text-gray-700">
            <span className="text-base">+</span>
            Create Specification
          </button>
        </section>

        <section className="px-4 py-4">
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Existing Specifications</h2>
              <span className="text-xs text-gray-500">{filteredSpecifications.length} total</span>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-sm text-gray-500">Loading specifications…</div>
            ) : filteredSpecifications.length === 0 ? (
              <div className="px-4 py-8 text-sm text-gray-500">No specifications found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-600">
                    <th className="px-4 py-2 text-left">Code</th>
                    <th className="px-4 py-2 text-left">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpecifications.map((spec) => (
                    <tr key={spec.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-4 py-3 text-gray-700">{spec.code || "—"}</td>
                      <td className="px-4 py-3 text-gray-900">{spec.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-[560px] bg-white rounded shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-7 pt-6 pb-4 flex items-start justify-between">
              <h3 className="text-[36px] leading-none font-semibold text-gray-900 tracking-tight">Upload Specifications</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-800 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="px-7 pb-6 space-y-5 text-sm">
              <div className="border border-dashed border-gray-300 rounded px-4 py-5 text-center">
                <button className="px-3 py-1.5 bg-gray-200 rounded text-sm text-gray-800">Attach Files</button>
                <p className="mt-2 text-gray-600">or Drag &amp; Drop</p>
              </div>

              <div>
                <label className="block font-semibold text-gray-800 mb-1">Specification Set <span className="text-red-500">*</span></label>
                <p className="text-gray-600 mb-2">Select an existing set or create a new one.</p>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-gray-600 bg-white">
                  <option>Select or Create set</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-800 mb-1">Format <span className="text-red-500">*</span></label>
                <p className="text-gray-600 mb-2">Select a format based on the region your project is set to.</p>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-gray-600 bg-white">
                  <option>Select a format</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-800 mb-1">Default Issued Date</label>
                  <p className="text-gray-600 mb-2">Select the date revisions were issued.</p>
                  <input type="text" placeholder="mm / dd / yyyy" className="w-full border border-gray-300 rounded px-3 py-2 text-gray-600" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-800 mb-1">Default Received Date</label>
                  <p className="text-gray-600 mb-2">Select the date revisions were received.</p>
                  <input type="text" placeholder="mm / dd / yyyy" className="w-full border border-gray-300 rounded px-3 py-2 text-gray-600" />
                </div>
              </div>

              <button className="text-sm font-medium text-gray-900">▸ Advanced Options</button>

              <div className="pt-10 flex items-center justify-between">
                <p className="text-xs italic text-gray-500">* Required fields</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowUploadModal(false)} className="text-gray-700 font-medium">Cancel</button>
                  <button className="px-4 py-1.5 rounded bg-orange-200 text-white font-semibold">Process</button>
                </div>
              </div>
              <p className="text-sm text-red-600 text-right">You must attach a file.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
