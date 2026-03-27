/**
 * GET  /api/settings/company-integrations
 * PATCH /api/settings/company-integrations
 *
 * Reads and writes Sage Intacct credentials scoped to the session user's
 * company. Only company super_admins may access this endpoint.
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

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) return null;
  if (session.company_role !== "super_admin" && session.role !== "site_admin") return null;
  if (!session.company_id) return null;
  return session;
}

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("company_integrations")
    .select("key, value")
    .eq("company_id", session.company_id)
    .in("key", SAGE_KEYS);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, string | null> = {};
  for (const key of SAGE_KEYS) {
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
  for (const key of SAGE_KEYS) {
    if (typeof body[key] === "string") {
      const val = body[key].trim();
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
