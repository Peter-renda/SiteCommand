import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Create360ReportClient from "../new/Create360ReportClient";

export default async function View360ReportPage({
  params,
}: {
  params: Promise<{ id: string; reportId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id, reportId } = await params;
  return <Create360ReportClient projectId={id} category="Financials" reportId={reportId} />;
}
