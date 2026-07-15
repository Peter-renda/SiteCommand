import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * SiteCommand is now a training-only program — the whole site is the training
 * sandbox. The old real-projects dashboard has been retired; every signed-in
 * user is sent to the training launcher. (Legacy /dashboard links, including the
 * "back to home" chrome across the app, land here and forward on.)
 */
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect("/training/practice");
}
