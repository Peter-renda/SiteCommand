"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";
import { ChevronDown, ChevronRight, Paperclip, Pencil } from "lucide-react";

type LineItem = {
  id: string;
  budget_code: string | null;
  description: string | null;
  vendor: string | null;
  contract_number: string | null;
  unit_of_measure: string | null;
  rev_unit_qty: number | null;
  rev_unit_cost: number | null;
  rev_rom: number | null;
  cost_unit_qty: number | null;
  cost_unit_cost: number | null;
  cost_rom: number | null;
};

type ChangeEvent = {
  id: string;
  number: number;
  title: string;
  status: string;
  origin: string | null;
  type: string | null;
  change_reason: string | null;
  scope: string | null;
  expecting_revenue: boolean;
  revenue_source: string | null;
  prime_contract: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  line_items: LineItem[];
};

type TabKey = "General" | "Related Items" | "Comments" | "Emails" | "Change History" | "Advanced Settings";

type CommentItem = {
  id: string;
  message: string;
  attachments: string[];
  createdAt: string;
};

function fmt(val: number | null | undefined) {
  if (val === null || val === undefined) return "—";
  return val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function fmtQty(val: number | null | undefined) {
  if (val === null || val === undefined) return "—";
  return val.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

function MetricField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value || "—"}</span>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value || "—"}</p>
    </div>
  );
}

export default function ChangeEventDetailClient({
  projectId,
  eventId,
  canWrite,
}: {
  projectId: string;
  eventId: string;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [event, setEvent] = useState<ChangeEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("General");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/change-events/${eventId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setEvent(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load change event.");
        setLoading(false);
      });
  }, [projectId, eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ProjectNav projectId={projectId} />
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <ProjectNav projectId={projectId} />
        <div className="flex-1 flex items-center justify-center text-sm text-red-500">{error ?? "Change event not found."}</div>
      </div>
    );
  }

  const totalRevRom = event.line_items.reduce((s, li) => s + (li.rev_rom ?? 0), 0);
  const totalCostRom = event.line_items.reduce((s, li) => s + (li.cost_rom ?? 0), 0);
  const tabs: TabKey[] = ["General", "Related Items", "Comments", "Emails", "Change History", "Advanced Settings"];
  const canSendComment = newComment.trim().length > 0 || pendingFiles.length > 0;

  function handleFilePick(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setPendingFiles((prev) => [...prev, ...Array.from(fileList)]);
  }

  function handleSendComment() {
    if (!canSendComment) return;

    setComments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        message: newComment.trim(),
        attachments: pendingFiles.map((file) => file.name),
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewComment("");
    setPendingFiles([]);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ProjectNav projectId={projectId} />

      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <button onClick={() => router.push(`/projects/${projectId}/change-events`)} className="hover:text-blue-600">
            Change Events
          </button>
          <ChevronRight className="w-3 h-3" />
          <span>Change Event #{String(event.number).padStart(3, "0")}</span>
        </div>
      </div>

      <div className="px-4 pt-3 pb-0 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-base font-semibold text-gray-900">
            Change Event #{String(event.number).padStart(3, "0")}: {event.title}
          </h1>
          <div className="flex items-center gap-2">
            {canWrite && (
              <button
                onClick={() => router.push(`/projects/${projectId}/change-events/${eventId}/edit`)}
                className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            <button className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
              Export <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === activeTab ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 px-3 py-3 space-y-3">
        {activeTab === "General" && (
          <>
            <section className="rounded border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">General Information</h2>
          </div>

          <div className="px-4 py-4 space-y-7">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-7">
              <InfoField label="Number" value={String(event.number).padStart(3, "0")} />
              <InfoField label="Title" value={event.title} />
              <div className="space-y-0.5">
                <p className="text-xs text-gray-500">Status</p>
                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700">{event.status || "—"}</span>
              </div>
              <InfoField label="Origin" value={event.origin} />
              <InfoField label="Type" value={event.type} />
              <InfoField label="Change Reason" value={event.change_reason} />
              <InfoField label="Scope" value={event.scope} />
              <InfoField label="Prime Contract for Markup Estimates" value={event.prime_contract} />
              <InfoField label="Expecting Revenue" value={event.expecting_revenue ? "Yes" : "No"} />
              <InfoField label="Line Item Revenue Source" value={event.revenue_source} />
            </div>

            <div className="space-y-0.5">
              <p className="text-xs text-gray-500">Description</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{event.description || "—"}</p>
            </div>

            <div className="flex gap-10">
              <MetricField label="Total Revenue ROM" value={fmt(totalRevRom)} />
              <MetricField label="Total Cost ROM" value={fmt(totalCostRom)} />
            </div>
          </div>
        </section>

            <section className="rounded border border-gray-200 bg-white">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Line Items</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-400">Bulk Actions 0 selected</button>
              <div className="relative">
                <input className="rounded border border-gray-300 px-3 py-1 pr-10 text-xs w-56" placeholder="Search" />
                <span className="absolute right-3 top-1 text-gray-400 text-xs">⌕</span>
              </div>
              <button className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700">Add Filter ▾</button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
              <button className="rounded border border-gray-300 px-3 py-1 text-xs">Show Rows 25 ▾</button>
              <span>{event.line_items.length > 0 ? `1-${event.line_items.length} of ${event.line_items.length}` : "0-0 of 0"}</span>
            </div>
          </div>

          {event.line_items.length === 0 ? (
            <p className="text-xs text-gray-400 italic px-4 py-3">No line items.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-y border-gray-300">
                    <th colSpan={5} className="px-3 py-2 text-left border-r border-gray-300"></th>
                    <th colSpan={4} className="px-3 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">
                      Revenue
                    </th>
                    <th colSpan={3} className="px-3 py-2 text-center font-semibold text-gray-700">
                      Cost
                    </th>
                  </tr>
                  <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-medium">
                    <th className="px-3 py-2 text-left whitespace-nowrap">Budget Code</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">Description</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">Vendor</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">Contract</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap border-r border-gray-300">UOM</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Unit Qty</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Unit Cost</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">ROM</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap border-r border-gray-300">Latest Price</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Unit Qty</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Unit Cost</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">ROM</th>
                  </tr>
                </thead>
                <tbody>
                  {event.line_items.map((li) => (
                    <tr key={li.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-700">{li.budget_code ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{li.description ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{li.vendor ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{li.contract_number ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600 border-r border-gray-300">{li.unit_of_measure ?? "—"}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{fmtQty(li.rev_unit_qty)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{fmt(li.rev_unit_cost)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{fmt(li.rev_rom)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900 border-r border-gray-300">{fmt(li.rev_rom)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{fmtQty(li.cost_unit_qty)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{fmt(li.cost_unit_cost)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{fmt(li.cost_rom)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-white font-semibold">
                    <td colSpan={5} className="px-3 py-2 text-right text-gray-700 border-r border-gray-300">
                      Totals
                    </td>
                    <td className="px-3 py-2 text-right text-gray-900">{fmtQty(event.line_items.reduce((s, li) => s + (li.rev_unit_qty ?? 0), 0))}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{fmt(event.line_items.reduce((s, li) => s + (li.rev_unit_cost ?? 0), 0))}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{fmt(totalRevRom)}</td>
                    <td className="px-3 py-2 text-right text-gray-900 border-r border-gray-300">{fmt(totalRevRom)}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{fmtQty(event.line_items.reduce((s, li) => s + (li.cost_unit_qty ?? 0), 0))}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{fmt(event.line_items.reduce((s, li) => s + (li.cost_unit_cost ?? 0), 0))}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{fmt(totalCostRom)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
          </>
        )}

        {activeTab === "Comments" && (
          <section className="rounded border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Comments</h2>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div className="space-y-3 rounded border border-gray-200 bg-gray-50 p-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-24 w-full rounded border border-gray-300 bg-white p-3 text-sm text-gray-800 outline-none ring-blue-500 focus:ring-1"
                />

                {pendingFiles.length > 0 && (
                  <ul className="space-y-1">
                    {pendingFiles.map((file, idx) => (
                      <li key={`${file.name}-${idx}`} className="flex items-center justify-between rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700">
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setPendingFiles((prev) => prev.filter((_, fIdx) => fIdx !== idx))}
                          className="ml-2 text-xs text-gray-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center justify-between">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                    <Paperclip className="h-4 w-4" />
                    Attach files
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        handleFilePick(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleSendComment}
                    disabled={!canSendComment}
                    className={`rounded px-4 py-1.5 text-sm font-medium text-white ${
                      canSendComment ? "bg-blue-600 hover:bg-blue-700" : "cursor-not-allowed bg-gray-300"
                    }`}
                  >
                    Send
                  </button>
                </div>
              </div>

              {comments.length === 0 ? (
                <p className="text-sm italic text-gray-500">No comments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {comments.map((comment) => (
                    <li key={comment.id} className="rounded border border-gray-200 bg-white p-3">
                      <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                      {comment.message && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{comment.message}</p>}
                      {comment.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {comment.attachments.map((fileName) => (
                            <span key={`${comment.id}-${fileName}`} className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                              <Paperclip className="h-3 w-3" />
                              {fileName}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {activeTab !== "General" && activeTab !== "Comments" && (
          <section className="rounded border border-gray-200 bg-white px-4 py-6">
            <p className="text-sm text-gray-500">{activeTab} content coming soon.</p>
          </section>
        )}
      </div>
    </div>
  );
}
