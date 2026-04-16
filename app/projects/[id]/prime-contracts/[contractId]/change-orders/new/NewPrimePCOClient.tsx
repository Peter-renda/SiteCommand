"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";
import { Paperclip } from "lucide-react";

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

type Contract = {
  id: string;
  contract_number: number;
  title: string;
  contract_company?: string | null;
};

type ChangeEvent = {
  id: string;
  number: number;
  title: string;
  description?: string;
};

type DirectoryContact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

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

export default function NewPrimePCOClient({
  projectId,
  contractId,
  eventIds,
  createdBy,
  role,
}: {
  projectId: string;
  contractId: string;
  eventIds: string;
  createdBy: string;
  role: string;
}) {
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [nextNumber, setNextNumber] = useState("001");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [directoryContacts, setDirectoryContacts] = useState<DirectoryContact[]>([]);
  const [sourceEventIds, setSourceEventIds] = useState<string[]>([]);

  // Form state
  const [revision, setRevision] = useState("0");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Draft");
  const [changeReason, setChangeReason] = useState("Allowance");
  const [isPrivate, setIsPrivate] = useState(true);
  const [description, setDescription] = useState("");
  const [executed, setExecuted] = useState(false);
  const [signedDate, setSignedDate] = useState("");
  const [requestReceivedFrom, setRequestReceivedFrom] = useState("");
  const [location, setLocation] = useState("");
  const [scheduleImpact, setScheduleImpact] = useState("");
  const [fieldChange, setFieldChange] = useState(false);
  const [reference, setReference] = useState("");
  const [paidInFull, setPaidInFull] = useState(false);
  const [primeContractChangeOrder, setPrimeContractChangeOrder] = useState<"none" | "add_to_existing" | "create_new">("none");

  const now = new Date();
  const dateCreated =
    now.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    }) +
    " at " +
    now
      .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      .toLowerCase();

  // Fetch contract
  useEffect(() => {
    fetch(`/api/projects/${projectId}/prime-contracts/${contractId}`)
      .then((r) => r.json())
      .then((data) => setContract(data))
      .catch(() => {});
  }, [projectId, contractId]);

  // Fetch project directory for Request Received From
  useEffect(() => {
    fetch(`/api/projects/${projectId}/directory`)
      .then((r) => r.json())
      .then((data) => setDirectoryContacts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [projectId]);

  // Fetch next PCO number
  useEffect(() => {
    fetch(`/api/projects/${projectId}/change-orders?type=prime`)
      .then((r) => r.json())
      .then((data: { number: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const max = Math.max(...data.map((co) => parseInt(co.number, 10) || 0));
          setNextNumber(String(max + 1).padStart(3, "0"));
        } else {
          setNextNumber("001");
        }
      })
      .catch(() => {});
  }, [projectId]);

  // Pre-populate from change events
  useEffect(() => {
    if (!eventIds) return;
    const ids = eventIds.split(",").filter(Boolean);
    if (ids.length === 0) return;

    Promise.all(
      ids.map((id) =>
        fetch(`/api/projects/${projectId}/change-events/${id}`).then((r) => r.json())
      )
    )
      .then((events: ChangeEvent[]) => {
        if (!events.length) return;

        setSourceEventIds(events.map((e) => e.id));

        // Auto-populate from the source change event the user launched this flow from.
        const sourceEvent = events[0];
        setTitle(sourceEvent.title);
        const rawDesc = sourceEvent.description?.trim() ?? "";
        setDescription(
          rawDesc
            ? stripHtml(rawDesc)
            : `CE #${String(sourceEvent.number).padStart(3, "0")} - ${sourceEvent.title}`
        );
      })
      .catch(() => {});
  }, [eventIds, projectId]);

  async function handleCreate(sendEmail = false) {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/change-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prime_contract_id: contractId,
          type: "prime",
          contract_name: contract
            ? `${contract.contract_number} - ${contract.title}`
            : "",
          revision: parseInt(revision, 10) || 0,
          title,
          status,
          contract_company: contract?.contract_company || "",
          change_reason: changeReason,
          description,
          is_private: isPrivate,
          executed,
          request_received_from: requestReceivedFrom,
          schedule_impact: scheduleImpact ? parseInt(scheduleImpact, 10) : null,
          reference,
          signed_change_order_received_date: signedDate || null,
          location,
          field_change: fieldChange,
          paid_in_full: paidInFull,
          prime_contract_change_order: primeContractChangeOrder,
          source_change_event_ids: sourceEventIds,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        if (sendEmail && created?.id) {
          router.push(
            `/projects/${projectId}/prime-contracts/${contractId}/change-orders/${created.id}/forward`
          );
        } else {
          router.push(`/projects/${projectId}/change-orders`);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setSaveError(errData?.error || `Server error (${res.status})`);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <ProjectNav projectId={projectId} role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-4 pb-1 text-xs text-gray-500 flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => router.push(`/projects/${projectId}/prime-contracts`)}
            className="hover:text-blue-600 transition-colors"
          >
            Prime Contracts
          </button>
          <span>›</span>
          <button
            onClick={() =>
              router.push(`/projects/${projectId}/prime-contracts/${contractId}`)
            }
            className="hover:text-blue-600 transition-colors"
          >
            {contract ? `Prime Contract #${contract.contract_number}` : "…"}
          </button>
          <span>›</span>
          <span>Change Orders</span>
          <span>›</span>
          <span className="text-gray-700 font-medium">New Potential Change Order</span>
        </div>

        <div className="px-6 py-3 shrink-0">
          <h1 className="text-4xl font-normal text-gray-700">New Potential Change Order</h1>
        </div>

        <div className="px-6 border-b border-gray-200 shrink-0">
          <button className="py-2 px-1 text-sm font-medium text-gray-900 border-b-2 border-orange-500 -mb-px">
            General
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-full">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">
              General Information
            </p>
            <div className="border border-gray-200 rounded divide-y divide-gray-200">
              <FormRow
                left={
                  <Field label="#:">
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

              <FormRow
                left={
                  <Field label="Contract Company:">
                    <span className="text-xs text-gray-700">{contract?.contract_company || ""}</span>
                  </Field>
                }
                right={
                  <Field label="Contract:">
                    <span className="text-xs text-blue-700">
                      {contract
                        ? `${contract.contract_number} - ${contract.title}`
                        : "Loading..."}
                    </span>
                  </Field>
                }
              />

              <FormRow
                left={
                  <div className="flex items-center gap-4">
                    <label className="text-xs text-gray-600 w-40 shrink-0">Title:</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </div>
                }
                right={null}
              />

              <FormRow
                left={
                  <Field label="Status:">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-40 border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>
                }
                right={
                  <Field label="Prime Contract Change Order:">
                    <div className="flex items-center gap-3 text-xs text-gray-700">
                      <label className="inline-flex items-center gap-1">
                        <input
                          type="radio"
                          checked={primeContractChangeOrder === "none"}
                          onChange={() => setPrimeContractChangeOrder("none")}
                        />
                        None
                      </label>
                      <label className="inline-flex items-center gap-1">
                        <input
                          type="radio"
                          checked={primeContractChangeOrder === "add_to_existing"}
                          onChange={() => setPrimeContractChangeOrder("add_to_existing")}
                        />
                        Add To Existing
                      </label>
                      <label className="inline-flex items-center gap-1">
                        <input
                          type="radio"
                          checked={primeContractChangeOrder === "create_new"}
                          onChange={() => setPrimeContractChangeOrder("create_new")}
                        />
                        Create New
                      </label>
                    </div>
                  </Field>
                }
              />

              <FormRow
                left={
                  <Field label="Change Reason:">
                    <select
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      className="w-40 border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
                    >
                      {CHANGE_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </Field>
                }
                right={null}
              />

              <FormRow
                left={
                  <Field label="Private:">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="rounded border-gray-300 accent-blue-600"
                    />
                  </Field>
                }
                right={null}
              />

              <div className="px-4 py-3">
                <div className="flex items-start gap-4">
                  <label className="text-xs text-gray-600 w-40 shrink-0 pt-1">Description:</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 resize-none focus:outline-none"
                  />
                </div>
              </div>

              <FormRow
                left={
                  <Field label="Executed:">
                    <input
                      type="checkbox"
                      checked={executed}
                      onChange={(e) => setExecuted(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </Field>
                }
                right={
                  <Field label="Signed Change Order Received Date:">
                    <input
                      type="date"
                      value={signedDate}
                      onChange={(e) => setSignedDate(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </Field>
                }
              />

              <FormRow
                left={
                  <Field label="Request Received From:">
                    <select
                      value={requestReceivedFrom}
                      onChange={(e) => setRequestReceivedFrom(e.target.value)}
                      className="w-64 border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
                    >
                      <option value=""></option>
                      {directoryContacts.map((contact) => {
                        const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
                        const label = name || contact.email || contact.id;
                        return (
                          <option key={contact.id} value={label}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </Field>
                }
                right={
                  <Field label="Location:">
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-48 border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
                    >
                      <option value="">Select a Location</option>
                    </select>
                  </Field>
                }
              />

              <FormRow
                left={
                  <Field label="Schedule Impact:">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={scheduleImpact}
                        onChange={(e) => setScheduleImpact(e.target.value)}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                      />
                      <span className="text-xs text-gray-600">days</span>
                    </div>
                  </Field>
                }
                right={
                  <Field label="Field Change:">
                    <input
                      type="checkbox"
                      checked={fieldChange}
                      onChange={(e) => setFieldChange(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </Field>
                }
              />

              <FormRow
                left={
                  <Field label="Reference:">
                    <input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-40 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </Field>
                }
                right={
                  <Field label="Paid In Full:">
                    <input
                      type="checkbox"
                      checked={paidInFull}
                      onChange={(e) => setPaidInFull(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </Field>
                }
              />

              <div className="px-4 py-3">
                <div className="flex items-start gap-4">
                  <label className="text-xs text-gray-600 w-40 shrink-0 pt-1">Attachments:</label>
                  <div className="flex-1 flex gap-4 items-stretch min-h-[36px]">
                    <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 shrink-0 self-center">
                      <Paperclip className="w-3.5 h-3.5" />
                      Attach File(s)
                    </button>
                    <div className="flex-1 border border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">
                      Drag and Drop File(s)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {saveError && (
          <div className="px-6 py-2 bg-red-50 border-t border-red-200 text-xs text-red-700 shrink-0">
            Error: {saveError}
          </div>
        )}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0">
          <button
            onClick={() =>
              router.push(`/projects/${projectId}/prime-contracts/${contractId}`)
            }
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleCreate(true)}
            disabled={saving}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Create &amp; Email
          </button>
          <button
            onClick={() => handleCreate(false)}
            disabled={saving}
            className="px-4 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
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
