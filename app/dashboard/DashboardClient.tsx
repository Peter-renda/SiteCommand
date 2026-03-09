"use client";

import { useState, useEffect, useRef } from "react";

type Member = { id: string; username: string; email: string };

type Project = {
  id: string;
  name: string;
  description: string;
  address: string;
  value: number;
  status: string;
  created_at: string;
  members?: Member[];
};

const ADMIN_EMAIL = "ptrenda1@gmail.com";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-6 py-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function MemberPicker({
  users,
  selected,
  onAdd,
  onRemove,
}: {
  users: Member[];
  selected: Member[];
  onAdd: (u: Member) => void;
  onRemove: (id: string) => void;
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

  const filtered = users.filter(
    (u) =>
      !selected.find((s) => s.id === u.id) &&
      (u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div ref={ref} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((u) => (
            <span
              key={u.id}
              className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-gray-100 text-xs text-gray-700 rounded-full"
            >
              {u.username}
              <button
                type="button"
                onClick={() => onRemove(u.id)}
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
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search by name or email..."
        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg max-h-40 overflow-y-auto z-20">
          {filtered.map((u) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onAdd(u); setSearch(""); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2.5"
            >
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                {u.username[0].toUpperCase()}
              </div>
              <span className="font-medium text-gray-900">{u.username}</span>
              <span className="text-gray-400 text-xs">{u.email}</span>
            </button>
          ))}
        </div>
      )}
      {open && search && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg px-3 py-2 z-20">
          <p className="text-xs text-gray-400">No matching team members</p>
        </div>
      )}
    </div>
  );
}

export default function DashboardClient({ username, email, role, companyRole, userType }: { username: string; email: string; role: string; companyRole: string | null; userType: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<Member[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [sector, setSector] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [county, setCounty] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("bidding");
  const [startDate, setStartDate] = useState("");
  const [actualStartDate, setActualStartDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [projectedFinishDate, setProjectedFinishDate] = useState("");
  const [warrantyStartDate, setWarrantyStartDate] = useState("");
  const [warrantyEndDate, setWarrantyEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"password" | "phone">("password");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  async function loadProjects() {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadUsers() {
    const res = await fetch("/api/users");
    const data = await res.json();
    setCompanyUsers(Array.isArray(data) ? data : []);
  }

  useEffect(() => { loadProjects(); }, []);

  function openModal() {
    loadUsers();
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setName(""); setProjectNumber(""); setSector("");
    setAddress(""); setCity(""); setStateVal(""); setZipCode(""); setCounty("");
    setDescription(""); setMembers([]); setValue(""); setStatus("bidding");
    setStartDate(""); setActualStartDate(""); setCompletionDate("");
    setProjectedFinishDate(""); setWarrantyStartDate(""); setWarrantyEndDate("");
    setFormError("");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  async function openSettings() {
    setSettingsError(""); setSettingsSuccess("");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    const res = await fetch("/api/user/profile");
    if (res.ok) {
      const data = await res.json();
      setPhone(data.phone ?? "");
    }
    setShowSettings(true);
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setSettingsError("New passwords do not match"); return; }
    if (newPassword.length < 6) { setSettingsError("Password must be at least 6 characters"); return; }
    setSettingsSaving(true); setSettingsError(""); setSettingsSuccess("");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSettingsSaving(false);
    if (!res.ok) { setSettingsError(data.error); return; }
    setSettingsSuccess("Password updated successfully");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
  }

  async function handleSavePhone(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true); setSettingsError(""); setSettingsSuccess("");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setSettingsSaving(false);
    if (!res.ok) { setSettingsError(data.error); return; }
    setSettingsSuccess("Phone number updated successfully");
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, project_number: projectNumber, sector,
        address, city, state: stateVal, zip_code: zipCode, county,
        description, value, status,
        start_date: startDate || null,
        actual_start_date: actualStartDate || null,
        completion_date: completionDate || null,
        projected_finish_date: projectedFinishDate || null,
        warranty_start_date: warrantyStartDate || null,
        warranty_end_date: warrantyEndDate || null,
        memberIds: members.map((m) => m.id),
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setFormError(data.error); return; }

    setProjects((prev) => [{ ...data, members }, ...prev]);
    closeModal();
  }

  const canManageProjects = role === "admin" || companyRole === "super_admin" || companyRole === "admin";
  const totalValue = projects.reduce((sum, p) => sum + (p.value || 0), 0);
  const activeCount = projects.filter((p) => p.status === "course of construction").length;
  const completedCount = projects.filter((p) => p.status === "post-construction" || p.status === "warranty").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 shrink-0">SiteCommand</span>
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          {role === "admin" && (
            <a href="/admin" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors shrink-0">
              Admin
            </a>
          )}
          {(companyRole === "super_admin" || companyRole === "admin") && (
            <a href="/company" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors shrink-0">
              Team
            </a>
          )}
          <span className="hidden sm:block text-sm text-gray-400 truncate max-w-[120px]">{username}</span>
          <button
            onClick={openSettings}
            className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
            title="Account Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors shrink-0">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-8">
          <div></div>
          {canManageProjects && (
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </button>
          )}
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatTile label="Portfolio Value" value={`$${totalValue.toLocaleString()}`} sub="across all projects" />
          <StatTile label="Total Projects" value={projects.length.toString()} />
          <StatTile label="Active" value={activeCount.toString()} sub="in progress" />
          <StatTile label="Completed" value={completedCount.toString()} sub="finished" />
        </div>

        <h2 className="text-sm font-semibold text-gray-900 mb-4">Projects</h2>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-16 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">No projects yet</p>
            {canManageProjects ? (
              <>
                <p className="text-xs text-gray-400 mb-6">Create your first project to get started.</p>
                <button onClick={openModal} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
                  New Project
                </button>
              </>
            ) : (
              <p className="text-xs text-gray-400">You haven&apos;t been added to any projects yet.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <a key={project.id} href={`/projects/${project.id}`} className="block bg-white border border-gray-100 rounded-xl px-5 py-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 leading-snug">{project.name}</h3>
                  <span className={`ml-3 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${project.status === "course of construction" ? "bg-green-50 text-green-700" : project.status === "bidding" ? "bg-blue-50 text-blue-700" : project.status === "pre-construction" ? "bg-yellow-50 text-yellow-700" : project.status === "warranty" ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
                    {project.status}
                  </span>
                </div>
                {project.address && (
                  <div className="flex items-center gap-1 mb-2">
                    <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-xs text-gray-400">{project.address}</p>
                  </div>
                )}
                {project.description && (
                  <p className="text-xs text-gray-400 mb-3 leading-relaxed">{project.description}</p>
                )}
                {project.members && project.members.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="flex -space-x-1.5">
                      {project.members.slice(0, 4).map((m) => (
                        <div
                          key={m.id}
                          title={m.username}
                          className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-semibold text-gray-600"
                        >
                          {m.username[0].toUpperCase()}
                        </div>
                      ))}
                    </div>
                    {project.members.length > 4 && (
                      <span className="text-xs text-gray-400">+{project.members.length - 4} more</span>
                    )}
                  </div>
                )}
                <div className="flex items-end justify-between">
                  <p className="text-lg font-semibold text-gray-900">${(project.value || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl flex flex-col max-h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-sm font-semibold text-gray-900">New Project</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="px-6 py-5 space-y-6 overflow-y-auto">

              {/* General Information */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">General Information</p>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="e.g. 123 Main St Renovation"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Project Number <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="text" value={projectNumber} onChange={(e) => setProjectNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="e.g. 2024-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={status} onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                    >
                      <option value="bidding">Bidding</option>
                      <option value="pre-construction">Pre-Construction</option>
                      <option value="course of construction">Course of Construction</option>
                      <option value="post-construction">Post-Construction</option>
                      <option value="warranty">Warranty</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sector <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="text" value={sector} onChange={(e) => setSector(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="e.g. Commercial"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Value ($)</label>
                    <input
                      type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                    placeholder="Brief description..."
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Location</p>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="text" value={city} onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="text" value={stateVal} onChange={(e) => setStateVal(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="State"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ZIP Code <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="e.g. 10001"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">County <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="text" value={county} onChange={(e) => setCounty(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="County"
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Dates</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Actual Start Date <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="date" value={actualStartDate} onChange={(e) => setActualStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Completion Date <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Projected Finish <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="date" value={projectedFinishDate} onChange={(e) => setProjectedFinishDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Warranty Start <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="date" value={warrantyStartDate} onChange={(e) => setWarrantyStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Warranty End <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="date" value={warrantyEndDate} onChange={(e) => setWarrantyEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Team */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Team</p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project Members <span className="text-gray-400 font-normal">(optional)</span></label>
                  <MemberPicker
                    users={companyUsers}
                    selected={members}
                    onAdd={(u) => setMembers((prev) => [...prev, u])}
                    onRemove={(id) => setMembers((prev) => prev.filter((m) => m.id !== id))}
                  />
                </div>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex gap-3 pt-1 pb-1">
                <button type="button" onClick={closeModal} className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50">
                  {saving ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-sm font-semibold text-gray-900">Account Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info row */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs text-gray-500"><span className="font-medium text-gray-700">Username:</span> {username}</p>
              <p className="text-xs text-gray-500 mt-0.5"><span className="font-medium text-gray-700">Email:</span> {email}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6">
              <button
                onClick={() => { setSettingsTab("password"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`py-3 text-xs font-medium mr-5 border-b-2 transition-colors ${settingsTab === "password" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}
              >
                Change Password
              </button>
              <button
                onClick={() => { setSettingsTab("phone"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`py-3 text-xs font-medium border-b-2 transition-colors ${settingsTab === "phone" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}
              >
                Phone Number
              </button>
            </div>

            <div className="px-6 py-5">
              {settingsTab === "password" && (
                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Repeat new password"
                    />
                  </div>
                  {settingsError && <p className="text-xs text-red-600">{settingsError}</p>}
                  {settingsSuccess && <p className="text-xs text-green-600">{settingsSuccess}</p>}
                  <button type="submit" disabled={settingsSaving} className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50">
                    {settingsSaving ? "Saving..." : "Update Password"}
                  </button>
                </form>
              )}

              {settingsTab === "phone" && (
                <form onSubmit={handleSavePhone} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="e.g. (555) 123-4567"
                    />
                  </div>
                  {settingsError && <p className="text-xs text-red-600">{settingsError}</p>}
                  {settingsSuccess && <p className="text-xs text-green-600">{settingsSuccess}</p>}
                  <button type="submit" disabled={settingsSaving} className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50">
                    {settingsSaving ? "Saving..." : "Save Phone Number"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
