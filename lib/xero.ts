/**
 * Xero API client.
 *
 * Xero uses OAuth 2.0 with short-lived access tokens (30 min) and long-lived
 * refresh tokens (60 days). API calls require a Xero-Tenant-Id header that
 * identifies which Xero organisation to act against.
 *
 * Credentials flow:
 *   Platform-level (platform_settings, site_admin):
 *     XERO_CLIENT_ID, XERO_CLIENT_SECRET
 *
 *   Company-level (company_integrations, super_admin):
 *     XERO_TENANT_ID     – Xero organisation tenant ID (obtained post-OAuth)
 *     XERO_ACCESS_TOKEN  – OAuth 2.0 access token (30 min)
 *     XERO_REFRESH_TOKEN – OAuth 2.0 refresh token (60 days)
 */

import { getSupabase } from "@/lib/supabase";

const XERO_API_BASE  = "https://api.xero.com/api.xro/2.0";
const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";

// ── Credential types ──────────────────────────────────────────────────────────

export type XeroAppCredentials = {
  clientId: string | null;
  clientSecret: string | null;
};

export type XeroCompanyCredentials = {
  tenantId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
};

// ── Credential helpers ────────────────────────────────────────────────────────

/**
 * Loads the platform-level Xero app credentials from platform_settings.
 * Falls back to environment variables.
 */
export async function getXeroAppCredentials(): Promise<XeroAppCredentials> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["XERO_CLIENT_ID", "XERO_CLIENT_SECRET"]);

    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key] = row.value;

    return {
      clientId:     map.XERO_CLIENT_ID     ?? process.env.XERO_CLIENT_ID     ?? null,
      clientSecret: map.XERO_CLIENT_SECRET ?? process.env.XERO_CLIENT_SECRET ?? null,
    };
  } catch {
    return {
      clientId:     process.env.XERO_CLIENT_ID     ?? null,
      clientSecret: process.env.XERO_CLIENT_SECRET ?? null,
    };
  }
}

/**
 * Loads per-company Xero tokens from company_integrations.
 */
export async function getXeroCompanyCredentials(
  companyId: string
): Promise<XeroCompanyCredentials> {
  const keys = ["XERO_TENANT_ID", "XERO_ACCESS_TOKEN", "XERO_REFRESH_TOKEN"] as const;

  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("company_integrations")
      .select("key, value")
      .eq("company_id", companyId)
      .in("key", keys);

    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key] = row.value;

    return {
      tenantId:     map.XERO_TENANT_ID     ?? null,
      accessToken:  map.XERO_ACCESS_TOKEN  ?? null,
      refreshToken: map.XERO_REFRESH_TOKEN ?? null,
    };
  } catch {
    return { tenantId: null, accessToken: null, refreshToken: null };
  }
}

export function isXeroConfigured(creds: XeroCompanyCredentials): boolean {
  return !!(creds.tenantId && creds.accessToken && creds.refreshToken);
}

// ── Token refresh ─────────────────────────────────────────────────────────────

type XeroTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

/**
 * Exchanges a Xero refresh token for fresh tokens and persists them back to
 * company_integrations.
 */
export async function refreshXeroTokens(
  companyId: string,
  appCreds: XeroAppCredentials,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (!appCreds.clientId || !appCreds.clientSecret) return null;

  const basicAuth = Buffer.from(
    `${appCreds.clientId}:${appCreds.clientSecret}`
  ).toString("base64");

  try {
    const res = await fetch(XERO_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as XeroTokenResponse;
    const { access_token, refresh_token } = json;

    const supabase = getSupabase();
    const now = new Date().toISOString();
    await supabase.from("company_integrations").upsert(
      [
        { company_id: companyId, key: "XERO_ACCESS_TOKEN",  value: access_token,  updated_at: now },
        { company_id: companyId, key: "XERO_REFRESH_TOKEN", value: refresh_token, updated_at: now },
      ],
      { onConflict: "company_id,key" }
    );

    return { accessToken: access_token, refreshToken: refresh_token };
  } catch {
    return null;
  }
}

// ── After OAuth: resolve and store tenant ID ──────────────────────────────────

/**
 * After the initial OAuth token exchange, calls the /connections endpoint to
 * find the first authorised Xero organisation and stores its tenantId.
 */
export async function resolveAndStoreXeroTenantId(
  companyId: string,
  accessToken: string
): Promise<string | null> {
  try {
    const res = await fetch(XERO_CONNECTIONS_URL, {
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    if (!res.ok) return null;

    const connections = (await res.json()) as Array<{ tenantId: string; tenantType: string }>;
    const org = connections.find((c) => c.tenantType === "ORGANISATION") ?? connections[0];
    if (!org?.tenantId) return null;

    const supabase = getSupabase();
    await supabase.from("company_integrations").upsert(
      [{ company_id: companyId, key: "XERO_TENANT_ID", value: org.tenantId, updated_at: new Date().toISOString() }],
      { onConflict: "company_id,key" }
    );

    return org.tenantId;
  } catch {
    return null;
  }
}

// ── API call helper ───────────────────────────────────────────────────────────

export type XeroResult =
  | { ok: true; id: string; rawResponse: string }
  | { ok: false; error: string; rawResponse: string };

async function callXero(
  companyId: string,
  appCreds: XeroAppCredentials,
  companyCreds: XeroCompanyCredentials,
  method: "GET" | "POST" | "PUT",
  path: string,
  body?: unknown
): Promise<{ status: number; json: unknown; rawText: string }> {
  let accessToken = companyCreds.accessToken!;
  const tenantId = companyCreds.tenantId!;
  const url = `${XERO_API_BASE}/${path}`;

  async function attempt(token: string) {
    return fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Xero-Tenant-Id": tenantId,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  let res = await attempt(accessToken);

  if (res.status === 401 && companyCreds.refreshToken) {
    const refreshed = await refreshXeroTokens(companyId, appCreds, companyCreds.refreshToken);
    if (refreshed) {
      accessToken = refreshed.accessToken;
      res = await attempt(accessToken);
    }
  }

  const rawText = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(rawText); } catch { /* non-JSON */ }

  return { status: res.status, json, rawText };
}

// ── Contact list ──────────────────────────────────────────────────────────────

export type XeroContact = { id: string; name: string };

export type XeroContactResult =
  | { ok: true; contacts: XeroContact[] }
  | { ok: false; error: string };

/**
 * Fetches active contacts from Xero (covers both vendors/suppliers and
 * customers since Xero uses a unified Contacts model).
 */
export async function fetchXeroContacts(
  companyId: string,
  appCreds: XeroAppCredentials,
  companyCreds: XeroCompanyCredentials
): Promise<XeroContactResult> {
  try {
    const { status, json, rawText } = await callXero(
      companyId, appCreds, companyCreds,
      "GET",
      "Contacts?where=IsSupplier%3D%3Dtrue%26%26ContactStatus%3D%3D%22ACTIVE%22&pageSize=200"
    );

    if (status !== 200) {
      return { ok: false, error: extractXeroError(json, rawText) };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (json as any)?.Contacts ?? [];
    const contacts: XeroContact[] = (Array.isArray(rows) ? rows : [rows]).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => ({ id: String(c.ContactID), name: String(c.Name ?? c.ContactID) })
    );
    return { ok: true, contacts };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Commitment sync ───────────────────────────────────────────────────────────

export type XeroCommitmentPayload = {
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
 * Syncs a commitment to Xero.
 * - Subcontracts → ACCPAY Invoice (accounts payable bill)
 * - Purchase Orders → PurchaseOrder object
 */
export async function syncCommitmentToXero(
  companyId: string,
  appCreds: XeroAppCredentials,
  companyCreds: XeroCompanyCredentials,
  commitment: XeroCommitmentPayload
): Promise<XeroResult> {
  const today = new Date().toISOString().slice(0, 10);
  const amount = Number(commitment.original_contract_amount.toFixed(2));

  try {
    if (commitment.type === "subcontract") {
      const payload = {
        Invoices: [
          {
            Type: "ACCPAY",
            Contact: { Name: commitment.contract_company },
            DateString: today,
            DueDateString: today,
            InvoiceNumber: `SC-${commitment.number}`,
            Reference: commitment.title,
            LineItems: [
              {
                Description: commitment.title,
                Quantity: 1,
                UnitAmount: amount,
                AccountCode: "200",
              },
            ],
          },
        ],
      };

      const { status, json, rawText } = await callXero(
        companyId, appCreds, companyCreds, "PUT", "Invoices", payload
      );

      if (status !== 200) return { ok: false, error: extractXeroError(json, rawText), rawResponse: rawText.slice(0, 8000) };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = String((json as any)?.Invoices?.[0]?.InvoiceID ?? "");
      if (!id) return { ok: false, error: "Xero returned no Invoice ID", rawResponse: rawText.slice(0, 8000) };
      return { ok: true, id, rawResponse: rawText.slice(0, 8000) };

    } else {
      const payload = {
        PurchaseOrders: [
          {
            Contact: { Name: commitment.contract_company },
            DateString: today,
            PurchaseOrderNumber: `SC-${commitment.number}`,
            Reference: commitment.title,
            LineItems: [
              {
                Description: commitment.title,
                Quantity: 1,
                UnitAmount: amount,
                AccountCode: "200",
              },
            ],
          },
        ],
      };

      const { status, json, rawText } = await callXero(
        companyId, appCreds, companyCreds, "PUT", "PurchaseOrders", payload
      );

      if (status !== 200) return { ok: false, error: extractXeroError(json, rawText), rawResponse: rawText.slice(0, 8000) };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = String((json as any)?.PurchaseOrders?.[0]?.PurchaseOrderID ?? "");
      if (!id) return { ok: false, error: "Xero returned no PurchaseOrder ID", rawResponse: rawText.slice(0, 8000) };
      return { ok: true, id, rawResponse: rawText.slice(0, 8000) };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: msg, rawResponse: "" };
  }
}

// ── Prime contract sync ───────────────────────────────────────────────────────

export type XeroPrimeContractPayload = {
  id: string;
  contract_number: number;
  title: string;
  owner_client: string;
  original_contract_amount: number;
  status: string;
};

/**
 * Creates an ACCREC (accounts receivable) Invoice in Xero for a prime contract.
 */
export async function syncPrimeContractToXero(
  companyId: string,
  appCreds: XeroAppCredentials,
  companyCreds: XeroCompanyCredentials,
  contract: XeroPrimeContractPayload
): Promise<XeroResult> {
  const today = new Date().toISOString().slice(0, 10);
  const amount = Number(contract.original_contract_amount.toFixed(2));

  try {
    const payload = {
      Invoices: [
        {
          Type: "ACCREC",
          Contact: { Name: contract.owner_client },
          DateString: today,
          DueDateString: today,
          InvoiceNumber: `SC-${contract.contract_number}`,
          Reference: contract.title,
          LineItems: [
            {
              Description: contract.title,
              Quantity: 1,
              UnitAmount: amount,
              AccountCode: "200",
            },
          ],
        },
      ],
    };

    const { status, json, rawText } = await callXero(
      companyId, appCreds, companyCreds, "PUT", "Invoices", payload
    );

    if (status !== 200) return { ok: false, error: extractXeroError(json, rawText), rawResponse: rawText.slice(0, 8000) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = String((json as any)?.Invoices?.[0]?.InvoiceID ?? "");
    if (!id) return { ok: false, error: "Xero returned no Invoice ID", rawResponse: rawText.slice(0, 8000) };
    return { ok: true, id, rawResponse: rawText.slice(0, 8000) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: msg, rawResponse: "" };
  }
}

// ── AP Invoice sync ───────────────────────────────────────────────────────────

export type XeroAPInvoicePayload = {
  commitmentId: string;
  commitmentNumber: number;
  contactName: string;
  description: string;
  lineItems: { description: string; amount: number }[];
};

export async function syncAPInvoiceToXero(
  companyId: string,
  appCreds: XeroAppCredentials,
  companyCreds: XeroCompanyCredentials,
  invoice: XeroAPInvoicePayload
): Promise<XeroResult> {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const payload = {
      Invoices: [
        {
          Type: "ACCPAY",
          Contact: { Name: invoice.contactName },
          DateString: today,
          DueDateString: today,
          Reference: invoice.description,
          LineItems: invoice.lineItems.map((li) => ({
            Description: li.description,
            Quantity: 1,
            UnitAmount: Number(li.amount.toFixed(2)),
            AccountCode: "200",
          })),
        },
      ],
    };

    const { status, json, rawText } = await callXero(
      companyId, appCreds, companyCreds, "PUT", "Invoices", payload
    );

    if (status !== 200) return { ok: false, error: extractXeroError(json, rawText), rawResponse: rawText.slice(0, 8000) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = String((json as any)?.Invoices?.[0]?.InvoiceID ?? "");
    if (!id) return { ok: false, error: "Xero returned no Invoice ID", rawResponse: rawText.slice(0, 8000) };
    return { ok: true, id, rawResponse: rawText.slice(0, 8000) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: msg, rawResponse: "" };
  }
}

// ── AR Invoice sync ───────────────────────────────────────────────────────────

export type XeroARInvoicePayload = {
  contractId: string;
  contractNumber: number;
  contactName: string;
  description: string;
  lineItems: { description: string; amount: number }[];
};

export async function syncARInvoiceToXero(
  companyId: string,
  appCreds: XeroAppCredentials,
  companyCreds: XeroCompanyCredentials,
  invoice: XeroARInvoicePayload
): Promise<XeroResult> {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const payload = {
      Invoices: [
        {
          Type: "ACCREC",
          Contact: { Name: invoice.contactName },
          DateString: today,
          DueDateString: today,
          Reference: invoice.description,
          LineItems: invoice.lineItems.map((li) => ({
            Description: li.description,
            Quantity: 1,
            UnitAmount: Number(li.amount.toFixed(2)),
            AccountCode: "200",
          })),
        },
      ],
    };

    const { status, json, rawText } = await callXero(
      companyId, appCreds, companyCreds, "PUT", "Invoices", payload
    );

    if (status !== 200) return { ok: false, error: extractXeroError(json, rawText), rawResponse: rawText.slice(0, 8000) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = String((json as any)?.Invoices?.[0]?.InvoiceID ?? "");
    if (!id) return { ok: false, error: "Xero returned no Invoice ID", rawResponse: rawText.slice(0, 8000) };
    return { ok: true, id, rawResponse: rawText.slice(0, 8000) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: msg, rawResponse: "" };
  }
}

// ── Error extraction ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractXeroError(json: any, rawText: string): string {
  // Xero error shape: { Type: "ValidationException", Message: "...", Elements: [...] }
  if (typeof json?.Message === "string") return json.Message;
  if (typeof json?.message === "string") return json.message;
  // Validation errors may be nested in Elements[].ValidationErrors
  const elems = json?.Elements;
  if (Array.isArray(elems) && elems.length > 0) {
    const errs = elems[0]?.ValidationErrors;
    if (Array.isArray(errs) && errs.length > 0) {
      return errs[0]?.Message ?? "Xero validation error";
    }
  }
  return rawText.slice(0, 500) || "Unknown Xero error";
}
