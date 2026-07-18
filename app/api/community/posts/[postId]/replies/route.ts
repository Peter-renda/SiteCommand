/**
 * Community → Discussion boards: a thread's replies.
 *
 * GET  /api/community/posts/[postId]/replies — the post + its replies.
 * POST /api/community/posts/[postId]/replies — add a reply. Body: { body }.
 *      Any logged-in user. Bumps the parent post's reply_count + updated_at
 *      so active threads float to the top of the board.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { resolveDisplayName } from "@/lib/community";

export const dynamic = "force-dynamic";

type ReplyRow = {
  id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

function serializeReply(row: ReplyRow, currentUserId: string) {
  return {
    id: row.id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
    mine: row.user_id === currentUserId,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { postId } = await params;

  const supabase = getSupabase();
  const { data: post } = await supabase
    .from("community_posts")
    .select("id, user_id, author_name, category, title, body, reply_count, created_at, updated_at")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: replies, error } = await supabase
    .from("community_post_replies")
    .select("id, user_id, author_name, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    post: {
      id: post.id,
      authorName: post.author_name,
      category: post.category,
      title: post.title,
      body: post.body,
      replyCount: post.reply_count,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      mine: post.user_id === session.id,
    },
    replies: ((replies ?? []) as ReplyRow[]).map((r) => serializeReply(r, session.id)),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { postId } = await params;

  let body: { body?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "A reply is required" }, { status: 400 });

  const supabase = getSupabase();
  const { data: post } = await supabase
    .from("community_posts")
    .select("id, reply_count")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const authorName = await resolveDisplayName(supabase, session.id, session.username || session.email);
  const { data, error } = await supabase
    .from("community_post_replies")
    .insert({
      post_id: postId,
      user_id: session.id,
      author_name: authorName,
      body: text.slice(0, 8000),
    })
    .select("id, user_id, author_name, body, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from("community_posts")
    .update({ reply_count: (post.reply_count ?? 0) + 1, updated_at: new Date().toISOString() })
    .eq("id", postId);

  return NextResponse.json({ reply: serializeReply(data as ReplyRow, session.id) });
}
