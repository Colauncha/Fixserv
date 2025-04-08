import { ValidationError } from "express-validator";
import { CustomError } from "./customError";

export class RequestValidationError extends CustomError {
  statusCode = 400;
  constructor(public errors: ValidationError[]) {
    super("Invalid request parameters");

    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }

  errorFormat(): { message: string; field?: string }[] {
    return this.errors.map((error) => {
      return {
        message: error.msg,
        field: "path" in error ? error.path : undefined,
      };
    });
  }
}
