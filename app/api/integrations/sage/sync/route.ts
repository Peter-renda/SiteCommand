/**
 * POST /api/integrations/sage/sync
 *
 * Triggers a manual sync of a single commitment or prime contract to Sage
 * Intacct. On success the record's erp_status is set to 'synced'; on failure
 * it is set back to 'not_synced'. Either way a row is written to
 * erp_sync_logs.
 *
 * Body:
 *   { recordType: "commitments" | "prime_contracts", recordId: string }
 *
 * Auth: company member or above (any authenticated user with project access).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import {
  getSageCredentials,
  isSageConfigured,
  syncCommitmentToSage,
  syncPrimeContractToSage,
  type CommitmentSyncPayload,
  type PrimeContractSyncPayload,
} from "@/lib/sage-intacct";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!session.company_id) {
    return NextResponse.json({ error: "No company associated with this account" }, { status: 422 });
  }

  const body = await req.json();
  const { recordType, recordId } = body as { recordType: string; recordId: string };

  if (!recordType || !recordId) {
    return NextResponse.json({ error: "recordType and recordId are required" }, { status: 400 });
  }
  if (recordType !== "commitments" && recordType !== "prime_contracts") {
    return NextResponse.json({ error: "Invalid recordType" }, { status: 400 });
  }

  const creds = await getSageCredentials(session.company_id);
  if (!isSageConfigured(creds)) {
    return NextResponse.json(
      { error: "Sage Intacct is not configured. Add credentials in Settings → Integrations." },
      { status: 422 }
    );
  }

  const supabase = getSupabase();

  // ── Fetch the record ────────────────────────────────────────────────────────
  if (recordType === "commitments") {
    const { data: commitment, error: fetchErr } = await supabase
      .from("commitments")
      .select("id, type, number, title, contract_company, original_contract_amount, status, project_id")
      .eq("id", recordId)
      .is("deleted_at", null)
      .single();

    if (fetchErr || !commitment) {
      return NextResponse.json({ error: "Commitment not found" }, { status: 404 });
    }

    // Mark pending while we call Sage
    await supabase.from("commitments").update({ erp_status: "pending" }).eq("id", recordId);

    const result = await syncCommitmentToSage(creds, commitment as CommitmentSyncPayload);

    const newStatus = result.ok ? "synced" : "not_synced";
    await Promise.all([
      supabase.from("commitments").update({ erp_status: newStatus }).eq("id", recordId),
      supabase.from("erp_sync_logs").insert({
        record_type: "commitments",
        record_id: recordId,
        result: result.ok ? "success" : "error",
        sage_key: result.ok ? result.key : null,
        error_message: result.ok ? null : result.error,
        raw_response: result.rawResponse,
      }),
    ]);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, sageKey: result.key, erp_status: "synced" });
  }

  // ── prime_contracts ─────────────────────────────────────────────────────────
  const { data: contract, error: fetchErr } = await supabase
    .from("prime_contracts")
    .select("id, contract_number, title, owner_client, original_contract_amount, status")
    .eq("id", recordId)
    .single();

  if (fetchErr || !contract) {
    return NextResponse.json({ error: "Prime contract not found" }, { status: 404 });
  }

  await supabase.from("prime_contracts").update({ erp_status: "pending" }).eq("id", recordId);

  const result = await syncPrimeContractToSage(creds, contract as PrimeContractSyncPayload);

  const newStatus = result.ok ? "synced" : "not_synced";
  await Promise.all([
    supabase.from("prime_contracts").update({ erp_status: newStatus }).eq("id", recordId),
    supabase.from("erp_sync_logs").insert({
      record_type: "prime_contracts",
      record_id: recordId,
      result: result.ok ? "success" : "error",
      sage_key: result.ok ? result.key : null,
      error_message: result.ok ? null : result.error,
      raw_response: result.rawResponse,
    }),
  ]);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, sageKey: result.key, erp_status: "synced" });
}
