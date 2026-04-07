"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";

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

const STATUSES = [
  "Draft",
  "Approved",
  "Pending - In Review",
  "Pending - Revised",
  "Rejected",
  "Void",
];

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
}: {
  projectId: string;
  commitmentId: string;
  eventIds: string;
  createdBy: string;
}) {
  const router = useRouter();
  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [nextNumber, setNextNumber] = useState("001");
  const [revision, setRevision] = useState("0");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Draft");
  const [changeReason, setChangeReason] = useState("");
  const [description, setDescription] = useState("");
  const [designatedReviewer, setDesignatedReviewer] = useState("");
  const [amount, setAmount] = useState("0.00");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sourceEventIds, setSourceEventIds] = useState<string[]>([]);
  const [budgetCodes, setBudgetCodes] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/commitments/${commitmentId}`)
      .then((r) => r.json())
      .then((data) => {
        setCommitment(data);
      })
      .catch(() => {});
  }, [projectId, commitmentId]);

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
          setDescription(events[0].description?.trim() || `CE #${String(events[0].number).padStart(3, "0")} - ${events[0].title}`);
        } else {
          setTitle(events.map((e) => `CE #${String(e.number).padStart(3, "0")}`).join(", "));
          setDescription(events.map((e) => `CE #${String(e.number).padStart(3, "0")} - ${e.title}`).join("\n"));
        }
      })
      .catch(() => {});
  }, [eventIds, projectId]);

  async function createCommitmentCO() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/change-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitment_id: commitmentId,
          type: "commitment",
          contract_name: commitment ? `${String(commitment.number).padStart(3, "0")} - ${commitment.title}` : "",
          revision: parseInt(revision, 10) || 0,
          title,
          status,
          contract_company: commitment?.contract_company || "",
          change_reason: changeReason,
          description,
          designated_reviewer: designatedReviewer || null,
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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <ProjectNav projectId={projectId} />
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <h1 className="text-2xl font-normal text-gray-900 mb-4">New Commitment Change Order</h1>
        <div className="max-w-4xl border border-gray-200 rounded divide-y divide-gray-200">
          <Row label="#"><input readOnly value={nextNumber} className="input" /></Row>
          <Row label="Revision"><input value={revision} onChange={(e) => setRevision(e.target.value)} className="input" /></Row>
          <Row label="Created By"><span className="text-xs text-gray-700">{createdBy}</span></Row>
          <Row label="Contract">
            <span className="text-xs text-gray-700">{commitment ? `${String(commitment.number).padStart(3, "0")} - ${commitment.title}` : "Loading..."}</span>
          </Row>
          <Row label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" /></Row>
          <Row label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Row>
          <Row label="Change Reason">
            <select value={changeReason} onChange={(e) => setChangeReason(e.target.value)} className="input">
              <option value="">Select...</option>
              {CHANGE_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Row>
          <Row label="Designated Reviewer"><input value={designatedReviewer} onChange={(e) => setDesignatedReviewer(e.target.value)} className="input" /></Row>
          <Row label="Amount"><input value={amount} onChange={(e) => setAmount(e.target.value)} className="input" /></Row>
          <Row label="Budget Codes"><span className="text-xs text-gray-700">{budgetCodes.length ? budgetCodes.join(", ") : "No budget codes linked"}</span></Row>
          <Row label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input w-full min-h-28" />
          </Row>
        </div>

        {saveError && <p className="mt-4 text-sm text-red-600">{saveError}</p>}
        <div className="mt-5 flex gap-2">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm border border-gray-300 rounded">Cancel</button>
          <button disabled={saving} onClick={createCommitmentCO} className="px-4 py-2 text-sm text-white bg-orange-500 rounded disabled:opacity-50">{saving ? "Saving..." : "Create Commitment CO"}</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 flex gap-4 items-start">
      <label className="text-xs text-gray-600 w-44 shrink-0 pt-1">{label}:</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
