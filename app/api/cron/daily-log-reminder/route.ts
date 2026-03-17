import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

export async function GET(req: NextRequest) {
  // Secure with CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  // Fetch all active projects
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, company_id")
    .eq("status", "active");

  if (projectsError) {
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  if (!projects || projects.length === 0) {
    return NextResponse.json({ message: "No active projects found", sent: 0 });
  }

  // Fetch all daily logs for today to find which projects have completed logs
  const projectIds = projects.map((p: { id: string }) => p.id);
  const { data: todayLogs, error: logsError } = await supabase
    .from("daily_logs")
    .select("project_id")
    .in("project_id", projectIds)
    .eq("log_date", today);

  if (logsError) {
    return NextResponse.json({ error: logsError.message }, { status: 500 });
  }

  const completedProjectIds = new Set(
    (todayLogs ?? []).map((l: { project_id: string }) => l.project_id)
  );

  // Find projects missing a daily log for today
  const incompleteProjects = projects.filter(
    (p: { id: string }) => !completedProjectIds.has(p.id)
  );

  if (incompleteProjects.length === 0) {
    return NextResponse.json({ message: "All active projects have daily logs for today", sent: 0 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY is not set" }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  let emailsSent = 0;
  const errors: string[] = [];

  for (const project of incompleteProjects) {
    // Get project members (admins and regular members) with their email addresses
    const { data: memberships, error: membershipsError } = await supabase
      .from("project_memberships")
      .select("role, users ( id, email, username )")
      .eq("project_id", project.id);

    if (membershipsError) {
      errors.push(`Failed to fetch members for project ${project.id}: ${membershipsError.message}`);
      continue;
    }

    if (!memberships || memberships.length === 0) continue;

    // Collect unique emails of project admins and members (exclude external collaborators where possible)
    const recipients = new Map<string, string>();
    for (const membership of memberships) {
      const user = membership.users as { id: string; email: string; username: string } | null;
      if (user?.email) {
        recipients.set(user.id, user.email);
      }
    }

    if (recipients.size === 0) continue;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.sitecommand.xyz";
    const projectUrl = `${appUrl}/projects/${project.id}/daily-log`;

    for (const email of recipients.values()) {
      try {
        const { error: sendError } = await resend.emails.send({
          from: "SiteCommand <invites@sitecommand.xyz>",
          to: email,
          subject: `Daily Log Reminder: ${project.name}`,
          html: `
            <p style="font-size:14px;">This is a reminder that the daily log for <strong>${project.name}</strong> has not been completed today (${today}).</p>
            <p style="font-size:14px;">Please complete it as soon as possible.</p>
            <p>
              <a href="${projectUrl}" style="background:#111;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
                Complete Daily Log
              </a>
            </p>
            <p style="color:#aaa;font-size:11px;">You are receiving this because you are a member of the ${project.name} project on SiteCommand.</p>
          `,
        });
        if (sendError) {
          errors.push(`Failed to send to ${email}: ${sendError.message}`);
        } else {
          emailsSent++;
        }
      } catch (err) {
        errors.push(`Exception sending to ${email}: ${String(err)}`);
      }
    }
  }

  return NextResponse.json({
    message: "Daily log reminder cron completed",
    date: today,
    incompleteProjects: incompleteProjects.length,
    emailsSent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
