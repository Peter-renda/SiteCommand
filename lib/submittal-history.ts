import { SupabaseClient } from "@supabase/supabase-js";

type SessionLike = {
  id: string;
  username: string;
  company_id: string | null;
};

const SKIP_KEYS = new Set([
  "id",
  "project_id",
  "created_at",
  "created_by",
  "updated_at",
]);

function toComparable(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function formatValue(value: unknown): string | null {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value || null;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return JSON.stringify(value);
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

    await supabase.from("submittal_change_history").insert({
      submittal_id: submittalId,
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

export async function logSubmittalDiff(
  supabase: SupabaseClient,
  session: SessionLike,
  submittalId: string,
  projectId: string,
  previous: Record<string, unknown> | null,
  next: Record<string, unknown>,
) {
  const prev = previous ?? {};
  const changes = Object.keys(next)
    .filter((key) => !SKIP_KEYS.has(key))
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
