import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data: users } = await supabase
    .from("users")
    .select("id, username, email, approved, role, created_at")
    .order("created_at", { ascending: false });

  return NextResponse.json(users);
}
