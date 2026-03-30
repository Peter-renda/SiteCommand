/**
 * GET /api/integrations/xero/connect
 *
 * Initiates the Xero OAuth 2.0 authorization flow. Redirects the user to the
 * Xero login page. After authorization, Xero redirects to
 * /api/integrations/xero/callback.
 *
 * Auth: company super_admin or site_admin.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getXeroAppCredentials } from "@/lib/xero";

const XERO_AUTH_URL = "https://login.xero.com/identity/connect/authorize";
// offline_access is required to receive a refresh token
const SCOPES = "offline_access accounting.transactions accounting.contacts";

export async function GET() {
  const session = await getSession();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const settingsUrl = `${baseUrl}/settings/integrations`;

  if (!session) return NextResponse.redirect(`${settingsUrl}?error=xero_unauthorized`);
  if (session.company_role !== "super_admin" && session.role !== "site_admin") {
    return NextResponse.redirect(`${settingsUrl}?error=xero_forbidden`);
  }
  if (!session.company_id) {
    return NextResponse.redirect(`${settingsUrl}?error=xero_no_company`);
  }

  const appCreds = await getXeroAppCredentials();
  if (!appCreds.clientId) {
    return NextResponse.redirect(`${settingsUrl}?error=xero_not_configured`);
  }

  const redirectUri = `${baseUrl}/api/integrations/xero/callback`;

  const state = Buffer.from(JSON.stringify({ companyId: session.company_id })).toString("base64url");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: appCreds.clientId,
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  });

  return NextResponse.redirect(`${XERO_AUTH_URL}?${params.toString()}`);
}
