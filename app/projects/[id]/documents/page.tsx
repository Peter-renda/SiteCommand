import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DocumentsClient from "./DocumentsClient";

export default async function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <DocumentsClient projectId={id} role={session.role} username={session.username} />;
}
