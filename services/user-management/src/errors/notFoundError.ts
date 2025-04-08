import { CustomError } from "./customError";

export class NotFoundError extends CustomError {
  statusCode = 404;
  constructor() {
    super("Not found");
  }
  errorFormat(): { message: string; field?: string }[] {
    return [{ message: "Not found" }];
  }
}
