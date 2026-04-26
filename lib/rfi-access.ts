import { getSupabase } from "@/lib/supabase";

type Session = {
  id: string;
  email?: string;
};

type TaggedContact = { id?: string | null; email?: string | null };

export type RfiTagFlags = {
  isAssignee: boolean;
  isOnDistribution: boolean;
  isManager: boolean;
  isReceivedFrom: boolean;
  isTagged: boolean;
};

/**
 * Returns the directory_contacts ids for the given project that map to
 * the current user — either by id match (rare) or by email match. The
 * list always includes the user's own session id so callers can do a
 * single membership test against rfi.assignees / distribution_list /
 * rfi_manager_id / received_from_id (which all reference contact ids).
 */
export async function getUserContactIds(
  projectId: string,
  session: Session
): Promise<string[]> {
  const supabase = getSupabase();
  const ids = new Set<string>([session.id]);

  const normalizedEmail = (session.email ?? "").trim().toLowerCase();
  const { data: contacts } = await supabase
    .from("directory_contacts")
    .select("id, email")
    .eq("project_id", projectId);

  for (const c of (contacts ?? []) as { id: string; email: string | null }[]) {
    if (c.id === session.id) ids.add(c.id);
    if (
      normalizedEmail &&
      c.email &&
      c.email.trim().toLowerCase() === normalizedEmail
    ) {
      ids.add(c.id);
    }
  }

  return [...ids];
}

/**
 * Returns true if the user is tagged on at least one RFI in the project
 * (assignee, distribution list, RFI manager, or received-from contact).
 * Used as a fallback project-access path so collaborators tagged on an
 * RFI can still navigate to /rfis even without a project_memberships row.
 */
export async function userIsTaggedOnAnyProjectRfi(
  projectId: string,
  session: Session
): Promise<boolean> {
  const supabase = getSupabase();
  const { data: rfis } = await supabase
    .from("rfis")
    .select("assignees, distribution_list, rfi_manager_id, received_from_id")
    .eq("project_id", projectId);
  if (!rfis || rfis.length === 0) return false;
  const contactIds = await getUserContactIds(projectId, session);
  return rfis.some((rfi) => isUserTaggedOnRfi(rfi, contactIds).isTagged);
}

export function isUserTaggedOnRfi(
  rfi: {
    assignees?: unknown;
    distribution_list?: unknown;
    rfi_manager_id?: string | null;
    received_from_id?: string | null;
  },
  contactIds: string[]
): RfiTagFlags {
  const ids = new Set(contactIds);
  const assignees = Array.isArray(rfi.assignees) ? (rfi.assignees as TaggedContact[]) : [];
  const distribution = Array.isArray(rfi.distribution_list)
    ? (rfi.distribution_list as TaggedContact[])
    : [];
  const isAssignee = assignees.some((a) => a?.id && ids.has(a.id));
  const isOnDistribution = distribution.some((a) => a?.id && ids.has(a.id));
  const isManager = !!rfi.rfi_manager_id && ids.has(rfi.rfi_manager_id);
  const isReceivedFrom = !!rfi.received_from_id && ids.has(rfi.received_from_id);
  return {
    isAssignee,
    isOnDistribution,
    isManager,
    isReceivedFrom,
    isTagged: isAssignee || isOnDistribution || isManager || isReceivedFrom,
  };
}
