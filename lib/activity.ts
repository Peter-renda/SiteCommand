import { SupabaseClient } from "@supabase/supabase-js";

export async function logActivity(
  supabase: SupabaseClient,
  {
    projectId,
    userId,
    type,
    description,
  }: {
    projectId: string;
    userId: string;
    type: string;
    description: string;
  }
) {
  await supabase.from("activity_log").insert({ project_id: projectId, user_id: userId, type, description });
}
