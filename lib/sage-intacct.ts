/**
 * Sage Intacct Web Services client.
 *
 * Sage Intacct's API is XML-based: every request is an HTTP POST to a single
 * endpoint with an XML envelope containing authentication and one or more
 * function calls. Responses are XML that we parse with a simple regex for the
 * lightweight fields we need.
 *
 * Credentials are stored per-company in the company_integrations table,
 * managed by the company's super_admin through Settings → Integrations.
 *
 * Required credentials:
 *   SAGE_SENDER_ID       – Sage-issued sender ID for your integration
 *   SAGE_SENDER_PASSWORD – Sage-issued sender password
 *   SAGE_COMPANY_ID      – The customer's Intacct company ID
 *   SAGE_USER_ID         – API user login name
 *   SAGE_USER_PASSWORD   – API user password
 */

import { XMLParser } from "fast-xml-parser";
import { getSupabase } from "@/lib/supabase";

const INTACCT_ENDPOINT = "https://api.intacct.com/ia/xml/xmlgw.phtml";

// ── Credential helpers ────────────────────────────────────────────────────────

export type SageCredentials = {
  senderId: string | null;
  senderPassword: string | null;
  companyId: string | null;
  userId: string | null;
  userPassword: string | null;
};

/**
 * Looks up Sage Intacct credentials for a specific SiteCommand company from
 * the company_integrations table, falling back to environment variables.
 */
export async function getSageCredentials(siteCompanyId: string): Promise<SageCredentials> {
  const keys = [
    "SAGE_SENDER_ID",
    "SAGE_SENDER_PASSWORD",
    "SAGE_COMPANY_ID",
    "SAGE_USER_ID",
    "SAGE_USER_PASSWORD",
  ] as const;

  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("company_integrations")
      .select("key, value")
      .eq("company_id", siteCompanyId)
      .in("key", keys);

    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key] = row.value;

    return {
      senderId:       map.SAGE_SENDER_ID       ?? process.env.SAGE_SENDER_ID       ?? null,
      senderPassword: map.SAGE_SENDER_PASSWORD  ?? process.env.SAGE_SENDER_PASSWORD  ?? null,
      companyId:      map.SAGE_COMPANY_ID       ?? process.env.SAGE_COMPANY_ID       ?? null,
      userId:         map.SAGE_USER_ID          ?? process.env.SAGE_USER_ID          ?? null,
      userPassword:   map.SAGE_USER_PASSWORD    ?? process.env.SAGE_USER_PASSWORD    ?? null,
    };
  } catch {
    // Fall back to env vars if table doesn't exist yet (migration pending)
    return {
      senderId:       process.env.SAGE_SENDER_ID       ?? null,
      senderPassword: process.env.SAGE_SENDER_PASSWORD  ?? null,
      companyId:      process.env.SAGE_COMPANY_ID       ?? null,
      userId:         process.env.SAGE_USER_ID          ?? null,
      userPassword:   process.env.SAGE_USER_PASSWORD    ?? null,
    };
  }
}

export function isSageConfigured(creds: SageCredentials): boolean {
  return !!(
    creds.senderId &&
    creds.senderPassword &&
    creds.companyId &&
    creds.userId &&
    creds.userPassword
  );
}

// ── XML building ──────────────────────────────────────────────────────────────

function xmlEscape(s: string | number | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEnvelope(
  creds: Awaited<ReturnType<typeof getSageCredentials>>,
  controlId: string,
  functionXml: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <control>
    <senderid>${xmlEscape(creds.senderId)}</senderid>
    <password>${xmlEscape(creds.senderPassword)}</password>
    <controlid>${xmlEscape(controlId)}</controlid>
    <uniqueid>false</uniqueid>
    <dtdversion>3.0</dtdversion>
    <includewhitespace>false</includewhitespace>
  </control>
  <operation>
    <authentication>
      <login>
        <userid>${xmlEscape(creds.userId)}</userid>
        <companyid>${xmlEscape(creds.companyId)}</companyid>
        <password>${xmlEscape(creds.userPassword)}</password>
      </login>
    </authentication>
    <content>
      <function controlid="${xmlEscape(controlId)}">
        ${functionXml}
      </function>
    </content>
  </operation>
</request>`;
}

// ── Response parsing ──────────────────────────────────────────────────────────

export type SageResult =
  | { ok: true; key: string; rawResponse: string }
  | { ok: false; error: string; rawResponse: string };

function parseResponse(xml: string): SageResult {
  // Check for overall auth/control errors first
  const statusMatch = xml.match(/<status>(\w+)<\/status>/);
  const topStatus = statusMatch?.[1];

  if (topStatus === "failure") {
    const descMatch = xml.match(/<description2?>([\s\S]*?)<\/description2?>/);
    const errText = descMatch?.[1]?.trim() ?? "Unknown Sage error";
    return { ok: false, error: errText, rawResponse: xml.slice(0, 8000) };
  }

  // Look for the result key — different object types use different key element names.
  // Sage returns e.g. <key>123</key> inside the <result> block on success.
  const keyMatch = xml.match(/<result>[\s\S]*?<key>([\s\S]*?)<\/key>/);
  const key = keyMatch?.[1]?.trim() ?? "";

  if (!key) {
    // No key found — treat as error
    const descMatch = xml.match(/<description2?>([\s\S]*?)<\/description2?>/);
    const errText = descMatch?.[1]?.trim() ?? "Sage returned no key";
    return { ok: false, error: errText, rawResponse: xml.slice(0, 8000) };
  }

  return { ok: true, key, rawResponse: xml.slice(0, 8000) };
}

// ── API call ──────────────────────────────────────────────────────────────────

async function callIntacct(
  creds: Awaited<ReturnType<typeof getSageCredentials>>,
  controlId: string,
  functionXml: string
): Promise<SageResult> {
  const envelope = buildEnvelope(creds, controlId, functionXml);

  let responseText: string;
  try {
    const res = await fetch(INTACCT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/xml; charset=utf-8" },
      body: envelope,
    });
    responseText = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: `Failed to reach Sage Intacct: ${msg}`, rawResponse: "" };
  }

  return parseResponse(responseText);
}

// ── Commitment sync ───────────────────────────────────────────────────────────

export type CommitmentSyncPayload = {
  id: string;
  type: "subcontract" | "purchase_order";
  number: number;
  title: string;
  contract_company: string;
  original_contract_amount: number;
  status: string;
  project_id: string;
};

/**
 * Creates or updates a commitment (subcontract or PO) in Sage Intacct.
 * Uses SUPDOC for subcontracts and PODOCUMENT for purchase orders.
 */
export async function syncCommitmentToSage(
  creds: Awaited<ReturnType<typeof getSageCredentials>>,
  commitment: CommitmentSyncPayload
): Promise<SageResult> {
  const controlId = `sc-commitment-${commitment.id}`;
  const amount = commitment.original_contract_amount.toFixed(2);

  let functionXml: string;

  if (commitment.type === "subcontract") {
    // Sage Intacct AP Subcontract
    functionXml = `
      <create_supdoc>
        <supdocid>${xmlEscape(commitment.number)}</supdocid>
        <supdocname>${xmlEscape(commitment.title)}</supdocname>
        <vendorid>${xmlEscape(commitment.contract_company)}</vendorid>
        <basecurr>USD</basecurr>
        <currency>USD</currency>
        <supdocitems>
          <supdocitem>
            <memo>${xmlEscape(commitment.title)}</memo>
            <amount>${xmlEscape(amount)}</amount>
          </supdocitem>
        </supdocitems>
      </create_supdoc>`;
  } else {
    // Sage Intacct AP Purchase Order
    functionXml = `
      <create_potransaction>
        <transactiontype>Purchase Order</transactiontype>
        <datecreated>
          <year>${new Date().getFullYear()}</year>
          <month>${new Date().getMonth() + 1}</month>
          <day>${new Date().getDate()}</day>
        </datecreated>
        <vendorid>${xmlEscape(commitment.contract_company)}</vendorid>
        <referenceno>${xmlEscape(commitment.number)}</referenceno>
        <termname>N30</termname>
        <potransitems>
          <potransitem>
            <itemid>GENERAL</itemid>
            <memo>${xmlEscape(commitment.title)}</memo>
            <quantity>1</quantity>
            <unit>Each</unit>
            <price>${xmlEscape(amount)}</price>
          </potransitem>
        </potransitems>
      </create_potransaction>`;
  }

  return callIntacct(creds, controlId, functionXml);
}

// ── Vendor list ───────────────────────────────────────────────────────────────

export type SageVendor = { id: string; name: string };

export type SageVendorResult =
  | { ok: true; vendors: SageVendor[] }
  | { ok: false; error: string };

/**
 * Fetches the list of active vendors from Sage Intacct so users can pick a
 * validated vendor when creating a commitment rather than typing free-form.
 */
export async function fetchSageVendors(
  creds: SageCredentials
): Promise<SageVendorResult> {
  const controlId = "sc-vendor-list";
  const functionXml = `
    <readByQuery>
      <object>VENDOR</object>
      <fields>VENDORID,NAME,STATUS</fields>
      <query>STATUS = 'T'</query>
      <pagesize>200</pagesize>
    </readByQuery>`;

  const envelope = buildEnvelope(creds, controlId, functionXml);

  let responseText: string;
  try {
    const res = await fetch(INTACCT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/xml; charset=utf-8" },
      body: envelope,
    });
    responseText = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: `Failed to reach Sage Intacct: ${msg}` };
  }

  // Check for top-level failure first
  const statusMatch = responseText.match(/<status>(\w+)<\/status>/);
  if (statusMatch?.[1] === "failure") {
    const descMatch = responseText.match(/<description2?>([\s\S]*?)<\/description2?>/);
    return { ok: false, error: descMatch?.[1]?.trim() ?? "Unknown Sage error" };
  }

  // Parse the vendor list out of the XML
  try {
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(responseText);
    const data = parsed?.response?.operation?.result?.data;
    const rawVendors = data?.vendor ?? [];
    const vendorArray = Array.isArray(rawVendors) ? rawVendors : [rawVendors];

    const vendors: SageVendor[] = vendorArray
      .filter((v: Record<string, unknown>) => v?.VENDORID)
      .map((v: Record<string, unknown>) => ({
        id: String(v.VENDORID),
        name: String(v.NAME ?? v.VENDORID),
      }));

    return { ok: true, vendors };
  } catch {
    return { ok: false, error: "Failed to parse vendor list from Sage response" };
  }
}

// ── Project / Job sync ────────────────────────────────────────────────────────

export type ProjectSyncPayload = {
  id: string;
  name: string;
  description?: string | null;
};

/**
 * Creates a project in Sage Intacct as a Project/Job so that AP bills and AR
 * invoices can be tagged to the correct job for cost tracking. The Sage
 * PROJECTID is derived from the SiteCommand UUID prefix — deterministic and
 * safe to retry.
 */
export async function syncProjectToSage(
  creds: SageCredentials,
  project: ProjectSyncPayload
): Promise<SageResult> {
  // First 8 hex chars of the UUID gives a compact, stable Sage project ID
  const sageProjectId = `SC-${project.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const controlId = `sc-project-${project.id}`;

  const functionXml = `
    <create_project>
      <projectid>${xmlEscape(sageProjectId)}</projectid>
      <name>${xmlEscape(project.name)}</name>
      <projectcategory>Contract</projectcategory>
      <description>${xmlEscape(project.description ?? "")}</description>
      <status>Open</status>
    </create_project>`;

  return callIntacct(creds, controlId, functionXml);
}

// ── Change order: update commitment amount in Sage ────────────────────────────

export type CommitmentUpdatePayload = CommitmentSyncPayload & {
  approved_change_orders: number;
};

/**
 * Updates an existing AP Subcontract or creates a Purchase Order Change Order
 * in Sage Intacct with the revised contract amount (original + approved COs).
 * Called when a change order is approved against a commitment.
 */
export async function updateCommitmentInSage(
  creds: SageCredentials,
  commitment: CommitmentUpdatePayload
): Promise<SageResult> {
  const controlId = `sc-co-commitment-${commitment.id}`;
  const revisedAmount = (
    commitment.original_contract_amount + commitment.approved_change_orders
  ).toFixed(2);

  let functionXml: string;

  if (commitment.type === "subcontract") {
    functionXml = `
      <update_supdoc>
        <supdocid>${xmlEscape(commitment.number)}</supdocid>
        <supdocitems>
          <supdocitem>
            <memo>${xmlEscape(commitment.title)} (revised)</memo>
            <amount>${xmlEscape(revisedAmount)}</amount>
          </supdocitem>
        </supdocitems>
      </update_supdoc>`;
  } else {
    // Purchase orders: create a change-order PO transaction
    const coRef = `${commitment.number}-CO`;
    functionXml = `
      <create_potransaction>
        <transactiontype>Purchase Order Change Order</transactiontype>
        <datecreated>
          <year>${new Date().getFullYear()}</year>
          <month>${new Date().getMonth() + 1}</month>
          <day>${new Date().getDate()}</day>
        </datecreated>
        <vendorid>${xmlEscape(commitment.contract_company)}</vendorid>
        <referenceno>${xmlEscape(coRef)}</referenceno>
        <termname>N30</termname>
        <potransitems>
          <potransitem>
            <itemid>GENERAL</itemid>
            <memo>${xmlEscape(commitment.title)} - Change Order</memo>
            <quantity>1</quantity>
            <unit>Each</unit>
            <price>${xmlEscape(revisedAmount)}</price>
          </potransitem>
        </potransitems>
      </create_potransaction>`;
  }

  return callIntacct(creds, controlId, functionXml);
}

// ── Change order: update prime contract amount in Sage ────────────────────────

export type PrimeContractUpdatePayload = PrimeContractSyncPayload & {
  approved_change_orders: number;
};

/**
 * Updates an existing AR Contract in Sage Intacct with the revised contract
 * amount (original + all approved change orders).
 * Called when a change order is approved against a prime contract.
 */
export async function updatePrimeContractInSage(
  creds: SageCredentials,
  contract: PrimeContractUpdatePayload
): Promise<SageResult> {
  const controlId = `sc-co-prime-${contract.id}`;
  const revisedAmount = (
    contract.original_contract_amount + contract.approved_change_orders
  ).toFixed(2);

  const functionXml = `
    <update_arcontract>
      <contractid>${xmlEscape(contract.contract_number)}</contractid>
      <arcontractitems>
        <arcontractitem>
          <memo>${xmlEscape(contract.title)} (revised)</memo>
          <amount>${xmlEscape(revisedAmount)}</amount>
        </arcontractitem>
      </arcontractitems>
    </update_arcontract>`;

  return callIntacct(creds, controlId, functionXml);
}

// ── AP Invoice (subcontractor pay application) ────────────────────────────────

export type APInvoiceLineItem = {
  description: string;
  amount: number;
  budgetCode?: string;
};

export type APInvoiceSyncPayload = {
  commitmentId: string;
  commitmentNumber: number;
  vendorId: string;
  description: string;
  invoiceDate: Date;
  lineItems: APInvoiceLineItem[];
  sageProjectId?: string;
};

/**
 * Creates an AP Bill in Sage Intacct representing a subcontractor pay
 * application. Line items are derived from the commitment's SOV billed amounts.
 * The caller should trigger this once the SOV is fully filled in for the period.
 */
export async function syncAPInvoiceToSage(
  creds: SageCredentials,
  invoice: APInvoiceSyncPayload
): Promise<SageResult> {
  const controlId = `sc-apbill-${invoice.commitmentId}-${Date.now()}`;
  const d = invoice.invoiceDate;

  const lineItemsXml = invoice.lineItems
    .map(
      (li) => `
        <lineitem>
          <glaccountno></glaccountno>
          <description>${xmlEscape(li.description)}</description>
          <amount>${li.amount.toFixed(2)}</amount>
          ${invoice.sageProjectId ? `<projectid>${xmlEscape(invoice.sageProjectId)}</projectid>` : ""}
        </lineitem>`
    )
    .join("");

  const functionXml = `
    <create_apbill>
      <vendorid>${xmlEscape(invoice.vendorId)}</vendorid>
      <datecreated>
        <year>${d.getFullYear()}</year>
        <month>${d.getMonth() + 1}</month>
        <day>${d.getDate()}</day>
      </datecreated>
      <termname>N30</termname>
      <action>Submit</action>
      <referenceno>${xmlEscape(invoice.commitmentNumber)}</referenceno>
      <description>${xmlEscape(invoice.description)}</description>
      <billitems>
        ${lineItemsXml}
      </billitems>
    </create_apbill>`;

  return callIntacct(creds, controlId, functionXml);
}

// ── AR Invoice (owner billing / pay application) ──────────────────────────────

export type ARInvoiceLineItem = {
  description: string;
  amount: number;
};

export type ARInvoiceSyncPayload = {
  contractId: string;
  contractNumber: number;
  customerId: string;
  description: string;
  invoiceDate: Date;
  lineItems: ARInvoiceLineItem[];
  sageProjectId?: string;
};

/**
 * Creates an AR Invoice in Sage Intacct representing an owner pay application
 * (AIA G702/G703). Line items are built from the prime contract SOV's
 * work_completed_this_period values at the time of the push.
 */
export async function syncARInvoiceToSage(
  creds: SageCredentials,
  invoice: ARInvoiceSyncPayload
): Promise<SageResult> {
  const controlId = `sc-arinv-${invoice.contractId}-${Date.now()}`;
  const d = invoice.invoiceDate;

  const lineItemsXml = invoice.lineItems
    .map(
      (li) => `
        <lineitem>
          <glaccountno></glaccountno>
          <description>${xmlEscape(li.description)}</description>
          <amount>${li.amount.toFixed(2)}</amount>
          ${invoice.sageProjectId ? `<projectid>${xmlEscape(invoice.sageProjectId)}</projectid>` : ""}
        </lineitem>`
    )
    .join("");

  const functionXml = `
    <create_invoice>
      <customerid>${xmlEscape(invoice.customerId)}</customerid>
      <datecreated>
        <year>${d.getFullYear()}</year>
        <month>${d.getMonth() + 1}</month>
        <day>${d.getDate()}</day>
      </datecreated>
      <termname>N30</termname>
      <action>Submit</action>
      <referenceno>${xmlEscape(invoice.contractNumber)}</referenceno>
      <description>${xmlEscape(invoice.description)}</description>
      <invoiceitems>
        ${lineItemsXml}
      </invoiceitems>
    </create_invoice>`;

  return callIntacct(creds, controlId, functionXml);
}

// ── Prime contract sync ───────────────────────────────────────────────────────

export type PrimeContractSyncPayload = {
  id: string;
  contract_number: number;
  title: string;
  owner_client: string;
  contractor: string;
  architect_engineer: string;
  description: string;
  original_contract_amount: number;
  approved_change_orders: number;
  default_retainage: number;
  status: string;
  executed: boolean;
  start_date: string | null;
  estimated_completion_date: string | null;
};

/**
 * Creates or updates a prime contract in Sage Intacct as an AR Contract.
 * Sends the full contract record including dates, retainage, revised amount,
 * and a memo combining description, contractor, and architect info.
 */
export async function syncPrimeContractToSage(
  creds: Awaited<ReturnType<typeof getSageCredentials>>,
  contract: PrimeContractSyncPayload
): Promise<SageResult> {
  const controlId = `sc-prime-${contract.id}`;
  const revisedAmount = (
    contract.original_contract_amount + (contract.approved_change_orders ?? 0)
  ).toFixed(2);

  const memo = [
    contract.description,
    contract.contractor     ? `Contractor: ${contract.contractor}`           : null,
    contract.architect_engineer ? `Architect/Engineer: ${contract.architect_engineer}` : null,
    contract.default_retainage  ? `Retainage: ${contract.default_retainage}%`          : null,
  ].filter(Boolean).join(" | ");

  const beginDateXml = contract.start_date
    ? `<begindate><year>${contract.start_date.slice(0, 4)}</year><month>${contract.start_date.slice(5, 7)}</month><day>${contract.start_date.slice(8, 10)}</day></begindate>`
    : "";

  const endDateXml = contract.estimated_completion_date
    ? `<enddate><year>${contract.estimated_completion_date.slice(0, 4)}</year><month>${contract.estimated_completion_date.slice(5, 7)}</month><day>${contract.estimated_completion_date.slice(8, 10)}</day></enddate>`
    : "";

  const functionXml = `
    <create_arcontract>
      <contractid>${xmlEscape(contract.contract_number)}</contractid>
      <contractname>${xmlEscape(contract.title)}</contractname>
      <customerid>${xmlEscape(contract.owner_client)}</customerid>
      <description>${xmlEscape(memo)}</description>
      ${beginDateXml}
      ${endDateXml}
      <basecurr>USD</basecurr>
      <currency>USD</currency>
      <arcontractitems>
        <arcontractitem>
          <memo>${xmlEscape(contract.title)}</memo>
          <amount>${xmlEscape(revisedAmount)}</amount>
        </arcontractitem>
      </arcontractitems>
    </create_arcontract>`;

  return callIntacct(creds, controlId, functionXml);
}

