/**
 * Sage Intacct Web Services client.
 *
 * Sage Intacct's API is XML-based: every request is an HTTP POST to a single
 * endpoint with an XML envelope containing authentication and one or more
 * function calls. Responses are XML that we parse with the built-in DOMParser
 * (Node 18+ via the `@xmldom/xmldom` fallback) or a simple regex for the
 * lightweight fields we need.
 *
 * Credentials are read from platform_settings (admin UI) or environment
 * variables, consistent with the APS pattern in lib/platform-settings.ts.
 *
 * Required credentials:
 *   SAGE_SENDER_ID       – Sage-issued sender ID for your integration
 *   SAGE_SENDER_PASSWORD – Sage-issued sender password
 *   SAGE_COMPANY_ID      – The customer's Intacct company ID
 *   SAGE_USER_ID         – API user login name
 *   SAGE_USER_PASSWORD   – API user password
 */

import { getPlatformSetting } from "@/lib/platform-settings";

const INTACCT_ENDPOINT = "https://api.intacct.com/ia/xml/xmlgw.phtml";

// ── Credential helpers ────────────────────────────────────────────────────────

export async function getSageCredentials(): Promise<{
  senderId: string | null;
  senderPassword: string | null;
  companyId: string | null;
  userId: string | null;
  userPassword: string | null;
}> {
  const [senderId, senderPassword, companyId, userId, userPassword] =
    await Promise.all([
      getPlatformSetting("SAGE_SENDER_ID"),
      getPlatformSetting("SAGE_SENDER_PASSWORD"),
      getPlatformSetting("SAGE_COMPANY_ID"),
      getPlatformSetting("SAGE_USER_ID"),
      getPlatformSetting("SAGE_USER_PASSWORD"),
    ]);
  return { senderId, senderPassword, companyId, userId, userPassword };
}

export function isSageConfigured(creds: Awaited<ReturnType<typeof getSageCredentials>>): boolean {
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

// ── Prime contract sync ───────────────────────────────────────────────────────

export type PrimeContractSyncPayload = {
  id: string;
  contract_number: number;
  title: string;
  owner_client: string;
  original_contract_amount: number;
  status: string;
};

/**
 * Creates or updates a prime contract in Sage Intacct as an AR Contract.
 */
export async function syncPrimeContractToSage(
  creds: Awaited<ReturnType<typeof getSageCredentials>>,
  contract: PrimeContractSyncPayload
): Promise<SageResult> {
  const controlId = `sc-prime-${contract.id}`;
  const amount = contract.original_contract_amount.toFixed(2);

  const functionXml = `
    <create_arcontract>
      <contractid>${xmlEscape(contract.contract_number)}</contractid>
      <contractname>${xmlEscape(contract.title)}</contractname>
      <customerid>${xmlEscape(contract.owner_client)}</customerid>
      <basecurr>USD</basecurr>
      <currency>USD</currency>
      <arcontractitems>
        <arcontractitem>
          <memo>${xmlEscape(contract.title)}</memo>
          <amount>${xmlEscape(amount)}</amount>
        </arcontractitem>
      </arcontractitems>
    </create_arcontract>`;

  return callIntacct(creds, controlId, functionXml);
}
