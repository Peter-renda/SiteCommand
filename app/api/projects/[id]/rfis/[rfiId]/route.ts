import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendRFIBallInCourtEmail, sendRFIClosedEmail, sendRFIReopenedEmail } from "@/lib/email";
import { logRFIChange } from "@/lib/rfi-history";

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

  // Fetch current RFI state before updating so we can detect transitions
  const { data: prevRfi } = await supabase
    .from("rfis")
    .select("status, ball_in_court_id, rfi_manager_id, assignees")
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

  // Log status change to history + send reopen emails
  if ("status" in update && prevRfi && update.status !== prevRfi.status) {
    const fromLabel = (prevRfi.status as string).charAt(0).toUpperCase() + (prevRfi.status as string).slice(1);
    const toLabel = (update.status as string).charAt(0).toUpperCase() + (update.status as string).slice(1);
    logRFIChange(supabase, session, rfiId, projectId, "Status", fromLabel, toLabel);

    if (update.status === "open" && prevRfi.status === "closed") {
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

    if (update.status === "closed" && prevRfi.status !== "closed") {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
        const rfiUrl = `${appUrl}/projects/${projectId}/rfis/${rfiId}`;

        const contactIds = [data.rfi_manager_id, data.received_from_id].filter(Boolean);
        const [projectRes, contactsRes] = await Promise.all([
          supabase.from("projects").select("name").eq("id", projectId).single(),
          contactIds.length > 0
            ? supabase.from("directory_contacts").select("id, first_name, last_name, email").in("id", contactIds)
            : Promise.resolve({ data: [] }),
        ]);

        const projectName = projectRes.data?.name ?? "your project";
        const contactsById = Object.fromEntries(
          ((contactsRes.data ?? []) as { id: string; first_name: string | null; last_name: string | null; email: string | null }[]).map((c) => [c.id, c])
        );

        // Collect all recipients: distribution list + assignees + rfi_manager + received_from
        const recipients: { name: string; email: string }[] = [];
        const seen = new Set<string>();

        const addRecipient = (name: string, email: string | null) => {
          if (email && !seen.has(email)) {
            seen.add(email);
            recipients.push({ name, email });
          }
        };

        const distributionList: { id: string; name: string; email: string | null }[] = Array.isArray(data.distribution_list) ? data.distribution_list : [];
        for (const contact of distributionList) addRecipient(contact.name, contact.email);

        const assignees: { id: string; name: string; email: string | null }[] = Array.isArray(data.assignees) ? data.assignees : [];
        for (const contact of assignees) addRecipient(contact.name, contact.email);

        if (data.rfi_manager_id && contactsById[data.rfi_manager_id]) {
          const c = contactsById[data.rfi_manager_id];
          addRecipient([c.first_name, c.last_name].filter(Boolean).join(" "), c.email);
        }

        if (data.received_from_id && contactsById[data.received_from_id]) {
          const c = contactsById[data.received_from_id];
          addRecipient([c.first_name, c.last_name].filter(Boolean).join(" "), c.email);
        }

        await Promise.allSettled(
          recipients.map((r) =>
            sendRFIClosedEmail(r.email, r.name, session.username, data.rfi_number, data.subject, projectName, rfiUrl)
          )
        );
      } catch {
        // Email failure should not block the response
      }
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

      // Determine descriptive from/to labels for history
      const prevAssignees = Array.isArray(prevRfi?.assignees) ? prevRfi.assignees as { id: string }[] : [];
      const prevBallWithAssignee = prevRfi?.ball_in_court_id !== null && prevRfi?.ball_in_court_id !== prevRfi?.rfi_manager_id;
      const fromLabel = prevRfi?.ball_in_court_id == null ? null : (prevBallWithAssignee ? "Assignees" : "RFI Manager");
      const newBallWithAssignee = data.ball_in_court_id !== data.rfi_manager_id && prevAssignees.some((a) => a.id === data.ball_in_court_id);
      const toLabel = newBallWithAssignee ? "Assignees" : "RFI Manager";
      logRFIChange(supabase, session, rfiId, projectId, "ball_in_court_role", fromLabel, toLabel);
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
