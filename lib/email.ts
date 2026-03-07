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
