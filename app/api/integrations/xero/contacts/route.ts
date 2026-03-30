/**
 * GET /api/integrations/xero/contacts
 *
 * Returns active supplier contacts from Xero. In Xero, both vendors and
 * customers are "Contacts" — this endpoint filters for IsSupplier=true.
 * Append ?type=customer to get IsCustomer=true contacts instead.
 *
 * Auth: any authenticated company member.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getXeroAppCredentials,
  getXeroCompanyCredentials,
  isXeroConfigured,
  fetchXeroContacts,
} from "@/lib/xero";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.company_id) {
    return NextResponse.json({ error: "No company associated with this account" }, { status: 422 });
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

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "customer" or default supplier

  // fetchXeroContacts fetches suppliers by default; for customers we override the
  // filter inline here since the helper is the same structure
  const result = type === "customer"
    ? await fetchCustomers(session.company_id, appCreds, companyCreds)
    : await fetchXeroContacts(session.company_id, appCreds, companyCreds);

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ contacts: result.contacts });
}

// Inline customer fetch (same as fetchXeroContacts but IsCustomer filter)
import {
  getXeroCompanyCredentials as _gcreds,
  refreshXeroTokens,
} from "@/lib/xero";

async function fetchCustomers(
  companyId: string,
  appCreds: Awaited<ReturnType<typeof getXeroAppCredentials>>,
  companyCreds: Awaited<ReturnType<typeof getXeroCompanyCredentials>>
) {
  let accessToken = companyCreds.accessToken!;
  const tenantId  = companyCreds.tenantId!;
  const url = "https://api.xero.com/api.xro/2.0/Contacts?where=IsCustomer%3D%3Dtrue%26%26ContactStatus%3D%3D%22ACTIVE%22&pageSize=200";

  async function attempt(token: string) {
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Xero-Tenant-Id": tenantId,
        Accept: "application/json",
      },
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

  if (res.status !== 200) {
    return { ok: false as const, error: "Failed to fetch Xero customers" };
  }

  const json = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (json as any)?.Contacts ?? [];
  const contacts = (Array.isArray(rows) ? rows : [rows]).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => ({ id: String(c.ContactID), name: String(c.Name ?? c.ContactID) })
  );
  return { ok: true as const, contacts };
}
