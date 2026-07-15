import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
  const session = await getSession();

  // Already logged in — send to the training program (the whole site is the
  // training sandbox now). This also prevents session confusion where an
  // existing user lands on /signup, creates a new account, and ends up with a
  // mismatched session cookie.
  if (session) {
    redirect("/training/practice");
  }

  return <SignupForm />;
}
