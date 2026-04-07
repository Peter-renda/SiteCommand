"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";

const CHANGE_REASONS = [
  "Allowance",
  "Client Request",
  "Design Change",
  "Differing Site Condition",
  "Owner Request",
  "Unforeseen Condition",
  "Value Engineering",
  "Weather",
  "Other",
];

const STATUSES = [
  "Approved",
  "Draft",
  "No Charge",
  "Pending - In Review",
  "Pending - Not Pricing",
  "Pending - Not Proceeding",
  "Pending - Pricing",
  "Pending - Proceeding",
  "Pending - Revised",
  "Rejected",
  "Void",
];

/** Strip HTML tags and decode common entities from rich-text fields. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

type DirectoryContact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type Commitment = {
  id: string;
  number: number;
  title: string;
  contract_company: string;
};

type ChangeEvent = {
  id: string;
  number: number;
  title: string;
  description?: string;
  line_items?: Array<{ budget_code?: string | null; cost_rom?: number | null }>;
};

export default function NewCommitmentCOClient({
  projectId,
  commitmentId,
  eventIds,
  createdBy,
  role,
}: {
  projectId: string;
  commitmentId: string;
  eventIds: string;
  createdBy: string;
  role?: string;
}) {
  const router = useRouter();
  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [nextNumber, setNextNumber] = useState("001");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sourceEventIds, setSourceEventIds] = useState<string[]>([]);
  const [budgetCodes, setBudgetCodes] = useState<string[]>([]);
  const [directoryContacts, setDirectoryContacts] = useState<DirectoryContact[]>([]);

  // Form fields
  const [revision, setRevision] = useState("0");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Draft");
  const [changeReason, setChangeReason] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [dueDate, setDueDate] = useState("");
  const [invoicedDate, setInvoicedDate] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [designatedReviewer, setDesignatedReviewer] = useState("");
  const [requestReceivedFrom, setRequestReceivedFrom] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("0.00");

  const now = new Date();
  const dateCreated =
    now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" }) +
    " at " +
    now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();

  // Fetch commitment details
  useEffect(() => {
    fetch(`/api/projects/${projectId}/commitments/${commitmentId}`)
      .then((r) => r.json())
      .then((data) => setCommitment(data))
      .catch(() => {});
  }, [projectId, commitmentId]);

  // Fetch project directory for reviewer dropdown
  useEffect(() => {
    fetch(`/api/projects/${projectId}/directory`)
      .then((r) => r.json())
      .then((data) => setDirectoryContacts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [projectId]);

  // Fetch next CO number
  useEffect(() => {
    fetch(`/api/projects/${projectId}/change-orders?type=commitment`)
      .then((r) => r.json())
      .then((data: { number: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const max = Math.max(...data.map((co) => parseInt(co.number, 10) || 0));
          setNextNumber(String(max + 1).padStart(3, "0"));
        }
      })
      .catch(() => {});
  }, [projectId]);

  // Pre-populate from change events
  useEffect(() => {
    if (!eventIds) return;
    const ids = eventIds.split(",").filter(Boolean);
    if (ids.length === 0) return;

    Promise.all(ids.map((id) => fetch(`/api/projects/${projectId}/change-events/${id}`).then((r) => r.json())))
      .then((events: ChangeEvent[]) => {
        setSourceEventIds(events.map((e) => e.id));

        const allCodes = new Set<string>();
        let total = 0;
        events.forEach((ev) => {
          ev.line_items?.forEach((li) => {
            if (li.budget_code?.trim()) allCodes.add(li.budget_code.trim());
            total += Number(li.cost_rom ?? 0);
          });
        });
        setBudgetCodes(Array.from(allCodes));
        setAmount(total.toFixed(2));

        if (events.length === 1) {
          setTitle(events[0].title);
          const rawDesc = events[0].description?.trim() ?? "";
          setDescription(
            rawDesc
              ? stripHtml(rawDesc)
              : `CE #${String(events[0].number).padStart(3, "0")} - ${events[0].title}`
          );
        } else {
          setTitle(events.map((e) => `CE #${String(e.number).padStart(3, "0")}`).join(", "));
          setDescription(events.map((e) => `CE #${String(e.number).padStart(3, "0")} - ${e.title}`).join("\n"));
        }
      })
      .catch(() => {});
  }, [eventIds, projectId]);

  async function handleCreate() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/change-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitment_id: commitmentId,
          type: "commitment",
          contract_name: commitment
            ? `${String(commitment.number).padStart(3, "0")} - ${commitment.title}`
            : "",
          revision: parseInt(revision, 10) || 0,
          title,
          status,
          contract_company: commitment?.contract_company || "",
          change_reason: changeReason,
          description,
          is_private: isPrivate,
          designated_reviewer: designatedReviewer || null,
          reviewer: reviewer || "",
          review_date: reviewDate || null,
          due_date: dueDate || null,
          invoiced_date: invoicedDate || null,
          paid_date: paidDate || null,
          request_received_from: requestReceivedFrom || "",
          amount: Number(amount || 0),
          source_change_event_ids: sourceEventIds,
          budget_codes: budgetCodes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setSaveError(errData?.error || `Server error (${res.status})`);
        return;
      }

      router.push(`/projects/${projectId}/change-orders`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  const contractLabel = commitment
    ? `SC-${String(commitment.number).padStart(3, "0")} - ${commitment.title}`
    : "Loading…";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <ProjectNav projectId={projectId} role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Breadcrumb */}
        <div className="px-6 pt-4 pb-1 text-xs text-gray-500 flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => router.push(`/projects/${projectId}/commitments`)}
            className="hover:text-blue-600 transition-colors"
          >
            Commitments
          </button>
          <span>›</span>
          <button
            onClick={() => router.push(`/projects/${projectId}/commitments/${commitmentId}`)}
            className="hover:text-blue-600 transition-colors"
          >
            {commitment ? `Contract #SC-${String(commitment.number).padStart(3, "0")}` : "…"}
          </button>
          <span>›</span>
          <span>Change Orders</span>
          <span>›</span>
          <span className="text-gray-700 font-medium">New Commitment Change Order</span>
        </div>

        {/* Page title */}
        <div className="px-6 py-3 shrink-0">
          <h1 className="text-2xl font-normal text-gray-900">New Commitment Change Order</h1>
        </div>

        {/* Tab bar */}
        <div className="px-6 border-b border-gray-200 shrink-0">
          <button className="py-2 px-1 text-sm font-medium text-gray-900 border-b-2 border-orange-500 -mb-px">
            General
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-5xl">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">
              General Information
            </p>

            <div className="border border-gray-200 rounded divide-y divide-gray-200">

              {/* Row: # / Date Created */}
              <FormRow
                left={
                  <Field label="#">
                    <input
                      readOnly
                      value={nextNumber}
                      className="w-40 border border-gray-300 rounded px-2 py-1 text-xs bg-gray-50"
                    />
                  </Field>
                }
                right={
                  <Field label="Date Created:">
                    <span className="text-xs text-gray-700">{dateCreated}</span>
                  </Field>
                }
              />

              {/* Row: Revision / Created By */}
              <FormRow
                left={
                  <Field label="Revision:">
                    <input
                      value={revision}
                      onChange={(e) => setRevision(e.target.value)}
                      className="w-40 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </Field>
                }
                right={
                  <Field label="Created By:">
                    <span className="text-xs text-gray-700">{createdBy}</span>
                  </Field>
                }
              />

              {/* Row: Contract Company / Contract */}
              <FormRow
                left={
                  <Field label="Contract Company:">
                    <span className="text-xs text-gray-700">
                      {commitment?.contract_company || "—"}
                    </span>
                  </Field>
                }
                right={
                  <Field label="Contract:">
                    <button
                      onClick={() => router.push(`/projects/${projectId}/commitments/${commitmentId}`)}
                      className="text-xs text-blue-600 hover:underline text-left"
                    >
                      {contractLabel}
                    </button>
                  </Field>
                }
              />

              {/* Row: Title (full width) */}
              <div className="px-4 py-3">
                <div className="flex items-start gap-4">
                  <label className="text-xs text-gray-600 w-40 shrink-0 pt-1">Title:</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                  />
                </div>
              </div>

              {/* Row: Status / Private */}
              <FormRow
                left={
                  <Field label="Status:">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-44 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                }
                right={
                  <Field label="Private:">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="rounded border-gray-300 accent-blue-600"
                      />
                      {isPrivate && (
                        <span className="text-xs text-gray-400 italic">
                          Visible to your organization only
                        </span>
                      )}
                    </div>
                  </Field>
                }
              />

              {/* Row: Change Reason */}
              <FormRow
                left={
                  <Field label="Change Reason:">
                    <select
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      className="w-44 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    >
                      <option value="">Select…</option>
                      {CHANGE_REASONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                }
                right={null}
              />

              {/* Row: Due Date / Invoiced Date */}
              <FormRow
                left={
                  <Field label="Due Date:">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </Field>
                }
                right={
                  <Field label="Invoiced Date:">
                    <input
                      type="date"
                      value={invoicedDate}
                      onChange={(e) => setInvoicedDate(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </Field>
                }
              />

              {/* Row: (empty left) / Paid Date */}
              <FormRow
                left={null}
                right={
                  <Field label="Paid Date:">
                    <input
                      type="date"
                      value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </Field>
                }
              />

              {/* Row: Designated Reviewer / Request Received From */}
              <FormRow
                left={
                  <Field label="Designated Reviewer:">
                    <select
                      value={designatedReviewer}
                      onChange={(e) => setDesignatedReviewer(e.target.value)}
                      className="w-52 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    >
                      <option value="">Select…</option>
                      {directoryContacts.map((c) => {
                        const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "";
                        return c.email ? <option key={c.id} value={c.email}>{name}</option> : null;
                      })}
                    </select>
                  </Field>
                }
                right={
                  <Field label="Request Received From:">
                    <select
                      value={requestReceivedFrom}
                      onChange={(e) => setRequestReceivedFrom(e.target.value)}
                      className="w-52 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    >
                      <option value="">Select…</option>
                      {directoryContacts.map((c) => {
                        const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "";
                        return c.email ? <option key={c.id} value={c.email}>{name}</option> : null;
                      })}
                    </select>
                  </Field>
                }
              />

              {/* Row: Reviewer / Review Date */}
              <FormRow
                left={
                  <Field label="Reviewer:">
                    <input
                      value={reviewer}
                      onChange={(e) => setReviewer(e.target.value)}
                      placeholder="—"
                      className="w-52 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </Field>
                }
                right={
                  <Field label="Review Date:">
                    <input
                      type="date"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </Field>
                }
              />

              {/* Row: Description (full width) */}
              <div className="px-4 py-3">
                <div className="flex items-start gap-4">
                  <label className="text-xs text-gray-600 w-40 shrink-0 pt-1">Description:</label>
                  <div className="flex-1 border border-gray-300 rounded overflow-hidden">
                    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-200">
                      {["B", "I", "U", "S"].map((cmd) => (
                        <button
                          key={cmd}
                          type="button"
                          className="w-5 h-5 text-xs text-gray-600 hover:bg-gray-200 rounded flex items-center justify-center font-medium"
                          style={
                            cmd === "B"
                              ? { fontWeight: "bold" }
                              : cmd === "I"
                              ? { fontStyle: "italic" }
                              : cmd === "U"
                              ? { textDecoration: "underline" }
                              : { textDecoration: "line-through" }
                          }
                        >
                          {cmd}
                        </button>
                      ))}
                      <span className="w-px h-3.5 bg-gray-300 mx-0.5" />
                      {["≡", "≣", "⊨"].map((cmd, i) => (
                        <button
                          key={i}
                          type="button"
                          className="w-5 h-5 text-xs text-gray-600 hover:bg-gray-200 rounded flex items-center justify-center"
                        >
                          {cmd}
                        </button>
                      ))}
                      <span className="w-px h-3.5 bg-gray-300 mx-0.5" />
                      {["•", "1.", "⊣", "⊢"].map((cmd, i) => (
                        <button
                          key={i}
                          type="button"
                          className="w-5 h-5 text-xs text-gray-600 hover:bg-gray-200 rounded flex items-center justify-center"
                        >
                          {cmd}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2 text-xs text-gray-800 resize-none focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row: Amount / Budget Codes */}
              <FormRow
                left={
                  <Field label="Amount:">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">$</span>
                      <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-36 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                      />
                    </div>
                  </Field>
                }
                right={
                  <Field label="Budget Codes:">
                    <span className="text-xs text-gray-700">
                      {budgetCodes.length ? budgetCodes.join(", ") : <span className="text-gray-400">None linked</span>}
                    </span>
                  </Field>
                }
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        {saveError && (
          <div className="px-6 py-2 bg-red-50 border-t border-red-200 text-xs text-red-700 shrink-0">
            Error: {saveError}
          </div>
        )}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={handleCreate}
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormRow({
  left,
  right,
}: {
  left: React.ReactNode | null;
  right: React.ReactNode | null;
}) {
  return (
    <div className="flex divide-x divide-gray-200">
      <div className="flex-1 px-4 py-3">{left}</div>
      <div className="flex-1 px-4 py-3">{right}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-xs text-gray-600 w-40 shrink-0">{label}</label>
      <div>{children}</div>
    </div>
  );
}
