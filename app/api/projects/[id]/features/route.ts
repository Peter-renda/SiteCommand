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

  // Fetch company-level enabled_features and user's allowed_tools in parallel
  const [{ data: company }, { data: membership }] = await Promise.all([
    supabase
      .from("companies")
      .select("enabled_features")
      .eq("id", project.company_id)
      .single(),
    supabase
      .from("org_members")
      .select("allowed_tools")
      .eq("user_id", session.id)
      .eq("org_id", project.company_id)
      .maybeSingle(),
  ]);

  const companyFeatures: string[] | null = company?.enabled_features ?? null;
  const userAllowed: string[] | null = membership?.allowed_tools ?? null;

  // Compute effective features:
  //   null + null → null (all enabled)
  //   null + array → user's list
  //   array + null → company's list
  //   array + array → intersection
  let effective: string[] | null;
  if (companyFeatures === null && userAllowed === null) {
    effective = null;
  } else if (companyFeatures === null) {
    effective = userAllowed;
  } else if (userAllowed === null) {
    effective = companyFeatures;
  } else {
    effective = companyFeatures.filter((f) => userAllowed.includes(f));
  }

  return NextResponse.json({ enabled_features: effective });
}
