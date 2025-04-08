import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { CustomError } from "../../errors/customError";
export class ErrorHandler {
  constructor() {}

  public static errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): ErrorRequestHandler | any {
    if (err instanceof CustomError) {
      return res.status(err.statusCode).send({ errors: err.errorFormat });
    }

    res.status(400).send({
      errors: [{ message: "Something went wrong" }],
    });
  }
}
