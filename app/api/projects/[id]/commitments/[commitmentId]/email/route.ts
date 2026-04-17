import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { requireToolLevel } from "@/lib/tool-permissions";
import { sendCommitmentEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId } = await params;
  const denied = await requireToolLevel(session, projectId, "commitments", "standard");
  if (denied) return denied;

  const supabase = getSupabase();
  const body = await req.json();
  const { to, cc, subject, message, isPrivate } = body as {
    to: string[];
    cc: string[];
    subject: string;
    message: string;
    isPrivate: boolean;
  };

  if (!Array.isArray(to) || to.filter(Boolean).length === 0) {
    return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
  }

  const [{ data: commitment, error: commitmentError }, { data: project }] = await Promise.all([
    supabase
      .from("commitments")
      .select("id, number, title, type")
      .eq("id", commitmentId)
      .eq("project_id", projectId)
      .single(),
    supabase.from("projects").select("name").eq("id", projectId).single(),
  ]);

  if (commitmentError || !commitment) {
    return NextResponse.json({ error: "Commitment not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.sitecommand.xyz";
  const commitmentUrl = `${appUrl}/projects/${projectId}/commitments/${commitmentId}`;

  const errors: string[] = [];
  for (const email of to.filter(Boolean)) {
    try {
      await sendCommitmentEmail({
        to: email,
        cc: (cc ?? []).filter(Boolean),
        subject: subject || `${commitment.type === "purchase_order" ? "Purchase Order" : "Subcontract"} #${commitment.number}`,
        message: message || "",
        commitmentNumber: commitment.number,
        commitmentTitle: commitment.title,
        commitmentType: commitment.type,
        projectName: project?.name || "",
        commitmentUrl,
        isPrivate: !!isPrivate,
      });
    } catch (err) {
      errors.push(`${email}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
