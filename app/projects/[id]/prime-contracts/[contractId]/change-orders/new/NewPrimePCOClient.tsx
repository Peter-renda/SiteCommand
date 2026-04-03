"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";
import { Paperclip } from "lucide-react";

const CHANGE_REASONS = [
  "Allowance",
  "Design Change",
  "Differing Site Condition",
  "Owner Request",
  "Unforeseen Condition",
  "Value Engineering",
  "Weather",
  "Other",
];

const STATUSES = ["Draft", "Under Review", "Approved", "Rejected", "Void"];

type Contract = {
  id: string;
  contract_number: number;
  title: string;
};

type ChangeEvent = {
  id: string;
  number: number;
  title: string;
};

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

  // Form state
  const [revision, setRevision] = useState("0");
  const [contractCompany, setContractCompany] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Draft");
  const [changeReason, setChangeReason] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [description, setDescription] = useState("");
  const [executed, setExecuted] = useState(false);
  const [requestReceivedFrom, setRequestReceivedFrom] = useState("");
  const [scheduleImpact, setScheduleImpact] = useState("");
  const [reference, setReference] = useState("");
  const [primeCOOption, setPrimeCOOption] = useState<"none" | "add_to_existing" | "create_new">("none");
  const [signedDate, setSignedDate] = useState("");
  const [location, setLocation] = useState("");
  const [fieldChange, setFieldChange] = useState(false);
  const [paidInFull, setPaidInFull] = useState(false);

  const now = new Date();
  const dateCreated = now.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  }) + " at " + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();

  // Fetch contract
  useEffect(() => {
    fetch(`/api/projects/${projectId}/prime-contracts/${contractId}`)
      .then((r) => r.json())
      .then((data) => setContract(data))
      .catch(() => {});
  }, [projectId, contractId]);

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
      .then((events: (ChangeEvent & { description?: string })[]) => {
        if (events.length === 1) {
          setTitle(events[0].title);
          // Use the change event's own description if present, otherwise build one
          setDescription(
            events[0].description?.trim() ||
              `CE #${String(events[0].number).padStart(3, "0")} - ${events[0].title}`
          );
        } else {
          setTitle(events.map((e) => `CE #${String(e.number).padStart(3, "0")}`).join(", "));
          setDescription(
            events
              .map((e) => `CE #${String(e.number).padStart(3, "0")} - ${e.title}`)
              .join("\n")
          );
        }
      })
      .catch(() => {});
  }, [eventIds, projectId]);

  async function handleCreate(sendEmail = false) {
    setSaving(true);
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
          contract_company: contractCompany,
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
          prime_contract_change_order: primeCOOption,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        if (sendEmail && created?.id) {
          router.push(
            `/projects/${projectId}/prime-contracts/${contractId}/change-orders/${created.id}/forward`
          );
        } else {
          router.push(`/projects/${projectId}/prime-contracts/${contractId}`);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  const contractLabel = contract
    ? `${contract.contract_number} - ${contract.title}`
    : "Loading…";

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <ProjectNav projectId={projectId} role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Breadcrumb ── */}
        <div className="px-6 pt-4 pb-1 text-xs text-gray-500 flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => router.push(`/projects/${projectId}/prime-contracts`)}
            className="hover:text-blue-600 transition-colors"
          >
            Prime Contracts
          </button>
          <span>›</span>
          <button
            onClick={() => router.push(`/projects/${projectId}/prime-contracts/${contractId}`)}
            className="hover:text-blue-600 transition-colors"
          >
            {contract ? `Prime Contract #${contract.contract_number}` : "…"}
          </button>
          <span>›</span>
          <span>Change Orders</span>
          <span>›</span>
          <span className="text-gray-700 font-medium">New Potential Change Order</span>
        </div>

        {/* ── Page title ── */}
        <div className="px-6 py-3 shrink-0">
          <h1 className="text-2xl font-normal text-gray-900">New Potential Change Order</h1>
        </div>

        {/* ── Tab bar ── */}
        <div className="px-6 border-b border-gray-200 shrink-0">
          <button className="py-2 px-1 text-sm font-medium text-gray-900 border-b-2 border-gray-900 -mb-px">
            General
          </button>
        </div>

        {/* ── Scrollable form body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-5xl">
            {/* Section header */}
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">
              General Information
            </p>

            {/* Form grid */}
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
                    <input
                      value={contractCompany}
                      onChange={(e) => setContractCompany(e.target.value)}
                      className="w-64 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </Field>
                }
                right={
                  <Field label="Contract:">
                    <button
                      onClick={() =>
                        router.push(`/projects/${projectId}/prime-contracts/${contractId}`)
                      }
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

              {/* Row: Status / Prime Contract Change Order */}
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
                  <Field label="Prime Contract Change Order:">
                    <div className="flex items-center gap-4">
                      {(["none", "add_to_existing", "create_new"] as const).map((opt) => (
                        <label key={opt} className="flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="primeCO"
                            value={opt}
                            checked={primeCOOption === opt}
                            onChange={() => setPrimeCOOption(opt)}
                            className="accent-blue-600"
                          />
                          {opt === "none" ? "None" : opt === "add_to_existing" ? "Add To Existing" : "Create New"}
                        </label>
                      ))}
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

              {/* Row: Private */}
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

              {/* Row: Description (full width) */}
              <div className="px-4 py-3">
                <div className="flex items-start gap-4">
                  <label className="text-xs text-gray-600 w-40 shrink-0 pt-1">Description:</label>
                  <div className="flex-1 border border-gray-300 rounded overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-200">
                      {["B", "I", "U", "S"].map((cmd) => (
                        <button
                          key={cmd}
                          type="button"
                          className="w-5 h-5 text-xs text-gray-600 hover:bg-gray-200 rounded flex items-center justify-center font-medium"
                          style={cmd === "B" ? { fontWeight: "bold" } : cmd === "I" ? { fontStyle: "italic" } : cmd === "U" ? { textDecoration: "underline" } : { textDecoration: "line-through" }}
                        >
                          {cmd}
                        </button>
                      ))}
                      <span className="w-px h-3.5 bg-gray-300 mx-0.5" />
                      {["≡", "≣", "⊨"].map((cmd, i) => (
                        <button key={i} type="button" className="w-5 h-5 text-xs text-gray-600 hover:bg-gray-200 rounded flex items-center justify-center">
                          {cmd}
                        </button>
                      ))}
                      <span className="w-px h-3.5 bg-gray-300 mx-0.5" />
                      {["•", "1.", "⊣", "⊢"].map((cmd, i) => (
                        <button key={i} type="button" className="w-5 h-5 text-xs text-gray-600 hover:bg-gray-200 rounded flex items-center justify-center">
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

              {/* Row: Executed / Signed Change Order Received Date */}
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

              {/* Row: Request Received From / Location */}
              <FormRow
                left={
                  <Field label="Request Received From:">
                    <input
                      value={requestReceivedFrom}
                      onChange={(e) => setRequestReceivedFrom(e.target.value)}
                      className="w-64 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                      placeholder="Select…"
                    />
                  </Field>
                }
                right={
                  <Field label="Location:">
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-48 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    >
                      <option value="">Select a Location</option>
                    </select>
                  </Field>
                }
              />

              {/* Row: Schedule Impact / Field Change */}
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

              {/* Row: Reference / Paid In Full */}
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

              {/* Row: Attachments */}
              <div className="px-4 py-3">
                <div className="flex items-start gap-4">
                  <label className="text-xs text-gray-600 w-40 shrink-0 pt-1">Attachments:</label>
                  <div className="flex-1 flex gap-4 items-stretch min-h-[60px]">
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

        {/* ── Footer actions ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0">
          <button
            onClick={() => router.push(`/projects/${projectId}/prime-contracts/${contractId}`)}
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

/* ── Layout helpers ── */

function FormRow({ left, right }: { left: React.ReactNode; right: React.ReactNode | null }) {
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
