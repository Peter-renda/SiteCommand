/**
 * GET /api/training/credential/certificate — download the caller's
 * "SiteCommand Certified" certificate as a PDF. Requires an issued
 * credential (POST /api/training/credential first).
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { buildCertificatePdf } from "@/lib/training-certificate-pdf";

export const dynamic = "force-dynamic";

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: credential } = await getSupabase()
    .from("training_credentials")
    .select("code, holder_name, title, overall_level, overall_score, profile, issued_at")
    .eq("user_id", session.id)
    .maybeSingle();

  if (!credential) {
    return NextResponse.json({ error: "No credential issued yet" }, { status: 404 });
  }

  const profile = (credential.profile ?? {}) as {
    skills?: { label?: string; level?: string | null; score?: number | null }[];
  };

  const bytes = await buildCertificatePdf({
    holderName: credential.holder_name,
    title: credential.title,
    overallLevel: credential.overall_level,
    overallScore: credential.overall_score,
    code: credential.code,
    issuedAt: credential.issued_at,
    verifyUrl: `${appBaseUrl()}/verify/${credential.code}`,
    skills: (profile.skills ?? []).map((s) => ({
      label: s.label ?? "",
      level: s.level ?? null,
      score: typeof s.score === "number" ? s.score : null,
    })),
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sitecommand-certificate-${credential.code}.pdf"`,
    },
  });
}
