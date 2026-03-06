import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail(to: string, inviteUrl: string, companyName: string) {
  const { error } = await resend.emails.send({
    from: 'SiteCommand <invites@sitecommand.app>',
    to,
    subject: `You've been invited to join ${companyName} on SiteCommand`,
    html: `<p>You've been invited to join <strong>${companyName}</strong> on SiteCommand.</p><p><a href="${inviteUrl}">Accept invitation</a></p><p>This link expires in 7 days.</p>`,
  });
  if (error) throw new Error(error.message);
}
