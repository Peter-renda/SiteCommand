"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TOOL_SECTIONS, ALL_TOOL_SLUGS } from "@/lib/tool-sections";

type Member = {
  id: string;
  username: string;
  email: string;
  company_role: string;
};

function roleBadgeClass(role: string) {
  if (role === "super_admin") return "bg-amber-50 text-amber-700";
  if (role === "admin") return "bg-gray-100 text-gray-700";
  return "bg-gray-50 text-gray-400";
}

function roleLabel(role: string) {
  if (role === "super_admin") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}

export default function MemberToolAccessClient({
  member,
  initialAllowedTools,
  isSuperAdmin,
  currentUserId,
}: {
  member: Member;
  initialAllowedTools: string[] | null;
  isSuperAdmin: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const isOwner = member.company_role === "super_admin";

  // null = all tools enabled (no restriction)
  // string[] = specific allowed tools
  const [allowedTools, setAllowedTools] = useState<string[] | null>(initialAllowedTools);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const canEdit = (isSuperAdmin || member.company_role === "member") && !isOwner && member.id !== currentUserId;

  // Whether a given slug is currently enabled
  function isEnabled(slug: string): boolean {
    if (allowedTools === null) return true;
    return allowedTools.includes(slug);
  }

  // Whether all items in a section are enabled
  function isSectionEnabled(slugs: string[]): boolean {
    return slugs.every((s) => isEnabled(s));
  }

  // Whether some (but not all) items in a section are enabled
  function isSectionIndeterminate(slugs: string[]): boolean {
    const enabled = slugs.filter((s) => isEnabled(s)).length;
    return enabled > 0 && enabled < slugs.length;
  }

  function toggleTool(slug: string) {
    setSaved(false);
    setAllowedTools((prev) => {
      // Expand null to full list first
      const current = prev === null ? [...ALL_TOOL_SLUGS] : [...prev];
      if (current.includes(slug)) {
        return current.filter((s) => s !== slug);
      } else {
        return [...current, slug];
      }
    });
  }

  function toggleSection(slugs: string[], enable: boolean) {
    setSaved(false);
    setAllowedTools((prev) => {
      const current = prev === null ? [...ALL_TOOL_SLUGS] : [...prev];
      if (enable) {
        const merged = Array.from(new Set([...current, ...slugs]));
        // If all tools are now enabled, collapse back to null
        if (ALL_TOOL_SLUGS.every((s) => merged.includes(s))) return null;
        return merged;
      } else {
        return current.filter((s) => !slugs.includes(s));
      }
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    // If every tool is enabled, send null (unrestricted)
    const payload =
      allowedTools !== null && ALL_TOOL_SLUGS.every((s) => allowedTools.includes(s))
        ? null
        : allowedTools;

    const res = await fetch(`/api/company/members/${member.id}/tools`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowedTools: payload }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">SiteCommand</span>
        <button
          onClick={() => router.push("/company")}
          className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
        >
          ← Team
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* User info */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-gray-900">{member.username}</h1>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${roleBadgeClass(member.company_role)}`}>
              {roleLabel(member.company_role)}
            </span>
          </div>
          <p className="text-sm text-gray-400">{member.email}</p>
        </div>

        {/* Tool Access */}
        <div className="bg-white rounded-xl border border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-900">Tool Access</h2>
            {isOwner && (
              <span className="text-xs text-gray-400">Owners have full access</span>
            )}
          </div>
          {!isOwner && (
            <p className="text-xs text-gray-400 mb-5">
              {canEdit
                ? "Toggle which tools this user can access. Disabled tools are hidden from their navigation."
                : "You don't have permission to change this user's tool access."}
            </p>
          )}

          {isOwner ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              The account owner always has access to all tools.
            </p>
          ) : (
            <div className="space-y-6">
              {TOOL_SECTIONS.map((section) => {
                const slugs = section.items.map((i) => i.slug);
                const allOn = isSectionEnabled(slugs);
                const someOn = isSectionIndeterminate(slugs);

                return (
                  <div key={section.label}>
                    {/* Section header with category toggle */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {section.label}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => toggleSection(slugs, !allOn)}
                          className={`text-xs font-medium transition-colors ${
                            allOn
                              ? "text-gray-400 hover:text-gray-600"
                              : "text-orange-500 hover:text-orange-700"
                          }`}
                        >
                          {allOn ? "Disable all" : someOn ? "Enable all" : "Enable all"}
                        </button>
                      )}
                    </div>

                    {/* Individual tool rows */}
                    <div className="space-y-0.5">
                      {section.items.map((tool) => {
                        const enabled = isEnabled(tool.slug);
                        return (
                          <div
                            key={tool.slug}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                          >
                            <span className={`text-sm ${enabled ? "text-gray-900" : "text-gray-400"}`}>
                              {tool.name}
                            </span>
                            {canEdit ? (
                              <button
                                onClick={() => toggleTool(tool.slug)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  enabled ? "bg-gray-900" : "bg-gray-200"
                                }`}
                                role="switch"
                                aria-checked={enabled}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    enabled ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            ) : (
                              <span
                                className={`inline-block h-5 w-9 rounded-full ${
                                  enabled ? "bg-gray-900" : "bg-gray-200"
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save button */}
        {canEdit && !isOwner && (
          <div className="mt-5 flex items-center justify-end gap-3">
            {error && <p className="text-xs text-red-600">{error}</p>}
            {saved && <p className="text-xs text-green-600">Saved</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
