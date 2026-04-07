import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewSubmittalPackageClient from "./NewSubmittalPackageClient";

export default async function NewSubmittalPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return (
    <NewSubmittalPackageClient
      projectId={id}
      username={session.username}
    />
  );
}
