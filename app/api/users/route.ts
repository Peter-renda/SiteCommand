import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data } = await supabase
    .from("users")
    .select("id, username, email")
    .eq("approved", true)
    .order("username");

  return NextResponse.json(data || []);
}
