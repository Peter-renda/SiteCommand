import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DirectoryClient from "./DirectoryClient";

export default async function DirectoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <DirectoryClient projectId={id} role={session.role} username={session.username} />;
}
