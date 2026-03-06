import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/email";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data } = await supabase
    .from("companies")
    .select("id, name")
    .order("name", { ascending: true });

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, company_name: bodyCompanyName, company_id: bodyCompanyId } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!bodyCompanyName && !bodyCompanyId && !session.company_id) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  const supabase = getSupabase();

  let company_id: string = bodyCompanyId || session.company_id || "";

  if (!company_id && bodyCompanyName) {
    // Look up existing company by name (case-insensitive), or create it
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .ilike("name", bodyCompanyName.trim())
      .limit(1)
      .single();

    if (existing) {
      company_id = existing.id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from("companies")
        .insert({ name: bodyCompanyName.trim(), seat_limit: 0 })
        .select("id")
        .single();
      if (createErr || !created) {
        return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
      }
      company_id = created.id;
    }
  }

  const { data: company } = await supabase
    .from("companies")
    .select("seat_limit, name")
    .eq("id", company_id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const { count: memberCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("company_id", company_id);

  if (company.seat_limit > 0 && (memberCount ?? 0) >= company.seat_limit) {
    return NextResponse.json({ error: "Seat limit reached for this company" }, { status: 403 });
  }

  const { data: invite, error } = await supabase
    .from("invitations")
    .insert({
      company_id,
      email,
      invited_by: session.id,
    })
    .select("token")
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  await sendInviteEmail(email, inviteUrl, company.name);

  return NextResponse.json({ success: true });
}
