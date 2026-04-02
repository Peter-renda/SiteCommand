"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ProjectNav from "@/components/ProjectNav";

// ── Types ─────────────────────────────────────────────────────────────────────

type DirectoryContact = {
  id: string;
  type: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  group_name: string | null;
  email: string | null;
};

type SovLine = {
  _key: string;
  dbId?: string; // set for existing items
  is_group_header: boolean;
  group_name: string;
  change_event_line_item: string;
  budget_code: string;
  description: string;
  qty: string;
  uom: string;
  unit_cost: string;
  amount: string;
  deleted?: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function contactName(c: DirectoryContact): string {
  if (c.type === "company") return c.company || "";
  if (c.type === "group") return c.group_name || "";
  return [c.first_name, c.last_name].filter(Boolean).join(" ");
}

function numVal(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function uid(): string {
  return Math.random().toString(36).slice(2);
}

// ── Section / Field wrappers ──────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-8 border-b border-gray-200 last:border-b-0">
      <h2 className="text-base font-semibold text-gray-900 mb-6">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white";
const selectCls =
  "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white";

// ── Rich Text Editor ──────────────────────────────────────────────────────────

type RteCommand =
  | "bold" | "italic" | "underline" | "strikeThrough"
  | "justifyLeft" | "justifyCenter" | "justifyRight"
  | "insertUnorderedList" | "insertOrderedList"
  | "outdent" | "indent" | "undo" | "redo";

function RichTextEditor({
  value,
  onChange,
  minHeight = "80px",
}: {
  value: string;
  onChange: (v: string) => void;
  minHeight?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isFocused.current) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function exec(cmd: RteCommand) {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  const btnCls = "p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors";

  return (
    <div className="border border-gray-300 rounded overflow-hidden">
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        <button type="button" onClick={() => exec("bold")} className={btnCls} title="Bold"><b className="text-xs px-0.5">B</b></button>
        <button type="button" onClick={() => exec("italic")} className={btnCls} title="Italic"><i className="text-xs px-0.5">I</i></button>
        <button type="button" onClick={() => exec("underline")} className={btnCls} title="Underline"><u className="text-xs px-0.5">U</u></button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button type="button" onClick={() => exec("insertUnorderedList")} className={btnCls} title="Bullet list">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" /></svg>
        </button>
        <button type="button" onClick={() => exec("insertOrderedList")} className={btnCls} title="Numbered list">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" /></svg>
        </button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button type="button" onClick={() => exec("undo")} className={btnCls} title="Undo">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" /></svg>
        </button>
        <button type="button" onClick={() => exec("redo")} className={btnCls} title="Redo">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" /></svg>
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
        onFocus={() => { isFocused.current = true; }}
        onBlur={() => { isFocused.current = false; }}
        className="px-3 py-2 text-sm text-gray-900 focus:outline-none"
        style={{ minHeight }}
      />
    </div>
  );
}

// ── SOV Table ─────────────────────────────────────────────────────────────────

function SovTable({
  lines,
  method,
  onMethodChange,
  onAdd,
  onAddGroup,
  onUpdate,
  onRemove,
}: {
  lines: SovLine[];
  method: "unit_quantity" | "amount";
  onMethodChange: (m: "unit_quantity" | "amount") => void;
  onAdd: () => void;
  onAddGroup: () => void;
  onUpdate: (key: string, field: keyof SovLine, value: string | boolean) => void;
  onRemove: (key: string) => void;
}) {
  const visible = lines.filter((l) => !l.deleted);

  function calcAmount(line: SovLine): number {
    if (method === "unit_quantity") return numVal(line.qty) * numVal(line.unit_cost);
    return numVal(line.amount);
  }

  const totalAmount = visible.filter((l) => !l.is_group_header).reduce((sum, l) => sum + calcAmount(l), 0);
  const cellCls = "px-2 py-1.5 border-b border-gray-100 text-xs";
  const thCls = "px-2 py-2 text-left text-xs font-medium text-gray-500 bg-white border-b border-gray-200 whitespace-nowrap";

  return (
    <div>
      <div className="flex items-center justify-between mb-4 bg-blue-50 border border-blue-200 rounded px-4 py-2">
        <span className="text-xs text-blue-700">
          Accounting method: <strong>{method === "unit_quantity" ? "unit/quantity-based" : "amount-based"}</strong>
        </span>
        <button
          type="button"
          onClick={() => onMethodChange(method === "unit_quantity" ? "amount" : "unit_quantity")}
          className="text-xs px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors"
        >
          Change to {method === "unit_quantity" ? "Amount" : "Unit/Quantity"}
        </button>
      </div>

      <div className="mb-3">
        <button type="button" onClick={onAddGroup} className="text-sm px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors">
          Add Group
        </button>
      </div>

      <div className="border border-gray-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className={thCls} style={{ width: 40 }}>#</th>
                <th className={thCls}>Change Event Line Item</th>
                <th className={thCls}>Budget Code</th>
                <th className={thCls}>Description</th>
                {method === "unit_quantity" ? (
                  <>
                    <th className={thCls}>Qty</th>
                    <th className={thCls}>UOM</th>
                    <th className={thCls}>Unit Cost</th>
                  </>
                ) : null}
                <th className={thCls}>Amount</th>
                <th className={thCls} style={{ width: 32 }} />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={method === "unit_quantity" ? 9 : 6} className="py-12 text-center">
                    <p className="text-sm text-gray-400 mb-3">No line items yet</p>
                    <button type="button" onClick={onAdd} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors">
                      Add Line
                    </button>
                  </td>
                </tr>
              ) : (
                visible.map((line, idx) => {
                  if (line.is_group_header) {
                    return (
                      <tr key={line._key} className="bg-gray-50">
                        <td className={cellCls} />
                        <td colSpan={method === "unit_quantity" ? 7 : 4} className={cellCls}>
                          <input
                            type="text"
                            value={line.group_name}
                            onChange={(e) => onUpdate(line._key, "group_name", e.target.value)}
                            placeholder="Group name…"
                            className="w-full bg-transparent font-medium text-gray-700 focus:outline-none"
                          />
                        </td>
                        <td className={cellCls}>
                          <button type="button" onClick={() => onRemove(line._key)} className="text-gray-300 hover:text-red-500 transition-colors">✕</button>
                        </td>
                      </tr>
                    );
                  }

                  const lineNum = visible.filter((l) => !l.is_group_header).indexOf(line) + 1;
                  const computed = calcAmount(line);

                  return (
                    <tr key={line._key} className="hover:bg-gray-50 group">
                      <td className={cellCls + " text-gray-400"}>{lineNum}</td>
                      <td className={cellCls}>
                        <input type="text" value={line.change_event_line_item} onChange={(e) => onUpdate(line._key, "change_event_line_item", e.target.value)} className="w-full min-w-[120px] focus:outline-none bg-transparent" />
                      </td>
                      <td className={cellCls}>
                        <input type="text" value={line.budget_code} onChange={(e) => onUpdate(line._key, "budget_code", e.target.value)} className="w-full min-w-[90px] focus:outline-none bg-transparent" />
                      </td>
                      <td className={cellCls}>
                        <input type="text" value={line.description} onChange={(e) => onUpdate(line._key, "description", e.target.value)} className="w-full min-w-[120px] focus:outline-none bg-transparent" />
                      </td>
                      {method === "unit_quantity" ? (
                        <>
                          <td className={cellCls}>
                            <input type="text" inputMode="decimal" value={line.qty} onChange={(e) => onUpdate(line._key, "qty", e.target.value)} className="w-16 focus:outline-none bg-transparent tabular-nums" />
                          </td>
                          <td className={cellCls}>
                            <input type="text" value={line.uom} onChange={(e) => onUpdate(line._key, "uom", e.target.value)} className="w-16 focus:outline-none bg-transparent" />
                          </td>
                          <td className={cellCls}>
                            <input type="text" inputMode="decimal" value={line.unit_cost} onChange={(e) => onUpdate(line._key, "unit_cost", e.target.value)} className="w-20 focus:outline-none bg-transparent tabular-nums" />
                          </td>
                        </>
                      ) : (
                        <td className={cellCls}>
                          <input type="text" inputMode="decimal" value={line.amount} onChange={(e) => onUpdate(line._key, "amount", e.target.value)} className="w-24 focus:outline-none bg-transparent tabular-nums" />
                        </td>
                      )}
                      <td className={cellCls + " tabular-nums text-gray-900"}>${fmt(computed)}</td>
                      <td className={cellCls}>
                        <button type="button" onClick={() => onRemove(line._key)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">✕</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
          <button type="button" onClick={onAdd} className="px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors">
            Add Line
          </button>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-700">
            <span>Total:</span>
            <span className="tabular-nums">${fmt(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EditCommitmentClient({
  projectId,
  commitmentId,
  role,
  username,
}: {
  projectId: string;
  commitmentId: string;
  role: string;
  username: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commitmentType, setCommitmentType] = useState<"subcontract" | "purchase_order">("subcontract");

  const [directory, setDirectory] = useState<DirectoryContact[]>([]);

  // General Information
  const [contractNumber, setContractNumber] = useState("");
  const [contractCompany, setContractCompany] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [executed, setExecuted] = useState(false);
  const [defaultRetainage, setDefaultRetainage] = useState("10");
  const [description, setDescription] = useState("");

  // Contract Dates
  const [deliveryDate, setDeliveryDate] = useState("");
  const [signedPoDate, setSignedPoDate] = useState("");

  // Contract Privacy
  const [isPrivate, setIsPrivate] = useState(true);
  const [sovViewAllowed, setSovViewAllowed] = useState(false);
  const [accessDropdownOpen, setAccessDropdownOpen] = useState(false);
  const accessDropdownRef = useRef<HTMLDivElement>(null);

  // Subcontract Additional Fields
  const [subcontractCoverLetter, setSubcontractCoverLetter] = useState("");
  const [bondAmount, setBondAmount] = useState("");
  const [exhibitAScope, setExhibitAScope] = useState("");
  const [trades, setTrades] = useState("");
  const [subcontractorContact, setSubcontractorContact] = useState("");

  // Purchase Order Additional Fields
  const [subcontractType, setSubcontractType] = useState("");
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [showExecutedCoverLetter, setShowExecutedCoverLetter] = useState(false);

  // SOV
  const [sovMethod, setSovMethod] = useState<"unit_quantity" | "amount">("unit_quantity");
  const [sovLines, setSovLines] = useState<SovLine[]>([]);
  // Track original dbIds so we can delete removed existing items
  const removedDbIds = useRef<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/directory`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/commitments/${commitmentId}`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/commitments/${commitmentId}/sov`).then((r) => r.json()),
    ]).then(([dir, c, sov]) => {
      setDirectory(Array.isArray(dir) ? dir : []);

      // Populate form from existing commitment
      setCommitmentType(c.type ?? "subcontract");
      setContractNumber(String(c.number ?? ""));
      setContractCompany(c.contract_company ?? "");
      setTitle(c.title ?? "");
      setStatus(c.status ?? "draft");
      setExecuted(c.executed ?? false);
      setDefaultRetainage(String(c.default_retainage ?? 10));
      setDescription(c.description ?? "");
      setDeliveryDate(c.delivery_date ?? "");
      setSignedPoDate(c.signed_po_received_date ?? "");
      setIsPrivate(c.is_private ?? true);
      setSovViewAllowed(c.sov_view_allowed ?? false);
      setSubcontractCoverLetter(c.subcontract_cover_letter ?? "");
      setBondAmount(c.bond_amount ? String(c.bond_amount) : "");
      setExhibitAScope(c.exhibit_a_scope ?? "");
      setTrades(c.trades ?? "");
      setSubcontractorContact(c.subcontractor_contact ?? "");
      setSubcontractType(c.subcontract_type ?? "");
      setShowCoverLetter(c.show_cover_letter ?? false);
      setShowExecutedCoverLetter(c.show_executed_cover_letter ?? false);
      setSovMethod(c.sov_accounting_method ?? "unit_quantity");

      // Map SOV items
      if (Array.isArray(sov)) {
        setSovLines(
          sov.map((item: {
            id: string;
            is_group_header: boolean;
            group_name: string;
            change_event_line_item: string;
            budget_code: string;
            description: string;
            qty: number;
            uom: string;
            unit_cost: number;
            amount: number;
          }) => ({
            _key: uid(),
            dbId: item.id,
            is_group_header: item.is_group_header,
            group_name: item.group_name,
            change_event_line_item: item.change_event_line_item,
            budget_code: item.budget_code,
            description: item.description,
            qty: String(item.qty ?? ""),
            uom: item.uom,
            unit_cost: String(item.unit_cost ?? ""),
            amount: String(item.amount ?? ""),
          }))
        );
      }

      setLoading(false);
    });
  }, [projectId, commitmentId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accessDropdownRef.current && !accessDropdownRef.current.contains(e.target as Node)) {
        setAccessDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const companies = directory.filter((c) => c.type === "company" || c.type === "user");

  function addSovLine() {
    setSovLines((prev) => [...prev, { _key: uid(), is_group_header: false, group_name: "", change_event_line_item: "", budget_code: "", description: "", qty: "", uom: "", unit_cost: "", amount: "" }]);
  }

  function addSovGroup() {
    setSovLines((prev) => [...prev, { _key: uid(), is_group_header: true, group_name: "", change_event_line_item: "", budget_code: "", description: "", qty: "", uom: "", unit_cost: "", amount: "" }]);
  }

  function updateSovLine(key: string, field: keyof SovLine, value: string | boolean) {
    setSovLines((prev) => prev.map((l) => (l._key === key ? { ...l, [field]: value } : l)));
  }

  function removeSovLine(key: string) {
    setSovLines((prev) => {
      const line = prev.find((l) => l._key === key);
      if (line?.dbId) removedDbIds.current.push(line.dbId);
      return prev.filter((l) => l._key !== key);
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const activeLines = sovLines.filter((l) => !l.deleted);
      const sovTotal = activeLines
        .filter((l) => !l.is_group_header)
        .reduce((sum, l) => {
          return sum + (sovMethod === "unit_quantity" ? numVal(l.qty) * numVal(l.unit_cost) : numVal(l.amount));
        }, 0);

      // PATCH the commitment
      const res = await fetch(`/api/projects/${projectId}/commitments/${commitmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_company: contractCompany,
          title,
          status,
          executed,
          default_retainage: numVal(defaultRetainage),
          description,
          delivery_date: deliveryDate || null,
          signed_po_received_date: signedPoDate || null,
          is_private: isPrivate,
          sov_view_allowed: sovViewAllowed,
          subcontract_cover_letter: subcontractCoverLetter,
          bond_amount: numVal(bondAmount),
          exhibit_a_scope: exhibitAScope,
          trades,
          subcontractor_contact: subcontractorContact,
          subcontract_type: subcontractType,
          show_cover_letter: showCoverLetter,
          show_executed_cover_letter: showExecutedCoverLetter,
          sov_accounting_method: sovMethod,
          original_contract_amount: sovTotal,
        }),
      });

      if (!res.ok) { setSaving(false); return; }

      // Delete removed SOV items
      await Promise.all(
        removedDbIds.current.map((id) =>
          fetch(`/api/projects/${projectId}/commitments/${commitmentId}/sov/${id}`, { method: "DELETE" })
        )
      );
      removedDbIds.current = [];

      // Save SOV lines: PATCH existing, POST new
      await Promise.all(
        activeLines.map((line, idx) => {
          const body = JSON.stringify({
            is_group_header: line.is_group_header,
            group_name: line.group_name,
            change_event_line_item: line.change_event_line_item,
            budget_code: line.budget_code,
            description: line.description,
            qty: numVal(line.qty),
            uom: line.uom,
            unit_cost: numVal(line.unit_cost),
            amount: sovMethod === "unit_quantity" ? numVal(line.qty) * numVal(line.unit_cost) : numVal(line.amount),
            sort_order: idx,
          });

          if (line.dbId) {
            return fetch(`/api/projects/${projectId}/commitments/${commitmentId}/sov/${line.dbId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body,
            });
          } else {
            return fetch(`/api/projects/${projectId}/commitments/${commitmentId}/sov`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body,
            });
          }
        })
      );

      window.location.href = `/projects/${projectId}/commitments/${commitmentId}`;
    } catch {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const typeLabel = commitmentType === "purchase_order" ? "Purchase Order" : "Subcontract";

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">SiteCommand</a>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      {/* Page header bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <a href={`/projects/${projectId}/commitments/${commitmentId}`} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← #{contractNumber}
          </a>
          <span className="text-gray-200">/</span>
          <h1 className="text-sm font-semibold text-gray-900">Edit {typeLabel}</h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/projects/${projectId}/commitments/${commitmentId}`}
            className="px-4 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-sm font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : `Save ${typeLabel}`}
          </button>
        </div>
      </div>

      {/* Form body */}
      <div className="max-w-5xl mx-auto px-8">

        {/* ── General Information ── */}
        <Section title="General Information">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Field label="Contract #">
              <input
                type="text"
                value={contractNumber}
                disabled
                className={inputCls + " bg-gray-50 text-gray-400 cursor-not-allowed"}
              />
            </Field>
            <Field label="Contract Company">
              <select value={contractCompany} onChange={(e) => setContractCompany(e.target.value)} className={selectCls}>
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={contactName(c)}>{contactName(c)}</option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <Field label="Status" required>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="void">Void</option>
                <option value="terminated">Terminated</option>
              </select>
            </Field>
            <Field label="Executed">
              <div className="flex items-center h-9 mt-0.5">
                <input type="checkbox" checked={executed} onChange={(e) => setExecuted(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
              </div>
            </Field>
            <Field label="Default Retainage">
              <div className="flex items-center">
                <input type="text" inputMode="decimal" value={defaultRetainage} onChange={(e) => setDefaultRetainage(e.target.value)} className={inputCls + " rounded-r-none"} />
                <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r text-sm text-gray-500 bg-gray-50">%</span>
              </div>
            </Field>
          </div>

          <Field label="Description" className="mb-4">
            <RichTextEditor value={description} onChange={setDescription} minHeight="100px" />
          </Field>
        </Section>

        {/* ── Schedule of Values ── */}
        <Section title="Schedule of Values">
          <SovTable
            lines={sovLines}
            method={sovMethod}
            onMethodChange={setSovMethod}
            onAdd={addSovLine}
            onAddGroup={addSovGroup}
            onUpdate={updateSovLine}
            onRemove={removeSovLine}
          />
        </Section>

        {/* ── Contract Dates ── */}
        <Section title="Contract Dates">
          <div className="grid grid-cols-2 gap-8">
            <Field label="Delivery Date">
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Signed Purchase Order Received Date">
              <input type="date" value={signedPoDate} onChange={(e) => setSignedPoDate(e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* ── Contract Privacy ── */}
        <Section title="Contract Privacy">
          <p className="text-xs text-blue-600 mb-4">
            Using the privacy setting allows only project admins and select non-admin users access.
          </p>
          <Field label="Private" className="mb-4">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          </Field>
          <div className="grid grid-cols-2 gap-4 items-start mb-4">
            <div ref={accessDropdownRef} />
            <div className="pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sovViewAllowed} onChange={(e) => setSovViewAllowed(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-gray-900" />
                <span className="text-sm text-gray-700">Allow non-admin users to view SOV items.</span>
              </label>
            </div>
          </div>
        </Section>

        {/* ── Additional Information ── */}
        <Section title="Additional Information">
          {commitmentType === "subcontract" && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Subcontract Additional Fields</h3>
              <Field label="Subcontract Cover Letter" className="mb-4">
                <select value={subcontractCoverLetter} onChange={(e) => setSubcontractCoverLetter(e.target.value)} className={selectCls}>
                  <option value="" />
                  <option value="standard">Standard Cover Letter</option>
                  <option value="custom">Custom Cover Letter</option>
                  <option value="none">No Cover Letter</option>
                </select>
              </Field>
              <Field label="Bond Amount" className="mb-4">
                <input type="text" inputMode="decimal" value={bondAmount} onChange={(e) => setBondAmount(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Exhibit A Scope of Work" className="mb-4">
                <RichTextEditor value={exhibitAScope} onChange={setExhibitAScope} minHeight="120px" />
              </Field>
              <Field label="Trades" className="mb-4">
                <input type="text" value={trades} onChange={(e) => setTrades(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Subcontractor Contact">
                <select value={subcontractorContact} onChange={(e) => setSubcontractorContact(e.target.value)} className={selectCls}>
                  <option value="" />
                  {directory.map((c) => (
                    <option key={c.id} value={contactName(c)}>{contactName(c)}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Purchase Order Additional Fields</h3>
            <Field label="Subcontract Type" className="mb-4">
              <select value={subcontractType} onChange={(e) => setSubcontractType(e.target.value)} className={selectCls}>
                <option value="" />
                <option value="lump_sum">Lump Sum</option>
                <option value="unit_price">Unit Price</option>
                <option value="cost_plus">Cost Plus</option>
                <option value="time_and_material">Time and Material</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-8">
              <Field label="Show Cover Letter">
                <input type="checkbox" checked={showCoverLetter} onChange={(e) => setShowCoverLetter(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-gray-900" />
              </Field>
              <Field label="Show Executed Cover Letter">
                <input type="checkbox" checked={showExecutedCoverLetter} onChange={(e) => setShowExecutedCoverLetter(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-gray-900" />
              </Field>
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}
