import { CustomError } from "./customError";

export class DatabaseConnectionError extends CustomError {
  statusCode = 404;
  reason = "Error connecting to database";
  constructor() {
    super("Error connecting to database");
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }
  errorFormat(): { message: string; field?: string }[] {
    return [{ message: this.reason }];
  }
}
