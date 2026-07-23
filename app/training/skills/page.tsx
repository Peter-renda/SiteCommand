import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasFullAccess } from "@/lib/entitlement";
import TrainingPaywall from "../TrainingPaywall";
import SkillsClient from "./SkillsClient";

export const metadata = { title: "Skills & Credential – CPMA" };

// Session gating happens in the Training layout; the client fetches the
// live competency profile itself. The skills profile / credential are a
// full-membership feature, so free accounts see the upgrade wall.
export default async function SkillsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!(await hasFullAccess(session))) {
    return (
      <TrainingPaywall
        title="Your skills profile is a members feature"
        description="Grade your real decisions across simulations, build a competency profile, and earn the SiteCommand Certified credential once you start your free trial. Your free account includes the Pre-Construction & Entitlements lessons, plus the Resources, Career Center, and Community pages."
      />
    );
  }

  return <SkillsClient />;
}
