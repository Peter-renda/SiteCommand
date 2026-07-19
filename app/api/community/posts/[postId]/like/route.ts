/**
 * Community → Discussion boards: like / unlike a post.
 *
 * POST /api/community/posts/[postId]/like — toggle the caller's like.
 *      Returns { likeCount, likedByMe }.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { postId } = await params;

  const supabase = getSupabase();
  const { data: post } = await supabase
    .from("community_posts")
    .select("id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: existing } = await supabase
    .from("community_post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", session.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("community_post_likes").delete().eq("id", existing.id);
  } else {
    const { error } = await supabase
      .from("community_post_likes")
      .insert({ post_id: postId, user_id: session.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("community_post_likes")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);

  return NextResponse.json({ likeCount: count ?? 0, likedByMe: !existing });
}
