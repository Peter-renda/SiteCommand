import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";

// API routes that demo accounts are allowed to POST to
const DEMO_ALLOWED_WRITE_PATHS = ["/api/auth/demo", "/api/auth/logout", "/api/auth/login", "/api/auth/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin area protection ────────────────────────────────────────────────────
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin/") &&
    !pathname.startsWith("/api/admin/auth/");

  if (isAdminPage || isAdminApi) {
    const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;
    if (adminToken) {
      const adminSession = await verifyAdminToken(adminToken);
      if (adminSession) return NextResponse.next();
    }
    // Not authenticated as admin
    if (isAdminApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  // ── Demo write guard ─────────────────────────────────────────────────────────
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.next();

  const session = await verifyToken(token);
  if (!session) return NextResponse.next();

  if (
    (session as { user_type?: string | null }).user_type === "demo" &&
    pathname.startsWith("/api/") &&
    ["POST", "PATCH", "PUT", "DELETE"].includes(req.method)
  ) {
    const isAllowed = DEMO_ALLOWED_WRITE_PATHS.some((path) => pathname === path);

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
  matcher: ["/api/:path*", "/admin/:path*"],
};
