/**
 * Community → Discussion boards: a single reply.
 *
 * DELETE /api/community/posts/[postId]/replies/[replyId] — remove a reply.
 *        Allowed for the reply author, the thread author, or a Site Command
 *        Admin. Decrements the parent post's reply_count.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string; replyId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { postId, replyId } = await params;

  const supabase = getSupabase();
  const { data: reply } = await supabase
    .from("community_post_replies")
    .select("id, user_id, post_id")
    .eq("id", replyId)
    .eq("post_id", postId)
    .maybeSingle();
  if (!reply) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: post } = await supabase
    .from("community_posts")
    .select("id, user_id, reply_count")
    .eq("id", postId)
    .maybeSingle();

  const canDelete =
    reply.user_id === session.id ||
    post?.user_id === session.id ||
    session.role === "site_admin";
  if (!canDelete) {
    return NextResponse.json({ error: "You can't delete this reply" }, { status: 403 });
  }

  const { error } = await supabase.from("community_post_replies").delete().eq("id", replyId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (post) {
    await supabase
      .from("community_posts")
      .update({ reply_count: Math.max(0, (post.reply_count ?? 1) - 1) })
      .eq("id", postId);
  }

  return NextResponse.json({ ok: true });
}
