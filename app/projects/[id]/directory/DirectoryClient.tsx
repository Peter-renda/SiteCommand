"use client";

import { useState, useEffect, useRef } from "react";
import ProjectNav from "@/components/ProjectNav";

type ContactType = "user" | "company" | "distribution_group";

type Contact = {
  id: string;
  type: ContactType;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  permission: string | null;
  group_name: string | null;
  notes: string | null;
  created_at: string;
};

const PERMISSIONS = [
  "Architect/Engineer",
  "Owner/Client",
  "Subcontractor",
  "Company Employee",
];


// ── Modal: Add / Edit User ────────────────────────────────────────────────────

type UserFormData = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  permission: string;
};

function UserModal({
  initial,
  companies,
  onConfirm,
  onCancel,
}: {
  initial?: Partial<UserFormData>;
  companies: string[];
  onConfirm: (data: UserFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<UserFormData>({
    first_name: initial?.first_name ?? "",
    last_name: initial?.last_name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    company: initial?.company ?? "",
    permission: initial?.permission ?? "",
  });

  function set(field: keyof UserFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.last_name.trim() || !form.email.trim()) return;
    onConfirm(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            {initial ? "Edit Contact" : "Add User"}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="(555) 000-0000"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
            <input
              type="text"
              list="company-suggestions"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Company name"
            />
            <datalist id="company-suggestions">
              {companies.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Permission</label>
            <select
              value={form.permission}
              onChange={(e) => set("permission", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              <option value="">Select permission...</option>
              {PERMISSIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
            >
              {initial ? "Save Changes" : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal: Add / Edit Company ─────────────────────────────────────────────────

type CompanyFormData = {
  company: string;
  email: string;
  phone: string;
  notes: string;
};

function CompanyModal({
  initial,
  onConfirm,
  onCancel,
}: {
  initial?: Partial<CompanyFormData>;
  onConfirm: (data: CompanyFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CompanyFormData>({
    company: initial?.company ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    notes: initial?.notes ?? "",
  });

  function set(field: keyof CompanyFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim()) return;
    onConfirm(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            {initial ? "Edit Company" : "Add Company"}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Company name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="contact@company.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="(555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
            >
              {initial ? "Save Changes" : "Add Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal: Add / Edit Distribution Group ─────────────────────────────────────

type GroupFormData = {
  group_name: string;
  email: string;
  notes: string;
};

function GroupModal({
  initial,
  onConfirm,
  onCancel,
}: {
  initial?: Partial<GroupFormData>;
  onConfirm: (data: GroupFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<GroupFormData>({
    group_name: initial?.group_name ?? "",
    email: initial?.email ?? "",
    notes: initial?.notes ?? "",
  });

  function set(field: keyof GroupFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.group_name.trim()) return;
    onConfirm(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            {initial ? "Edit Distribution Group" : "Add Distribution Group"}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.group_name}
              onChange={(e) => set("group_name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="e.g. Design Team, Subcontractors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Group Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="group@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
            >
              {initial ? "Save Changes" : "Add Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────────

function ConfirmModal({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Remove from Directory</h2>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to remove <span className="font-medium text-gray-800">{name}</span> from the directory?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Indeterminate checkbox ────────────────────────────────────────────────────

function IndeterminateCheckbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="rounded border-gray-300 cursor-pointer"
    />
  );
}

// ── Import modal ──────────────────────────────────────────────────────────────

type SourceProject = { id: string; name: string };

function ImportModal({
  projectId,
  existingContacts,
  onClose,
  onImported,
}: {
  projectId: string;
  existingContacts: Contact[];
  onClose: () => void;
  onImported: (contacts: Contact[]) => void;
}) {
  const [projects, setProjects] = useState<SourceProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sourceContacts, setSourceContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const existingCompanyNames = new Set(
    existingContacts.filter((c) => c.type === "company").map((c) => (c.company ?? "").toLowerCase())
  );
  const existingUserNames = new Set(
    existingContacts
      .filter((c) => c.type === "user")
      .map((c) => [c.first_name, c.last_name].filter(Boolean).join(" ").toLowerCase())
  );
  const existingGroupNames = new Set(
    existingContacts.filter((c) => c.type === "distribution_group").map((c) => (c.group_name ?? "").toLowerCase())
  );

  function isDuplicate(c: Contact): boolean {
    if (c.type === "company") return existingCompanyNames.has((c.company ?? "").toLowerCase());
    if (c.type === "user") {
      const name = [c.first_name, c.last_name].filter(Boolean).join(" ").toLowerCase();
      return existingUserNames.has(name);
    }
    if (c.type === "distribution_group") return existingGroupNames.has((c.group_name ?? "").toLowerCase());
    return false;
  }

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(
          Array.isArray(data)
            ? data.filter((p: SourceProject) => p.id !== projectId).map((p: SourceProject) => ({ id: p.id, name: p.name }))
            : []
        );
      });
  }, [projectId]);

  useEffect(() => {
    if (!selectedProjectId) { setSourceContacts([]); setSelectedIds(new Set()); return; }
    setLoadingContacts(true);
    fetch(`/api/projects/${selectedProjectId}/directory`)
      .then((r) => r.json())
      .then((data) => { setSourceContacts(Array.isArray(data) ? data : []); setSelectedIds(new Set()); })
      .finally(() => setLoadingContacts(false));
  }, [selectedProjectId]);

  const companyContacts = sourceContacts.filter((c) => c.type === "company");
  const companyNames = new Set(companyContacts.map((c) => c.company).filter(Boolean));

  const employeesByCompany: Record<string, Contact[]> = {};
  for (const c of sourceContacts) {
    if (c.type === "user" && c.company && companyNames.has(c.company)) {
      if (!employeesByCompany[c.company]) employeesByCompany[c.company] = [];
      employeesByCompany[c.company].push(c);
    }
  }

  const standaloneUsers = sourceContacts.filter(
    (c) => c.type === "user" && (!c.company || !companyNames.has(c.company))
  );

  function toggleCompany(company: Contact) {
    if (isDuplicate(company)) return;
    const emps = employeesByCompany[company.company ?? ""] ?? [];
    const togglableIds = [company.id, ...emps.filter((e) => !isDuplicate(e)).map((e) => e.id)];
    const allSelected = togglableIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) { togglableIds.forEach((id) => next.delete(id)); }
      else { togglableIds.forEach((id) => next.add(id)); }
      return next;
    });
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleImport() {
    const toImport = sourceContacts.filter((c) => selectedIds.has(c.id) && !isDuplicate(c));
    if (toImport.length === 0) return;
    setImporting(true);
    const created: Contact[] = [];
    for (const c of toImport) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, ...rest } = c as Contact & { id: string; created_at: string };
      const res = await fetch(`/api/projects/${projectId}/directory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      });
      if (res.ok) created.push(await res.json());
    }
    setImporting(false);
    onImported(created);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">Import from a Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pt-5 pb-3 shrink-0">
          <label className="block text-xs font-medium text-gray-500 mb-1">Select Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            <option value="">Choose a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
          {loadingContacts ? (
            <p className="text-sm text-gray-400 py-4">Loading contacts…</p>
          ) : selectedProjectId && sourceContacts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No contacts in this project.</p>
          ) : selectedProjectId ? (
            <div className="space-y-5">
              {companyContacts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Companies</p>
                  <div className="space-y-2">
                    {companyContacts.map((company) => {
                      const companyDup = isDuplicate(company);
                      const emps = employeesByCompany[company.company ?? ""] ?? [];
                      const togglableIds = [company.id, ...emps.filter((e) => !isDuplicate(e)).map((e) => e.id)];
                      const allSelected = !companyDup && togglableIds.every((id) => selectedIds.has(id));
                      const someSelected = !companyDup && togglableIds.some((id) => selectedIds.has(id));
                      return (
                        <div key={company.id} className="border border-gray-100 rounded-lg overflow-hidden">
                          <label className={`flex items-center gap-3 px-3 py-2.5 bg-gray-50 ${companyDup ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"} transition-colors`}>
                            <IndeterminateCheckbox
                              checked={allSelected}
                              indeterminate={!allSelected && someSelected}
                              onChange={() => toggleCompany(company)}
                            />
                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">{company.company}</span>
                            {companyDup ? (
                              <span className="text-xs text-gray-400 ml-auto">Already added</span>
                            ) : emps.length > 0 ? (
                              <span className="text-xs text-gray-400 ml-auto">{emps.length} employee{emps.length !== 1 ? "s" : ""}</span>
                            ) : null}
                          </label>
                          {emps.length > 0 && (
                            <div className="divide-y divide-gray-50">
                              {emps.map((emp) => {
                                const empDup = isDuplicate(emp);
                                return (
                                  <label key={emp.id} className={`flex items-center gap-3 px-3 py-2 pl-10 ${empDup ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"} transition-colors`}>
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.has(emp.id)}
                                      onChange={() => !empDup && toggleItem(emp.id)}
                                      disabled={empDup}
                                      className="rounded border-gray-300 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <span className="text-sm text-gray-700">
                                      {[emp.first_name, emp.last_name].filter(Boolean).join(" ") || "Unnamed"}
                                    </span>
                                    {empDup ? (
                                      <span className="text-xs text-gray-400 ml-auto">Already added</span>
                                    ) : emp.email ? (
                                      <span className="text-xs text-gray-400 ml-auto truncate max-w-[160px]">{emp.email}</span>
                                    ) : null}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {standaloneUsers.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Individual Users</p>
                  <div className="border border-gray-100 rounded-lg divide-y divide-gray-50 overflow-hidden">
                    {standaloneUsers.map((u) => {
                      const dup = isDuplicate(u);
                      return (
                        <label key={u.id} className={`flex items-center gap-3 px-3 py-2.5 ${dup ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"} transition-colors`}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(u.id)}
                            onChange={() => !dup && toggleItem(u.id)}
                            disabled={dup}
                            className="rounded border-gray-300 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-sm text-gray-700">
                            {[u.first_name, u.last_name].filter(Boolean).join(" ") || "Unnamed"}
                          </span>
                          {dup ? (
                            <span className="text-xs text-gray-400 ml-auto">Already added</span>
                          ) : (
                            <>
                              {u.email && (
                                <span className="text-xs text-gray-400 ml-2 truncate max-w-[160px]">{u.email}</span>
                              )}
                              {u.permission && <span className="ml-auto shrink-0"><PermissionBadge value={u.permission} /></span>}
                            </>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {selectedProjectId && sourceContacts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
            <span className="text-xs text-gray-400">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={selectedIds.size === 0 || importing}
                onClick={handleImport}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? "Importing…" : `Import${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Permission badge ──────────────────────────────────────────────────────────

const PERMISSION_COLORS: Record<string, string> = {
  "Architect/Engineer": "bg-blue-50 text-blue-700",
  "Owner/Client": "bg-purple-50 text-purple-700",
  "Subcontractor": "bg-amber-50 text-amber-700",
  "Company Employee": "bg-green-50 text-green-700",
};

function PermissionBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-gray-300 text-xs">—</span>;
  const color = PERMISSION_COLORS[value] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {value}
    </span>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 className="text-sm font-semibold text-gray-700">{label}</h2>
      <span className="text-xs text-gray-400 font-normal">({count})</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DirectoryClient({
  projectId,
  role,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Contact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  // Import
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const importMenuRef = useRef<HTMLDivElement>(null);

  // Three-dot menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    loadContacts();
  }, [projectId]);

  // Click-outside for three-dot menu
  useEffect(() => {
    function handleClick() {
      setOpenMenuId(null);
      setMenuPos(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Click-outside for import dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (importMenuRef.current && !importMenuRef.current.contains(e.target as Node)) {
        setShowImportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadContacts() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/directory`);
      if (res.ok) setContacts(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(data: UserFormData) {
    setShowUserModal(false);
    const res = await fetch(`/api/projects/${projectId}/directory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "user", ...data }),
    });
    if (res.ok) {
      const newContact = await res.json();
      setContacts((prev) => [...prev, newContact]);
    }
  }

  async function handleAddCompany(data: CompanyFormData) {
    setShowCompanyModal(false);
    const res = await fetch(`/api/projects/${projectId}/directory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "company", ...data }),
    });
    if (res.ok) {
      const newContact = await res.json();
      setContacts((prev) => [...prev, newContact]);
    }
  }

  async function handleAddGroup(data: GroupFormData) {
    setShowGroupModal(false);
    const res = await fetch(`/api/projects/${projectId}/directory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "distribution_group", ...data }),
    });
    if (res.ok) {
      const newContact = await res.json();
      setContacts((prev) => [...prev, newContact]);
    }
  }

  async function handleEdit(data: UserFormData | CompanyFormData | GroupFormData) {
    if (!editTarget) return;
    const id = editTarget.id;
    setEditTarget(null);
    const res = await fetch(`/api/projects/${projectId}/directory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await fetch(`/api/projects/${projectId}/directory/${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  function handleImported(newContacts: Contact[]) {
    setShowImportModal(false);
    setContacts((prev) => [...prev, ...newContacts]);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function displayName(c: Contact): string {
    if (c.type === "company") return c.company ?? "Unnamed Company";
    if (c.type === "distribution_group") return c.group_name ?? "Unnamed Group";
    const parts = [c.first_name, c.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Unnamed";
  }

  const users = contacts.filter((c) => c.type === "user");
  const companies = contacts.filter((c) => c.type === "company");
  const groups = contacts.filter((c) => c.type === "distribution_group");

  // Find the contact for the open menu
  const menuContact = contacts.find((c) => c.id === openMenuId) ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          SiteCommand
        </a>
        <div className="flex items-center gap-5">
          {role === "admin" && (
            <a href="/admin" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Admin
            </a>
          )}
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Page title + action buttons */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-gray-900">Directory</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add User
            </button>
            <button
              onClick={() => setShowCompanyModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Add Company
            </button>
            <button
              onClick={() => setShowGroupModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Add Distribution Group
            </button>

            {/* Import dropdown */}
            <div ref={importMenuRef} className="relative">
              <button
                onClick={() => setShowImportMenu((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showImportMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showImportMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-20">
                  <button
                    onClick={() => { setShowImportMenu(false); setShowImportModal(true); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Import from a Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : contacts.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-16 text-center">
            <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <p className="text-sm text-gray-400">No contacts yet</p>
            <p className="text-xs text-gray-300 mt-1">Use the buttons above to add users, companies, or groups</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Users */}
            {users.length > 0 && (
              <section>
                <SectionHeader
                  label="Users"
                  count={users.length}
                  icon={
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Company</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Permission</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((c) => (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-b-0">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{displayName(c)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {c.email ? (
                              <a href={`mailto:${c.email}`} className="hover:text-gray-900 transition-colors">{c.email}</a>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{c.phone || <span className="text-gray-300">—</span>}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{c.company || <span className="text-gray-300">—</span>}</td>
                          <td className="px-4 py-3"><PermissionBadge value={c.permission} /></td>
                          <td className="px-4 py-3">
                            <button
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openMenuId === c.id) { setOpenMenuId(null); setMenuPos(null); return; }
                                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                setOpenMenuId(c.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Companies */}
            {companies.length > 0 && (
              <section>
                <SectionHeader
                  label="Companies"
                  count={companies.length}
                  icon={
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Company</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((c) => (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-b-0">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.company}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {c.email ? (
                              <a href={`mailto:${c.email}`} className="hover:text-gray-900 transition-colors">{c.email}</a>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{c.phone || <span className="text-gray-300">—</span>}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{c.notes || <span className="text-gray-300">—</span>}</td>
                          <td className="px-4 py-3">
                            <button
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openMenuId === c.id) { setOpenMenuId(null); setMenuPos(null); return; }
                                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                setOpenMenuId(c.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Distribution Groups */}
            {groups.length > 0 && (
              <section>
                <SectionHeader
                  label="Distribution Groups"
                  count={groups.length}
                  icon={
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Group Name</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((c) => (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-b-0">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.group_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {c.email ? (
                              <a href={`mailto:${c.email}`} className="hover:text-gray-900 transition-colors">{c.email}</a>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{c.notes || <span className="text-gray-300">—</span>}</td>
                          <td className="px-4 py-3">
                            <button
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openMenuId === c.id) { setOpenMenuId(null); setMenuPos(null); return; }
                                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                setOpenMenuId(c.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Fixed three-dot dropdown */}
      {openMenuId && menuPos && menuContact && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
          className="w-36 bg-white border border-gray-100 rounded-lg shadow-lg py-1"
        >
          <button
            onMouseDown={(e) => { e.stopPropagation(); setEditTarget(menuContact); setOpenMenuId(null); setMenuPos(null); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onMouseDown={(e) => { e.stopPropagation(); setDeleteTarget(menuContact); setOpenMenuId(null); setMenuPos(null); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      {/* Modals */}
      {showUserModal && (
        <UserModal
          companies={companies.map((c) => c.company ?? "").filter(Boolean)}
          onConfirm={handleAddUser}
          onCancel={() => setShowUserModal(false)}
        />
      )}
      {showCompanyModal && (
        <CompanyModal onConfirm={handleAddCompany} onCancel={() => setShowCompanyModal(false)} />
      )}
      {showGroupModal && (
        <GroupModal onConfirm={handleAddGroup} onCancel={() => setShowGroupModal(false)} />
      )}

      {/* Edit modals — open the right type for the target */}
      {editTarget?.type === "user" && (
        <UserModal
          initial={{
            first_name: editTarget.first_name ?? "",
            last_name: editTarget.last_name ?? "",
            email: editTarget.email ?? "",
            phone: editTarget.phone ?? "",
            company: editTarget.company ?? "",
            permission: editTarget.permission ?? "",
          }}
          companies={companies.map((c) => c.company ?? "").filter(Boolean)}
          onConfirm={handleEdit}
          onCancel={() => setEditTarget(null)}
        />
      )}
      {editTarget?.type === "company" && (
        <CompanyModal
          initial={{
            company: editTarget.company ?? "",
            email: editTarget.email ?? "",
            phone: editTarget.phone ?? "",
            notes: editTarget.notes ?? "",
          }}
          onConfirm={handleEdit}
          onCancel={() => setEditTarget(null)}
        />
      )}
      {editTarget?.type === "distribution_group" && (
        <GroupModal
          initial={{
            group_name: editTarget.group_name ?? "",
            email: editTarget.email ?? "",
            notes: editTarget.notes ?? "",
          }}
          onConfirm={handleEdit}
          onCancel={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          name={displayName(deleteTarget)}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showImportModal && (
        <ImportModal
          projectId={projectId}
          existingContacts={contacts}
          onClose={() => setShowImportModal(false)}
          onImported={handleImported}
        />
      )}
    </div>
  );
}
