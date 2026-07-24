import { getSession } from "@/lib/auth";
import CareersClient from "./CareersClient";

export const metadata = { title: "Career Center – CPMA" };

/**
 * The Career Center is a dual-audience page: logged-out visitors see the
 * public marketing chrome, while logged-in trainees reach it from the in-app
 * left menu. We resolve the session here (server-side, so there's no flash of
 * logged-out chrome) and let the client render the appropriate header — the
 * app hamburger menu + account menu when signed in, the marketing navbar when
 * not. It stays a public route either way (no redirect).
 */
export default async function CareersPage() {
  const session = await getSession();
  return <CareersClient isLoggedIn={!!session} username={session?.username ?? null} />;
}
