import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || !session.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data } = await supabase
    .from("users")
    .select("id, username, email, company_role, created_at")
    .eq("company_id", session.company_id)
    .order("created_at", { ascending: true });

  return NextResponse.json(data || []);
}
