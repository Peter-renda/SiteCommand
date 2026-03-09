import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import SubcontractorClient from "./SubcontractorClient";

export default async function SubcontractorPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Internal users belong on the regular dashboard
  if (session.user_type !== "external") redirect("/dashboard");

  const supabase = getSupabase();

  // Fetch the projects this external user was explicitly invited to,
  // along with their allowed sections for each project.
  const { data: memberships } = await supabase
    .from("project_memberships")
    .select(`
      role,
      allowed_sections,
      projects (
        id, name, description, address, status, value, company_id,
        companies (name)
      )
    `)
    .eq("user_id", session.id);

  type RawProject = {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    status: string;
    value: number;
    company_id: string;
    companies: { name: string } | { name: string }[] | null;
  };

  const projects = (memberships ?? []).map((m) => {
    const project = (m.projects as unknown) as RawProject | null;
    const companiesRaw = project?.companies;
    const companyName = Array.isArray(companiesRaw)
      ? (companiesRaw[0]?.name ?? "")
      : (companiesRaw?.name ?? "");

    return {
      id: project?.id ?? "",
      name: project?.name ?? "",
      description: project?.description ?? null,
      address: project?.address ?? null,
      status: project?.status ?? "",
      value: project?.value ?? 0,
      companyName,
      role: m.role as string,
      allowedSections: (m.allowed_sections as string[] | null) ?? null,
    };
  }).filter((p) => p.id);

  return (
    <SubcontractorClient
      username={session.username}
      email={session.email}
      projects={projects}
    />
  );
}
