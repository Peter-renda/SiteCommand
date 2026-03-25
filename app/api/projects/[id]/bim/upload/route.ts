import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkProjectAccess } from "@/lib/permissions";
import { getApsCredentials, getPlatformSetting } from "@/lib/platform-settings";

const APS_BASE = "https://developer.api.autodesk.com";

async function getApsToken(clientId: string, clientSecret: string, scope: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${APS_BASE}/authentication/v2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to obtain APS token: ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function ensureBucket(token: string, bucketKey: string): Promise<void> {
  // Check if bucket exists
  const check = await fetch(`${APS_BASE}/oss/v2/buckets/${bucketKey}/details`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (check.status === 200) return; // already exists

  // Create bucket
  const create = await fetch(`${APS_BASE}/oss/v2/buckets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bucketKey,
      policyKey: "persistent",
    }),
  });

  if (!create.ok && create.status !== 409) {
    const text = await create.text();
    throw new Error(`Failed to create APS bucket: ${text}`);
  }
}

async function uploadToOss(
  token: string,
  bucketKey: string,
  objectKey: string,
  fileBuffer: ArrayBuffer,
  contentType: string
): Promise<string> {
  const res = await fetch(
    `${APS_BASE}/oss/v2/buckets/${bucketKey}/objects/${encodeURIComponent(objectKey)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType,
        "Content-Length": String(fileBuffer.byteLength),
      },
      body: fileBuffer,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to upload to APS OSS: ${text}`);
  }

  const data = await res.json();
  // URN is base64url encoded version of "urn:adsk.objects:os.object:{bucket}/{objectKey}"
  const rawUrn = `urn:adsk.objects:os.object:${bucketKey}/${objectKey}`;
  return Buffer.from(rawUrn).toString("base64url");
}

async function triggerTranslation(token: string, urn: string): Promise<void> {
  const res = await fetch(`${APS_BASE}/modelderivative/v2/designdata/job`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-ads-force": "true",
    },
    body: JSON.stringify({
      input: { urn },
      output: {
        formats: [{ type: "svf2", views: ["2d", "3d"] }],
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to trigger translation: ${text}`);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId: apsClientId, clientSecret: apsClientSecret } = await getApsCredentials();
  if (!apsClientId || !apsClientSecret) {
    return NextResponse.json(
      { error: "APS credentials not configured. Set APS_CLIENT_ID and APS_CLIENT_SECRET." },
      { status: 503 }
    );
  }

  const { id: projectId } = await params;

  try {
    await checkProjectAccess(session.id, projectId);
  } catch {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedExtensions = [".dwg", ".rvt", ".ifc", ".nwd", ".nwc", ".dxf", ".dwf"];
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!allowedExtensions.includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type. Allowed: ${allowedExtensions.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const apsBucketKey = await getPlatformSetting("APS_BUCKET_KEY");
    const bucketKey =
      apsBucketKey ?? `sitecommand-bim-${apsClientId.toLowerCase().slice(0, 20)}`;

    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `${projectId}/${Date.now()}-${safeFilename}`;

    const token = await getApsToken(apsClientId, apsClientSecret, "data:read data:write data:create bucket:read bucket:create");

    await ensureBucket(token, bucketKey);

    const fileBuffer = await file.arrayBuffer();
    const urn = await uploadToOss(token, bucketKey, objectKey, fileBuffer, file.type || "application/octet-stream");

    await triggerTranslation(token, urn);

    return NextResponse.json({ urn, aps_object_key: objectKey, filename: file.name });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
