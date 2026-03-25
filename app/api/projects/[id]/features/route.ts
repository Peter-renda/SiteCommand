import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canAccessProject } from "@/lib/project-access";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  // Verify the user can access this project
  const hasAccess = await canAccessProject(projectId, session);
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabase();

  // Get the project's company_id, then fetch enabled_features
  const { data: project } = await supabase
    .from("projects")
    .select("company_id")
    .eq("id", projectId)
    .single();

  if (!project?.company_id) {
    // No company attached — return all features enabled
    return NextResponse.json({ enabled_features: null });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("enabled_features")
    .eq("id", project.company_id)
    .single();

  return NextResponse.json({
    enabled_features: company?.enabled_features ?? null,
  });
}
