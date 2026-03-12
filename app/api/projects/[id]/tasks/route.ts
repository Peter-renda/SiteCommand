import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendTaskCreatedEmail } from "@/lib/email";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("task_number", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  // Determine next task number
  const { data: maxRow } = await supabase
    .from("tasks")
    .select("task_number")
    .eq("project_id", projectId)
    .order("task_number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (maxRow?.task_number ?? 0) + 1;

  const { title, status, category, description, distribution_list, assignees, due_date } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      task_number: nextNumber,
      title,
      status: status || "open",
      category: category || null,
      description: description || null,
      distribution_list: distribution_list || [],
      assignees: assignees || [],
      due_date: due_date || null,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send email notifications to distribution list members with emails
  const recipients: { name: string; email: string }[] = (distribution_list ?? []).filter(
    (d: { email?: string | null }) => d.email
  );

  if (recipients.length > 0) {
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const taskUrl = `${appUrl}/projects/${projectId}/tasks`;

    await Promise.allSettled(
      recipients.map((r) =>
        sendTaskCreatedEmail(r.email, project?.name ?? "", data!.task_number, title, taskUrl, description || null, due_date || null)
      )
    );
  }

  return NextResponse.json(data);
}
