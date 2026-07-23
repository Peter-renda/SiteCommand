import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasFullAccess } from "@/lib/entitlement";
import TrainingPaywall from "../TrainingPaywall";
import GuidesClient from "./GuidesClient";

export default async function GuidesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Company guides & best-practice templates are a full-membership feature.
  if (!(await hasFullAccess(session))) {
    return (
      <TrainingPaywall
        title="Company guides are a members feature"
        description="Browse and manage company guides and best-practice templates once you start your free trial. Your free account includes the Pre-Construction & Entitlements lessons, plus the Resources, Career Center, and Community pages."
      />
    );
  }

  return (
    <GuidesClient
      canManage={session.company_role === "super_admin"}
      hasCompany={Boolean(session.company_id)}
    />
  );
}
