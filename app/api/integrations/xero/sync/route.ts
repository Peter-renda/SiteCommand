/**
 * POST /api/integrations/xero/sync
 *
 * Triggers a manual sync of a SiteCommand record to Xero.
 *
 * Supported recordType values:
 *   "commitments"     – Create ACCPAY Invoice (subcontract) or PurchaseOrder
 *   "prime_contracts" – Create ACCREC Invoice (AR)
 *   "ap_invoice"      – Push ACCPAY Invoice from commitment SOV billed amounts
 *   "ar_invoice"      – Push ACCREC Invoice from prime contract SOV this-period amounts
 *
 * On success the record's erp_status is set to 'synced'; on failure it reverts
 * to 'not_synced'. A row is always written to erp_sync_logs with integration='xero'.
 *
 * Body: { recordType: string, recordId: string }
 * Auth: any authenticated company member.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import {
  getXeroAppCredentials,
  getXeroCompanyCredentials,
  isXeroConfigured,
  syncCommitmentToXero,
  syncPrimeContractToXero,
  syncAPInvoiceToXero,
  syncARInvoiceToXero,
  type XeroResult,
} from "@/lib/xero";

const VALID_TYPES = ["commitments", "prime_contracts", "ap_invoice", "ar_invoice"] as const;
type RecordType = (typeof VALID_TYPES)[number];

async function writeLog(
  supabase: ReturnType<typeof getSupabase>,
  recordType: string,
  recordId: string,
  result: XeroResult
) {
  await supabase.from("erp_sync_logs").insert({
    record_type: recordType,
    record_id: recordId,
    integration: "xero",
    result: result.ok ? "success" : "error",
    sage_key: result.ok ? result.id : null,
    error_message: result.ok ? null : result.error,
    raw_response: result.rawResponse ?? null,
  });
}

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
  if (!VALID_TYPES.includes(recordType as RecordType)) {
    return NextResponse.json(
      { error: `Invalid recordType. Must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const [appCreds, companyCreds] = await Promise.all([
    getXeroAppCredentials(),
    getXeroCompanyCredentials(session.company_id),
  ]);

  if (!isXeroConfigured(companyCreds)) {
    return NextResponse.json(
      { error: "Xero is not connected. Connect in Settings → Integrations." },
      { status: 422 }
    );
  }

  const supabase = getSupabase();

  // ── commitments ─────────────────────────────────────────────────────────────
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

    await supabase.from("commitments").update({ erp_status: "pending" }).eq("id", recordId);

    const result = await syncCommitmentToXero(session.company_id, appCreds, companyCreds, commitment);
    const newStatus = result.ok ? "synced" : "not_synced";

    await Promise.all([
      supabase.from("commitments").update({ erp_status: newStatus }).eq("id", recordId),
      writeLog(supabase, "commitments", recordId, result),
    ]);

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ ok: true, xeroId: result.id, erp_status: "synced" });
  }

  // ── prime_contracts ─────────────────────────────────────────────────────────
  if (recordType === "prime_contracts") {
    const { data: contract, error: fetchErr } = await supabase
      .from("prime_contracts")
      .select("id, contract_number, title, owner_client, contractor, architect_engineer, description, original_contract_amount, approved_change_orders, default_retainage, status, executed, start_date, estimated_completion_date")
      .eq("id", recordId)
      .single();

    if (fetchErr || !contract) {
      return NextResponse.json({ error: "Prime contract not found" }, { status: 404 });
    }

    await supabase.from("prime_contracts").update({ erp_status: "pending" }).eq("id", recordId);

    const result = await syncPrimeContractToXero(session.company_id, appCreds, companyCreds, contract);
    const newStatus = result.ok ? "synced" : "not_synced";

    await Promise.all([
      supabase.from("prime_contracts").update({ erp_status: newStatus }).eq("id", recordId),
      writeLog(supabase, "prime_contracts", recordId, result),
    ]);

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ ok: true, xeroId: result.id, erp_status: "synced" });
  }

  // ── ap_invoice ───────────────────────────────────────────────────────────────
  if (recordType === "ap_invoice") {
    const { data: commitment, error: fetchErr } = await supabase
      .from("commitments")
      .select("id, number, title, contract_company")
      .eq("id", recordId)
      .is("deleted_at", null)
      .single();

    if (fetchErr || !commitment) {
      return NextResponse.json({ error: "Commitment not found" }, { status: 404 });
    }

    const { data: sovItems } = await supabase
      .from("commitment_sov_items")
      .select("description, billed_to_date")
      .eq("commitment_id", recordId)
      .eq("is_group_header", false)
      .gt("billed_to_date", 0)
      .order("sort_order", { ascending: true });

    if (!sovItems || sovItems.length === 0) {
      return NextResponse.json(
        { error: "No billed amounts found on this commitment's SOV. Enter billed-to-date amounts before syncing." },
        { status: 422 }
      );
    }

    const result = await syncAPInvoiceToXero(session.company_id, appCreds, companyCreds, {
      commitmentId: commitment.id,
      commitmentNumber: commitment.number,
      contactName: commitment.contract_company,
      description: commitment.title,
      lineItems: sovItems.map((item) => ({
        description: item.description || commitment.title,
        amount: Number(item.billed_to_date),
      })),
    });

    await writeLog(supabase, "ap_invoice", recordId, result);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ ok: true, xeroId: result.id });
  }

  // ── ar_invoice ───────────────────────────────────────────────────────────────
  if (recordType === "ar_invoice") {
    const { data: contract, error: fetchErr } = await supabase
      .from("prime_contracts")
      .select("id, contract_number, title, owner_client")
      .eq("id", recordId)
      .is("deleted_at", null)
      .single();

    if (fetchErr || !contract) {
      return NextResponse.json({ error: "Prime contract not found" }, { status: 404 });
    }

    const { data: sovItems } = await supabase
      .from("prime_contract_sov_items")
      .select("description, work_completed_this_period")
      .eq("prime_contract_id", recordId)
      .eq("is_group_header", false)
      .gt("work_completed_this_period", 0)
      .order("sort_order", { ascending: true });

    if (!sovItems || sovItems.length === 0) {
      return NextResponse.json(
        { error: "No 'work completed this period' amounts found on this contract's SOV. Fill in the current-period billing before syncing." },
        { status: 422 }
      );
    }

    const result = await syncARInvoiceToXero(session.company_id, appCreds, companyCreds, {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      contactName: contract.owner_client,
      description: contract.title,
      lineItems: sovItems.map((item) => ({
        description: item.description || contract.title,
        amount: Number(item.work_completed_this_period),
      })),
    });

    await writeLog(supabase, "ar_invoice", recordId, result);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ ok: true, xeroId: result.id });
  }

  return NextResponse.json({ error: "Unhandled recordType" }, { status: 500 });
}
