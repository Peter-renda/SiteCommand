import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { email, password } = await req.json();

  const { data: user } = await supabase
    .from("users")
    .select(
      "id, email, username, first_name, last_name, role, company_id, company_role, user_type, password_hash"
    )
    .eq("email", email)
    .single();

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createToken({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role ?? "user",
    company_id: user.company_id ?? null,
    company_role: user.company_role ?? null,
    user_type: user.user_type ?? "internal",
  });

  // ── Redirect logic ──────────────────────────────────────────────────────────
  let redirect: string | null = null;
  const orgRole: string | null = user.company_role ?? null;
  const isOrgAdmin = orgRole === "super_admin" || orgRole === "admin";

  if (user.role === "contractor") {
    redirect = "/teammate";
  } else if (user.role !== "admin") {
    if (!user.company_id) {
      redirect = "/pricing";
    } else if (isOrgAdmin) {
      // Company owner / admin — verify active subscription
      const { data: company } = await supabase
        .from("companies")
        .select("subscription_status, stripe_subscription_id")
        .eq("id", user.company_id)
        .single();

      if (
        !company ||
        (company.stripe_subscription_id &&
          company.subscription_status !== "active")
      ) {
        redirect = "/pricing";
      }
    }
    // Invited members always go to /dashboard
  }

  // ── Build rich user/org/project payload ─────────────────────────────────────
  // Lets the frontend know exactly what the user can see and edit without
  // making additional API calls after login.
  const userPayload = await buildUserPayload(supabase, user, orgRole);

  const res = NextResponse.json({ message: "Logged in", redirect, user: userPayload });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}

// ── Helper: build the evaluated-permission payload ───────────────────────────

type ProjectEntry = {
  project_id: string;
  name: string;
  status: string;
  evaluated_permission: "write" | "read_only";
};

type OrgEntry = {
  org_id: string;
  name: string;
  role: string;
  billing: {
    stripe_customer_id: string | null;
    subscription_status: string | null;
  } | null;
  projects: ProjectEntry[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildUserPayload(supabase: any, user: any, orgRole: string | null) {
  const isOrgAdmin = orgRole === "super_admin" || orgRole === "admin";
  let organizations: OrgEntry[] = [];

  if (user.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("id, name, stripe_customer_id, subscription_status")
      .eq("id", user.company_id)
      .single();

    if (company) {
      const { data: allProjects } = await supabase
        .from("projects")
        .select("id, name, status")
        .eq("company_id", user.company_id)
        .order("created_at", { ascending: false });

      const projects = allProjects ?? [];

      // For regular members, fetch their explicit project-level permissions
      let memberPermissions: Record<string, "write" | "read_only"> = {};
      if (!isOrgAdmin && projects.length > 0) {
        const { data: memberships } = await supabase
          .from("project_memberships")
          .select("project_id, permission, role")
          .eq("user_id", user.id);

        for (const m of memberships ?? []) {
          // Prefer the explicit permission column; fall back to legacy role
          const perm: "write" | "read_only" =
            (m.permission as "write" | "read_only" | null) ??
            (m.role === "external_viewer" ? "read_only" : "write");
          memberPermissions[m.project_id] = perm;
        }
      }

      organizations = [
        {
          org_id: company.id,
          name: company.name,
          role: orgRole ?? "member",
          // Only expose billing info to org-level admins
          billing: isOrgAdmin
            ? {
                stripe_customer_id: company.stripe_customer_id ?? null,
                subscription_status: company.subscription_status ?? null,
              }
            : null,
          // Admins see all projects as write; members see only their own
          projects: (projects as { id: string; name: string; status: string }[])
            .filter((p) => isOrgAdmin || memberPermissions[p.id] !== undefined)
            .map((p) => ({
              project_id: p.id,
              name: p.name,
              status: p.status,
              evaluated_permission: isOrgAdmin
                ? ("write" as const)
                : memberPermissions[p.id],
            })),
        },
      ];
    }
  }

  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    organizations,
  };
}
