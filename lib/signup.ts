import { getSupabase } from "@/lib/supabase";

type Supabase = ReturnType<typeof getSupabase>;

export type MaterializedAccount = {
  userId: string;
  companyId: string;
  email: string;
  username: string;
  role: string;
  companyRole: string;
  userType: string;
};

type PendingSignup = {
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
};

const DEFAULT_COMPANY_NAME = "My Company";

async function findUserByEmail(
  supabase: Supabase,
  email: string
): Promise<MaterializedAccount | null> {
  const { data } = await supabase
    .from("users")
    .select("id, email, username, role, company_id, company_role, user_type")
    .eq("email", email)
    .maybeSingle();
  if (!data?.company_id) return null;
  return {
    userId: data.id,
    companyId: data.company_id,
    email: data.email,
    username: data.username,
    role: data.role ?? "user",
    companyRole: data.company_role ?? "super_admin",
    userType: data.user_type ?? "internal",
  };
}

// Turn a staged pending signup into a real company + super-admin user. Safe to
// call more than once for the same signup (the checkout success callback and the
// Stripe webhook can both fire): if the account already exists it is returned as
// is. Optionally records the subscription on the company.
export async function materializePendingSignup(
  supabase: Supabase,
  pending: PendingSignup,
  billing?: { subscriptionId?: string | null; customerId?: string | null }
): Promise<MaterializedAccount | null> {
  const email = pending.email;

  // Already created (idempotent / race with the other completion path).
  const existing = await findUserByEmail(supabase, email);
  if (existing) {
    await applyBilling(supabase, existing.companyId, billing);
    return existing;
  }

  // Create the company first (the user row references it).
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({ name: DEFAULT_COMPANY_NAME })
    .select("id")
    .single();
  if (companyError || !company) {
    console.error("materializePendingSignup: company insert failed", companyError);
    return null;
  }
  const companyId = company.id as string;

  const displayName = `${pending.first_name} ${pending.last_name}`;
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      username: displayName,
      first_name: pending.first_name,
      last_name: pending.last_name,
      email,
      password_hash: pending.password_hash,
      company: DEFAULT_COMPANY_NAME,
      role: "user",
      company_id: companyId,
      company_role: "super_admin",
      user_type: "internal",
    })
    .select("id")
    .single();

  if (userError || !user) {
    // Most likely a unique-email violation from a concurrent completion path.
    // Clean up the orphan company we just made and return the winner's account.
    await supabase.from("companies").delete().eq("id", companyId);
    const winner = await findUserByEmail(supabase, email);
    if (winner) {
      await applyBilling(supabase, winner.companyId, billing);
      return winner;
    }
    console.error("materializePendingSignup: user insert failed", userError);
    return null;
  }

  const userId = user.id as string;

  await supabase
    .from("companies")
    .update({ billing_owner_id: userId })
    .eq("id", companyId);

  await supabase.from("org_members").insert({
    user_id: userId,
    org_id: companyId,
    role: "super_admin",
  });

  await applyBilling(supabase, companyId, billing);

  return {
    userId,
    companyId,
    email,
    username: displayName,
    role: "user",
    companyRole: "super_admin",
    userType: "internal",
  };
}

async function applyBilling(
  supabase: Supabase,
  companyId: string,
  billing?: { subscriptionId?: string | null; customerId?: string | null }
) {
  if (!billing?.subscriptionId) return;
  const update: Record<string, string> = {
    stripe_subscription_id: billing.subscriptionId,
    subscription_status: "trialing",
  };
  if (billing.customerId) update.stripe_customer_id = billing.customerId;
  await supabase.from("companies").update(update).eq("id", companyId);
}
