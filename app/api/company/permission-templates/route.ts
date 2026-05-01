import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isCompanyAdmin } from "@/lib/project-access";
import {
  TEMPLATE_TOOLS,
  defaultLevelFor,
  isTemplateCategory,
  isTemplateUserType,
  isPermissionLevel,
  type PermissionLevel,
  type TemplateCategory,
  type TemplateUserType,
} from "@/lib/permission-templates";
import { applyPermissionTemplate } from "@/lib/apply-permission-template";


function inviteeUserTypeToTemplateName(userType: TemplateUserType): string | null {
  if (userType === "subcontractor") return "Subcontractor";
  if (userType === "architect_engineer") return "Architect/Engineer";
  if (userType === "owner_client") return "Owner/Client";
  return null;
}

/**
 * GET /api/company/permission-templates?category=company|invitee&type=<user_type>
 *
 * Returns the merged template (built-in defaults + any stored overrides) as
 * { tool: level } for every tool in TEMPLATE_TOOLS. Visible to company admins.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.company_id || !isCompanyAdmin(session.company_role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const userType = searchParams.get("type");

  if (!isTemplateCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!isTemplateUserType(category, userType)) {
    return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: rows } = await supabase
    .from("company_permission_templates")
    .select("tool, level")
    .eq("company_id", session.company_id)
    .eq("user_category", category)
    .eq("user_type", userType);

  const overrides = new Map<string, PermissionLevel>();
  for (const row of rows ?? []) {
    if (isPermissionLevel(row.level)) overrides.set(row.tool, row.level);
  }

  const levels: Record<string, PermissionLevel> = {};
  for (const tool of TEMPLATE_TOOLS) {
    levels[tool] = overrides.get(tool) ?? defaultLevelFor(category, userType, tool);
  }

  return NextResponse.json({ category, user_type: userType, levels });
}

/**
 * PUT /api/company/permission-templates
 * Body: { category, user_type, levels: { [tool]: level } }
 *
 * Replaces the stored template for (company, category, user_type). Only the
 * Super Admin may modify templates.
 */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.company_role !== "super_admin" || !session.company_id) {
    return NextResponse.json({ error: "Only the Super Admin can edit templates" }, { status: 403 });
  }

  const body = (await req.json()) as {
    category?: TemplateCategory;
    user_type?: TemplateUserType;
    levels?: Record<string, PermissionLevel>;
  };

  if (!isTemplateCategory(body.category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!isTemplateUserType(body.category, body.user_type)) {
    return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
  }
  const levels = body.levels;
  if (!levels || typeof levels !== "object") {
    return NextResponse.json({ error: "levels is required" }, { status: 400 });
  }

  const rows: {
    company_id: string;
    user_category: TemplateCategory;
    user_type: TemplateUserType;
    tool: string;
    level: PermissionLevel;
    updated_by: string;
    updated_at: string;
  }[] = [];

  const now = new Date().toISOString();
  for (const tool of TEMPLATE_TOOLS) {
    const level = levels[tool];
    if (!isPermissionLevel(level)) {
      return NextResponse.json({ error: `Invalid level for ${tool}` }, { status: 400 });
    }
    rows.push({
      company_id: session.company_id,
      user_category: body.category,
      user_type: body.user_type,
      tool,
      level,
      updated_by: session.id,
      updated_at: now,
    });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("company_permission_templates")
    .upsert(rows, { onConflict: "company_id,user_category,user_type,tool" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.category === "invitee") {
    const templateName = inviteeUserTypeToTemplateName(body.user_type);
    if (templateName) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("company_id", session.company_id);

      const projectIds = (projects ?? []).map((p) => p.id).filter(Boolean);

      if (projectIds.length > 0) {
        const { data: contacts } = await supabase
          .from("directory_contacts")
          .select("project_id,email,type,permission")
          .in("project_id", projectIds)
          .eq("type", "user")
          .eq("permission", templateName)
          .not("email", "is", null);

        const normalized = Array.from(
          new Set(
            (contacts ?? [])
              .map((c) => ({
                projectId: c.project_id as string | null,
                email: String(c.email ?? "").trim().toLowerCase(),
              }))
              .filter((c) => c.projectId && c.email)
              .map((c) => `${c.projectId}::${c.email}`)
          )
        ).map((key) => {
          const [projectId, email] = key.split("::");
          return { projectId, email };
        });

        if (normalized.length > 0) {
          const emailSet = Array.from(new Set(normalized.map((c) => c.email)));
          const { data: users } = await supabase
            .from("users")
            .select("id,email")
            .in("email", emailSet);

          const userIdByEmail = new Map(
            (users ?? []).map((u) => [String(u.email ?? "").trim().toLowerCase(), u.id as string])
          );

          for (const contact of normalized) {
            const userId = userIdByEmail.get(contact.email);
            if (!userId) continue;

            await applyPermissionTemplate(supabase, {
              companyId: session.company_id,
              projectId: contact.projectId,
              userId,
              category: body.category,
              userType: body.user_type,
              updatedBy: session.id,
            });
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
