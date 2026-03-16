import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isCompanyAdmin } from "@/lib/project-access";
import DeveloperSettingsClient from "./DeveloperSettingsClient";

export default async function DeveloperSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isCompanyAdmin(session.company_role)) redirect("/dashboard");

  return <DeveloperSettingsClient />;
}
