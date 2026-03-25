import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getApsCredentials } from "@/lib/platform-settings";

async function getApsToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://developer.api.autodesk.com/authentication/v2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "data:read",
    }),
  });

  const data = await res.json();
  return data.access_token;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ urn: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, clientSecret } = await getApsCredentials();
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "APS not configured" }, { status: 503 });
  }

  const { urn } = await params;

  const token = await getApsToken(clientId, clientSecret);
  const res = await fetch(
    `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/manifest`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (res.status === 404) {
    return NextResponse.json({ status: "pending" });
  }

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch manifest" }, { status: 502 });
  }

  const manifest = await res.json();
  const status = manifest.status ?? "pending";
  const progress = manifest.progress ?? "0%";

  return NextResponse.json({ status, progress });
}
