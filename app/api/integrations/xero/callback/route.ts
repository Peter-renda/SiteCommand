/**
 * GET /api/integrations/xero/callback
 *
 * Handles the OAuth 2.0 callback from Xero. Exchanges the authorization code
 * for access + refresh tokens, resolves the Xero organisation's tenant ID, and
 * stores everything in company_integrations. Redirects back to the settings page.
 *
 * Auth: validated via state parameter (contains companyId).
 */

import { NextRequest, NextResponse } from "next/server";
import { getXeroAppCredentials, resolveAndStoreXeroTenantId } from "@/lib/xero";
import { getSupabase } from "@/lib/supabase";

const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code     = searchParams.get("code");
  const stateB64 = searchParams.get("state");
  const error    = searchParams.get("error");

  const origin = new URL(req.url).origin;
  const settingsUrl = `${origin}/settings/integrations`;

  if (error) {
    return NextResponse.redirect(`${settingsUrl}?error=xero_denied`);
  }

  if (!code || !stateB64) {
    return NextResponse.redirect(`${settingsUrl}?error=xero_invalid_callback`);
  }

  let companyId: string;
  try {
    const parsed = JSON.parse(Buffer.from(stateB64, "base64url").toString("utf-8"));
    companyId = parsed.companyId;
    if (!companyId) throw new Error("missing companyId");
  } catch {
    return NextResponse.redirect(`${settingsUrl}?error=xero_invalid_state`);
  }

  const appCreds = await getXeroAppCredentials(companyId);
  if (!appCreds.clientId || !appCreds.clientSecret) {
    return NextResponse.redirect(`${settingsUrl}?error=xero_missing_app_creds`);
  }

  const redirectUri = `${origin}/api/integrations/xero/callback`;
  const basicAuth = Buffer.from(`${appCreds.clientId}:${appCreds.clientSecret}`).toString("base64");

  // Exchange code for tokens
  let accessToken: string;
  let refreshToken: string;
  try {
    const res = await fetch(XERO_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!res.ok) {
      return NextResponse.redirect(`${settingsUrl}?error=xero_token_exchange_failed`);
    }

    const json = await res.json() as { access_token: string; refresh_token: string };
    accessToken  = json.access_token;
    refreshToken = json.refresh_token;
  } catch {
    return NextResponse.redirect(`${settingsUrl}?error=xero_token_exchange_failed`);
  }

  // Persist tokens
  const supabase = getSupabase();
  const now = new Date().toISOString();
  await supabase.from("company_integrations").upsert(
    [
      { company_id: companyId, key: "XERO_ACCESS_TOKEN",  value: accessToken,  updated_at: now },
      { company_id: companyId, key: "XERO_REFRESH_TOKEN", value: refreshToken, updated_at: now },
    ],
    { onConflict: "company_id,key" }
  );

  // Resolve and store the Xero tenant (organisation) ID
  await resolveAndStoreXeroTenantId(companyId, accessToken);

  return NextResponse.redirect(`${settingsUrl}?connected=xero`);
}
