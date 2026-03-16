import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; packageId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, packageId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("bids")
    .select("*")
    .eq("bid_package_id", packageId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; packageId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, packageId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const { company_name, contact_name, contact_email } = body;

  if (!company_name?.trim()) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bids")
    .insert({
      bid_package_id: packageId,
      project_id: projectId,
      company_name: company_name.trim(),
      contact_name: contact_name || null,
      contact_email: contact_email || null,
      status: "invited",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
