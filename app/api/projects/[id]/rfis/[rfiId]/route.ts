import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { canAccessProject } from "@/lib/project-access";
import { getToolLevel } from "@/lib/tool-permissions";
import { sendRFIBallInCourtEmail, sendRFIClosedEmail, sendRFIReopenedEmail } from "@/lib/email";
import { logRFIChange } from "@/lib/rfi-history";

type NamedContact = { id: string; first_name: string | null; last_name: string | null };
type NamedSpecification = { id: string; name: string | null; code: string | null };
type AssigneeLike = { id?: string | null; name?: string | null };

function toComparable(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function isEqual(a: unknown, b: unknown): boolean {
  return toComparable(a) === toComparable(b);
}

function contactNameById(contacts: NamedContact[], id: string | null): string | null {
  if (!id) return null;
  const contact = contacts.find((c) => c.id === id);
  if (!contact) return id;
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();
  return name || id;
}

function specNameById(specifications: NamedSpecification[], id: string | null): string | null {
  if (!id) return null;
  const specification = specifications.find((s) => s.id === id);
  if (!specification) return id;
  const base = specification.name?.trim() || id;
  return specification.code ? `${base} (${specification.code})` : base;
}

function listNames(value: unknown): string {
  const items = Array.isArray(value) ? (value as AssigneeLike[]) : [];
  const names = items
    .map((item) => item?.name?.trim() || item?.id?.trim() || null)
    .filter((name): name is string => Boolean(name));
  return names.join(", ");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;

  if (!(await canAccessProject(projectId, session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    "official_response_id",
    "related_items",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      if (key === "subject") update[key] = (body[key] ?? "").toString().slice(0, 200);
      else update[key] = body[key] ?? null;
    }
  }

  const supabase = getSupabase();

  // Permission gate:
  //   - Admins on the RFIs tool may update anything.
  //   - The RFI creator may update anything on their own RFI (creator carve-out
  //     so they retain the same affordances as an admin on records they own).
  //   - All other callers (including assignees) may only update `ball_in_court_id`,
  //     and only when they are the current ball-in-court holder. This preserves the
  //     "Return to X's Court" workflow primitive without letting non-admins close,
  //     edit, mark-official, or otherwise mutate the RFI.
  const updateKeys = Object.keys(update);
  const ballInCourtOnly = updateKeys.length > 0 && updateKeys.every((k) => k === "ball_in_court_id");
  const toolLevel = await getToolLevel(session, projectId, "rfis");
  if (toolLevel !== "admin") {
    const { data: gateRfi } = await supabase
      .from("rfis")
      .select("created_by, ball_in_court_id, rfi_manager_id")
      .eq("id", rfiId)
      .eq("project_id", projectId)
      .single();
    if (!gateRfi) return NextResponse.json({ error: "RFI not found" }, { status: 404 });

    const isCreator = gateRfi.created_by === session.id;

    if (!isCreator && !ballInCourtOnly) {
      return NextResponse.json(
        { error: "Insufficient rfis permission (admin or RFI creator required)." },
        { status: 403 },
      );
    }

    if (!isCreator) {
      const currentHolderId = gateRfi.ball_in_court_id ?? gateRfi.rfi_manager_id;
      let isHolder = currentHolderId === session.id;
      if (!isHolder && currentHolderId && session.email) {
        const { data: holderContact } = await supabase
          .from("directory_contacts")
          .select("id, email")
          .eq("project_id", projectId)
          .eq("id", currentHolderId)
          .single();
        if (holderContact?.email && holderContact.email.toLowerCase() === session.email.toLowerCase()) {
          isHolder = true;
        }
      }
      if (!isHolder) {
        return NextResponse.json(
          { error: "Only the current ball-in-court holder, an RFI admin, or the RFI creator can update this RFI." },
          { status: 403 },
        );
      }
    }
  }

  // Fetch current RFI state before updating so we can detect transitions
  const { data: prevRfi } = await supabase
    .from("rfis")
    .select("subject, question, due_date, status, rfi_manager_id, received_from_id, assignees, distribution_list, responsible_contractor_id, specification_id, drawing_number, attachments, ball_in_court_id, official_response_id, related_items")
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

  const historyPromises: Promise<unknown>[] = [];

  // Log status change to history + send reopen emails
  if ("status" in update && prevRfi && update.status !== prevRfi.status) {
    const fromLabel = (prevRfi.status as string).charAt(0).toUpperCase() + (prevRfi.status as string).slice(1);
    const toLabel = (update.status as string).charAt(0).toUpperCase() + (update.status as string).slice(1);
    historyPromises.push(logRFIChange(supabase, session, rfiId, projectId, "Status", fromLabel, toLabel));

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

  // Log Ball In Court change to history (independently of email so the entry is always recorded)
  if ("ball_in_court_id" in update && prevRfi && prevRfi.ball_in_court_id !== data.ball_in_court_id) {
    const prevAssignees = Array.isArray(prevRfi.assignees) ? prevRfi.assignees as { id: string }[] : [];
    const newAssignees = Array.isArray(data.assignees) ? data.assignees as { id: string }[] : [];
    const labelFor = (ballId: string | null, managerId: string | null, assignees: { id: string }[]): string | null => {
      if (!ballId) return null;
      if (ballId === managerId) return "RFI Manager";
      if (assignees.some((a) => a.id === ballId)) return "Assignees";
      return "Other";
    };
    const fromLabel = labelFor(prevRfi.ball_in_court_id as string | null, prevRfi.rfi_manager_id as string | null, prevAssignees);
    const toLabel = labelFor(data.ball_in_court_id as string | null, data.rfi_manager_id as string | null, newAssignees);
    historyPromises.push(logRFIChange(supabase, session, rfiId, projectId, "Ball In Court", fromLabel, toLabel));
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

  if (prevRfi) {
    const [contactsRes, specsRes] = await Promise.all([
      supabase.from("directory_contacts").select("id, first_name, last_name").eq("project_id", projectId),
      supabase.from("specifications").select("id, name, code").eq("project_id", projectId),
    ]);

    const contacts = (contactsRes.data ?? []) as NamedContact[];
    const specifications = (specsRes.data ?? []) as NamedSpecification[];

    const fieldChanges = [
      { key: "subject", action: "Subject", toDisplay: (v: unknown) => (typeof v === "string" ? v : null) },
      { key: "question", action: "Question", toDisplay: (v: unknown) => (typeof v === "string" ? v : null) },
      { key: "due_date", action: "Due Date", toDisplay: (v: unknown) => (typeof v === "string" ? v : null) },
      { key: "rfi_manager_id", action: "RFI Manager", toDisplay: (v: unknown) => contactNameById(contacts, typeof v === "string" ? v : null) },
      { key: "received_from_id", action: "Received From", toDisplay: (v: unknown) => contactNameById(contacts, typeof v === "string" ? v : null) },
      { key: "assignees", action: "Assignees", toDisplay: (v: unknown) => listNames(v) || null },
      { key: "distribution_list", action: "Distribution List", toDisplay: (v: unknown) => listNames(v) || null },
      { key: "responsible_contractor_id", action: "Responsible Contractor", toDisplay: (v: unknown) => contactNameById(contacts, typeof v === "string" ? v : null) },
      { key: "specification_id", action: "Specification", toDisplay: (v: unknown) => specNameById(specifications, typeof v === "string" ? v : null) },
      { key: "drawing_number", action: "Drawing Number", toDisplay: (v: unknown) => (typeof v === "string" ? v : null) },
      { key: "official_response_id", action: "Official Response", toDisplay: (v: unknown) => (typeof v === "string" ? v : null) },
      { key: "related_items", action: "Related Items", toDisplay: (v: unknown) => (Array.isArray(v) ? `${v.length} items` : null) },
    ];

    for (const change of fieldChanges) {
      if (!(change.key in update)) continue;
      const oldValue = (prevRfi as Record<string, unknown>)[change.key];
      const newValue = (data as Record<string, unknown>)[change.key];
      if (isEqual(oldValue, newValue)) continue;

      historyPromises.push(
        logRFIChange(
          supabase,
          session,
          rfiId,
          projectId,
          change.action,
          change.toDisplay(oldValue),
          change.toDisplay(newValue),
        ),
      );
    }

    if ("attachments" in update) {
      const prevAttachments = Array.isArray(prevRfi.attachments) ? prevRfi.attachments : [];
      const newAttachments = Array.isArray(data.attachments) ? data.attachments : [];

      const prevUrls = new Set(
        prevAttachments
          .map((attachment: unknown) => (attachment && typeof attachment === "object" && "url" in attachment ? (attachment as { url?: string }).url : null))
          .filter((url): url is string => Boolean(url)),
      );

      for (const attachment of newAttachments) {
        const nextAttachment = attachment as { name?: string; url?: string };
        if (nextAttachment.url && prevUrls.has(nextAttachment.url)) continue;
        historyPromises.push(
          logRFIChange(supabase, session, rfiId, projectId, "Attachment Added", null, nextAttachment.name ?? "Attachment"),
        );
      }
    }
  }

  if (historyPromises.length > 0) {
    await Promise.allSettled(historyPromises);
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

  // Admins on the RFIs tool may delete any RFI; the RFI creator may delete the
  // RFI they own.
  const toolLevel = await getToolLevel(session, projectId, "rfis");
  if (toolLevel !== "admin") {
    const { data: existing } = await supabase
      .from("rfis")
      .select("created_by")
      .eq("id", rfiId)
      .eq("project_id", projectId)
      .single();
    if (!existing) return NextResponse.json({ error: "RFI not found" }, { status: 404 });
    if (existing.created_by !== session.id) {
      return NextResponse.json(
        { error: "Only an RFI admin or the RFI creator can delete this RFI." },
        { status: 403 },
      );
    }
  }

  const { error } = await supabase.from("rfis").delete().eq("id", rfiId).eq("project_id", projectId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
