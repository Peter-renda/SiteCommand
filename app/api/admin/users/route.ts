import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 50;
  const offset = (page - 1) * limit;

  const supabase = getSupabase();

  let query = supabase
    .from("users")
    .select(
      "id, email, username, first_name, last_name, role, company_id, company_role, user_type, created_at, companies(id, name, subscription_plan, subscription_status)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data ?? [], total: count ?? 0, page, limit });
}
