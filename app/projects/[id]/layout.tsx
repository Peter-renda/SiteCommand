import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canAccessProject } from "@/lib/project-access";
import { userIsTaggedOnAnyProjectRfi } from "@/lib/rfi-access";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Demo users may navigate into projects they created client-side (sessionStorage only).
  // Those projects don't exist in the database, so we skip the DB access check for demo
  // accounts and trust the client-side interceptor to handle data correctly.
  if (session.user_type !== "demo") {
    const { id } = await params;
    const hasAccess = await canAccessProject(id, session);
    if (!hasAccess) {
      // Tagged collaborators (assignees, distribution list, RFI manager,
      // received-from contacts) get scoped access so they can interact
      // with the RFIs they're on, even without a full project membership.
      const tagged = await userIsTaggedOnAnyProjectRfi(id, session);
      if (!tagged) redirect("/dashboard");
    }
  }

  return <>{children}</>;
}
