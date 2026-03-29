/**
 * GET /api/integrations/sage/vendors
 *
 * Returns the list of active vendors from the company's Sage Intacct account.
 * Used to populate vendor selection dropdowns when creating commitments so that
 * the contract_company value is always a valid Sage vendor ID.
 *
 * Response: { vendors: Array<{ id: string; name: string }> }
 *
 * Auth: any authenticated company member.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSageCredentials, isSageConfigured, fetchSageVendors } from "@/lib/sage-intacct";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!session.company_id) {
    return NextResponse.json({ error: "No company associated with this account" }, { status: 422 });
  }

  const creds = await getSageCredentials(session.company_id);
  if (!isSageConfigured(creds)) {
    return NextResponse.json(
      { error: "Sage Intacct is not configured. Add credentials in Settings → Integrations." },
      { status: 422 }
    );
  }

  const result = await fetchSageVendors(creds);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ vendors: result.vendors });
}
