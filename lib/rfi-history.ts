import { SupabaseClient } from "@supabase/supabase-js";

type SessionLike = {
  id: string;
  username: string;
  company_id: string | null;
};

export async function logRFIChange(
  supabase: SupabaseClient,
  session: SessionLike,
  rfiId: string,
  projectId: string,
  action: string,
  fromValue: string | null,
  toValue: string | null,
) {
  try {
    const [userRes, companyRes] = await Promise.all([
      supabase.from("users").select("first_name, last_name, username").eq("id", session.id).single(),
      session.company_id
        ? supabase.from("companies").select("name").eq("id", session.company_id).single()
        : Promise.resolve({ data: null }),
    ]);

    const u = userRes.data;
    const changedByName = u
      ? ([u.first_name, u.last_name].filter(Boolean).join(" ") || u.username)
      : session.username;
    const changedByCompany = (companyRes.data as { name?: string } | null)?.name ?? null;

    await supabase.from("rfi_change_history").insert({
      rfi_id: rfiId,
      project_id: projectId,
      changed_by: session.id,
      changed_by_name: changedByName,
      changed_by_company: changedByCompany,
      action,
      from_value: fromValue,
      to_value: toValue,
    });
  } catch {
    // History logging should never block the main operation
  }
}
