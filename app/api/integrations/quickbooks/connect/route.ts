/**
 * GET /api/integrations/quickbooks/connect
 *
 * Initiates the QuickBooks Online OAuth 2.0 authorization flow. Redirects the
 * user to the Intuit authorization page. After authorization, Intuit redirects
 * to /api/integrations/quickbooks/callback.
 *
 * Auth: company super_admin or site_admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getQBOAppCredentials } from "@/lib/quickbooks";

const QBO_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const SCOPES = "com.intuit.quickbooks.accounting";

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const settingsUrl = `${origin}/settings/integrations`;

  const session = await getSession();
  if (!session) return NextResponse.redirect(`${settingsUrl}?error=qbo_unauthorized`);
  if (session.company_role !== "super_admin" && session.role !== "site_admin") {
    return NextResponse.redirect(`${settingsUrl}?error=qbo_forbidden`);
  }
  if (!session.company_id) {
    return NextResponse.redirect(`${settingsUrl}?error=qbo_no_company`);
  }

  const appCreds = await getQBOAppCredentials(session.company_id);
  if (!appCreds.clientId) {
    return NextResponse.redirect(`${settingsUrl}?error=qbo_not_configured`);
  }

  const redirectUri = `${origin}/api/integrations/quickbooks/callback`;

  // Encode company_id in state so the callback can associate tokens with the right company
  const state = Buffer.from(JSON.stringify({ companyId: session.company_id })).toString("base64url");

  const params = new URLSearchParams({
    client_id: appCreds.clientId,
    response_type: "code",
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
  });

  return NextResponse.redirect(`${QBO_AUTH_URL}?${params.toString()}`);
}
