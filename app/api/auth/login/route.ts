import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { createToken } from "@/lib/auth";
import { isCompanyAdmin } from "@/lib/project-access";
import { ProjectPermission, resolvePermission } from "@/lib/permissions";

type LoginUser = {
  id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  company_id: string | null;
  company_role: string | null;
  user_type: string;
  password_hash: string;
};

type CompanyRow = {
  id: string;
  name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
};

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { email, password } = await req.json();

  const { data: user } = (await supabase
    .from("users")
    .select(
      "id, email, username, first_name, last_name, role, company_id, company_role, user_type, password_hash"
    )
    .eq("email", email)
    .single()) as { data: LoginUser | null };

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

  // ── Fetch company once (shared by redirect check and payload builder) ────────
  let company: CompanyRow | null = null;
  if (user.company_id) {
    const { data } = await supabase
      .from("companies")
      .select("id, name, stripe_customer_id, stripe_subscription_id, subscription_status")
      .eq("id", user.company_id)
      .single();
    company = data as CompanyRow | null;
  }

  // ── Redirect logic ──────────────────────────────────────────────────────────
  let redirect: string | null = null;
  const orgRole: string | null = user.company_role ?? null;

  if (user.role === "contractor") {
    redirect = "/teammate";
  } else {
    if (!user.company_id) {
      redirect = "/pricing";
    } else if (isCompanyAdmin(orgRole)) {
      // Company owner / admin — verify active subscription
      const ACTIVE_STATUSES = ["active", "trialing"];
      if (
        !company ||
        (company.stripe_subscription_id &&
          !ACTIVE_STATUSES.includes(company.subscription_status ?? ""))
      ) {
        redirect = "/pricing";
      }
    }
    // Regular members always go to /dashboard regardless of billing status
  }

  // ── Build rich user/org/project payload ─────────────────────────────────────
  // Lets the frontend know exactly what the user can see and edit without
  // making additional API calls after login.
  const userPayload = await buildUserPayload(supabase, user, orgRole, company);

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
  evaluated_permission: ProjectPermission;
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

async function buildUserPayload(
  supabase: ReturnType<typeof getSupabase>,
  user: LoginUser,
  orgRole: string | null,
  company: CompanyRow | null
) {
  const isAdmin = isCompanyAdmin(orgRole);
  let organizations: OrgEntry[] = [];

  if (user.company_id && company) {
    const { data: allProjects } = await supabase
      .from("projects")
      .select("id, name, status")
      .eq("company_id", user.company_id)
      .order("created_at", { ascending: false });

    const projects = (allProjects ?? []) as { id: string; name: string; status: string }[];

    // For regular members, fetch their explicit project-level permissions
    let memberPermissions: Record<string, ProjectPermission> = {};
    if (!isAdmin && projects.length > 0) {
      const { data: memberships } = await supabase
        .from("project_memberships")
        .select("project_id, permission, role")
        .eq("user_id", user.id);

      for (const m of memberships ?? []) {
        memberPermissions[m.project_id] = resolvePermission(m);
      }
    }

    organizations = [
      {
        org_id: company.id,
        name: company.name,
        role: orgRole ?? "member",
        // Only expose billing info to org-level admins
        billing: isAdmin
          ? {
              stripe_customer_id: company.stripe_customer_id ?? null,
              subscription_status: company.subscription_status ?? null,
            }
          : null,
        // Admins see all projects as write; members see only their own
        projects: projects
          .filter((p) => isAdmin || memberPermissions[p.id] !== undefined)
          .map((p) => ({
            project_id: p.id,
            name: p.name,
            status: p.status,
            evaluated_permission: isAdmin ? ("write" as const) : memberPermissions[p.id],
          })),
      },
    ];
  }

  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    organizations,
  };
}
