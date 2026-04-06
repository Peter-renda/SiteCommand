import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

type FeedItem = {
  id: string;
  type: string;
  description: string;
  created_at: string;
  users: { username: string } | null;
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const [{ data: activityData, error: activityError }, { data: documentData, error: documentError }] = await Promise.all([
    supabase
      .from("activity_log")
      .select("id, type, description, created_at, users(username)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("documents")
      .select("id, name, created_at, users:users!created_by(username)")
      .eq("project_id", projectId)
      .eq("type", "file")
      .or(`is_private.eq.false,created_by.eq.${session.id}`)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (activityError) return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  if (documentError) return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });

  const activityItems: FeedItem[] = (activityData || []).map((item) => ({
    id: `activity-${item.id}`,
    type: item.type,
    description: item.description,
    created_at: item.created_at,
    users: item.users,
  }));

  const documentItems: FeedItem[] = (documentData || []).map((doc) => ({
    id: `document-${doc.id}`,
    type: "document",
    description: `Uploaded document: ${doc.name}`,
    created_at: doc.created_at,
    users: doc.users,
  }));

  const merged = [...activityItems, ...documentItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  return NextResponse.json(merged);
}
