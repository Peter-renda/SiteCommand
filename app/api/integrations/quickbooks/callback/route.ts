/**
 * GET /api/integrations/quickbooks/callback
 *
 * Handles the OAuth 2.0 callback from Intuit after the user authorizes access.
 * Exchanges the authorization code for access + refresh tokens, stores them in
 * company_integrations, and redirects back to the integrations settings page.
 *
 * Auth: validated via state parameter (contains companyId).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getQBOAppCredentials } from "@/lib/quickbooks";

const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code     = searchParams.get("code");
  const realmId  = searchParams.get("realmId");
  const stateB64 = searchParams.get("state");
  const error    = searchParams.get("error");

  const origin = new URL(req.url).origin;
  const settingsUrl = `${origin}/settings/integrations`;

  if (error) {
    return NextResponse.redirect(`${settingsUrl}?error=qbo_denied`);
  }

  if (!code || !realmId || !stateB64) {
    return NextResponse.redirect(`${settingsUrl}?error=qbo_invalid_callback`);
  }

  // Decode state to get company_id
  let companyId: string;
  try {
    const parsed = JSON.parse(Buffer.from(stateB64, "base64url").toString("utf-8"));
    companyId = parsed.companyId;
    if (!companyId) throw new Error("missing companyId");
  } catch {
    return NextResponse.redirect(`${settingsUrl}?error=qbo_invalid_state`);
  }

  const appCreds = await getQBOAppCredentials(companyId);
  if (!appCreds.clientId || !appCreds.clientSecret) {
    return NextResponse.redirect(`${settingsUrl}?error=qbo_missing_app_creds`);
  }

  const redirectUri = `${origin}/api/integrations/quickbooks/callback`;
  const basicAuth = Buffer.from(`${appCreds.clientId}:${appCreds.clientSecret}`).toString("base64");

  // Exchange code for tokens
  let accessToken: string;
  let refreshToken: string;
  try {
    const res = await fetch(QBO_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!res.ok) {
      return NextResponse.redirect(`${settingsUrl}?error=qbo_token_exchange_failed`);
    }

    const json = await res.json() as { access_token: string; refresh_token: string };
    accessToken  = json.access_token;
    refreshToken = json.refresh_token;
  } catch {
    return NextResponse.redirect(`${settingsUrl}?error=qbo_token_exchange_failed`);
  }

  // Persist tokens + realmId to company_integrations
  const supabase = getSupabase();
  const now = new Date().toISOString();
  await supabase.from("company_integrations").upsert(
    [
      { company_id: companyId, key: "QBO_REALM_ID",      value: realmId,       updated_at: now },
      { company_id: companyId, key: "QBO_ACCESS_TOKEN",  value: accessToken,   updated_at: now },
      { company_id: companyId, key: "QBO_REFRESH_TOKEN", value: refreshToken,  updated_at: now },
    ],
    { onConflict: "company_id,key" }
  );

  return NextResponse.redirect(`${settingsUrl}?connected=quickbooks`);
}
