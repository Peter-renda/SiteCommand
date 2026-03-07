import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.company_id) return NextResponse.json([]);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("company_lessons")
    .select("id, filename, columns, rows")
    .eq("company_id", session.company_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten all rows across all lesson files, tagging source filename
  const allRows: Array<Record<string, unknown>> = [];
  for (const lesson of data ?? []) {
    for (const row of (lesson.rows as Record<string, unknown>[])) {
      allRows.push({ _source: lesson.filename, ...row });
    }
  }

  return NextResponse.json(allRows);
}
