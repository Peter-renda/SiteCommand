import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isCompanyAdmin } from "@/lib/project-access";
import { getSupabase } from "@/lib/supabase";
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
    .from("webhooks")
    .select("id, name, url, events, is_active, created_at")
    .eq("company_id", session.company_id)
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
  const { name, url, events, notify_email } = body;

  if (!name || !name.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!url || !url.trim()) return NextResponse.json({ error: "URL is required" }, { status: 400 });
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: "At least one event is required" }, { status: 400 });
  }

  const secret = "whsec_" + uuidv4().replace(/-/g, "");

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("webhooks")
    .insert({
      company_id: session.company_id,
      created_by: session.id,
      name: name.trim(),
      url: url.trim(),
      events,
      secret,
      is_active: true,
      notify_email: notify_email?.trim() || null,
    })
    .select("id, name, url, events, is_active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ secret, ...data }, { status: 201 });
}
