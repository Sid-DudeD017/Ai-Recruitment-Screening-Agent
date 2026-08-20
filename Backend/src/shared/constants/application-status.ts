export const ApplicationStatus = {
  APPLIED: "APPLIED",
  SCREENING: "SCREENING",
  PENDING_REVIEW: "PENDING_REVIEW",
  SHORTLISTED: "SHORTLISTED",
  INTERVIEW: "INTERVIEW",
  OFFERED: "OFFERED",
  HIRED: "HIRED",
  REJECTED: "REJECTED",
} as const;

export type ApplicationStatusType =
  (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

/**
 * Valid forward transitions. REJECTED can be reached from any non-terminal state.
 */
export const VALID_TRANSITIONS: Record<string, string[]> = {
  APPLIED: ["SCREENING", "PENDING_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"],
  SCREENING: ["APPLIED", "PENDING_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"],
  PENDING_REVIEW: ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"],
  SHORTLISTED: ["APPLIED", "SCREENING", "PENDING_REVIEW", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"],
  INTERVIEW: ["APPLIED", "SCREENING", "PENDING_REVIEW", "SHORTLISTED", "OFFERED", "HIRED", "REJECTED"],
  OFFERED: ["APPLIED", "SCREENING", "PENDING_REVIEW", "SHORTLISTED", "INTERVIEW", "HIRED", "REJECTED"],
  // Terminal states — allow undoing mistakes by dragging back
  HIRED: ["PENDING_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED"],
  REJECTED: ["PENDING_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED"],
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
