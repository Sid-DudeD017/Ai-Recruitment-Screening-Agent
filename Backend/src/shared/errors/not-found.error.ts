import { AppError } from "./app-error";

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    const message = id
      ? `${entity} with id '${id}' was not found`
      : `${entity} was not found`;
    super(message, 404, "NOT_FOUND");
  }
}
