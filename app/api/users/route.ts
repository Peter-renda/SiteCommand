import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const companyId = req.nextUrl.searchParams.get("company_id");

  let query = supabase
    .from("users")
    .select("id, username, email")
    .eq("approved", true)
    .order("username");

  if (companyId && session.role === "admin") {
    query = query.eq("company_id", companyId);
  } else if (!companyId && session.company_id) {
    query = query.eq("company_id", session.company_id);
  }

  const { data } = await query;
  return NextResponse.json(data || []);
}
