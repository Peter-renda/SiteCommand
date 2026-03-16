import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isCompanyAdmin } from "@/lib/project-access";
import { getSupabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCompanyAdmin(session.company_role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!session.company_id) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, created_at")
    .eq("company_id", session.company_id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCompanyAdmin(session.company_role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!session.company_id) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const body = await req.json();
  const { name } = body;
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const rawKey = "sc_live_" + uuidv4().replace(/-/g, "").slice(0, 32);
  const prefix = rawKey.slice(0, 16);
  const key_hash = await bcrypt.hash(rawKey, 10);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      company_id: session.company_id,
      created_by: session.id,
      name: name.trim(),
      key_prefix: prefix,
      key_hash,
    })
    .select("id, name, key_prefix, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ key: rawKey, ...data }, { status: 201 });
}
