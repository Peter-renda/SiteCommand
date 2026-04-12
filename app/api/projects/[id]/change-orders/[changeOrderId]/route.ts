import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, changeOrderId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("change_orders")
    .select("*")
    .eq("id", changeOrderId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, changeOrderId } = await params;
  const supabase = getSupabase();
  const body = await req.json();

  const { data: existing, error: existingError } = await supabase
    .from("change_orders")
    .select("id, type, erp_status")
    .eq("id", changeOrderId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .single();

  let existingRecord = existing as { id: string; type: string; erp_status?: string | null } | null;

  if (existingError) {
    // Backward compatibility for environments where erp_status may not exist yet.
    const missingErpStatusColumn = /erp_status/i.test(existingError.message || "");
    if (missingErpStatusColumn) {
      const { data: fallbackExisting, error: fallbackError } = await supabase
        .from("change_orders")
        .select("id, type")
        .eq("id", changeOrderId)
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .single();

      if (fallbackError || !fallbackExisting) {
        return NextResponse.json(
          { error: fallbackError?.message || "Not found" },
          { status: fallbackError ? 500 : 404 }
        );
      }
      existingRecord = { ...fallbackExisting, erp_status: null };
    } else {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
  }

  if (!existingRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (
    String(existingRecord.type || "").trim().toLowerCase() === "commitment" &&
    String(existingRecord.erp_status || "").trim().toLowerCase() === "synced"
  ) {
    return NextResponse.json(
      { error: "This commitment change order is synced to ERP and cannot be edited." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("change_orders")
    .update(body)
    .eq("id", changeOrderId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, changeOrderId } = await params;
  const supabase = getSupabase();

  const { data: existing, error: existingError } = await supabase
    .from("change_orders")
    .select("id, status")
    .eq("id", changeOrderId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .single();

  if (existingError || !existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (String(existing.status || "").trim().toLowerCase() === "approved") {
    return NextResponse.json({ error: "Approved change orders cannot be deleted." }, { status: 400 });
  }

  const { error } = await supabase
    .from("change_orders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", changeOrderId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
