export function normalizeStatus(status: string): string {
  const s = status.toUpperCase().trim();
  if (s === "OFFER") return "OFFERED";
  if (s === "HIRE") return "HIRED";
  if (s === "REJECT") return "REJECTED";
  if (s === "SHORTLIST") return "SHORTLISTED";
  if (s === "SCREEN") return "SCREENING";
  if (s === "PENDING REVIEW" || s === "REVIEW") return "PENDING_REVIEW";
  return s;
}
