import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeammateClient from "./TeammateClient";

export default async function TeammatePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "contractor") redirect("/dashboard");

  return <TeammateClient username={session.username} />;
}
