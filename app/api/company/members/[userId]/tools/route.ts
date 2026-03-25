import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { isCompanyAdmin } from "@/lib/project-access";
import { ALL_TOOL_SLUGS } from "@/lib/tool-sections";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session || !isCompanyAdmin(session.company_role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  const supabase = getSupabase();

  const { data: membership } = await supabase
    .from("org_members")
    .select("allowed_tools, role, users(id, username, email)")
    .eq("user_id", userId)
    .eq("org_id", session.company_id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    allowedTools: membership.allowed_tools ?? null,
    role: membership.role,
    user: membership.users,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session || !isCompanyAdmin(session.company_role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  const { allowedTools } = await req.json() as { allowedTools: string[] | null };

  // Validate — must be null (unrestricted) or a subset of known slugs
  if (allowedTools !== null) {
    const invalid = allowedTools.filter((s) => !ALL_TOOL_SLUGS.includes(s));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Unknown tool slugs: ${invalid.join(", ")}` }, { status: 400 });
    }
  }

  const supabase = getSupabase();

  const { data: membership } = await supabase
    .from("org_members")
    .select("id, role")
    .eq("user_id", userId)
    .eq("org_id", session.company_id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Admins cannot restrict a super_admin
  if (membership.role === "super_admin") {
    return NextResponse.json({ error: "Cannot restrict tool access for the account owner" }, { status: 403 });
  }

  await supabase
    .from("org_members")
    .update({ allowed_tools: allowedTools })
    .eq("user_id", userId)
    .eq("org_id", session.company_id);

  return NextResponse.json({ success: true });
}
