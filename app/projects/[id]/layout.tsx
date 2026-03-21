import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canAccessProject } from "@/lib/project-access";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const hasAccess = await canAccessProject(id, session);
  if (!hasAccess) redirect("/dashboard");

  return <>{children}</>;
}
