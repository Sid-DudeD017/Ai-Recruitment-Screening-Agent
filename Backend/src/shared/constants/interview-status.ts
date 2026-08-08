export const InterviewStatus = {
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type InterviewStatusType =
  (typeof InterviewStatus)[keyof typeof InterviewStatus];

export const InterviewType = {
  PHONE: "PHONE",
  VIDEO: "VIDEO",
  ONSITE: "ONSITE",
  TECHNICAL: "TECHNICAL",
} as const;

export type InterviewTypeValue =
  (typeof InterviewType)[keyof typeof InterviewType];
