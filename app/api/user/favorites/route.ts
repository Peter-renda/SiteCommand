import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("favorites")
    .eq("id", session.id)
    .single();

  if (error || !data) return NextResponse.json({ favorites: [] });
  return NextResponse.json({ favorites: data.favorites ?? [] });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { favorites } = await req.json();
  if (!Array.isArray(favorites)) {
    return NextResponse.json({ error: "Invalid favorites" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("users")
    .update({ favorites })
    .eq("id", session.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorites });
}
