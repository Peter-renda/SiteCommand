"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";
import { Brand, Eyebrow } from "@/components/design-system/Primitives";
import { PERMISSION_TEMPLATES, type PermissionLevel } from "@/lib/permission-templates";

type Contact = {
  id: string;
  type: "user" | "company" | "distribution_group";
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  permission: string | null;
  group_name: string | null;
  notes: string | null;
  job_title: string | null;
  address: string | null;
};

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  address: string;
  permission: string;
};

function levelLabel(level: PermissionLevel): string {
  if (level === "read_only") return "Read Only";
  if (level === "standard") return "Standard";
  if (level === "admin") return "Admin";
  return "None";
}

export default function DirectoryContactDetailClient({
  projectId,
  username,
  initialContact,
}: {
  projectId: string;
  username: string;
  initialContact: Contact;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<FormData>({
    first_name: initialContact.first_name ?? "",
    last_name: initialContact.last_name ?? "",
    email: initialContact.email ?? "",
    phone: initialContact.phone ?? "",
    company: initialContact.company ?? "",
    job_title: initialContact.job_title ?? "",
    address: initialContact.address ?? "",
    permission: initialContact.permission ?? "",
  });

  const permissionRows = useMemo(() => {
    if (!form.permission || !(form.permission in PERMISSION_TEMPLATES)) return [];
    return PERMISSION_TEMPLATES[form.permission as keyof typeof PERMISSION_TEMPLATES];
  }, [form.permission]);

  function set(field: keyof FormData, value: string) {
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/directory/${initialContact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="hover:opacity-80 transition-opacity"><Brand /></a>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={() => router.push(`/projects/${projectId}/directory`)} className="text-sm text-gray-400 hover:text-gray-900">Back to Directory</button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">
        <div className="rounded-xl border border-[var(--border-base)] bg-white p-4">
          <Eyebrow quiet>Project Workspace</Eyebrow>
          <h1 className="font-display text-[28px] leading-tight text-[color:var(--ink)] mt-2">Contact Details</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">First Name</label><input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Last Name</label><input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Email</label><input value={form.email} type="email" onChange={(e) => set("email", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Phone</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Company</label><input value={form.company} onChange={(e) => set("company", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Job Title</label><input value={form.job_title} onChange={(e) => set("job_title", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Address</label><input value={form.address} onChange={(e) => set("address", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" /></div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Permission Template</label>
              <select value={form.permission} onChange={(e) => set("permission", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white">
                <option value="">— None —</option>
                {Object.keys(PERMISSION_TEMPLATES).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-xs text-green-600">Saved</span>}
            <button disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>

        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-900">Permissions</div>
          {permissionRows.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-400">Select a permission template to view tool permissions.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">None</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Read Only</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Standard</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Admin</th>
                </tr>
              </thead>
              <tbody>
                {permissionRows.map((row) => (
                  <Fragment key={row.tool}>
                    <tr className="border-b border-gray-100">
                      <td className="px-3 py-2 text-sm text-gray-800">{row.tool}</td>
                      {(["none", "read_only", "standard", "admin"] as PermissionLevel[]).map((level) => (
                        <td key={level} className="px-3 py-2 text-center"><input type="radio" readOnly checked={row.level === level} aria-label={`${row.tool} ${levelLabel(level)}`} /></td>
                      ))}
                    </tr>
                    {row.granularPermissions?.length ? (
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <td colSpan={5} className="px-3 py-2 text-xs text-gray-600">Granular Permissions: {row.granularPermissions.join(" · ")}</td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
