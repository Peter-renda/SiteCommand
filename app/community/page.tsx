import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import CommunityClient from "./CommunityClient";

export const metadata = { title: "Community – CPMA" };

export default async function CommunityPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <CommunityClient username={session.username} email={session.email} />;
}
