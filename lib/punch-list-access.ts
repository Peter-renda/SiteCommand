type PunchListAccessItem = {
  private: boolean | null;
  created_by: string | null;
  punch_item_manager_id: string | null;
  final_approver_id: string | null;
  assignees: unknown;
};

function getAssigneeIds(assignees: unknown): string[] {
  if (!Array.isArray(assignees)) return [];

  return assignees
    .map((assignee) => {
      if (typeof assignee === "string") return assignee;
      if (
        assignee &&
        typeof assignee === "object" &&
        "id" in assignee &&
        typeof (assignee as { id?: unknown }).id === "string"
      ) {
        return (assignee as { id: string }).id;
      }
      return null;
    })
    .filter((id): id is string => Boolean(id));
}

export function canViewPunchListItem(item: PunchListAccessItem, userId: string): boolean {
  if (!item.private) return true;

  const allowedUserIds = new Set([
    item.created_by,
    item.punch_item_manager_id,
    item.final_approver_id,
    ...getAssigneeIds(item.assignees),
  ].filter((id): id is string => Boolean(id)));

  return allowedUserIds.has(userId);
}
