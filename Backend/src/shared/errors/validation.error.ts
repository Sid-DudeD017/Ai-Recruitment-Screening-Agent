import { AppError } from "./app-error";
import { ZodError } from "zod";

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(zodError: ZodError) {
    const formattedErrors: Record<string, string[]> = {};

    for (const issue of zodError.issues) {
      const path = issue.path.join(".") || "_root";
      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }
      formattedErrors[path].push(issue.message);
    }

    super("Validation failed", 400, "VALIDATION_ERROR");
    this.errors = formattedErrors;
  }
}
