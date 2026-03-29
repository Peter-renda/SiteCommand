import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendRFIBallInCourtEmail, sendRFIReopenedEmail } from "@/lib/email";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("rfis")
    .select("*")
    .eq("id", rfiId)
    .eq("project_id", projectId)
    .single();

  if (error || !data) return NextResponse.json({ error: "RFI not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const body = await req.json();

  const allowed = [
    "subject", "question", "due_date", "status",
    "rfi_manager_id", "received_from_id", "assignees", "distribution_list",
    "responsible_contractor_id", "specification_id", "drawing_number", "attachments",
    "ball_in_court_id",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      if (key === "subject") update[key] = (body[key] ?? "").toString().slice(0, 200);
      else update[key] = body[key] ?? null;
    }
  }

  const supabase = getSupabase();

  // Fetch current RFI state before updating so we can detect status transitions
  const { data: prevRfi } = await supabase
    .from("rfis")
    .select("status")
    .eq("id", rfiId)
    .eq("project_id", projectId)
    .single();

  const { data, error } = await supabase
    .from("rfis")
    .update(update)
    .eq("id", rfiId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send reopen emails when status changes from closed → open
  if (update.status === "open" && prevRfi?.status === "closed") {
    try {
      const projectRes = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();

      const projectName = projectRes.data?.name ?? "your project";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const rfiUrl = `${appUrl}/projects/${projectId}/rfis/${rfiId}`;
      const distributionList: { id: string; name: string; email: string | null }[] = Array.isArray(data.distribution_list) ? data.distribution_list : [];

      await Promise.allSettled(
        distributionList
          .filter((contact) => contact.email)
          .map((contact) =>
            sendRFIReopenedEmail(
              contact.email!,
              contact.name,
              session.username,
              data.rfi_number,
              data.subject,
              projectName,
              rfiUrl,
            )
          )
      );
    } catch {
      // Email failure should not block the response
    }
  }

  // Send ball-in-court email notification when ball_in_court_id is set
  if ("ball_in_court_id" in update && data.ball_in_court_id) {
    try {
      const [contactRes, projectRes] = await Promise.all([
        supabase
          .from("directory_contacts")
          .select("first_name, last_name, email")
          .eq("id", data.ball_in_court_id)
          .single(),
        supabase
          .from("projects")
          .select("name")
          .eq("id", projectId)
          .single(),
      ]);

      const contact = contactRes.data;
      const recipientEmail = contact?.email;
      if (recipientEmail) {
        const recipientName = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
        const senderName = session.username;
        const projectName = projectRes.data?.name ?? "your project";
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
        const rfiUrl = `${appUrl}/projects/${projectId}/rfis/${rfiId}`;
        await sendRFIBallInCourtEmail(recipientEmail, recipientName, senderName, data.rfi_number, data.subject, projectName, rfiUrl);
      }
    } catch {
      // Email failure should not block the response
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const supabase = getSupabase();

  const { error } = await supabase.from("rfis").delete().eq("id", rfiId).eq("project_id", projectId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
