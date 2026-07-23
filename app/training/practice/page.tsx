import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasFullAccess } from "@/lib/entitlement";
import TrainingPaywall from "../TrainingPaywall";
import PracticeClient from "./PracticeClient";

export default async function PracticePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // The project simulation sandbox is a full-membership feature.
  if (!(await hasFullAccess(session))) {
    return (
      <TrainingPaywall
        title="Project simulations are a members feature"
        description="Launch a real, private SiteCommand sandbox and run a whole job end to end once you start your free trial. Your free account includes the Pre-Construction & Entitlements lessons, plus the Resources, Career Center, and Community pages."
      />
    );
  }

  return <PracticeClient username={session.username} />;
}
