/**
 * Community hub — shared constants + helpers (server + client safe).
 *
 * The Community page (linked under Career Center) hosts five surfaces:
 * discussion boards, mentorship matching, office hours, regional networking,
 * and a simulation-performance leaderboard. The board categories, focus areas,
 * and regions live here so the client UI and the API validation agree.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const BOARD_CATEGORIES = [
  { slug: "general", label: "General" },
  { slug: "buyout", label: "Buyout & Procurement" },
  { slug: "cost", label: "Cost & Billing" },
  { slug: "schedule", label: "Scheduling" },
  { slug: "field", label: "Field Operations" },
  { slug: "software", label: "Using SiteCommand" },
  { slug: "careers", label: "Careers & Advice" },
] as const;

export type BoardCategorySlug = (typeof BOARD_CATEGORIES)[number]["slug"];

export function isBoardCategory(v: unknown): v is BoardCategorySlug {
  return typeof v === "string" && BOARD_CATEGORIES.some((c) => c.slug === v);
}

export function boardCategoryLabel(slug: string): string {
  return BOARD_CATEGORIES.find((c) => c.slug === slug)?.label ?? "General";
}

export const FOCUS_AREAS = [
  "Buyout & Procurement",
  "Cost & Billing",
  "Scheduling",
  "Submittals & RFIs",
  "Change Management",
  "Field Operations",
  "Owner / Client Relations",
  "Closeout",
  "Preconstruction",
  "Leadership",
] as const;

export const REGIONS = [
  "Northeast",
  "Mid-Atlantic",
  "Southeast",
  "Midwest",
  "Great Plains",
  "Mountain West",
  "Southwest",
  "West Coast",
  "Pacific Northwest",
  "International",
] as const;

export type Region = (typeof REGIONS)[number];

export function isRegion(v: unknown): v is Region {
  return typeof v === "string" && (REGIONS as readonly string[]).includes(v);
}

export const MENTORSHIP_ROLES = ["mentor", "mentee"] as const;
export type MentorshipRole = (typeof MENTORSHIP_ROLES)[number];

/**
 * Best-effort human name for a user id. Prefers "First Last", then username,
 * then the supplied fallback (usually the session email/username).
 */
export async function resolveDisplayName(
  supabase: SupabaseClient,
  userId: string,
  fallback: string,
): Promise<string> {
  const { data } = await supabase
    .from("users")
    .select("first_name, last_name, username")
    .eq("id", userId)
    .maybeSingle();
  const full = [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim();
  return full || data?.username || fallback || "CPMA member";
}

/**
 * Overlap score between two focus-area lists (0..1) — the mentorship match
 * strength. Simple Jaccard-style intersection over the smaller set so a mentee
 * with a couple of interests still matches a broad mentor strongly.
 */
export function focusOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const shared = a.filter((x) => setB.has(x)).length;
  return shared / Math.min(a.length, b.length);
}
