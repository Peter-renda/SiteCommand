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

type DirectoryContact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type ChangeOrder = {
  id: string;
  type: "prime" | "commitment";
  number: string;
  revision: number;
  title: string;
  status: string;
  contract_name: string;
  contract_company: string;
  change_reason: string;
  description: string;
  is_private: boolean;
  due_date: string | null;
  invoiced_date: string | null;
  paid_date: string | null;
  designated_reviewer: string | null;
  reviewer: string | null;
  review_date: string | null;
  request_received_from: string | null;
  amount: number;
  date_initiated: string | null;
  budget_codes: string[];
  commitment_id: string | null;
  prime_contract_id: string | null;
};

function contactName(email: string, contacts: DirectoryContact[]): string {
  const c = contacts.find((x) => x.email === email);
  if (!c) return email;
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || email;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" }) +
    " at " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase()
  );
}

export default function ChangeOrderDetailClient({
  projectId,
  changeOrderId,
  username,
  role,
}: {
  projectId: string;
  changeOrderId: string;
  username: string;
  role?: string;
}) {
  const router = useRouter();
  const [co, setCo] = useState<ChangeOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [directoryContacts, setDirectoryContacts] = useState<DirectoryContact[]>([]);

  // Editable fields
  const [revision, setRevision] = useState("");
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

  useEffect(() => {
    fetch(`/api/projects/${projectId}/directory`)
      .then((r) => r.json())
      .then((data) => setDirectoryContacts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/change-orders/${changeOrderId}`)
      .then((r) => r.json())
      .then((data: ChangeOrder) => {
        setCo(data);
        setRevision(String(data.revision ?? 0));
        setTitle(data.title ?? "");
        setStatus(data.status ?? "Draft");
        setChangeReason(data.change_reason ?? "");
        setIsPrivate(data.is_private ?? true);
        setDueDate(data.due_date ?? "");
        setInvoicedDate(data.invoiced_date ?? "");
        setPaidDate(data.paid_date ?? "");
        setDesignatedReviewer(data.designated_reviewer ?? "");
        setRequestReceivedFrom(data.request_received_from ?? "");
        setReviewer(data.reviewer ?? "");
        setReviewDate(data.review_date ?? "");
        setDescription(data.description ?? "");
        setAmount(String(data.amount ?? "0.00"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId, changeOrderId]);

  // designated_reviewer stores the email; username is session.email
  const isReviewer =
    !!designatedReviewer && username.trim().toLowerCase() === designatedReviewer.trim().toLowerCase();
  const pendingReview = new Set([
    "Pending - In Review",
    "Pending - Revised",
    "Pending - Pricing",
    "Pending - Not Pricing",
    "Pending - Proceeding",
    "Pending - Not Proceeding",
  ]).has(status);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/change-orders/${changeOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revision: parseInt(revision, 10) || 0,
          title,
          status,
          change_reason: changeReason,
          description,
          is_private: isPrivate,
          due_date: dueDate || null,
          invoiced_date: invoicedDate || null,
          paid_date: paidDate || null,
          designated_reviewer: designatedReviewer || null,
          reviewer: reviewer || "",
          review_date: reviewDate || null,
          request_received_from: requestReceivedFrom || "",
          amount: Number(amount || 0),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(err?.error || `Server error (${res.status})`);
        return;
      }
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  async function handleReview(newStatus: "Approved" | "Rejected") {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/change-orders/${changeOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reviewer: username,
          review_date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStatus(updated.status);
        setReviewer(updated.reviewer ?? username);
        setReviewDate(updated.review_date ?? new Date().toISOString().slice(0, 10));
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveError(err?.error || `Server error (${res.status})`);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <ProjectNav projectId={projectId} role={role} />
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          Loading…
        </div>
      </div>
    );
  }

  if (!co) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <ProjectNav projectId={projectId} role={role} />
        <div className="flex-1 flex items-center justify-center text-sm text-red-500">
          Change order not found.
        </div>
      </div>
    );
  }

  const isCommitment = co.type === "commitment";
  const dateCreatedDisplay = co.date_initiated ? fmtDateTime(co.date_initiated) : "—";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <ProjectNav projectId={projectId} role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Breadcrumb */}
        <div className="px-6 pt-4 pb-1 text-xs text-gray-500 flex items-center gap-1.5 shrink-0">
          {isCommitment ? (
            <>
              <button
                onClick={() => router.push(`/projects/${projectId}/commitments`)}
                className="hover:text-blue-600 transition-colors"
              >
                Commitments
              </button>
              <span>›</span>
              {co.commitment_id && (
                <>
                  <button
                    onClick={() => router.push(`/projects/${projectId}/commitments/${co.commitment_id}`)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {co.contract_name}
                  </button>
                  <span>›</span>
                </>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => router.push(`/projects/${projectId}/prime-contracts`)}
                className="hover:text-blue-600 transition-colors"
              >
                Prime Contracts
              </button>
              <span>›</span>
            </>
          )}
          <button
            onClick={() => router.push(`/projects/${projectId}/change-orders`)}
            className="hover:text-blue-600 transition-colors"
          >
            Change Orders
          </button>
          <span>›</span>
          <span className="text-gray-700 font-medium">
            {isCommitment ? "Commitment Change Order" : "Potential Change Order"} #{co.number}
          </span>
        </div>

        {/* Page title */}
        <div className="px-6 py-3 shrink-0 flex items-center justify-between">
          <h1 className="text-2xl font-normal text-gray-900">
            {isCommitment ? "Commitment Change Order" : "Potential Change Order"} #{co.number}
          </h1>
          {/* Reviewer actions shown when current user is the designated reviewer and status is pending */}
          {isCommitment && isReviewer && pendingReview && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-600 font-medium">
                Awaiting your review as {contactName(designatedReviewer, directoryContacts)}
              </span>
              <button
                disabled={saving}
                onClick={() => handleReview("Approved")}
                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={saving}
                onClick={() => handleReview("Rejected")}
                className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
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
                    <span className="text-xs text-gray-700">{co.number}</span>
                  </Field>
                }
                right={
                  <Field label="Date Created:">
                    <span className="text-xs text-gray-700">{dateCreatedDisplay}</span>
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
                  <Field label="Contract Company:">
                    <span className="text-xs text-gray-700">{co.contract_company || "—"}</span>
                  </Field>
                }
              />

              {/* Row: Contract */}
              <FormRow
                left={null}
                right={
                  <Field label="Contract:">
                    {isCommitment && co.commitment_id ? (
                      <button
                        onClick={() =>
                          router.push(`/projects/${projectId}/commitments/${co.commitment_id}`)
                        }
                        className="text-xs text-blue-600 hover:underline text-left"
                      >
                        {co.contract_name}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-700">{co.contract_name || "—"}</span>
                    )}
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

              {/* Row: (empty) / Paid Date */}
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
                    <span className="text-xs text-gray-700">{reviewer || "—"}</span>
                  </Field>
                }
                right={
                  <Field label="Review Date:">
                    <span className="text-xs text-gray-700">{reviewDate || "—"}</span>
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
                      {co.budget_codes?.length
                        ? co.budget_codes.join(", ")
                        : <span className="text-gray-400">None linked</span>}
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
        {saved && (
          <div className="px-6 py-2 bg-green-50 border-t border-green-200 text-xs text-green-700 shrink-0">
            Changes saved.
          </div>
        )}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0">
          <button
            onClick={() => router.push(`/projects/${projectId}/change-orders`)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Back
          </button>
          <button
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
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
