/**
 * Simulated email identity for "SiteCommand Training" sandboxes.
 *
 * Every address that appears inside a training project is fake by
 * construction: generated addresses live under a reserved `.example.com`
 * domain (RFC 2606 — mail to it is never deliverable), and the trainee
 * participates in sandbox threads under a fake PM address derived from their
 * name — their real login email is never stored in, sent from, or displayed
 * in a simulation. Real outbound email from a training project is blocked
 * entirely (see lib/training-outbound.ts); responses come from the LLM
 * (lib/training-email-reply.ts).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ThreadMessage } from "@/lib/email-types";

/** Fictional general contractor used when the launcher has no company of their own. */
export const DEFAULT_COMPANY = "Summit Builders";

/** Reserved domain suffix (RFC 2606) — mail to it can never be delivered. */
export const TRAINING_EMAIL_SUFFIX = ".example.com";

/** "Acme Builders, Inc." → "acmebuildersinc.example.com" */
export function trainingDomain(company: string, fallbackSlug: string): string {
  const slug = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${slug || fallbackSlug}${TRAINING_EMAIL_SUFFIX}`;
}

/** The GC's simulated email domain (e.g. "summitbuilders.example.com"). */
export function emailDomain(company: string): string {
  return trainingDomain(company, "summitbuilders");
}

/** "First"+"Last"@domain with a safe, dot-normalized local part. */
export function emailFor(first: string, last: string, domain: string): string {
  const local = `${first}.${last}`
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return `${local || "project.manager"}@${domain}`;
}

export type TrainingPmIdentity = {
  /** Display name ("First Last" > username > "Project Manager"). */
  name: string;
  /** First name for greetings. */
  first: string;
  /** The trainee's FAKE simulated PM address — never their login email. */
  email: string;
  /** Their real login email — used only to recognize legacy stored rows. */
  realEmail: string;
  companyName: string;
  domain: string;
};

/**
 * Resolves the trainee's simulated PM identity for a sandbox: display name,
 * fake `@<company>.example.com` address, and GC company/domain context.
 */
export async function resolveTrainingPmIdentity(
  supabase: SupabaseClient,
  opts: { userId: string; companyId?: string | null },
): Promise<TrainingPmIdentity> {
  let companyName = DEFAULT_COMPANY;
  if (opts.companyId) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", opts.companyId)
      .maybeSingle();
    if (company?.name) companyName = company.name;
  }
  const domain = emailDomain(companyName);

  const { data: user } = await supabase
    .from("users")
    .select("first_name, last_name, email, username")
    .eq("id", opts.userId)
    .maybeSingle();

  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "Project Manager";
  const first = (user?.first_name || name).split(/\s+/)[0] || "there";
  const email =
    user?.first_name || user?.last_name
      ? emailFor(user?.first_name ?? "", user?.last_name ?? "", domain)
      : emailFor(user?.username ?? "", "", domain);

  return { name, first, email, realEmail: user?.email ?? "", companyName, domain };
}

/** The set of addresses that identify the trainee in stored sandbox threads. */
export function pmAddressSet(
  identity: Pick<TrainingPmIdentity, "email" | "realEmail">,
): Set<string> {
  return new Set(
    [identity.email, identity.realEmail]
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Rewrites the trainee's real login address to their fake simulated address
 * throughout a stored thread (from/to/cc) so the real address never surfaces
 * in a sandbox — including threads seeded before fake identities existed.
 */
export function maskRealPmAddress(
  messages: ThreadMessage[],
  identity: Pick<TrainingPmIdentity, "email" | "realEmail">,
): ThreadMessage[] {
  const real = identity.realEmail.trim().toLowerCase();
  if (!real || real === identity.email.toLowerCase()) return messages;
  const swap = (addr: string | null | undefined) =>
    (addr ?? "").trim().toLowerCase() === real ? identity.email : (addr ?? "");
  return messages.map((m) => ({
    ...m,
    from: { ...m.from, address: swap(m.from?.address) },
    to: (m.to ?? []).map((r) => ({ ...r, address: swap(r.address) })),
    cc: (m.cc ?? []).map((r) => ({ ...r, address: swap(r.address) })),
  }));
}
