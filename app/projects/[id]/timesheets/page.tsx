import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TimesheetsClient from "./TimesheetsClient";

export default async function TimesheetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <TimesheetsClient projectId={id} username={session.username} />;
}
