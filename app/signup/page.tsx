import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
  const session = await getSession();

  // Already logged in — send to the appropriate home page.
  // This prevents session confusion where an existing user (e.g. the system
  // admin) lands on /signup, creates a new account, and ends up with a
  // mismatched session cookie.
  if (session) {
    redirect("/dashboard");
  }

  return <SignupForm />;
}
