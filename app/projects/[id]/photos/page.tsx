import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PhotosClient from "./PhotosClient";

export default async function PhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <PhotosClient projectId={id} role={session.role} username={session.username} />;
}
