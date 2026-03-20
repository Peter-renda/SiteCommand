import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Indent, Outdent,
  Scissors, Copy, ClipboardPaste,
  Link, Undo2, Redo2, ChevronDown,
  Paperclip, HelpCircle, Plus, Trash2, Info,
} from "lucide-react";

type SOVItem = {
  budget_code: string;
  description: string;
  amount: number;
  billed_to_date: number;
};

function RichToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-white">
      <ToolBtn><Bold className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn><Italic className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn><Underline className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn><Strikethrough className="w-3.5 h-3.5" /></ToolBtn>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <ToolBtn><AlignLeft className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn><AlignCenter className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn><AlignRight className="w-3.5 h-3.5" /></ToolBtn>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <ToolBtn>
        <List className="w-3.5 h-3.5" />
        <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
      </ToolBtn>
      <ToolBtn>
        <ListOrdered className="w-3.5 h-3.5" />
        <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
      </ToolBtn>
      <ToolBtn><Outdent className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn><Indent className="w-3.5 h-3.5" /></ToolBtn>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <ToolBtn><Scissors className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn><Copy className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn><ClipboardPaste className="w-3.5 h-3.5" /></ToolBtn>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <button type="button" className="flex items-center gap-0.5 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">
        12pt <ChevronDown className="w-2.5 h-2.5" />
      </button>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <ToolBtn>
        <span className="text-xs font-bold underline decoration-red-500" style={{ textDecorationColor: "#ef4444" }}>A</span>
        <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
      </ToolBtn>
      <ToolBtn>
        <span className="relative text-xs font-bold">
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-300 rounded-sm" />
          <span className="relative">A</span>
        </span>
        <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
      </ToolBtn>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <ToolBtn><Link className="w-3.5 h-3.5" /></ToolBtn>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <ToolBtn><Undo2 className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn><Redo2 className="w-3.5 h-3.5" /></ToolBtn>
    </div>
  );
}

function ToolBtn({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="flex items-center px-1.5 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm">
      {children}
    </button>
  );
}

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="border border-gray-300 rounded focus-within:ring-1 focus-within:ring-blue-400 bg-white">
      <RichToolbar />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm focus:outline-none resize-none min-h-[80px] bg-white"
      />
    </div>
  );
}

function SectionBlock({ children }: { children: React.ReactNode }) {
  return <div className="bg-white px-8 py-6">{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-gray-900 mb-5">{children}</h2>;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white ${props.className ?? ""}`}
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full appearance-none px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white pr-8 ${props.className ?? ""}`}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

export default function CreatePrimeContract() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    contract_number: "",
    owner_client: "",
    title: "",
    status: "Draft",
    executed: false,
    default_retainage: "",
    contractor: "",
    architect_engineer: "",
    description: "",
    inclusions: "",
    exclusions: "",
    start_date: "",
    estimated_completion_date: "",
    actual_completion_date: "",
    signed_contract_received_date: "",
    contract_termination_date: "",
    is_private: true,
    non_admin_access: [] as string[],
    allow_non_admin_sov_view: false,
  });
  const [sovItems, setSovItems] = useState<SOVItem[]>([]);

  const addLine = () => setSovItems([...sovItems, { budget_code: "", description: "", amount: 0, billed_to_date: 0 }]);
  const removeLine = (i: number) => setSovItems(sovItems.filter((_, idx) => idx !== i));
  const updateSov = (i: number, field: keyof SOVItem, value: any) => {
    const next = [...sovItems];
    next[i] = { ...next[i], [field]: value };
    setSovItems(next);
  };

  const totalAmount = sovItems.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const totalBilled = sovItems.reduce((s, x) => s + (Number(x.billed_to_date) || 0), 0);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setAttachments((prev) => [...prev, ...Array.from(files)]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/prime-contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, sov_items: sovItems }),
      });
      if (res.ok) navigate(`/projects/${id}/prime-contracts`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string, value: any) => setFormData((f) => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ProjectNav projectId={id!} />

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 space-y-3 py-3">

          {/* Page title */}
          <div className="bg-white px-8 py-4">
            <h1 className="text-xl font-bold text-gray-900">Create Prime Contract</h1>
          </div>

          {/* General Information */}
          <SectionBlock>
            <SectionTitle>General Information</SectionTitle>

            {/* Row 1: Contract #, Owner/Client, Title */}
            <div className="grid grid-cols-3 gap-5 mb-5">
              <div>
                <Label>Contract #</Label>
                <Input
                  type="text"
                  value={formData.contract_number}
                  onChange={(e) => set("contract_number", e.target.value)}
                  placeholder="2"
                />
              </div>
              <div>
                <Label>Owner/Client</Label>
                <Select value={formData.owner_client} onChange={(e) => set("owner_client", e.target.value)}>
                  <option value="">Select company</option>
                  <option value="Client A">Client A</option>
                  <option value="Client B">Client B</option>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Enter title"
                />
              </div>
            </div>

            {/* Row 2: Status, Executed, Default Retainage */}
            <div className="grid grid-cols-3 gap-5 mb-5">
              <div>
                <Label required>Status</Label>
                <Select value={formData.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="Draft">Draft</option>
                  <option value="Approved">Approved</option>
                  <option value="Executed">Executed</option>
                  <option value="Pending">Pending</option>
                  <option value="Void">Void</option>
                </Select>
              </div>
              <div>
                <Label required>Executed</Label>
                <div className="flex items-center h-[34px]">
                  <input
                    type="checkbox"
                    checked={formData.executed}
                    onChange={(e) => set("executed", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <Label>Default Retainage</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.default_retainage}
                    onChange={(e) => set("default_retainage", e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
              </div>
            </div>

            {/* Row 3: Contractor, Architect/Engineer */}
            <div className="grid grid-cols-3 gap-5 mb-5">
              <div>
                <Label>Contractor</Label>
                <Select value={formData.contractor} onChange={(e) => set("contractor", e.target.value)}>
                  <option value="" />
                  <option value="Contractor A">Contractor A</option>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Architect/Engineer</Label>
                <Select value={formData.architect_engineer} onChange={(e) => set("architect_engineer", e.target.value)}>
                  <option value="" />
                  <option value="Architect A">Architect A</option>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <Label>Description</Label>
              <RichEditor value={formData.description} onChange={(v) => set("description", v)} />
            </div>

            {/* Attachments */}
            <div>
              <Label>Attachments</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                className={`border border-dashed rounded flex flex-col items-center justify-center py-8 gap-2 transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"}`}
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-1.5 text-sm border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-700 font-medium"
                >
                  Attach Files
                </button>
                <span className="text-sm text-gray-500">or Drag &amp; Drop</span>
                {attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attachments.map((f, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                        <Paperclip className="w-3 h-3" /> {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </div>
          </SectionBlock>

          {/* Schedule of Values */}
          <SectionBlock>
            {/* Info banner */}
            <div className="flex items-center gap-3 -mx-8 -mt-6 mb-6 px-8 py-3 bg-blue-50 border-b border-blue-100">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="text-xs text-blue-800 flex-1">
                This contract's default accounting method is amount-based. To use budget codes with a unit of measure association, select Change to Unit/Quantity.
              </p>
              <button type="button" className="shrink-0 text-xs font-medium text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50">
                Change to Unit/Quantity
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Schedule of Values</SectionTitle>
              <button type="button" onClick={addLine} className="text-sm text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">
                Add Group
              </button>
            </div>

            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-white">
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-500 w-10">#</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1">Budget Code <HelpCircle className="w-3.5 h-3.5" /></span>
                    </th>
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Description</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Billed to Date</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Amount Remaining</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {sovItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          {/* Construction question mark icon */}
                          <svg viewBox="0 0 120 120" className="w-24 h-24" fill="none">
                            <circle cx="60" cy="55" r="38" stroke="#fed7aa" strokeWidth="3" fill="#fff7ed" />
                            <circle cx="38" cy="30" r="7" fill="#e5e7eb" />
                            <circle cx="82" cy="28" r="5" fill="#e5e7eb" />
                            <circle cx="30" cy="68" r="4" fill="#e5e7eb" />
                            <path d="M30 85 Q60 110 90 85" stroke="#fed7aa" strokeWidth="3" fill="none" strokeLinecap="round" />
                            <text x="60" y="65" textAnchor="middle" fontSize="28" fill="#f97316" fontWeight="bold">?</text>
                            <line x1="72" y1="50" x2="80" y2="42" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                            <line x1="80" y1="42" x2="80" y2="58" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                            <line x1="45" y1="52" x2="40" y2="44" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                          <p className="text-sm font-semibold text-gray-700">You Have No Line Items Yet</p>
                          <button
                            type="button"
                            onClick={addLine}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
                          >
                            Add Line
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sovItems.map((item, i) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2">
                          <input type="text" value={item.budget_code} onChange={(e) => updateSov(i, "budget_code", e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={item.description} onChange={(e) => updateSov(i, "description", e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" value={item.amount} onChange={(e) => updateSov(i, "amount", e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" value={item.billed_to_date} onChange={(e) => updateSov(i, "billed_to_date", e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-600">
                          ${(Number(item.amount) - Number(item.billed_to_date)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* SOV footer */}
              <div className="flex items-center border-t border-gray-200 px-4 py-2.5 bg-gray-50">
                <button type="button" onClick={addLine} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
                  Add Line
                </button>
                <button type="button" className="flex items-center gap-1 ml-2 px-3 py-1.5 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700">
                  Import <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1" />
                <div className="flex items-center gap-8 text-sm text-gray-600 font-medium">
                  <span>Total:</span>
                  <span className="w-28 text-right">${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  <span className="w-28 text-right">${totalBilled.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  <span className="w-28 text-right">${(totalAmount - totalBilled).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </SectionBlock>

          {/* Inclusions & Exclusions */}
          <SectionBlock>
            <SectionTitle>Inclusions &amp; Exclusions</SectionTitle>
            <div className="space-y-5">
              <div>
                <Label>Inclusions</Label>
                <RichEditor value={formData.inclusions} onChange={(v) => set("inclusions", v)} />
              </div>
              <div>
                <Label>Exclusions</Label>
                <RichEditor value={formData.exclusions} onChange={(v) => set("exclusions", v)} />
              </div>
            </div>
          </SectionBlock>

          {/* Contract Dates */}
          <SectionBlock>
            <SectionTitle>Contract Dates</SectionTitle>
            <div className="grid grid-cols-3 gap-5 mb-5">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => set("start_date", e.target.value)} />
              </div>
              <div>
                <Label>Estimated Completion Date</Label>
                <Input type="date" value={formData.estimated_completion_date} onChange={(e) => set("estimated_completion_date", e.target.value)} />
              </div>
              <div>
                <Label>Actual Completion Date</Label>
                <Input type="date" value={formData.actual_completion_date} onChange={(e) => set("actual_completion_date", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-5">
              <div>
                <Label>Signed Contract Received Date</Label>
                <Input type="date" value={formData.signed_contract_received_date} onChange={(e) => set("signed_contract_received_date", e.target.value)} />
              </div>
              <div>
                <Label>Contract Termination Date</Label>
                <Input type="date" value={formData.contract_termination_date} onChange={(e) => set("contract_termination_date", e.target.value)} />
              </div>
            </div>
          </SectionBlock>

          {/* Contract Privacy */}
          <SectionBlock>
            <SectionTitle>Contract Privacy</SectionTitle>
            <p className="text-sm text-green-700 mb-4">
              Using the privacy setting allows only project admins and the select non-admin users access.
            </p>
            <div className="mb-4">
              <Label>Private</Label>
              <input
                type="checkbox"
                checked={formData.is_private}
                onChange={(e) => set("is_private", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-start gap-5">
              <div className="flex-1">
                <Label>Access for Non-Admin Users</Label>
                <Select>
                  <option value="">Select Values</option>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-6 shrink-0">
                <input
                  type="checkbox"
                  checked={formData.allow_non_admin_sov_view}
                  onChange={(e) => set("allow_non_admin_sov_view", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-600">Allow these non-admin users to view the SOV items.</label>
              </div>
            </div>
          </SectionBlock>

        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 flex items-center justify-between px-8 py-3">
          <p className="text-xs text-gray-400 italic"><span className="text-red-500">*</span> Required fields</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(`/projects/${id}/prime-contracts`)}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
