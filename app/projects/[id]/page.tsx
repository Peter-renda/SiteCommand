import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProjectClient from "./ProjectClient";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  return <ProjectClient projectId={id} role={session.role} username={session.username} companyRole={session.company_role ?? ""} userId={session.id} />;
}
