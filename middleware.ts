import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// API routes that demo accounts are allowed to POST to
const DEMO_ALLOWED_WRITE_PATHS = ["/api/auth/demo", "/api/auth/logout"];

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) return NextResponse.next();

  const session = await verifyToken(token);

  if (!session) return NextResponse.next();

  // Demo write guard: block mutating requests for demo accounts
  if (
    (session as { user_type?: string | null }).user_type === "demo" &&
    req.nextUrl.pathname.startsWith("/api/") &&
    ["POST", "PATCH", "PUT", "DELETE"].includes(req.method)
  ) {
    const isAllowed = DEMO_ALLOWED_WRITE_PATHS.some((path) =>
      req.nextUrl.pathname === path
    );

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: "Demo accounts are read-only. Sign up for full access.",
          demo: true,
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
