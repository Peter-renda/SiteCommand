"use client";

import { useState, useEffect, useRef } from "react";
import ProjectNav from "@/components/ProjectNav";

type DirectoryContact = {
  id: string;
  type: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  group_name: string | null;
  email: string | null;
};

type DirContact = { id: string; name: string; email: string | null };

type TransmittalItem = {
  id: string;
  format: string;
  description: string;
  date: string;
  copies: string;
};

const DELIVERY_METHODS = ["Mail", "Email", "Hand Delivery", "Courier", "Fax", "Other"];

const ITEM_FORMATS = [
  "Prints",
  "Shop Drawings",
  "Specifications",
  "Product Data",
  "Samples",
  "Change Order",
  "Contract Documents",
  "Correspondence",
  "Other",
];

const SUBMITTED_FOR_OPTIONS = [
  { key: "approval", label: "Approval" },
  { key: "your_use", label: "Your Use" },
  { key: "as_requested", label: "As Requested" },
  { key: "review_and_comment", label: "Review and Comment" },
  { key: "further_processing", label: "Further Processing" },
];

const ACTION_AS_NOTED_OPTIONS = [
  { key: "out_for_signature", label: "Out for Signature" },
  { key: "approved_as_submitted", label: "Approved as Submitted" },
  { key: "approved_as_noted", label: "Approved as Noted" },
  { key: "submit", label: "Submit" },
  { key: "resubmitted", label: "Resubmitted" },
  { key: "returned", label: "Returned" },
  { key: "returned_for_corrections", label: "Returned for Corrections" },
  { key: "resubmit", label: "Resubmit" },
  { key: "due_by", label: "Due By", hasDate: true },
  { key: "received", label: "Received" },
  { key: "received_as_noted", label: "Received as Noted" },
  { key: "sent_date", label: "Sent date", hasDate: true },
];

function contactDisplayName(c: DirectoryContact): string {
  if (c.type === "company") return c.company ?? "Unnamed Company";
  if (c.type === "distribution_group") return c.group_name ?? "Unnamed Group";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed";
}

function SingleContactPicker({
  directory,
  selectedId,
  onChange,
  placeholder = "Select A Person...",
}: {
  directory: DirectoryContact[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-700"
    >
      <option value="">{placeholder}</option>
      {directory.map((c) => (
        <option key={c.id} value={c.id}>
          {contactDisplayName(c)}
        </option>
      ))}
    </select>
  );
}

function MultiContactPicker({
  directory,
  selected,
  onChange,
  placeholder = "Select A Person...",
}: {
  directory: DirectoryContact[];
  selected: DirContact[];
  onChange: (v: DirContact[]) => void;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedIds = new Set(selected.map((s) => s.id));
  const filtered = directory.filter(
    (c) =>
      !selectedIds.has(c.id) &&
      (contactDisplayName(c).toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  function add(c: DirectoryContact) {
    onChange([...selected, { id: c.id, name: contactDisplayName(c), email: c.email }]);
    setSearch("");
    setOpen(false);
  }
  function remove(id: string) {
    onChange(selected.filter((s) => s.id !== id));
  }

  return (
    <div ref={ref} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((s) => (
            <span
              key={s.id}
              className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-gray-100 text-xs text-gray-700 rounded-full"
            >
              {s.name}
              <button
                type="button"
                onClick={() => remove(s.id)}
                className="text-gray-400 hover:text-gray-700 ml-0.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <select
        value=""
        onChange={(e) => {
          const c = directory.find((x) => x.id === e.target.value);
          if (c) add(c);
        }}
        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-700"
      >
        <option value="">{placeholder}</option>
        {filtered.map((c) => (
          <option key={c.id} value={c.id}>
            {contactDisplayName(c)}
          </option>
        ))}
      </select>
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg max-h-40 overflow-y-auto z-20">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(c)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="font-medium text-gray-900">{contactDisplayName(c)}</span>
              {c.email && <span className="text-gray-400 text-xs">{c.email}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple rich text editor using contentEditable
function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  function execCmd(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  }

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-white flex-wrap">
        <ToolBtn onClick={() => execCmd("bold")} title="Bold">
          <span className="font-bold text-sm">B</span>
        </ToolBtn>
        <ToolBtn onClick={() => execCmd("italic")} title="Italic">
          <span className="italic text-sm">I</span>
        </ToolBtn>
        <ToolBtn onClick={() => execCmd("underline")} title="Underline">
          <span className="underline text-sm">U</span>
        </ToolBtn>
        <ToolBtn onClick={() => execCmd("strikeThrough")} title="Strikethrough">
          <span className="line-through text-sm">S</span>
        </ToolBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn onClick={() => execCmd("justifyLeft")} title="Align left">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h12M3 18h18" /></svg>
        </ToolBtn>
        <ToolBtn onClick={() => execCmd("justifyCenter")} title="Align center">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M3 18h18" /></svg>
        </ToolBtn>
        <ToolBtn onClick={() => execCmd("justifyRight")} title="Align right">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 12h12M3 18h18" /></svg>
        </ToolBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn onClick={() => execCmd("insertUnorderedList")} title="Bullet list">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
        </ToolBtn>
        <ToolBtn onClick={() => execCmd("insertOrderedList")} title="Numbered list">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </ToolBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn onClick={() => execCmd("outdent")} title="Outdent">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" /></svg>
        </ToolBtn>
        <ToolBtn onClick={() => execCmd("indent")} title="Indent">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
        </ToolBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolBtn onClick={() => execCmd("undo")} title="Undo">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
        </ToolBtn>
        <ToolBtn onClick={() => execCmd("redo")} title="Redo">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11A3 3 0 003 18v2M21 10l-6 6m6-6l-6-6" /></svg>
        </ToolBtn>
      </div>
      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        data-placeholder={placeholder}
        className="min-h-[120px] px-3 py-2.5 text-sm text-gray-800 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
      />
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
    >
      {children}
    </button>
  );
}

export default function NewTransmittalClient({
  projectId,
  username,
}: {
  projectId: string;
  username: string;
}) {
  const [directory, setDirectory] = useState<DirectoryContact[]>([]);
  const [nextNumber, setNextNumber] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [subject, setSubject] = useState("");
  const [toId, setToId] = useState<string | null>(null);
  const [ccContacts, setCcContacts] = useState<DirContact[]>([]);
  const [sentVia, setSentVia] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submittedFor, setSubmittedFor] = useState<string[]>([]);
  const [actionAsNoted, setActionAsNoted] = useState<string[]>([]);
  const [dueBy, setDueBy] = useState("");
  const [sentDate, setSentDate] = useState("");
  const [items, setItems] = useState<TransmittalItem[]>([]);
  const [newItemFormat, setNewItemFormat] = useState("");
  const [comments, setComments] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/directory`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/transmittals`).then((r) => r.json()),
    ]).then(([dirData, tData]) => {
      setDirectory(Array.isArray(dirData) ? dirData : []);
      if (Array.isArray(tData) && tData.length > 0) {
        setNextNumber(Math.max(...tData.map((t: { transmittal_number: number }) => t.transmittal_number)) + 1);
      }
    });
  }, [projectId]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function toggleCheck(arr: string[], key: string, setArr: (v: string[]) => void) {
    if (arr.includes(key)) {
      setArr(arr.filter((k) => k !== key));
    } else {
      setArr([...arr, key]);
    }
  }

  function addItem() {
    if (!newItemFormat) return;
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), format: newItemFormat, description: "", date: "", copies: "" },
    ]);
    setNewItemFormat("");
  }

  function updateItem(id: string, field: keyof TransmittalItem, value: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/transmittals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        to_id: toId,
        cc_contacts: ccContacts,
        sent_via: sentVia || null,
        private: isPrivate,
        submitted_for: submittedFor,
        action_as_noted: actionAsNoted,
        due_by: dueBy || null,
        sent_date: sentDate || null,
        items: items.map(({ id: _id, ...rest }) => rest),
        comments,
      }),
    });
    if (res.ok) {
      window.location.href = `/projects/${projectId}/transmittals`;
    } else {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          SiteCommand
        </a>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <a
            href={`/projects/${projectId}/transmittals`}
            className="text-orange-500 hover:text-orange-600 transition-colors"
          >
            Transmittals
          </a>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-600">New Transmittal</span>
        </div>

        {/* Page title */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-5">New Transmittal</h1>

        {/* Tab */}
        <div className="border-b border-gray-200 mb-6">
          <button className="px-0 pb-2 text-sm font-medium text-gray-900 border-b-2 border-orange-500 -mb-px mr-6">
            General
          </button>
        </div>

        {/* GENERAL INFORMATION */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">General Information</h2>

          {/* Grid rows */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-5">
            {/* Row 1: Number | Subject */}
            <div className="flex items-center gap-6">
              <label className="text-sm text-gray-600 w-24 flex-shrink-0">Number:</label>
              <input
                type="text"
                value={nextNumber}
                readOnly
                className="w-32 px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700"
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="text-sm text-gray-600 w-24 flex-shrink-0">Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Row 2: To | CC */}
            <div className="flex items-center gap-6">
              <label className="text-sm text-gray-600 w-24 flex-shrink-0">To:</label>
              <div className="flex-1">
                <SingleContactPicker
                  directory={directory}
                  selectedId={toId}
                  onChange={setToId}
                  placeholder="Select A Person..."
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="text-sm text-gray-600 w-24 flex-shrink-0">CC:</label>
              <div className="flex-1">
                <MultiContactPicker
                  directory={directory}
                  selected={ccContacts}
                  onChange={setCcContacts}
                  placeholder="Select A Person..."
                />
              </div>
            </div>

            {/* Row 3: Sent Via | Private */}
            <div className="flex items-center gap-6">
              <label className="text-sm text-gray-600 w-24 flex-shrink-0">Sent Via:</label>
              <select
                value={sentVia}
                onChange={(e) => setSentVia(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-700"
              >
                <option value="">Select Delivery Method</option>
                {DELIVERY_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-6">
              <label className="text-sm text-gray-600 w-24 flex-shrink-0">Private:</label>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Row 4: Submitted For | Action As Noted */}
          <div className="grid grid-cols-2 gap-x-12 mt-5">
            {/* Submitted For */}
            <div className="flex gap-6">
              <label className="text-sm text-gray-600 w-24 flex-shrink-0 pt-0.5">Submitted For:</label>
              <div className="flex flex-col gap-2">
                {SUBMITTED_FOR_OPTIONS.map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={submittedFor.includes(opt.key)}
                      onChange={() => toggleCheck(submittedFor, opt.key, setSubmittedFor)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action As Noted */}
            <div className="flex gap-6">
              <label className="text-sm text-gray-600 w-24 flex-shrink-0 pt-0.5">Action As Noted:</label>
              <div className="flex flex-col gap-2">
                {ACTION_AS_NOTED_OPTIONS.map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actionAsNoted.includes(opt.key)}
                      onChange={() => toggleCheck(actionAsNoted, opt.key, setActionAsNoted)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                    {opt.hasDate && opt.key === "due_by" && actionAsNoted.includes(opt.key) && (
                      <input
                        type="date"
                        value={dueBy}
                        onChange={(e) => setDueBy(e.target.value)}
                        className="ml-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    )}
                    {opt.hasDate && opt.key === "sent_date" && actionAsNoted.includes(opt.key) && (
                      <input
                        type="date"
                        value={sentDate}
                        onChange={(e) => setSentDate(e.target.value)}
                        className="ml-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ITEMS */}
        <section className="mb-0">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Items</h2>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600 w-1/3">Format</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600 flex-1">Description</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600 w-36">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600 w-24"># Copies</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.format}
                        onChange={(e) => updateItem(item.id, "format", e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => updateItem(item.id, "date", e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={item.copies}
                        onChange={(e) => updateItem(item.id, "copies", e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Add item row */}
                <tr>
                  <td className="px-3 py-2" colSpan={5}>
                    <div className="flex items-center gap-3">
                      <select
                        value={newItemFormat}
                        onChange={(e) => setNewItemFormat(e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white text-gray-700"
                      >
                        <option value="">Select an Item:</option>
                        {ITEM_FORMATS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      {newItemFormat && (
                        <button
                          type="button"
                          onClick={addItem}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Orange divider */}
        <div className="h-0.5 bg-orange-400 my-6" />

        {/* COMMENTS */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Comments</h2>
          <RichTextEditor
            value={comments}
            onChange={setComments}
            placeholder="Add comments..."
          />
        </section>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <a
            href={`/projects/${projectId}/transmittals`}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </a>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create Transmittal"}
          </button>
        </div>
      </main>
    </div>
  );
}
