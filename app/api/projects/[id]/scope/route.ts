import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("scope_items")
    .select("*")
    .eq("project_id", projectId)
    .order("division_code", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const { division_code, division_name, section_code, section_name, scope_text, sort_order } = body;

  if (!division_code?.trim()) {
    return NextResponse.json({ error: "Division code is required" }, { status: 400 });
  }
  if (!scope_text?.trim()) {
    return NextResponse.json({ error: "Scope text is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("scope_items")
    .insert({
      project_id: projectId,
      division_code: division_code.trim(),
      division_name: division_name?.trim() || "",
      section_code: section_code?.trim() || null,
      section_name: section_name?.trim() || null,
      scope_text: scope_text.trim(),
      sort_order: sort_order ?? 0,
      created_by: session.id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
