import { Resend } from 'resend';

export async function sendInviteEmail(to: string, inviteUrl: string, companyName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set in environment variables");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: 'SiteCommand <invites@sitecommand.xyz>',
    to,
    subject: `You've been invited to join ${companyName} on SiteCommand`,
    html: `<p>You've been invited to join <strong>${companyName}</strong> on SiteCommand.</p><p><a href="${inviteUrl}">Accept invitation</a></p><p>This link expires in 7 days.</p>`,
  });
  if (error) throw new Error(error.message);
}

export async function sendTaskCreatedEmail(
  to: string,
  projectName: string,
  taskNumber: number,
  taskTitle: string,
  taskUrl: string,
  description: string | null,
  dueDate: string | null,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set in environment variables");

  const resend = new Resend(apiKey);
  const dueLine = dueDate ? `<p style="color:#555;font-size:13px;"><strong>Due:</strong> ${new Date(dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>` : "";
  const descLine = description ? `<p style="color:#555;font-size:13px;">${description}</p>` : "";

  const { error } = await resend.emails.send({
    from: 'SiteCommand <invites@sitecommand.xyz>',
    to,
    subject: `New Task #${taskNumber}: ${taskTitle} — ${projectName}`,
    html: `
      <p style="font-size:14px;">A new task has been created on <strong>${projectName}</strong>.</p>
      <p style="font-size:16px;font-weight:600;">Task #${taskNumber}: ${taskTitle}</p>
      ${descLine}
      ${dueLine}
      <p><a href="${taskUrl}" style="background:#111;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">View Task</a></p>
      <p style="color:#aaa;font-size:11px;">You are receiving this because you are on the task distribution list.</p>
    `,
  });
  if (error) throw new Error(error.message);
}

export async function sendTaskEmail(
  to: string,
  projectName: string,
  taskNumber: number,
  taskTitle: string,
  taskUrl: string,
  description: string | null,
  dueDate: string | null,
  assignees: string[],
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set in environment variables");

  const resend = new Resend(apiKey);
  const dueLine = dueDate ? `<p style="color:#555;font-size:13px;"><strong>Due:</strong> ${new Date(dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>` : "";
  const descLine = description ? `<p style="color:#555;font-size:13px;">${description}</p>` : "";
  const assigneeLine = assignees.length > 0 ? `<p style="color:#555;font-size:13px;"><strong>Assigned to:</strong> ${assignees.join(", ")}</p>` : "";

  const { error } = await resend.emails.send({
    from: 'SiteCommand <invites@sitecommand.xyz>',
    to,
    subject: `Task #${taskNumber}: ${taskTitle} — ${projectName}`,
    html: `
      <p style="font-size:14px;">You have been notified about a task on <strong>${projectName}</strong>.</p>
      <p style="font-size:16px;font-weight:600;">Task #${taskNumber}: ${taskTitle}</p>
      ${assigneeLine}
      ${descLine}
      ${dueLine}
      <p><a href="${taskUrl}" style="background:#111;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">View Task</a></p>
      <p style="color:#aaa;font-size:11px;">You are receiving this because you are assigned to or on the distribution list for this task.</p>
    `,
  });
  if (error) throw new Error(error.message);
}

export async function sendWebhookEventEmail(
  to: string,
  event: string,
  payload: Record<string, unknown>,
  webhookName: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silent — email is optional for webhook notifications

  const resend = new Resend(apiKey);
  const rows = Object.entries(payload)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `<tr><td style="padding:4px 8px;color:#555;font-size:12px;">${k}</td><td style="padding:4px 8px;font-size:12px;font-family:monospace;">${String(v)}</td></tr>`)
    .join("");

  await resend.emails.send({
    from: "SiteCommand <invites@sitecommand.xyz>",
    to,
    subject: `[SiteCommand] ${event}`,
    html: `
      <p style="font-size:14px;">A <strong>${event}</strong> event was triggered on your <strong>${webhookName}</strong> webhook.</p>
      <table style="border-collapse:collapse;width:100%;margin-top:12px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
        <thead><tr style="background:#f9fafb;"><th style="text-align:left;padding:6px 8px;font-size:11px;color:#6b7280;font-weight:600;">FIELD</th><th style="text-align:left;padding:6px 8px;font-size:11px;color:#6b7280;font-weight:600;">VALUE</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#aaa;font-size:11px;margin-top:16px;">You are receiving this because you configured email notifications on a SiteCommand webhook.</p>
    `,
  });
}

export async function sendRFIBallInCourtEmail(
  to: string,
  recipientName: string,
  senderName: string,
  rfiNumber: number,
  rfiSubject: string | null,
  projectName: string,
  rfiUrl: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silent if not configured

  const resend = new Resend(apiKey);
  const subject = rfiSubject || "No subject";
  await resend.emails.send({
    from: 'SiteCommand <invites@sitecommand.xyz>',
    to,
    subject: `RFI #${rfiNumber} has been returned to your court — ${projectName}`,
    html: `
      <p style="font-size:14px;">Hi${recipientName ? ` ${recipientName}` : ""},</p>
      <p style="font-size:14px;"><strong>${senderName}</strong> has returned <strong>RFI #${rfiNumber}: ${subject}</strong> to your court on <strong>${projectName}</strong>.</p>
      <p style="font-size:13px;color:#555;">This RFI requires your attention.</p>
      <p><a href="${rfiUrl}" style="background:#111;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">View RFI</a></p>
      <p style="color:#aaa;font-size:11px;">You are receiving this because you are assigned to this RFI on SiteCommand.</p>
    `,
  });
}

export async function sendRFIReopenedEmail(
  to: string,
  recipientName: string,
  reopenedByName: string,
  rfiNumber: number,
  rfiSubject: string | null,
  projectName: string,
  rfiUrl: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silent if not configured

  const resend = new Resend(apiKey);
  const subject = rfiSubject || "No subject";
  await resend.emails.send({
    from: 'SiteCommand <invites@sitecommand.xyz>',
    to,
    subject: `RFI #${rfiNumber} has been reopened — ${projectName}`,
    html: `
      <p style="font-size:14px;">Hi${recipientName ? ` ${recipientName}` : ""},</p>
      <p style="font-size:14px;"><strong>${reopenedByName}</strong> has reopened <strong>RFI #${rfiNumber}: ${subject}</strong> on <strong>${projectName}</strong>.</p>
      <p><a href="${rfiUrl}" style="background:#111;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">View RFI</a></p>
      <p style="color:#aaa;font-size:11px;">You are receiving this because you are on the distribution list for this RFI on SiteCommand.</p>
    `,
  });
}

export async function sendContractorInviteEmail(
  to: string,
  inviteUrl: string,
  projectName: string,
  contactName: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set in environment variables");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: 'SiteCommand <invites@sitecommand.xyz>',
    to,
    subject: `You've been invited to access ${projectName} on SiteCommand`,
    html: `
      <p>Hi${contactName ? ` ${contactName}` : ""},</p>
      <p>You've been invited to access <strong>${projectName}</strong> on SiteCommand.</p>
      <p><a href="${inviteUrl}" style="background:#111;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Accept Invitation</a></p>
      <p style="color:#888;font-size:12px;">This link expires in 7 days.</p>
    `,
  });
  if (error) throw new Error(error.message);
}
