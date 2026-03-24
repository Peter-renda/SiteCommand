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

  // Use the project's owning company, not the user's primary company_id.
  // A user can belong to multiple companies (via org_members), so we must
  // show the company that owns this specific project as the directory context.
  let companyName: string | null = null;
  const { data: project } = await supabase
    .from("projects")
    .select("company_id")
    .eq("id", projectId)
    .single();

  if (project?.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", project.company_id)
      .single();
    companyName = company?.name ?? null;
  }

  if (existing) {
    // Update the company in case it was previously stored incorrectly
    // (e.g. user was a member of a different company at insertion time)
    await supabase
      .from("directory_contacts")
      .update({ company: companyName })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("directory_contacts").insert({
    project_id: projectId,
    type: "user",
    first_name: user.first_name || null,
    last_name: user.last_name || null,
    email: user.email,
    permission: "Company Employee",
    company: companyName,
  });
}
