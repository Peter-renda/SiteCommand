import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  // Get tasks assigned to or created by this user that are open/in_progress
  // assignees may be a UUID[] array — use .contains() to check membership
  let tasks: {
    id: string;
    title: string;
    status: string;
    due_date: string | null;
    project_id: string;
  }[] = [];

  try {
    // Try contains first (UUID array column)
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, status, due_date, project_id")
      .contains("assignees", [session.id])
      .in("status", ["open", "in_progress"])
      .limit(5);

    if (!error && data) {
      tasks = data;
    } else {
      // Fallback: try assigned_to as single UUID
      const { data: data2 } = await supabase
        .from("tasks")
        .select("id, title, status, due_date, project_id")
        .eq("assigned_to", session.id)
        .in("status", ["open", "in_progress"])
        .limit(5);
      tasks = data2 || [];
    }
  } catch {
    tasks = [];
  }

  // Also include tasks created_by the user that are still open
  try {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, status, due_date, project_id")
      .eq("created_by", session.id)
      .in("status", ["open", "in_progress"])
      .limit(5);

    if (data) {
      // Merge, deduplicate by id
      const existingIds = new Set(tasks.map((t) => t.id));
      for (const row of data) {
        if (!existingIds.has(row.id)) {
          tasks.push(row);
        }
      }
    }
  } catch {}

  // Limit to 5 total
  tasks = tasks.slice(0, 5);

  if (tasks.length === 0) {
    return NextResponse.json({ tasks: [] });
  }

  // Fetch project names
  const projectIds = [...new Set(tasks.map((t) => t.project_id))];
  const { data: projectsData } = await supabase
    .from("projects")
    .select("id, name")
    .in("id", projectIds);

  const projectMap = new Map((projectsData || []).map((p: { id: string; name: string }) => [p.id, p.name]));

  const result = tasks.map((t) => ({
    ...t,
    project_name: projectMap.get(t.project_id) ?? "",
  }));

  return NextResponse.json({ tasks: result });
}
