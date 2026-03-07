import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  let companyId = session.company_id;

  // Fall back to the project's company if user has no company (e.g. system admin)
  if (!companyId) {
    const projectId = req.nextUrl.searchParams.get("projectId");
    if (!projectId) return NextResponse.json([]);
    const { data: project } = await supabase
      .from("projects")
      .select("company_id")
      .eq("id", projectId)
      .single();
    companyId = project?.company_id ?? null;
  }

  if (!companyId) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("company_lessons")
    .select("id, filename, columns, rows")
    .eq("company_id", companyId);

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
