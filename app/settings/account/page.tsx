import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccountSettingsClient from "./AccountSettingsClient";

export default async function AccountSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <AccountSettingsClient username={session.username} email={session.email} />;
}
