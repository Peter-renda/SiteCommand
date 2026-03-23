"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ProjectNav from "@/components/ProjectNav";

type ProjectAdmin = {
  id: string;
  name: string;
  description: string | null;
  project_number: string | null;
  status: string | null;
  sector: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  county: string | null;
  start_date: string | null;
  actual_start_date: string | null;
  completion_date: string | null;
  projected_finish_date: string | null;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
};

type ProjectMember = {
  membership_id: string;
  user_id: string;
  username: string;
  email: string;
  role: string;
};

type CompanyUser = {
  id: string;
  username: string;
  email: string;
};

const STAGES = [
  "Bidding",
  "Course of Construction",
  "Post-Construction",
  "Pre-Construction",
  "Warranty",
];


// ── Shared field components ───────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ReadonlyValue({ value }: { value: string | null | undefined }) {
  return (
    <p className="px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-md min-h-[38px]">
      {value || <span className="text-gray-300">—</span>}
    </p>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
    />
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
    />
  );
}

function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminClient({
  projectId,
  role,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const [data, setData] = useState<ProjectAdmin | null>(null);
  const isAdmin = role === "admin" || role === "super_admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // General Information
  const [stage, setStage] = useState("");
  const [name, setName] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [description, setDescription] = useState("");
  const [sector, setSector] = useState("");

  // Project Location
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [county, setCounty] = useState("");

  // Dates
  const [startDate, setStartDate] = useState("");
  const [actualStartDate, setActualStartDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [projectedFinishDate, setProjectedFinishDate] = useState("");
  const [warrantyStartDate, setWarrantyStartDate] = useState("");
  const [warrantyEndDate, setWarrantyEndDate] = useState("");

  // Members
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [memberActionError, setMemberActionError] = useState("");
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/members`);
    if (!res.ok) return;
    const data: Array<{ id: string; role: string; users: { id: string; username: string; email: string; company_id: string | null } | null }> = await res.json();
    setMembers(
      data
        .filter((m) => m.users)
        .map((m) => ({
          membership_id: m.id,
          user_id: m.users!.id,
          username: m.users!.username,
          email: m.users!.email,
          role: m.role,
        }))
    );
  }, [projectId]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/admin`)
      .then((r) => r.json())
      .then((d: ProjectAdmin) => {
        setData(d);
        setStage(d.status ?? "");
        setName(d.name ?? "");
        setProjectNumber(d.project_number ?? "");
        setDescription(d.description ?? "");
        setSector(d.sector ?? "");
        setAddress(d.address ?? "");
        setCity(d.city ?? "");
        setStateVal(d.state ?? "");
        setZipCode(d.zip_code ?? "");
        setCounty(d.county ?? "");
        setStartDate(d.start_date ?? "");
        setActualStartDate(d.actual_start_date ?? "");
        setCompletionDate(d.completion_date ?? "");
        setProjectedFinishDate(d.projected_finish_date ?? "");
        setWarrantyStartDate(d.warranty_start_date ?? "");
        setWarrantyEndDate(d.warranty_end_date ?? "");
        setLoading(false);
      });
    loadMembers();
  }, [projectId, loadMembers]);

  // Load company users for autocomplete
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d: CompanyUser[]) => setCompanyUsers(d))
      .catch(() => {});
  }, []);

  // Close member dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(e.target as Node)) {
        setMemberDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleAddMember(userId: string) {
    setMemberActionError("");
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: "member" }),
    });
    if (res.ok) {
      setMemberSearch("");
      setMemberDropdownOpen(false);
      loadMembers();
    } else {
      const d = await res.json().catch(() => ({}));
      setMemberActionError(d.error || "Failed to add member");
    }
  }

  async function handleRemoveMember(userId: string) {
    setMemberActionError("");
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      loadMembers();
    } else {
      const d = await res.json().catch(() => ({}));
      setMemberActionError(d.error || "Failed to remove member");
    }
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/admin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, description, project_number: projectNumber, status: stage, sector,
        address, city, state: stateVal, zip_code: zipCode, county,
        start_date: startDate || null,
        actual_start_date: actualStartDate || null,
        completion_date: completionDate || null,
        projected_finish_date: projectedFinishDate || null,
        warranty_start_date: warrantyStartDate || null,
        warranty_end_date: warrantyEndDate || null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData(updated);
      setStage(updated.status ?? "");
      setName(updated.name ?? "");
      setProjectNumber(updated.project_number ?? "");
      setDescription(updated.description ?? "");
      setSector(updated.sector ?? "");
      setAddress(updated.address ?? "");
      setCity(updated.city ?? "");
      setStateVal(updated.state ?? "");
      setZipCode(updated.zip_code ?? "");
      setCounty(updated.county ?? "");
      setStartDate(updated.start_date ?? "");
      setActualStartDate(updated.actual_start_date ?? "");
      setCompletionDate(updated.completion_date ?? "");
      setProjectedFinishDate(updated.projected_finish_date ?? "");
      setWarrantyStartDate(updated.warranty_start_date ?? "");
      setWarrantyEndDate(updated.warranty_end_date ?? "");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          SiteCommand
        </a>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <>
            {/* Page title + save */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin</h1>
              </div>
            </div>

            <div className="space-y-6">

              {/* General Information */}
              <Section title="General Information">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Stage of Construction">
                    <ReadonlyValue value={data?.status} />
                  </Field>

                  <Field label="Project Number">
                    <ReadonlyValue value={data?.project_number} />
                  </Field>

                  <Field label="Project Name">
                    <ReadonlyValue value={data?.name} />
                  </Field>

                  <Field label="Project Sector">
                    <ReadonlyValue value={data?.sector} />
                  </Field>

                  <div className="col-span-2">
                    <Field label="Description">
                      <ReadonlyValue value={data?.description} />
                    </Field>
                  </div>
                </div>
              </Section>

              {/* Project Location */}
              <Section title="Project Location">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="col-span-2">
                    <Field label="Address">
                      <ReadonlyValue value={data?.address} />
                    </Field>
                  </div>

                  <Field label="City">
                    <ReadonlyValue value={data?.city} />
                  </Field>

                  <Field label="State">
                    <ReadonlyValue value={data?.state} />
                  </Field>

                  <Field label="Zip Code">
                    <ReadonlyValue value={data?.zip_code} />
                  </Field>

                  <Field label="County">
                    <ReadonlyValue value={data?.county} />
                  </Field>
                </div>
              </Section>

              {/* Dates */}
              <Section title="Dates">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Start Date">
                    <ReadonlyValue value={formatDate(data?.start_date ?? null) || null} />
                  </Field>

                  <Field label="Actual Start Date">
                    <ReadonlyValue value={formatDate(data?.actual_start_date ?? null) || null} />
                  </Field>

                  <Field label="Completion Date">
                    <ReadonlyValue value={formatDate(data?.completion_date ?? null) || null} />
                  </Field>

                  <Field label="Projected Finish Date">
                    <ReadonlyValue value={formatDate(data?.projected_finish_date ?? null) || null} />
                  </Field>

                  <Field label="Warranty Start Date">
                    <ReadonlyValue value={formatDate(data?.warranty_start_date ?? null) || null} />
                  </Field>

                  <Field label="Warranty End Date">
                    <ReadonlyValue value={formatDate(data?.warranty_end_date ?? null) || null} />
                  </Field>
                </div>
              </Section>

              {/* Project Members */}
              <Section title="Project Members">
                <div className="space-y-4">
                  {/* Existing members list */}
                  {members.length === 0 ? (
                    <p className="text-sm text-gray-400">No members added yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {members.map((m) => (
                        <div key={m.user_id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                              {m.username[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{m.username}</p>
                              <p className="text-xs text-gray-400 truncate">{m.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-400 capitalize">{m.role.replace("_", " ")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add member autocomplete — admin only */}
                  {isAdmin && (
                    <div ref={memberDropdownRef} className="relative">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Add member</label>
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => { setMemberSearch(e.target.value); setMemberDropdownOpen(true); }}
                        onFocus={() => setMemberDropdownOpen(true)}
                        placeholder="Search by name or email..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                      {memberDropdownOpen && (() => {
                        const memberUserIds = new Set(members.map((m) => m.user_id));
                        const filtered = companyUsers.filter(
                          (u) =>
                            !memberUserIds.has(u.id) &&
                            (u.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
                              u.email.toLowerCase().includes(memberSearch.toLowerCase()))
                        );
                        if (filtered.length === 0) {
                          return memberSearch ? (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg px-3 py-2 z-20">
                              <p className="text-xs text-gray-400">No matching members found</p>
                            </div>
                          ) : null;
                        }
                        return (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg max-h-48 overflow-y-auto z-20">
                            {filtered.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleAddMember(u.id)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2.5"
                              >
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                                  {u.username[0]?.toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{u.username}</span>
                                <span className="text-xs text-gray-400">{u.email}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {memberActionError && (
                    <p className="text-xs text-red-600">{memberActionError}</p>
                  )}
                </div>
              </Section>

            </div>
          </>
        )}
      </main>
    </div>
  );
}
