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

export async function sendContractorInviteEmail(to: string, inviteUrl: string, projectName: string, contactName: string) {
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
