import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendTaskEmail } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, taskId } = await params;
  const supabase = getSupabase();

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("project_id", projectId)
    .single();

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const taskUrl = `${appUrl}/projects/${projectId}/tasks/${taskId}`;

  // Collect unique recipients from both assignees and distribution list
  const assignees: { name: string; email: string | null }[] = task.assignees ?? [];
  const distList: { name: string; email: string | null }[] = task.distribution_list ?? [];

  const emailMap = new Map<string, { name: string; email: string }>();
  for (const r of [...assignees, ...distList]) {
    if (r.email) emailMap.set(r.email.toLowerCase(), { name: r.name, email: r.email });
  }

  const recipients = Array.from(emailMap.values());

  if (recipients.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const assigneeNames = assignees.map((a) => a.name).filter(Boolean);

  await Promise.allSettled(
    recipients.map((r) =>
      sendTaskEmail(
        r.email,
        project?.name ?? "",
        task.task_number,
        task.title,
        taskUrl,
        task.description ?? null,
        task.due_date ?? null,
        assigneeNames,
      )
    )
  );

  return NextResponse.json({ sent: recipients.length });
}
