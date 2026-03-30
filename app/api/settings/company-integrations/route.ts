/**
 * GET  /api/settings/company-integrations
 * PATCH /api/settings/company-integrations
 *
 * Reads and writes ERP credentials scoped to the session user's company.
 * Supports Sage Intacct (manual credentials), QuickBooks Online (OAuth tokens),
 * and Xero (OAuth tokens). Only company super_admins may access this endpoint.
 *
 * GET supports an optional ?integration=quickbooks|xero|sage query param to
 * return only the keys for a specific integration (used by the settings UI to
 * determine connection status without exposing all credentials at once).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const SAGE_KEYS = [
  "SAGE_SENDER_ID",
  "SAGE_SENDER_PASSWORD",
  "SAGE_COMPANY_ID",
  "SAGE_USER_ID",
  "SAGE_USER_PASSWORD",
] as const;

const QBO_KEYS = [
  "QBO_REALM_ID",
  "QBO_ACCESS_TOKEN",
  "QBO_REFRESH_TOKEN",
] as const;

const XERO_KEYS = [
  "XERO_TENANT_ID",
  "XERO_ACCESS_TOKEN",
  "XERO_REFRESH_TOKEN",
] as const;

const ALL_KEYS = [...SAGE_KEYS, ...QBO_KEYS, ...XERO_KEYS] as const;
type AllKey = (typeof ALL_KEYS)[number];

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) return null;
  if (session.company_role !== "super_admin" && session.role !== "site_admin") return null;
  if (!session.company_id) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const integration = searchParams.get("integration"); // optional filter

  let keysToFetch: readonly string[];
  if (integration === "quickbooks") keysToFetch = QBO_KEYS;
  else if (integration === "xero")   keysToFetch = XERO_KEYS;
  else if (integration === "sage")   keysToFetch = SAGE_KEYS;
  else                                keysToFetch = ALL_KEYS;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("company_integrations")
    .select("key, value")
    .eq("company_id", session.company_id)
    .in("key", keysToFetch);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, string | null> = {};
  for (const key of keysToFetch) {
    const row = data?.find((r) => r.key === key);
    settings[key] = row ? row.value : null;
  }

  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const upserts: { company_id: string; key: string; value: string; updated_at: string }[] = [];
  for (const key of ALL_KEYS) {
    if (typeof body[key as AllKey] === "string") {
      const val = (body[key as AllKey] as string).trim();
      if (val) {
        upserts.push({ company_id: session.company_id!, key, value: val, updated_at: now });
      }
    }
  }

  if (upserts.length === 0) {
    return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });
  }

  const { error } = await supabase
    .from("company_integrations")
    .upsert(upserts, { onConflict: "company_id,key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
