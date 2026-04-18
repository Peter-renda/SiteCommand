import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// Returns a deduplicated pool of directory contacts across all projects in the
// session's company. Used by the project directory's "Bulk Add from Company
// Directory" flow. Optional query param ?excludeProjectId=<id> removes contacts
// that already exist in the target project so the caller doesn't show them.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const excludeProjectId = req.nextUrl.searchParams.get("excludeProjectId");
  const supabase = getSupabase();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("company_id", session.company_id);

  const projectIds = (projects ?? []).map((p) => p.id);
  if (projectIds.length === 0) return NextResponse.json([]);

  const projectNames = new Map<string, string>(
    (projects ?? []).map((p) => [p.id as string, p.name as string])
  );

  const { data, error } = await supabase
    .from("directory_contacts")
    .select("*")
    .in("project_id", projectIds)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const existingKeys = new Set<string>();
  if (excludeProjectId) {
    for (const c of data ?? []) {
      if (c.project_id === excludeProjectId) {
        existingKeys.add(dedupeKey(c));
      }
    }
  }

  const seen = new Map<string, any>();
  for (const c of data ?? []) {
    if (excludeProjectId && c.project_id === excludeProjectId) continue;
    const key = dedupeKey(c);
    if (existingKeys.has(key)) continue;
    if (seen.has(key)) continue;
    seen.set(key, {
      id: c.id,
      type: c.type,
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      permission: c.permission,
      group_name: c.group_name,
      notes: c.notes,
      job_title: c.job_title,
      address: c.address,
      source_project_id: c.project_id,
      source_project_name: projectNames.get(c.project_id) ?? null,
    });
  }

  return NextResponse.json(Array.from(seen.values()));
}

function dedupeKey(c: {
  type: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  group_name: string | null;
}): string {
  if (c.email) return `email:${c.email.toLowerCase()}`;
  if (c.type === "company") return `company:${(c.company ?? "").toLowerCase()}`;
  if (c.type === "distribution_group") return `group:${(c.group_name ?? "").toLowerCase()}`;
  return `user:${(c.first_name ?? "").toLowerCase()}|${(c.last_name ?? "").toLowerCase()}|${(c.company ?? "").toLowerCase()}`;
}
