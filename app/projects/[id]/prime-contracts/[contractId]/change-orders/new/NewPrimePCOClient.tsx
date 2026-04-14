"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";
import { Paperclip } from "lucide-react";

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

type UserOption = { id: string; name: string };

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

  // Form state
  const [revision, setRevision] = useState("0");
  const [title, setTitle] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [invoicedDate, setInvoicedDate] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [description, setDescription] = useState("");
  const [executed, setExecuted] = useState(false);
  const [signedDate, setSignedDate] = useState("");
  const [selectedPCO, setSelectedPCO] = useState("");
  const [scheduleImpact, setScheduleImpact] = useState("");
  const [newSubstantialCompletionDate, setNewSubstantialCompletionDate] = useState("");
  const [signer, setSigner] = useState("");
  const [workflow, setWorkflow] = useState("Owner Change Order Workflow");
  const [accountant, setAccountant] = useState("");
  const [noUser, setNoUser] = useState("");
  const [projectManager, setProjectManager] = useState("");
  const [distribution, setDistribution] = useState<string[]>([]);

  // User/directory options
  const [companyUsers, setCompanyUsers] = useState<UserOption[]>([]);
  const [directoryContacts, setDirectoryContacts] = useState<UserOption[]>([]);

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

  const contractLabel = contract
    ? `Prime Contract #${contract.contract_number} - ${contract.title}`
    : "Loading…";

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

  // Fetch company users for Accountant dropdown
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(
        (data: { id: string; username: string; first_name: string | null; last_name: string | null }[]) => {
          setCompanyUsers(
            data.map((u) => ({
              id: u.id,
              name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username,
            }))
          );
        }
      )
      .catch(() => {});
  }, []);

  // Fetch project directory for No User, Project Manager, Distribution
  useEffect(() => {
    fetch(`/api/projects/${projectId}/directory`)
      .then((r) => r.json())
      .then(
        (data: { id: string; first_name: string | null; last_name: string | null; email: string | null }[]) => {
          setDirectoryContacts(
            data.map((c) => ({
              id: c.id,
              name:
                [c.first_name, c.last_name].filter(Boolean).join(" ") ||
                c.email ||
                c.id,
            }))
          );
        }
      )
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
          description,
          is_private: isPrivate,
          executed,
          schedule_impact: scheduleImpact ? parseInt(scheduleImpact, 10) : null,
          signed_change_order_received_date: signedDate || null,
          invoiced_date: invoicedDate || null,
          paid_date: paidDate || null,
          new_substantial_completion_date: newSubstantialCompletionDate || null,
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
          <span className="text-gray-700 font-medium">New Prime Contract Change Order</span>
        </div>

        {/* ── Page title ── */}
        <div className="px-6 py-3 shrink-0">
          <h1 className="text-4xl font-normal text-gray-700">New Prime Contract Change Order</h1>
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

            {/* ── GENERAL INFORMATION ── */}
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">
              General Information
            </p>
            <div className="border border-gray-200 rounded divide-y divide-gray-200">

              {/* # / Date Created */}
              <FormRow
                left={
                  <Field label="#">
                    <input
                      value={nextNumber}
                      onChange={(e) => setNextNumber(e.target.value)}
                      className="w-40 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </Field>
                }
                right={
                  <Field label="Date Created:">
                    <span className="text-xs text-gray-700">{dateCreated}</span>
                  </Field>
                }
              />

              {/* Revision / Created By */}
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

              {/* Title (left half only) */}
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

              {/* Status / Private */}
              <FormRow
                left={
                  <Field label="Status:">
                    <span className="text-xs text-gray-700">Status is set via workflow.</span>
                  </Field>
                }
                right={
                  <Field label="Private:">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="rounded border-gray-300 accent-blue-600"
                    />
                  </Field>
                }
              />

              {/* null / Invoiced Date */}
              <FormRow
                left={null}
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

              {/* null / Paid Date */}
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

              {/* Description (full width) */}
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

              {/* Executed / Signed Change Order Received Date */}
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

              {/* Potential Change Orders */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-4">
                  <label className="text-xs text-gray-600 w-40 shrink-0">
                    Potential Change Orders:
                  </label>
                  <select
                    value={selectedPCO}
                    onChange={(e) => setSelectedPCO(e.target.value)}
                    className="w-48 border border-gray-300 rounded px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    <option value="">Select a PCO to Add...</option>
                  </select>
                </div>
              </div>

              {/* Schedule Impact */}
              <div className="px-4 py-3">
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
              </div>

              {/* Attachments */}
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

            {/* ── ADDITIONAL FIELDS ── */}
            <div className="mt-8 border-t border-gray-200 pt-4">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">
                Additional Fields
              </p>
              <div className="border border-gray-200 rounded divide-y divide-gray-200">
                <FormRow
                  left={
                    <Field label="New Date of Substantial Completion:">
                      <input
                        type="date"
                        value={newSubstantialCompletionDate}
                        onChange={(e) => setNewSubstantialCompletionDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                      />
                    </Field>
                  }
                  right={
                    <Field label="Project Executive or Project Manager Signer:">
                      <select
                        value={signer}
                        onChange={(e) => setSigner(e.target.value)}
                        className="w-64 border border-gray-300 rounded px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300"
                      >
                        <option value=""></option>
                      </select>
                    </Field>
                  }
                />
              </div>
            </div>

            {/* ── WORKFLOW SETUP ── */}
            <div className="mt-8 border-t border-gray-200 pt-4">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">
                Workflow Setup
              </p>
              <div className="border border-gray-200 rounded divide-y divide-gray-200">
                <FormRow
                  left={
                    <Field label="Workflow:">
                      <select
                        value={workflow}
                        onChange={(e) => setWorkflow(e.target.value)}
                        className="w-64 border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
                      >
                        <option>Owner Change Order Workflow</option>
                      </select>
                    </Field>
                  }
                  right={null}
                />
                <FormRow
                  left={
                    <Field label="Accountant:">
                      <select
                        value={accountant}
                        onChange={(e) => setAccountant(e.target.value)}
                        className="w-64 border border-gray-300 rounded px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300"
                      >
                        <option value=""></option>
                        {companyUsers.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </Field>
                  }
                  right={null}
                />
                <FormRow
                  left={
                    <Field label="No User:">
                      <select
                        value={noUser}
                        onChange={(e) => setNoUser(e.target.value)}
                        className="w-64 border border-gray-300 rounded px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300"
                      >
                        <option value=""></option>
                        {directoryContacts.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </Field>
                  }
                  right={null}
                />
                <FormRow
                  left={
                    <Field label="Project Manager:">
                      <select
                        value={projectManager}
                        onChange={(e) => setProjectManager(e.target.value)}
                        className="w-64 border border-gray-300 rounded px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300"
                      >
                        <option value=""></option>
                        {directoryContacts.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </Field>
                  }
                  right={null}
                />
                <FormRow
                  left={
                    <div className="flex items-start gap-4">
                      <label className="text-xs text-gray-600 w-40 shrink-0 pt-1">Distribution:</label>
                      <div className="space-y-2">
                        {distribution.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {distribution.map((id) => {
                              const person = directoryContacts.find((c) => c.id === id);
                              return (
                                <span
                                  key={id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                                >
                                  {person?.name ?? id}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDistribution((prev) => prev.filter((d) => d !== id))
                                    }
                                    className="hover:text-blue-900 leading-none"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <select
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && !distribution.includes(val)) {
                              setDistribution((prev) => [...prev, val]);
                            }
                          }}
                          className="w-64 border border-gray-300 rounded px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        >
                          <option value="">Select A Person...</option>
                          {directoryContacts
                            .filter((c) => !distribution.includes(c.id))
                            .map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                      </div>
                    </div>
                  }
                  right={null}
                />

                {/* Reminder rows */}
                <FormRow
                  left={<ReminderRow label="PM Creates PCCO:" />}
                  right={<ReminderRow label="Owner/Architect Review:" />}
                />
                <FormRow
                  left={<ReminderRow label="PCCO Approved:" />}
                  right={<ReminderRow label="PCCO Rejected:" />}
                />
                <FormRow
                  left={<ReminderRow label="Cost Codes Changed:" />}
                  right={<ReminderRow label="PCCO Editing:" />}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── Footer actions ── */}
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

/* ── Layout helpers ── */

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

function ReminderRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-700 w-40 shrink-0">{label}</span>
      <span className="text-xs text-gray-600 whitespace-nowrap">
        Start sending reminder emails after
      </span>
      <input className="w-8 border border-gray-300 rounded px-1 py-1 text-xs" />
      <select className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700">
        <option>business days</option>
      </select>
    </div>
  );
}
