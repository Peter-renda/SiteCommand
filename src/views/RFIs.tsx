import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";

export default function RFIs() {
  const { id } = useParams();
  const [rfis, setRfis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("draft");
  const [scheduleImpact, setScheduleImpact] = useState("");
  const [costImpact, setCostImpact] = useState("");
  const [costCode, setCostCode] = useState("");
  const [subJob, setSubJob] = useState("");
  const [rfiStage, setRfiStage] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  async function loadRfis() {
    const res = await fetch(`/api/projects/${id}/rfis`);
    const data = await res.json();
    setRfis(data);
    setLoading(false);
  }

  useEffect(() => {
    loadRfis();
  }, [id]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/projects/${id}/rfis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        question,
        status,
        schedule_impact: scheduleImpact,
        cost_impact: costImpact,
        cost_code: costCode,
        sub_job: subJob,
        rfi_stage: rfiStage,
        private: isPrivate,
      }),
    });
    if (res.ok) {
      loadRfis();
      setShowModal(false);
      setSubject("");
      setQuestion("");
      setStatus("draft");
      setScheduleImpact("");
      setCostImpact("");
      setCostCode("");
      setSubJob("");
      setRfiStage("");
      setIsPrivate(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={id!} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">RFIs</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            New RFI
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
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Subject</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">RFI Stage</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Private</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rfis.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 text-gray-400 font-mono">{r.rfi_number}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{r.subject}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium capitalize">{r.status}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{r.rfi_stage || "—"}</td>
                    <td className="px-6 py-4 text-gray-500">{r.private ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New RFI</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Question</label>
                <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">RFI Stage</label>
                  <input type="text" value={rfiStage} onChange={(e) => setRfiStage(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Schedule Impact</label>
                  <input type="text" value={scheduleImpact} onChange={(e) => setScheduleImpact(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cost Impact</label>
                  <input type="text" value={costImpact} onChange={(e) => setCostImpact(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cost Code</label>
                  <input type="text" value={costCode} onChange={(e) => setCostCode(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sub Job</label>
                  <input type="text" value={subJob} onChange={(e) => setSubJob(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <span>Private (if checked, only you can view this RFI)</span>
              </label>
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
