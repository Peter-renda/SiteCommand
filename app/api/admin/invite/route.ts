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

  const { email, company_id: bodyCompanyId } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Prefer company_id from request body, then session, then first company
  let company_id: string = bodyCompanyId || session.company_id || "";
  if (!company_id) {
    const { data: first } = await supabase
      .from("companies")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    if (!first) {
      return NextResponse.json({ error: "No company found. Please select a company." }, { status: 404 });
    }
    company_id = first.id;
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
