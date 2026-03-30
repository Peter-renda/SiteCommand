/**
 * POST /api/integrations/sage/sync
 *
 * Triggers a manual sync of a record to Sage Intacct.
 *
 * Supported recordType values:
 *
 *   "commitments"         – Create AP Subcontract or PO (original amount)
 *   "prime_contracts"     – Create AR Contract (original amount)
 *   "projects"            – Create Project / Job in Sage job-cost module
 *   "change_orders"       – Push approved change order → update parent contract amount
 *   "ap_invoice"          – Push AP Bill from commitment SOV billed amounts
 *   "ar_invoice"          – Push AR Invoice from prime contract SOV this-period amounts
 *
 * On success the record's erp_status is set to 'synced'; on failure it is set
 * back to 'not_synced'. Either way a row is written to erp_sync_logs.
 *
 * Body: { recordType: string, recordId: string }
 *
 * Auth: any authenticated company member.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import {
  getSageCredentials,
  isSageConfigured,
  syncCommitmentToSage,
  syncPrimeContractToSage,
  syncProjectToSage,
  updateCommitmentInSage,
  updatePrimeContractInSage,
  syncAPInvoiceToSage,
  syncARInvoiceToSage,
  type CommitmentSyncPayload,
  type PrimeContractSyncPayload,
  type CommitmentUpdatePayload,
  type PrimeContractUpdatePayload,
  type APInvoiceSyncPayload,
  type ARInvoiceSyncPayload,
  type SageResult,
} from "@/lib/sage-intacct";

const VALID_TYPES = [
  "commitments",
  "prime_contracts",
  "projects",
  "change_orders",
  "ap_invoice",
  "ar_invoice",
] as const;
type RecordType = (typeof VALID_TYPES)[number];

// ── helpers ───────────────────────────────────────────────────────────────────

async function writeLog(
  supabase: ReturnType<typeof getSupabase>,
  recordType: string,
  recordId: string,
  result: SageResult
) {
  await supabase.from("erp_sync_logs").insert({
    record_type: recordType,
    record_id: recordId,
    result: result.ok ? "success" : "error",
    sage_key: result.ok ? result.key : null,
    error_message: result.ok ? null : result.error,
    raw_response: result.ok ? result.rawResponse : (result as { rawResponse?: string }).rawResponse ?? null,
  });
}

// ── handler ───────────────────────────────────────────────────────────────────

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

  const creds = await getSageCredentials(session.company_id);
  if (!isSageConfigured(creds)) {
    return NextResponse.json(
      { error: "Sage Intacct is not configured. Add credentials in Settings → Integrations." },
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

    const result = await syncCommitmentToSage(creds, commitment as CommitmentSyncPayload);
    const newStatus = result.ok ? "synced" : "not_synced";

    await Promise.all([
      supabase.from("commitments").update({ erp_status: newStatus }).eq("id", recordId),
      writeLog(supabase, "commitments", recordId, result),
    ]);

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ ok: true, sageKey: result.key, erp_status: "synced" });
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

    const result = await syncPrimeContractToSage(creds, contract as PrimeContractSyncPayload);
    const newStatus = result.ok ? "synced" : "not_synced";

    await Promise.all([
      supabase.from("prime_contracts").update({ erp_status: newStatus }).eq("id", recordId),
      writeLog(supabase, "prime_contracts", recordId, result),
    ]);

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ ok: true, sageKey: result.key, erp_status: "synced" });
  }

  // ── projects ─────────────────────────────────────────────────────────────────
  if (recordType === "projects") {
    const { data: project, error: fetchErr } = await supabase
      .from("projects")
      .select("id, name, description")
      .eq("id", recordId)
      .single();

    if (fetchErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await supabase.from("projects").update({ erp_status: "pending" }).eq("id", recordId);

    const result = await syncProjectToSage(creds, project);
    const newStatus = result.ok ? "synced" : "not_synced";

    await Promise.all([
      supabase.from("projects").update({
        erp_status: newStatus,
        ...(result.ok ? { sage_job_key: result.key } : {}),
      }).eq("id", recordId),
      writeLog(supabase, "projects", recordId, result),
    ]);

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ ok: true, sageKey: result.key, erp_status: "synced" });
  }

  // ── change_orders ────────────────────────────────────────────────────────────
  if (recordType === "change_orders") {
    const { data: co, error: fetchErr } = await supabase
      .from("change_orders")
      .select("id, type, commitment_id, prime_contract_id, amount, status")
      .eq("id", recordId)
      .is("deleted_at", null)
      .single();

    if (fetchErr || !co) {
      return NextResponse.json({ error: "Change order not found" }, { status: 404 });
    }
    if (co.status !== "Approved") {
      return NextResponse.json(
        { error: "Only approved change orders can be synced to Sage" },
        { status: 422 }
      );
    }

    await supabase.from("change_orders").update({ erp_status: "pending" }).eq("id", recordId);

    let result: SageResult;

    if (co.type === "commitment" && co.commitment_id) {
      const { data: commitment } = await supabase
        .from("commitments")
        .select("id, type, number, title, contract_company, original_contract_amount, approved_change_orders, status, project_id")
        .eq("id", co.commitment_id)
        .single();

      if (!commitment) {
        await supabase.from("change_orders").update({ erp_status: "not_synced" }).eq("id", recordId);
        return NextResponse.json({ error: "Parent commitment not found" }, { status: 404 });
      }

      result = await updateCommitmentInSage(creds, commitment as CommitmentUpdatePayload);
    } else if (co.type === "prime" && co.prime_contract_id) {
      const { data: contract } = await supabase
        .from("prime_contracts")
        .select("id, contract_number, title, owner_client, contractor, architect_engineer, description, original_contract_amount, approved_change_orders, default_retainage, status, executed, start_date, estimated_completion_date")
        .eq("id", co.prime_contract_id)
        .single();

      if (!contract) {
        await supabase.from("change_orders").update({ erp_status: "not_synced" }).eq("id", recordId);
        return NextResponse.json({ error: "Parent prime contract not found" }, { status: 404 });
      }

      result = await updatePrimeContractInSage(creds, contract as PrimeContractUpdatePayload);
    } else {
      await supabase.from("change_orders").update({ erp_status: "not_synced" }).eq("id", recordId);
      return NextResponse.json({ error: "Change order has no valid parent record" }, { status: 422 });
    }

    const newStatus = result.ok ? "synced" : "not_synced";
    await Promise.all([
      supabase.from("change_orders").update({ erp_status: newStatus }).eq("id", recordId),
      writeLog(supabase, "change_orders", recordId, result),
    ]);

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ ok: true, sageKey: result.key, erp_status: "synced" });
  }

  // ── ap_invoice ───────────────────────────────────────────────────────────────
  if (recordType === "ap_invoice") {
    // recordId = commitment UUID
    const { data: commitment, error: fetchErr } = await supabase
      .from("commitments")
      .select("id, number, title, contract_company, project_id")
      .eq("id", recordId)
      .is("deleted_at", null)
      .single();

    if (fetchErr || !commitment) {
      return NextResponse.json({ error: "Commitment not found" }, { status: 404 });
    }

    // Fetch SOV line items (non-group-headers with a positive billed_to_date)
    const { data: sovItems } = await supabase
      .from("commitment_sov_items")
      .select("description, billed_to_date, budget_code")
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

    // Look up the project's Sage job key to tag the bill to the right job
    const { data: project } = await supabase
      .from("projects")
      .select("sage_job_key")
      .eq("id", commitment.project_id)
      .single();

    const payload: APInvoiceSyncPayload = {
      commitmentId: commitment.id,
      commitmentNumber: commitment.number,
      vendorId: commitment.contract_company,
      description: commitment.title,
      invoiceDate: new Date(),
      lineItems: sovItems.map((item) => ({
        description: item.description || commitment.title,
        amount: Number(item.billed_to_date),
        budgetCode: item.budget_code || undefined,
      })),
      sageProjectId: project?.sage_job_key ?? undefined,
    };

    const result = await syncAPInvoiceToSage(creds, payload);
    await writeLog(supabase, "ap_invoice", recordId, result);

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ ok: true, sageKey: result.key });
  }

  // ── ar_invoice ───────────────────────────────────────────────────────────────
  if (recordType === "ar_invoice") {
    // recordId = prime_contract UUID
    const { data: contract, error: fetchErr } = await supabase
      .from("prime_contracts")
      .select("id, contract_number, title, owner_client, project_id")
      .eq("id", recordId)
      .is("deleted_at", null)
      .single();

    if (fetchErr || !contract) {
      return NextResponse.json({ error: "Prime contract not found" }, { status: 404 });
    }

    // Fetch SOV line items with work billed this period
    const { data: sovItems } = await supabase
      .from("prime_contract_sov_items")
      .select("description, work_completed_this_period, budget_code")
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

    const { data: project } = await supabase
      .from("projects")
      .select("sage_job_key")
      .eq("id", contract.project_id)
      .single();

    const payload: ARInvoiceSyncPayload = {
      contractId: contract.id,
      contractNumber: contract.contract_number,
      customerId: contract.owner_client,
      description: contract.title,
      invoiceDate: new Date(),
      lineItems: sovItems.map((item) => ({
        description: item.description || contract.title,
        amount: Number(item.work_completed_this_period),
      })),
      sageProjectId: project?.sage_job_key ?? undefined,
    };

    const result = await syncARInvoiceToSage(creds, payload);
    await writeLog(supabase, "ar_invoice", recordId, result);

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ ok: true, sageKey: result.key });
  }

  // Should be unreachable given the VALID_TYPES check above
  return NextResponse.json({ error: "Unhandled recordType" }, { status: 500 });
}
