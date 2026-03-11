"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ProjectNav from "@/components/ProjectNav";

// ── Types ────────────────────────────────────────────────────────────────────

type PrimeContract = {
  id: string;
  contract_number: number;
  owner_client_id: string | null;
  title: string;
  status: string;
  executed: boolean;
  default_retainage: number | null;
  contractor_id: string | null;
  architect_engineer_id: string | null;
  description: string | null;
  inclusions: string | null;
  exclusions: string | null;
  start_date: string | null;
  estimated_completion_date: string | null;
  actual_completion_date: string | null;
  signed_contract_received_date: string | null;
  contract_termination_date: string | null;
  is_private: boolean;
  non_admin_access: DirectoryContact[];
  allow_non_admin_sov_view: boolean;
  accounting_method: string;
  attachments: Attachment[];
  created_at: string;
  sov_items?: SovItem[];
};

type SovItem = {
  id?: string;
  item_number: number;
  group_name: string | null;
  budget_code: string;
  description: string;
  amount: number;
  billed_to_date: number;
  isGroup?: boolean;
};

type DirectoryContact = {
  id: string;
  type: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  group_name: string | null;
  email: string | null;
};

type Attachment = {
  name: string;
  url: string;
  size: number;
};

// ── Constants ────────────────────────────────────────────────────────────────

const STATUSES = [
  "Draft",
  "Out for Bid",
  "Out for Signature",
  "Approved",
  "Pending Execution",
  "Executed",
  "Terminated",
];

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600",
  "Out for Bid": "bg-amber-50 text-amber-700",
  "Out for Signature": "bg-blue-50 text-blue-700",
  Approved: "bg-green-50 text-green-700",
  "Pending Execution": "bg-orange-50 text-orange-700",
  Executed: "bg-emerald-50 text-emerald-700",
  Terminated: "bg-red-50 text-red-700",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function contactDisplayName(c: DirectoryContact): string {
  if (c.type === "company") return c.company ?? "Unnamed Company";
  if (c.type === "distribution_group") return c.group_name ?? "Unnamed Group";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed";
}

function fmt(n: number): string {
  if (n === 0) return "$0.00";
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `($${formatted})` : `$${formatted}`;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Rich Text Editor ─────────────────────────────────────────────────────────

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
  const isInit = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInit.current) {
      editorRef.current.innerHTML = value;
      isInit.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function exec(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML ?? "");
  }

  const ToolBtn = ({
    title,
    onClick,
    children,
  }: {
    title: string;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="px-1.5 py-0.5 text-gray-600 hover:bg-gray-100 rounded text-sm leading-none select-none"
    >
      {children}
    </button>
  );

  const Divider = () => <span className="w-px h-4 bg-gray-200 mx-0.5 inline-block" />;

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1 border-b border-gray-200 bg-white">
        <ToolBtn title="Bold" onClick={() => exec("bold")}>
          <b>B</b>
        </ToolBtn>
        <ToolBtn title="Italic" onClick={() => exec("italic")}>
          <i>I</i>
        </ToolBtn>
        <ToolBtn title="Underline" onClick={() => exec("underline")}>
          <u>U</u>
        </ToolBtn>
        <ToolBtn title="Strikethrough" onClick={() => exec("strikeThrough")}>
          <s>S</s>
        </ToolBtn>
        <Divider />
        <ToolBtn title="Align Left" onClick={() => exec("justifyLeft")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h16" />
          </svg>
        </ToolBtn>
        <ToolBtn title="Align Center" onClick={() => exec("justifyCenter")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M4 18h16" />
          </svg>
        </ToolBtn>
        <ToolBtn title="Align Right" onClick={() => exec("justifyRight")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M10 12h10M4 18h16" />
          </svg>
        </ToolBtn>
        <Divider />
        <ToolBtn title="Bullet List" onClick={() => exec("insertUnorderedList")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h1m2 0h13M4 12h1m2 0h13M4 18h1m2 0h13" />
          </svg>
        </ToolBtn>
        <ToolBtn title="Numbered List" onClick={() => exec("insertOrderedList")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </ToolBtn>
        <Divider />
        <ToolBtn title="Indent" onClick={() => exec("indent")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12l4 3-4 3M9 12h12M3 18h18" />
          </svg>
        </ToolBtn>
        <ToolBtn title="Outdent" onClick={() => exec("outdent")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M7 9l-4 3 4 3M3 18h18" />
          </svg>
        </ToolBtn>
        <Divider />
        <ToolBtn title="Cut" onClick={() => exec("cut")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9a3 3 0 100 6 3 3 0 000-6zm0 0l7.5-4.5M6 15l7.5 4.5M20.5 6.5L13.5 10.5M20.5 17.5L13.5 13.5" />
          </svg>
        </ToolBtn>
        <ToolBtn title="Copy" onClick={() => exec("copy")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        </ToolBtn>
        <ToolBtn title="Paste" onClick={() => exec("paste")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </ToolBtn>
        <Divider />
        <select
          defaultValue="12pt"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => exec("fontSize", e.target.value === "12pt" ? "3" : e.target.value === "14pt" ? "4" : e.target.value === "18pt" ? "5" : "3")}
          className="text-xs border border-gray-200 rounded px-1 py-0.5 focus:outline-none"
        >
          <option value="10pt">10pt</option>
          <option value="12pt">12pt</option>
          <option value="14pt">14pt</option>
          <option value="18pt">18pt</option>
          <option value="24pt">24pt</option>
        </select>
        <Divider />
        <ToolBtn title="Undo" onClick={() => exec("undo")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10H17a4 4 0 010 8h-4M3 10l4-4M3 10l4 4" />
          </svg>
        </ToolBtn>
        <ToolBtn title="Redo" onClick={() => exec("redo")}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H7a4 4 0 000 8h4M21 10l-4-4M21 10l-4 4" />
          </svg>
        </ToolBtn>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML ?? "")}
        data-placeholder={placeholder}
        className="min-h-[80px] p-3 text-sm focus:outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400"
      />
    </div>
  );
}

// ── Single Select Dropdown ────────────────────────────────────────────────────

function SingleSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 text-left"
      >
        <span className={selected ? "text-gray-900 truncate" : "text-gray-400"}>
          {selected ? selected.label : (placeholder ?? "Select")}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-30 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {value && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(""); setSearch(""); setOpen(false); }}
                className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:bg-gray-50"
              >
                Clear selection
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-400">No results</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onChange(o.value); setSearch(""); setOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${value === o.value ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-900"}`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Multi Select Dropdown ─────────────────────────────────────────────────────

function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedSet = new Set(value);
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabels = value.map((v) => options.find((o) => o.value === v)?.label).filter(Boolean).join(", ");

  function toggle(v: string) {
    if (selectedSet.has(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 text-left"
      >
        <span className={value.length === 0 ? "text-gray-400 truncate" : "text-gray-900 truncate"}>
          {value.length === 0 ? (placeholder ?? "Select Values") : selectedLabels}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-30 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-400">No results</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(o.value)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${selectedSet.has(o.value) ? "bg-blue-50" : "hover:bg-gray-50"}`}
                >
                  <span className={selectedSet.has(o.value) ? "text-blue-700" : "text-gray-900"}>{o.label}</span>
                  {selectedSet.has(o.value) && (
                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SOV Table ────────────────────────────────────────────────────────────────

function SovTable({
  items,
  onChange,
  accountingMethod,
  onChangeMethod,
}: {
  items: SovItem[];
  onChange: (items: SovItem[]) => void;
  accountingMethod: string;
  onChangeMethod: (m: string) => void;
}) {
  function addLine() {
    const nextNum = items.filter((i) => !i.isGroup).length + 1;
    onChange([
      ...items,
      {
        item_number: nextNum,
        group_name: null,
        budget_code: "",
        description: "",
        amount: 0,
        billed_to_date: 0,
      },
    ]);
  }

  function addGroup() {
    const groupName = `Group ${items.filter((i) => i.isGroup).length + 1}`;
    onChange([
      ...items,
      {
        item_number: 0,
        group_name: groupName,
        budget_code: "",
        description: "",
        amount: 0,
        billed_to_date: 0,
        isGroup: true,
      },
    ]);
  }

  function updateItem(idx: number, field: keyof SovItem, val: string | number | null) {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange(updated);
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  const totalAmount = items.filter((i) => !i.isGroup).reduce((s, i) => s + (i.amount || 0), 0);
  const totalBilled = items.filter((i) => !i.isGroup).reduce((s, i) => s + (i.billed_to_date || 0), 0);
  const totalRemaining = totalAmount - totalBilled;

  return (
    <div>
      {/* Banner */}
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-4 py-3 mb-4">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-blue-700">
            This contract&apos;s default accounting method is {accountingMethod === "amount" ? "amount-based" : "unit/quantity-based"}.
            {accountingMethod === "amount" && " To use budget codes with a unit of measure association, select Change to Unit/Quantity."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChangeMethod(accountingMethod === "amount" ? "unit_quantity" : "amount")}
          className="ml-4 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap shrink-0"
        >
          {accountingMethod === "amount" ? "Change to Unit/Quantity" : "Change to Amount"}
        </button>
      </div>

      {/* Add Group */}
      <div className="mb-3">
        <button
          type="button"
          onClick={addGroup}
          className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 bg-white hover:bg-gray-50"
        >
          Add Group
        </button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 w-12">#</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 w-40">Budget Code</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Description</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-36">Amount</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-36">Billed to Date</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-36">Amount Remaining</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
                      <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">You Have No Line Items Yet</p>
                    <button
                      type="button"
                      onClick={addLine}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded"
                    >
                      Add Line
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, idx) =>
                item.isGroup ? (
                  <tr key={idx} className="bg-gray-50 border-b border-gray-200">
                    <td colSpan={6} className="px-3 py-2">
                      <input
                        type="text"
                        value={item.group_name ?? ""}
                        onChange={(e) => updateItem(idx, "group_name", e.target.value)}
                        className="w-full text-sm font-semibold text-gray-700 bg-transparent focus:outline-none"
                        placeholder="Group name"
                      />
                    </td>
                    <td className="px-2">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-gray-300 hover:text-red-500"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500 text-xs">{item.item_number}</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.budget_code}
                        onChange={(e) => updateItem(idx, "budget_code", e.target.value)}
                        className="w-full text-sm focus:outline-none border-b border-transparent focus:border-gray-300 bg-transparent"
                        placeholder="—"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        className="w-full text-sm focus:outline-none border-b border-transparent focus:border-gray-300 bg-transparent"
                        placeholder="—"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.amount || ""}
                        onChange={(e) => updateItem(idx, "amount", parseFloat(e.target.value) || 0)}
                        className="w-full text-sm text-right focus:outline-none border-b border-transparent focus:border-gray-300 bg-transparent"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-gray-400">{fmt(item.billed_to_date)}</td>
                    <td className="px-3 py-2 text-right text-sm text-gray-700">{fmt((item.amount || 0) - (item.billed_to_date || 0))}</td>
                    <td className="px-2">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-gray-300 hover:text-red-500"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>

        {/* Footer row */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={addLine}
            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded"
          >
            Add Line
          </button>
          <div className="flex gap-8 text-sm font-medium text-gray-700">
            <span>Total:</span>
            <span className="w-36 text-right">{fmt(totalAmount)}</span>
            <span className="w-36 text-right">{fmt(totalBilled)}</span>
            <span className="w-36 text-right">{fmt(totalRemaining)}</span>
          </div>
        </div>
      </div>

      {/* Import */}
      <div className="mt-3">
        <div className="relative inline-block">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 bg-white hover:bg-gray-50"
          >
            Import
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Attachment Drop Zone ──────────────────────────────────────────────────────

function AttachmentZone({
  attachments,
  onChange,
}: {
  attachments: Attachment[];
  onChange: (a: Attachment[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newAttachments: Attachment[] = Array.from(files).map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
    }));
    onChange([...attachments, ...newAttachments]);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"}`}
    >
      {attachments.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-xs">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-gray-700 max-w-[120px] truncate">{a.name}</span>
              <button
                type="button"
                onClick={() => onChange(attachments.filter((_, j) => j !== i))}
                className="text-gray-400 hover:text-red-500 ml-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
      >
        Attach Files
      </button>
      <p className="text-xs text-gray-400 mt-2">or Drag &amp; Drop</p>
    </div>
  );
}

// ── Create Form ──────────────────────────────────────────────────────────────

type FormState = {
  owner_client_id: string;
  title: string;
  status: string;
  executed: boolean;
  default_retainage: string;
  contractor_id: string;
  architect_engineer_id: string;
  description: string;
  inclusions: string;
  exclusions: string;
  start_date: string;
  estimated_completion_date: string;
  actual_completion_date: string;
  signed_contract_received_date: string;
  contract_termination_date: string;
  is_private: boolean;
  non_admin_access: string[];
  allow_non_admin_sov_view: boolean;
  accounting_method: string;
  attachments: Attachment[];
};

const DEFAULT_FORM: FormState = {
  owner_client_id: "",
  title: "",
  status: "Draft",
  executed: false,
  default_retainage: "",
  contractor_id: "",
  architect_engineer_id: "",
  description: "",
  inclusions: "",
  exclusions: "",
  start_date: "",
  estimated_completion_date: "",
  actual_completion_date: "",
  signed_contract_received_date: "",
  contract_termination_date: "",
  is_private: true,
  non_admin_access: [],
  allow_non_admin_sov_view: false,
  accounting_method: "amount",
  attachments: [],
};

function CreateForm({
  projectId,
  nextContractNumber,
  directory,
  onCancel,
  onCreated,
}: {
  projectId: string;
  nextContractNumber: number;
  directory: DirectoryContact[];
  onCancel: () => void;
  onCreated: (c: PrimeContract) => void;
}) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [sovItems, setSovItems] = useState<SovItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const companyOptions = directory
    .filter((c) => c.type === "company")
    .map((c) => ({ value: c.id, label: contactDisplayName(c) }));

  const contactOptions = directory
    .filter((c) => c.type === "user" || c.type === "company")
    .map((c) => ({ value: c.id, label: contactDisplayName(c) }));

  const nonAdminOptions = directory
    .filter((c) => c.type === "user")
    .map((c) => ({ value: c.id, label: contactDisplayName(c) }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.status) { setError("Status is required"); return; }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/prime-contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          default_retainage: form.default_retainage ? parseFloat(form.default_retainage) : null,
          sov_items: sovItems.filter((i) => !i.isGroup),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create contract"); return; }
      onCreated(data);
    } finally {
      setSaving(false);
    }
  }

  const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-gray-900 mb-4">{children}</h3>
  );

  const Section = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">{children}</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Create Prime Contract</h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-[1400px] mx-auto px-6 py-6">
        {/* General Information */}
        <Section>
          <SectionTitle>General Information</SectionTitle>

          {/* Row 1: Contract #, Owner/Client, Title */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Contract #</Label>
              <input
                type="text"
                value={nextContractNumber}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <Label>Owner/Client</Label>
              <SingleSelect
                options={companyOptions}
                value={form.owner_client_id}
                onChange={(v) => set("owner_client_id", v)}
                placeholder="Select company"
              />
            </div>
            <div>
              <Label>Title</Label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Enter title"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          {/* Row 2: Status, Executed, Default Retainage */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label required>Status</Label>
              <SingleSelect
                options={STATUSES.map((s) => ({ value: s, label: s }))}
                value={form.status}
                onChange={(v) => set("status", v)}
                placeholder="Select status"
              />
            </div>
            <div>
              <Label required>Executed</Label>
              <div className="flex items-center h-[38px]">
                <input
                  type="checkbox"
                  id="executed"
                  checked={form.executed}
                  onChange={(e) => set("executed", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <Label>Default Retainage</Label>
              <div className="relative">
                <input
                  type="number"
                  value={form.default_retainage}
                  onChange={(e) => set("default_retainage", e.target.value)}
                  placeholder=""
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full pr-8 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 text-right"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
              </div>
            </div>
          </div>

          {/* Row 3: Contractor, Architect/Engineer */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Contractor</Label>
              <SingleSelect
                options={contactOptions}
                value={form.contractor_id}
                onChange={(v) => set("contractor_id", v)}
                placeholder="Select contractor"
              />
            </div>
            <div>
              <Label>Architect/Engineer</Label>
              <SingleSelect
                options={contactOptions}
                value={form.architect_engineer_id}
                onChange={(v) => set("architect_engineer_id", v)}
                placeholder="Select architect/engineer"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <Label>Description</Label>
            <RichTextEditor
              value={form.description}
              onChange={(v) => set("description", v)}
              placeholder="Enter description"
            />
          </div>

          {/* Attachments */}
          <div>
            <Label>Attachments</Label>
            <AttachmentZone
              attachments={form.attachments}
              onChange={(a) => set("attachments", a)}
            />
          </div>
        </Section>

        {/* Schedule of Values */}
        <Section>
          <SectionTitle>Schedule of Values</SectionTitle>
          <SovTable
            items={sovItems}
            onChange={setSovItems}
            accountingMethod={form.accounting_method}
            onChangeMethod={(m) => set("accounting_method", m)}
          />
        </Section>

        {/* Inclusions & Exclusions */}
        <Section>
          <SectionTitle>Inclusions &amp; Exclusions</SectionTitle>
          <div className="mb-4">
            <Label>Inclusions</Label>
            <RichTextEditor
              value={form.inclusions}
              onChange={(v) => set("inclusions", v)}
              placeholder="Enter inclusions"
            />
          </div>
          <div>
            <Label>Exclusions</Label>
            <RichTextEditor
              value={form.exclusions}
              onChange={(v) => set("exclusions", v)}
              placeholder="Enter exclusions"
            />
          </div>
        </Section>

        {/* Contract Dates */}
        <Section>
          <SectionTitle>Contract Dates</SectionTitle>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Start Date</Label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <Label>Estimated Completion Date</Label>
              <input
                type="date"
                value={form.estimated_completion_date}
                onChange={(e) => set("estimated_completion_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <Label>Actual Completion Date</Label>
              <input
                type="date"
                value={form.actual_completion_date}
                onChange={(e) => set("actual_completion_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Signed Contract Received Date</Label>
              <input
                type="date"
                value={form.signed_contract_received_date}
                onChange={(e) => set("signed_contract_received_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <Label>Contract Termination Date</Label>
              <input
                type="date"
                value={form.contract_termination_date}
                onChange={(e) => set("contract_termination_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        </Section>

        {/* Contract Privacy */}
        <Section>
          <SectionTitle>Contract Privacy</SectionTitle>
          <p className="text-xs text-gray-500 mb-4">
            Using the privacy setting allows{" "}
            <span className="text-blue-600">only project admins and the select non-admin users</span> access.
          </p>

          <div className="mb-4">
            <Label>Private</Label>
            <input
              type="checkbox"
              id="is_private"
              checked={form.is_private}
              onChange={(e) => set("is_private", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <Label>Access for Non-Admin Users</Label>
              <MultiSelect
                options={nonAdminOptions}
                value={form.non_admin_access}
                onChange={(v) => set("non_admin_access", v)}
                placeholder="Select Values"
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                id="allow_sov"
                checked={form.allow_non_admin_sov_view}
                onChange={(e) => set("allow_non_admin_sov_view", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="allow_sov" className="text-xs text-gray-600">
                Allow these non-admin users to view the SOV items.
              </label>
            </div>
          </div>
        </Section>

        {/* Footer */}
        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}
        <div className="flex items-center justify-between py-4 bg-gray-50 border-t border-gray-200 -mx-6 px-6 sticky bottom-0">
          <p className="text-xs text-gray-400">* Required fields</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-md"
            >
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PrimeContractsClient({
  projectId,
  role,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const [view, setView] = useState<"list" | "create">("list");
  const [contracts, setContracts] = useState<PrimeContract[]>([]);
  const [directory, setDirectory] = useState<DirectoryContact[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [contractsRes, dirRes] = await Promise.all([
      fetch(`/api/projects/${projectId}/prime-contracts`),
      fetch(`/api/projects/${projectId}/directory`),
    ]);
    const [contractsData, dirData] = await Promise.all([
      contractsRes.json(),
      dirRes.json(),
    ]);
    if (Array.isArray(contractsData)) setContracts(contractsData);
    if (Array.isArray(dirData)) setDirectory(dirData);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  function handlePdfExport() {
    window.print();
  }

  function nameForId(id: string | null): string {
    if (!id) return "—";
    const c = directory.find((d) => d.id === id);
    return c ? contactDisplayName(c) : "—";
  }

  function totalAmount(c: PrimeContract): number {
    return (c.sov_items ?? []).reduce((s, i) => s + (i.amount || 0), 0);
  }

  if (view === "create") {
    return (
      <>
        <div className="print:hidden">
          <ProjectNav projectId={projectId} />
        </div>
        <CreateForm
          projectId={projectId}
          nextContractNumber={contracts.length + 1}
          directory={directory}
          onCancel={() => setView("list")}
          onCreated={(c) => {
            setContracts((prev) => [...prev, c]);
            setView("list");
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="print:hidden">
        <ProjectNav projectId={projectId} />
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Prime Contracts</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePdfExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            <button
              onClick={() => setView("create")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-md text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create
            </button>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">No prime contracts yet</p>
              <p className="text-xs text-gray-400 mb-4">Create your first prime contract to get started.</p>
              <button
                onClick={() => setView("create")}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-md text-sm font-medium"
              >
                Create Prime Contract
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-16">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Owner/Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Contractor</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Contract Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Start Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Est. Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 text-gray-500">{c.contract_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.title || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{nameForId(c.owner_client_id)}</td>
                    <td className="px-4 py-3 text-gray-600">{nameForId(c.contractor_id)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(totalAmount(c))}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(c.start_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(c.estimated_completion_date)}</td>
                  </tr>
                ))}
              </tbody>
              {/* Totals row */}
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-xs font-medium text-gray-500">
                    {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {fmt(contracts.reduce((s, c) => s + totalAmount(c), 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
