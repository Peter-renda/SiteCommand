export type SubmittalScheduleInput = {
  required_on_site_date?: string | null;
  lead_time?: number | null;
  design_team_review_time?: number | null;
  internal_review_time?: number | null;
};

type ScheduleDates = {
  planned_return_date: string | null;
  planned_internal_review_completed_date: string | null;
  planned_submit_by_date: string | null;
  submitter_due_date: string | null;
  approver_due_date: string | null;
};

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDateUTC(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function minusDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

export function calculateSubmittalSchedule(input: SubmittalScheduleInput): Partial<ScheduleDates> {
  const requiredOnSite = parseDate(input.required_on_site_date ?? null);
  const leadTime = input.lead_time != null ? Number(input.lead_time) : null;
  const designReview = input.design_team_review_time != null ? Number(input.design_team_review_time) : null;
  const internalReview = input.internal_review_time != null ? Number(input.internal_review_time) : null;

  const plannedReturn = requiredOnSite && leadTime != null ? minusDays(requiredOnSite, leadTime) : null;
  const plannedInternalReviewCompleted = plannedReturn && designReview != null ? minusDays(plannedReturn, designReview) : null;
  const plannedSubmitBy =
    plannedInternalReviewCompleted && internalReview != null
      ? minusDays(plannedInternalReviewCompleted, internalReview)
      : null;

  return {
    planned_return_date: plannedReturn ? formatDateUTC(plannedReturn) : null,
    planned_internal_review_completed_date: plannedInternalReviewCompleted
      ? formatDateUTC(plannedInternalReviewCompleted)
      : null,
    planned_submit_by_date: plannedSubmitBy ? formatDateUTC(plannedSubmitBy) : null,
    // Procore describes these as suggested dates, derived from calculated milestones.
    submitter_due_date: plannedSubmitBy ? formatDateUTC(plannedSubmitBy) : null,
    approver_due_date: plannedInternalReviewCompleted ? formatDateUTC(plannedInternalReviewCompleted) : null,
  };
}
