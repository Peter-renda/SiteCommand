import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { requireToolLevel, type ToolLevel } from "@/lib/tool-permissions";

const TOOL = "commitments";
const LEVELS: ToolLevel[] = ["none", "read_only", "standard", "admin"];

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/[id]/commitments/permissions
 * Lists every project member alongside their effective Commitments
 * level (explicit override if set, otherwise derived from project role).
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const denied = await requireToolLevel(session, projectId, TOOL, "admin");
  if (denied) return denied;

  const supabase = getSupabase();

  const { data: memberships } = await supabase
    .from("project_memberships")
    .select("user_id, role")
    .eq("project_id", projectId);

  const userIds = (memberships || []).map((m) => m.user_id).filter(Boolean);

  const [{ data: users }, { data: overrides }] = await Promise.all([
    supabase
      .from("users")
      .select("id, username, first_name, last_name, email")
      .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("project_tool_permissions")
      .select("user_id, level")
      .eq("project_id", projectId)
      .eq("tool", TOOL),
  ]);

  const overrideByUser = new Map<string, ToolLevel>(
    (overrides || []).map((o) => [o.user_id as string, o.level as ToolLevel])
  );
  const usersById = Object.fromEntries((users || []).map((u) => [u.id, u]));

  const roleDefault = (role: string | null): ToolLevel => {
    if (role === "project_admin") return "admin";
    if (role === "member") return "standard";
    if (role === "external_viewer") return "read_only";
    return "none";
  };

  const rows = (memberships || []).map((m) => {
    const user = usersById[m.user_id];
    const override = overrideByUser.get(m.user_id);
    return {
      user_id: m.user_id,
      username: user?.username ?? "",
      email: user?.email ?? "",
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      project_role: m.role,
      default_level: roleDefault(m.role),
      level: override ?? roleDefault(m.role),
      overridden: !!override,
    };
  });

  return NextResponse.json(rows);
}

/**
 * PUT /api/projects/[id]/commitments/permissions
 * Body: { user_id: string, level: ToolLevel | null }
 *
 * level === null clears the override (user falls back to role default).
 */
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const denied = await requireToolLevel(session, projectId, TOOL, "admin");
  if (denied) return denied;

  const { user_id, level } = await req.json();
  if (typeof user_id !== "string" || !user_id) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }
  if (level !== null && !LEVELS.includes(level)) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  const supabase = getSupabase();

  if (level === null) {
    const { error } = await supabase
      .from("project_tool_permissions")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", user_id)
      .eq("tool", TOOL);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ user_id, overridden: false });
  }

  const { error } = await supabase
    .from("project_tool_permissions")
    .upsert(
      {
        project_id: projectId,
        user_id,
        tool: TOOL,
        level,
        updated_by: session.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id,user_id,tool" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user_id, level, overridden: true });
}
