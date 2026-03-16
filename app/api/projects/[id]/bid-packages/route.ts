import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  // Fetch packages
  const { data: packages, error: pkgError } = await supabase
    .from("bid_packages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (pkgError) return NextResponse.json({ error: pkgError.message }, { status: 500 });

  if (!packages || packages.length === 0) return NextResponse.json([]);

  // Fetch bid counts per package
  const packageIds = packages.map((p) => p.id);
  const { data: bidCounts, error: countError } = await supabase
    .from("bids")
    .select("bid_package_id")
    .in("bid_package_id", packageIds);

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  const countMap: Record<string, number> = {};
  for (const b of bidCounts ?? []) {
    countMap[b.bid_package_id] = (countMap[b.bid_package_id] ?? 0) + 1;
  }

  const result = packages.map((p) => ({ ...p, bid_count: countMap[p.id] ?? 0 }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const { name, description, scope_of_work, due_date } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Package name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bid_packages")
    .insert({
      project_id: projectId,
      name: name.trim(),
      description: description || null,
      scope_of_work: scope_of_work || null,
      due_date: due_date || null,
      status: "draft",
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, bid_count: 0 });
}
