/**
 * Community → Discussion boards: a single post.
 *
 * DELETE /api/community/posts/[postId] — remove a thread (and its replies via
 *        cascade). Allowed for the author or a Site Command Admin
 *        (session.role === "site_admin") for moderation.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { postId } = await params;

  const supabase = getSupabase();
  const { data: post } = await supabase
    .from("community_posts")
    .select("id, user_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canDelete = post.user_id === session.id || session.role === "site_admin";
  if (!canDelete) {
    return NextResponse.json({ error: "Only the author can delete this post" }, { status: 403 });
  }

  const { error } = await supabase.from("community_posts").delete().eq("id", postId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
