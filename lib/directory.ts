import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Adds a user to the project directory if they aren't already there.
 * Skips silently if the user's email already exists in the project's directory.
 */
export async function addUserToDirectory(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
) {
  const { data: user } = await supabase
    .from("users")
    .select("first_name, last_name, email")
    .eq("id", userId)
    .single();

  if (!user?.email) return;

  // Check for existing entry by email to avoid duplicates
  const { data: existing } = await supabase
    .from("directory_contacts")
    .select("id")
    .eq("project_id", projectId)
    .eq("email", user.email)
    .maybeSingle();

  if (existing) return;

  await supabase.from("directory_contacts").insert({
    project_id: projectId,
    type: "user",
    first_name: user.first_name || null,
    last_name: user.last_name || null,
    email: user.email,
    permission: "Company Employee",
  });
}
