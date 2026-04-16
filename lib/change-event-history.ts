import { SupabaseClient } from "@supabase/supabase-js";

type SessionLike = {
  id: string;
  username: string;
  company_id: string | null;
};

export async function logChangeEventHistory(
  supabase: SupabaseClient,
  session: SessionLike,
  changeEventId: string,
  projectId: string,
  action: string,
  fromValue: string | null,
  toValue: string | null
) {
  try {
    const [userRes, companyRes] = await Promise.all([
      supabase.from("users").select("first_name, last_name, username").eq("id", session.id).single(),
      session.company_id
        ? supabase.from("companies").select("name").eq("id", session.company_id).single()
        : Promise.resolve({ data: null }),
    ]);

    const user = userRes.data;
    const changedByName = user
      ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username
      : session.username;
    const changedByCompany = (companyRes.data as { name?: string } | null)?.name ?? null;

    await supabase.from("change_event_change_history").insert({
      change_event_id: changeEventId,
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
