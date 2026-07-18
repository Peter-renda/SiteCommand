/**
 * Community → Discussion boards.
 *
 * GET  /api/community/posts?category=…  — list posts (optionally filtered to a
 *      board category), newest activity first.
 * POST /api/community/posts             — start a thread. Body: { title,
 *      body?, category? }. Any logged-in user.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isBoardCategory, resolveDisplayName } from "@/lib/community";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  user_id: string;
  author_name: string;
  category: string;
  title: string;
  body: string;
  reply_count: number;
  created_at: string;
  updated_at: string;
};

function serialize(row: Row, currentUserId: string) {
  return {
    id: row.id,
    authorName: row.author_name,
    category: row.category,
    title: row.title,
    body: row.body,
    replyCount: row.reply_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mine: row.user_id === currentUserId,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const category = req.nextUrl.searchParams.get("category");
  const supabase = getSupabase();
  let query = supabase
    .from("community_posts")
    .select("id, user_id, author_name, category, title, body, reply_count, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (category && isBoardCategory(category)) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    posts: ((data ?? []) as Row[]).map((r) => serialize(r, session.id)),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { title?: unknown; body?: unknown; category?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  const category = isBoardCategory(body.category) ? body.category : "general";
  if (!title) return NextResponse.json({ error: "A title is required" }, { status: 400 });

  const supabase = getSupabase();
  const authorName = await resolveDisplayName(supabase, session.id, session.username || session.email);

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: session.id,
      author_name: authorName,
      category,
      title: title.slice(0, 200),
      body: text.slice(0, 8000),
    })
    .select("id, user_id, author_name, category, title, body, reply_count, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: serialize(data as Row, session.id) });
}
