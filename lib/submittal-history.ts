import { SupabaseClient } from "@supabase/supabase-js";

type SessionLike = {
  id: string;
  username: string;
  company_id: string | null;
};

const TRACKED_FIELDS = [
  "submittal_number",
  "title",
  "revision",
  "specification_id",
  "submittal_type",
  "status",
  "responsible_contractor_id",
  "received_from_id",
  "submittal_manager_id",
  "approver_name_id",
  "submit_by",
  "received_date",
  "issue_date",
  "final_due_date",
  "cost_code",
  "linked_drawings",
  "distribution_list",
  "ball_in_court_id",
  "lead_time",
  "design_team_review_time",
  "internal_review_time",
  "required_on_site_date",
  "planned_return_date",
  "planned_internal_review_completed_date",
  "planned_submit_by_date",
  "submitter_due_date",
  "approver_due_date",
  "private",
  "description",
  "attachments",
  "owners_manual",
  "package_notes",
  "confirmed_delivery_date",
  "actual_delivery_date",
  "workflow_steps",
  "related_items",
  "closed_at",
  "closed_by",
  "distributed_at",
  "distributed_by",
] as const;

function toComparable(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function formatValue(value: unknown): string | null {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value || null;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    if (value.every((item) => typeof item === "object" && item !== null && "name" in (item as Record<string, unknown>))) {
      return value
        .map((item) => (item as { name?: string }).name?.trim() || JSON.stringify(item))
        .join(", ");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function humanizeField(key: string): string {
  return key
    .replace(/_id$/i, "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function logSubmittalChange(
  supabase: SupabaseClient,
  session: SessionLike,
  submittalId: string,
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

    const user = userRes.data;
    const changedByName = user
      ? ([user.first_name, user.last_name].filter(Boolean).join(" ") || user.username)
      : session.username;
    const changedByCompany = (companyRes.data as { name?: string } | null)?.name ?? null;

    const payload = {
      submittal_id: submittalId,
      project_id: projectId,
      changed_by: session.id,
      changed_by_name: changedByName,
      changed_by_company: changedByCompany,
      action,
      from_value: fromValue,
      to_value: toValue,
    };

    const { error: insertError } = await supabase.from("submittal_change_history").insert(payload);
    if (insertError) {
      const { error: fallbackError } = await supabase.from("submittal_change_history").insert({
        ...payload,
        changed_by: null,
      });
      if (fallbackError) throw fallbackError;
    }
  } catch (error) {
    // History logging should never block the main operation
    console.error("Failed to write submittal change history", { submittalId, projectId, action, error });
  }
}

export async function logSubmittalDiff(
  supabase: SupabaseClient,
  session: SessionLike,
  submittalId: string,
  projectId: string,
  previous: Record<string, unknown> | null,
  next: Record<string, unknown>,
) {
  const prev = previous ?? {};
  const changes = TRACKED_FIELDS
    .filter((key) => key in next)
    .filter((key) => toComparable(prev[key]) !== toComparable(next[key]))
    .map((key) => ({
      action: humanizeField(key),
      fromValue: formatValue(prev[key]),
      toValue: formatValue(next[key]),
    }));

  await Promise.all(
    changes.map((change) =>
      logSubmittalChange(
        supabase,
        session,
        submittalId,
        projectId,
        change.action,
        change.fromValue,
        change.toValue,
      )
    )
  );
}
