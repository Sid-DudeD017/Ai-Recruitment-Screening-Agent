export const Roles = {
  ADMIN: "ADMIN",
  RECRUITER: "RECRUITER",
  HIRING_MANAGER: "HIRING_MANAGER",
  CANDIDATE: "CANDIDATE",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];
