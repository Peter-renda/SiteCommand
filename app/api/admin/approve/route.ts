import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, approved } = await req.json();
  const supabase = getSupabase();

  const { error } = await supabase.from("users").update({ approved }).eq("id", id);

  if (error) return NextResponse.json({ error: "Failed to update user" }, { status: 500 });

  return NextResponse.json({ message: "User updated" });
}
