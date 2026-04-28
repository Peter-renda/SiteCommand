import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import DirectoryContactDetailClient from "./DirectoryContactDetailClient";

export default async function DirectoryContactDetailPage({
  params,
}: {
  params: Promise<{ id: string; contactId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, contactId } = await params;
  const supabase = getSupabase();

  const { data: contact } = await supabase
    .from("directory_contacts")
    .select("*")
    .eq("id", contactId)
    .eq("project_id", id)
    .single();

  if (!contact) redirect(`/projects/${id}/directory`);

  return <DirectoryContactDetailClient projectId={id} username={session.username} initialContact={contact} />;
}
