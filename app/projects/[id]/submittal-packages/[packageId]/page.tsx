import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SubmittalPackageDetailClient from "./SubmittalPackageDetailClient";

export default async function SubmittalPackageDetailPage({
  params,
}: {
  params: Promise<{ id: string; packageId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, packageId } = await params;
  return (
    <SubmittalPackageDetailClient
      projectId={id}
      packageId={packageId}
      username={session.username}
    />
  );
}
