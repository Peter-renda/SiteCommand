import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  const expectedCode = process.env.DEMO_ACCESS_CODE ?? "sitecommand-demo";

  if (!code || code !== expectedCode) {
    return NextResponse.json({ error: "Invalid demo access code" }, { status: 401 });
  }

  const token = await createToken({
    id: "demo-user",
    email: "demo@sitecommand.app",
    username: "Demo User",
    role: "admin",
    company_id: "demo-company",
    company_role: "admin",
    user_type: "demo",
  });

  const res = NextResponse.json({ success: true, redirect: "/dashboard" });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
