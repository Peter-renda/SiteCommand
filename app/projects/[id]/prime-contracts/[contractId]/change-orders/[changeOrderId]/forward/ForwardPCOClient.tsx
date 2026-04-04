"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";
import { X, Paperclip, ChevronDown } from "lucide-react";

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  job_title: string;
};

type ChangeOrder = {
  id: string;
  number: string;
  title: string;
  description: string;
  status: string;
  contract_name: string;
  change_reason: string;
  revision: number;
  created_at: string;
};

type Contract = {
  id: string;
  contract_number: number;
  title: string;
};

function contactLabel(c: Contact) {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
  return c.company ? `${name} (${c.company})` : name;
}

function PeopleSearch({
  label,
  selected,
  onAdd,
  onRemove,
  contacts,
}: {
  label: string;
  selected: Contact[];
  onAdd: (c: Contact) => void;
  onRemove: (id: string) => void;
  contacts: Contact[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = contacts.filter((c) => {
    if (selected.find((s) => s.id === c.id)) return false;
    const q = query.toLowerCase();
    return (
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-gray-200 last:border-0">
      <label className="text-xs text-gray-600 w-24 shrink-0 pt-2">{label}</label>
      <div className="flex-1" ref={ref}>
        <div className="border border-gray-300 rounded px-2 py-1 flex flex-wrap gap-1 min-h-[32px] relative">
          {selected.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded"
            >
              <span>{contactLabel(c)}</span>
              <button
                type="button"
                onClick={() => onRemove(c.id)}
                className="text-blue-400 hover:text-blue-700"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <div className="relative flex-1 min-w-[160px]">
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Start typing to search people..."
              className="w-full text-xs focus:outline-none bg-transparent py-0.5"
            />
            {open && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 w-72 max-h-48 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-400">No contacts found</div>
                ) : (
                  filtered.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onAdd(c);
                        setQuery("");
                        setOpen(false);
                      }}
                    >
                      <div className="font-medium">
                        {[c.first_name, c.last_name].filter(Boolean).join(" ")}
                      </div>
                      {c.company && (
                        <div className="text-gray-400">{c.company}</div>
                      )}
                      {c.email && (
                        <div className="text-gray-400">{c.email}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForwardPCOClient({
  projectId,
  contractId,
  changeOrderId,
  role,
}: {
  projectId: string;
  contractId: string;
  changeOrderId: string;
  role: string;
}) {
  const router = useRouter();
  const [changeOrder, setChangeOrder] = useState<ChangeOrder | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [toList, setToList] = useState<Contact[]>([]);
  const [ccList, setCcList] = useState<Contact[]>([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("Sent from SiteCommand");
  const [sending, setSending] = useState(false);

  // Fetch change order
  useEffect(() => {
    fetch(`/api/projects/${projectId}/change-orders/${changeOrderId}`)
      .then((r) => r.json())
      .then((data) => {
        setChangeOrder(data);
        setSubject(`FW: Prime Contract Change Order: PCCO #${data.number}: ${data.title}`);
      })
      .catch(() => {});
  }, [projectId, changeOrderId]);

  // Fetch contract
  useEffect(() => {
    fetch(`/api/projects/${projectId}/prime-contracts/${contractId}`)
      .then((r) => r.json())
      .then(setContract)
      .catch(() => {});
  }, [projectId, contractId]);

  // Fetch project directory
  useEffect(() => {
    fetch(`/api/projects/${projectId}/directory`)
      .then((r) => r.json())
      .then((data: Contact[]) => setContacts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [projectId]);

  const pcoLabel = changeOrder
    ? `PCCO #${changeOrder.number}: ${changeOrder.title}`
    : "…";

  const pageTitle = changeOrder
    ? `Prime Contract Change Order #${changeOrder.number}: ${changeOrder.title}`
    : "Prime Contract Change Order";

  function handleSend() {
    setSending(true);
    // Future: POST email to API
    setTimeout(() => {
      router.push(`/projects/${projectId}/prime-contracts/${contractId}`);
    }, 500);
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
            onClick={() => router.push(`/projects/${projectId}/prime-contracts/${contractId}`)}
            className="hover:text-blue-600 transition-colors"
          >
            {contract ? `Prime Contract #${contract.contract_number}` : "…"}
          </button>
          <span>›</span>
          <span>Change Orders</span>
          <span>›</span>
          <span className="text-gray-700 font-medium">{pcoLabel}</span>
        </div>

        {/* ── Page title ── */}
        <div className="px-6 py-3 shrink-0">
          <h1 className="text-2xl font-normal text-gray-900">{pageTitle}</h1>
        </div>

        {/* ── Tab bar ── */}
        <div className="px-6 border-b border-gray-200 shrink-0 flex gap-6">
          {["General", "Schedule of Values", "Related Items", "Emails", "Financial Markup", "Change History"].map(
            (tab) => (
              <button
                key={tab}
                className={`py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  tab === "Emails"
                    ? "border-gray-900 text-gray-900 font-medium"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl">
            {/* Section header */}
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">
              Forward Prime Contract Change Order:{" "}
              {changeOrder ? `#${changeOrder.number}: ${changeOrder.title}` : "…"}
            </p>

            <div className="border border-gray-200 rounded divide-y divide-gray-200">
              {/* To */}
              <div className="px-4">
                <PeopleSearch
                  label="To:"
                  selected={toList}
                  onAdd={(c) => setToList((prev) => [...prev, c])}
                  onRemove={(id) => setToList((prev) => prev.filter((c) => c.id !== id))}
                  contacts={contacts}
                />
              </div>

              {/* CC */}
              <div className="px-4">
                <PeopleSearch
                  label="CC:"
                  selected={ccList}
                  onAdd={(c) => setCcList((prev) => [...prev, c])}
                  onRemove={(id) => setCcList((prev) => prev.filter((c) => c.id !== id))}
                  contacts={contacts}
                />
              </div>

              {/* Private */}
              <div className="px-4 py-2.5 flex items-center gap-4">
                <label className="text-xs text-gray-600 w-24 shrink-0 flex items-center gap-1">
                  Private:
                </label>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-gray-300 accent-blue-600"
                />
              </div>

              {/* Subject */}
              <div className="px-4 py-2.5 flex items-center gap-4">
                <label className="text-xs text-gray-600 w-24 shrink-0">Subject:</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>

              {/* Attachments */}
              <div className="px-4 py-2.5 flex items-start gap-4">
                <label className="text-xs text-gray-600 w-24 shrink-0 pt-1">Attachments:</label>
                <div className="flex flex-1 gap-4 items-stretch min-h-[48px]">
                  <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 shrink-0 self-center">
                    <Paperclip className="w-3.5 h-3.5" />
                    Attach File(s)
                  </button>
                  <div className="flex-1 border border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">
                    Drag and Drop File(s)
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="px-4 py-2.5 flex items-start gap-4">
                <label className="text-xs text-gray-600 w-24 shrink-0 pt-1">Message:</label>
                <div className="flex-1 border border-gray-300 rounded overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-200">
                    {["B", "I", "U"].map((cmd) => (
                      <button
                        key={cmd}
                        type="button"
                        className="w-5 h-5 text-xs text-gray-600 hover:bg-gray-200 rounded flex items-center justify-center font-medium"
                        style={
                          cmd === "B"
                            ? { fontWeight: "bold" }
                            : cmd === "I"
                            ? { fontStyle: "italic" }
                            : { textDecoration: "underline" }
                        }
                      >
                        {cmd}
                      </button>
                    ))}
                    <span className="w-px h-3.5 bg-gray-300 mx-0.5" />
                    {["≡", "≣", "⊨", "•", "1.", "⊣", "⊢", "✂", "⎘"].map((cmd, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-5 h-5 text-xs text-gray-600 hover:bg-gray-200 rounded flex items-center justify-center"
                      >
                        {cmd}
                      </button>
                    ))}
                    <span className="w-px h-3.5 bg-gray-300 mx-0.5" />
                    <select className="text-xs border border-gray-200 rounded px-1 focus:outline-none">
                      <option>Font Sizes</option>
                      {[10, 12, 14, 16, 18, 24].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 text-xs text-gray-800 resize-none focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0">
          <button
            onClick={() => router.push(`/projects/${projectId}/prime-contracts/${contractId}`)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || toList.length === 0}
            className="px-4 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}
