/**
 * QuickBooks Online (QBO) API client.
 *
 * QBO uses OAuth 2.0 with short-lived access tokens (1 hr) and long-lived
 * refresh tokens (100 days). Every API call is a JSON REST request to the
 * company-scoped base URL.
 *
 * Credentials lookup order (most → least specific):
 *   1. company_integrations (company admin sets their own Intuit app credentials)
 *   2. platform_settings    (site admin sets a shared Intuit app for all companies)
 *   3. Environment variables
 *
 *   Company-level tokens set automatically via OAuth callback:
 *     QBO_REALM_ID, QBO_ACCESS_TOKEN, QBO_REFRESH_TOKEN
 */

import { getSupabase } from "@/lib/supabase";

const QBO_BASE = "https://quickbooks.api.intuit.com/v3/company";
const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QBO_MINOR_VERSION = "65";

// ── Credential types ──────────────────────────────────────────────────────────

export type QBOAppCredentials = {
  clientId: string | null;
  clientSecret: string | null;
};

export type QBOCompanyCredentials = {
  realmId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
};

// ── Credential helpers ────────────────────────────────────────────────────────

/**
 * Loads QBO app credentials. Company-level credentials take precedence over
 * platform-level ones, allowing each company to register their own Intuit app
 * without requiring site admin involvement.
 *
 * Lookup order: company_integrations → platform_settings → env vars
 */
export async function getQBOAppCredentials(companyId?: string): Promise<QBOAppCredentials> {
  try {
    const supabase = getSupabase();

    // Check company-level credentials first
    if (companyId) {
      const { data: companyData } = await supabase
        .from("company_integrations")
        .select("key, value")
        .eq("company_id", companyId)
        .in("key", ["QBO_CLIENT_ID", "QBO_CLIENT_SECRET"]);

      const companyMap: Record<string, string> = {};
      for (const row of companyData ?? []) companyMap[row.key] = row.value;

      if (companyMap.QBO_CLIENT_ID && companyMap.QBO_CLIENT_SECRET) {
        return {
          clientId:     companyMap.QBO_CLIENT_ID,
          clientSecret: companyMap.QBO_CLIENT_SECRET,
        };
      }
    }

    // Fall back to platform-level credentials
    const { data: platformData } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["QBO_CLIENT_ID", "QBO_CLIENT_SECRET"]);

    const platformMap: Record<string, string> = {};
    for (const row of platformData ?? []) platformMap[row.key] = row.value;

    return {
      clientId:     platformMap.QBO_CLIENT_ID     ?? process.env.QBO_CLIENT_ID     ?? null,
      clientSecret: platformMap.QBO_CLIENT_SECRET ?? process.env.QBO_CLIENT_SECRET ?? null,
    };
  } catch {
    return {
      clientId:     process.env.QBO_CLIENT_ID     ?? null,
      clientSecret: process.env.QBO_CLIENT_SECRET ?? null,
    };
  }
}

/**
 * Loads per-company QBO tokens from company_integrations.
 */
export async function getQBOCompanyCredentials(
  companyId: string
): Promise<QBOCompanyCredentials> {
  const keys = ["QBO_REALM_ID", "QBO_ACCESS_TOKEN", "QBO_REFRESH_TOKEN"] as const;

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
      realmId:      map.QBO_REALM_ID      ?? null,
      accessToken:  map.QBO_ACCESS_TOKEN  ?? null,
      refreshToken: map.QBO_REFRESH_TOKEN ?? null,
    };
  } catch {
    return { realmId: null, accessToken: null, refreshToken: null };
  }
}

export function isQBOConfigured(creds: QBOCompanyCredentials): boolean {
  return !!(creds.realmId && creds.accessToken && creds.refreshToken);
}

// ── Token refresh ─────────────────────────────────────────────────────────────

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

/**
 * Exchanges a refresh token for a new access token and persists the updated
 * tokens back to company_integrations.
 */
export async function refreshQBOTokens(
  companyId: string,
  appCreds: QBOAppCredentials,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (!appCreds.clientId || !appCreds.clientSecret) return null;

  const basicAuth = Buffer.from(
    `${appCreds.clientId}:${appCreds.clientSecret}`
  ).toString("base64");

  try {
    const res = await fetch(QBO_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as TokenResponse;
    const { access_token, refresh_token } = json;

    // Persist fresh tokens
    const supabase = getSupabase();
    const now = new Date().toISOString();
    await supabase.from("company_integrations").upsert(
      [
        { company_id: companyId, key: "QBO_ACCESS_TOKEN",  value: access_token,  updated_at: now },
        { company_id: companyId, key: "QBO_REFRESH_TOKEN", value: refresh_token, updated_at: now },
      ],
      { onConflict: "company_id,key" }
    );

    return { accessToken: access_token, refreshToken: refresh_token };
  } catch {
    return null;
  }
}

// ── API call helper ───────────────────────────────────────────────────────────

export type QBOResult =
  | { ok: true; id: string; rawResponse: string }
  | { ok: false; error: string; rawResponse: string };

/**
 * Makes an authenticated JSON request to the QBO REST API. Automatically
 * retries once with a refreshed token if a 401 is returned.
 */
export async function callQBO(
  companyId: string,
  appCreds: QBOAppCredentials,
  companyCreds: QBOCompanyCredentials,
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<{ status: number; json: unknown; rawText: string }> {
  let accessToken = companyCreds.accessToken!;
  const realmId = companyCreds.realmId!;
  const url = `${QBO_BASE}/${realmId}/${path}?minorversion=${QBO_MINOR_VERSION}`;

  async function attempt(token: string) {
    return fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  let res = await attempt(accessToken);

  // Retry once with refreshed token on 401
  if (res.status === 401 && companyCreds.refreshToken) {
    const refreshed = await refreshQBOTokens(
      companyId,
      appCreds,
      companyCreds.refreshToken
    );
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

// ── Vendor list ───────────────────────────────────────────────────────────────

export type QBOVendor = { id: string; name: string };

export type QBOVendorResult =
  | { ok: true; vendors: QBOVendor[] }
  | { ok: false; error: string };

export async function fetchQBOVendors(
  companyId: string,
  appCreds: QBOAppCredentials,
  companyCreds: QBOCompanyCredentials
): Promise<QBOVendorResult> {
  try {
    const query = encodeURIComponent("SELECT Id, DisplayName FROM Vendor WHERE Active = true MAXRESULTS 200");
    const { status, json, rawText } = await callQBO(
      companyId, appCreds, companyCreds,
      "GET",
      `query?query=${query}&minorversion=${QBO_MINOR_VERSION}`.replace(`?query=`, "query?query="),
    );

    if (status !== 200) {
      return { ok: false, error: extractQBOError(json, rawText) };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (json as any)?.QueryResponse?.Vendor ?? [];
    const vendors: QBOVendor[] = (Array.isArray(rows) ? rows : [rows]).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (v: any) => ({ id: String(v.Id), name: String(v.DisplayName ?? v.Id) })
    );
    return { ok: true, vendors };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Customer list ─────────────────────────────────────────────────────────────

export type QBOCustomer = { id: string; name: string };

export type QBOCustomerResult =
  | { ok: true; customers: QBOCustomer[] }
  | { ok: false; error: string };

export async function fetchQBOCustomers(
  companyId: string,
  appCreds: QBOAppCredentials,
  companyCreds: QBOCompanyCredentials
): Promise<QBOCustomerResult> {
  try {
    const query = encodeURIComponent("SELECT Id, DisplayName FROM Customer WHERE Active = true MAXRESULTS 200");
    const { status, json, rawText } = await callQBO(
      companyId, appCreds, companyCreds,
      "GET",
      `query?query=${query}&minorversion=${QBO_MINOR_VERSION}`.replace(`?query=`, "query?query="),
    );

    if (status !== 200) {
      return { ok: false, error: extractQBOError(json, rawText) };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (json as any)?.QueryResponse?.Customer ?? [];
    const customers: QBOCustomer[] = (Array.isArray(rows) ? rows : [rows]).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => ({ id: String(c.Id), name: String(c.DisplayName ?? c.Id) })
    );
    return { ok: true, customers };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Commitment sync ───────────────────────────────────────────────────────────

export type QBOCommitmentPayload = {
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
 * Creates a Bill (subcontract) or PurchaseOrder in QuickBooks Online.
 * The vendor is matched by display name; if QBO can't resolve it the sync
 * still proceeds using the name as a ref.
 */
export async function syncCommitmentToQBO(
  companyId: string,
  appCreds: QBOAppCredentials,
  companyCreds: QBOCompanyCredentials,
  commitment: QBOCommitmentPayload
): Promise<QBOResult> {
  const today = new Date().toISOString().slice(0, 10);
  const amount = Number(commitment.original_contract_amount.toFixed(2));

  try {
    if (commitment.type === "subcontract") {
      // AP Bill
      const payload = {
        VendorRef: { name: commitment.contract_company },
        TxnDate: today,
        DocNumber: String(commitment.number),
        PrivateNote: commitment.title,
        Line: [
          {
            DetailType: "AccountBasedExpenseLineDetail",
            Amount: amount,
            Description: commitment.title,
            AccountBasedExpenseLineDetail: {
              AccountRef: { name: "Accounts Payable (A/P)" },
            },
          },
        ],
      };

      const { status, json, rawText } = await callQBO(
        companyId, appCreds, companyCreds, "POST", "bill", payload
      );

      if (status !== 200) return { ok: false, error: extractQBOError(json, rawText), rawResponse: rawText.slice(0, 8000) };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = String((json as any)?.Bill?.Id ?? "");
      if (!id) return { ok: false, error: "QBO returned no Bill Id", rawResponse: rawText.slice(0, 8000) };
      return { ok: true, id, rawResponse: rawText.slice(0, 8000) };

    } else {
      // Purchase Order
      const payload = {
        VendorRef: { name: commitment.contract_company },
        TxnDate: today,
        DocNumber: String(commitment.number),
        PrivateNote: commitment.title,
        Line: [
          {
            DetailType: "ItemBasedExpenseLineDetail",
            Amount: amount,
            Description: commitment.title,
            ItemBasedExpenseLineDetail: {
              ItemRef: { name: "Services" },
              Qty: 1,
              UnitPrice: amount,
            },
          },
        ],
      };

      const { status, json, rawText } = await callQBO(
        companyId, appCreds, companyCreds, "POST", "purchaseorder", payload
      );

      if (status !== 200) return { ok: false, error: extractQBOError(json, rawText), rawResponse: rawText.slice(0, 8000) };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = String((json as any)?.PurchaseOrder?.Id ?? "");
      if (!id) return { ok: false, error: "QBO returned no PurchaseOrder Id", rawResponse: rawText.slice(0, 8000) };
      return { ok: true, id, rawResponse: rawText.slice(0, 8000) };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: msg, rawResponse: "" };
  }
}

// ── Prime contract sync ───────────────────────────────────────────────────────

export type QBOPrimeContractPayload = {
  id: string;
  contract_number: number;
  title: string;
  owner_client: string;
  original_contract_amount: number;
  status: string;
};

/**
 * Creates a Sales Receipt / Invoice in QuickBooks Online representing a prime
 * contract (AR side). We use Invoice so it appears in AR Aging.
 */
export async function syncPrimeContractToQBO(
  companyId: string,
  appCreds: QBOAppCredentials,
  companyCreds: QBOCompanyCredentials,
  contract: QBOPrimeContractPayload
): Promise<QBOResult> {
  const today = new Date().toISOString().slice(0, 10);
  const amount = Number(contract.original_contract_amount.toFixed(2));

  try {
    const payload = {
      CustomerRef: { name: contract.owner_client },
      TxnDate: today,
      DocNumber: String(contract.contract_number),
      PrivateNote: contract.title,
      Line: [
        {
          DetailType: "SalesItemLineDetail",
          Amount: amount,
          Description: contract.title,
          SalesItemLineDetail: {
            ItemRef: { name: "Services" },
            Qty: 1,
            UnitPrice: amount,
          },
        },
      ],
    };

    const { status, json, rawText } = await callQBO(
      companyId, appCreds, companyCreds, "POST", "invoice", payload
    );

    if (status !== 200) return { ok: false, error: extractQBOError(json, rawText), rawResponse: rawText.slice(0, 8000) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = String((json as any)?.Invoice?.Id ?? "");
    if (!id) return { ok: false, error: "QBO returned no Invoice Id", rawResponse: rawText.slice(0, 8000) };
    return { ok: true, id, rawResponse: rawText.slice(0, 8000) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: msg, rawResponse: "" };
  }
}

// ── AP Invoice sync ───────────────────────────────────────────────────────────

export type QBOAPInvoicePayload = {
  commitmentId: string;
  commitmentNumber: number;
  vendorName: string;
  description: string;
  lineItems: { description: string; amount: number }[];
};

export async function syncAPInvoiceToQBO(
  companyId: string,
  appCreds: QBOAppCredentials,
  companyCreds: QBOCompanyCredentials,
  invoice: QBOAPInvoicePayload
): Promise<QBOResult> {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const payload = {
      VendorRef: { name: invoice.vendorName },
      TxnDate: today,
      DocNumber: String(invoice.commitmentNumber),
      PrivateNote: invoice.description,
      Line: invoice.lineItems.map((li) => ({
        DetailType: "AccountBasedExpenseLineDetail",
        Amount: Number(li.amount.toFixed(2)),
        Description: li.description,
        AccountBasedExpenseLineDetail: {
          AccountRef: { name: "Accounts Payable (A/P)" },
        },
      })),
    };

    const { status, json, rawText } = await callQBO(
      companyId, appCreds, companyCreds, "POST", "bill", payload
    );

    if (status !== 200) return { ok: false, error: extractQBOError(json, rawText), rawResponse: rawText.slice(0, 8000) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = String((json as any)?.Bill?.Id ?? "");
    if (!id) return { ok: false, error: "QBO returned no Bill Id", rawResponse: rawText.slice(0, 8000) };
    return { ok: true, id, rawResponse: rawText.slice(0, 8000) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: msg, rawResponse: "" };
  }
}

// ── AR Invoice sync ───────────────────────────────────────────────────────────

export type QBOARInvoicePayload = {
  contractId: string;
  contractNumber: number;
  customerName: string;
  description: string;
  lineItems: { description: string; amount: number }[];
};

export async function syncARInvoiceToQBO(
  companyId: string,
  appCreds: QBOAppCredentials,
  companyCreds: QBOCompanyCredentials,
  invoice: QBOARInvoicePayload
): Promise<QBOResult> {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const payload = {
      CustomerRef: { name: invoice.customerName },
      TxnDate: today,
      DocNumber: String(invoice.contractNumber),
      PrivateNote: invoice.description,
      Line: invoice.lineItems.map((li) => ({
        DetailType: "SalesItemLineDetail",
        Amount: Number(li.amount.toFixed(2)),
        Description: li.description,
        SalesItemLineDetail: {
          ItemRef: { name: "Services" },
          Qty: 1,
          UnitPrice: Number(li.amount.toFixed(2)),
        },
      })),
    };

    const { status, json, rawText } = await callQBO(
      companyId, appCreds, companyCreds, "POST", "invoice", payload
    );

    if (status !== 200) return { ok: false, error: extractQBOError(json, rawText), rawResponse: rawText.slice(0, 8000) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = String((json as any)?.Invoice?.Id ?? "");
    if (!id) return { ok: false, error: "QBO returned no Invoice Id", rawResponse: rawText.slice(0, 8000) };
    return { ok: true, id, rawResponse: rawText.slice(0, 8000) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: msg, rawResponse: "" };
  }
}

// ── Error extraction ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractQBOError(json: any, rawText: string): string {
  // QBO error shape: { Fault: { Error: [{ Message, Detail }] } }
  const errors = json?.Fault?.Error;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    return first?.Detail ?? first?.Message ?? "QuickBooks error";
  }
  if (typeof json?.message === "string") return json.message;
  return rawText.slice(0, 500) || "Unknown QuickBooks error";
}
