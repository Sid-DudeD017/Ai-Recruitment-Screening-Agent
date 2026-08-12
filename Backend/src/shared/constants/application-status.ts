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
  APPLIED: ["SCREENING", "PENDING_REVIEW", "REJECTED"],
  SCREENING: ["PENDING_REVIEW", "SHORTLISTED", "REJECTED"],
  PENDING_REVIEW: ["SHORTLISTED", "INTERVIEW", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["OFFERED", "REJECTED"],
  OFFERED: ["HIRED", "REJECTED"],
  // Terminal states — no transitions
  HIRED: [],
  REJECTED: [],
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
