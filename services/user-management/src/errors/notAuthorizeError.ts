import { CustomError } from "./customError";

export class NotAuthorizeError extends CustomError {
  statusCode = 401;

  constructor() {
    super("Not Authorized");

    Object.setPrototypeOf(this, NotAuthorizeError.prototype);
  }
  errorFormat(): { message: string; field?: string }[] {
    return [{ message: "Not Authorized" }];
  }
}
