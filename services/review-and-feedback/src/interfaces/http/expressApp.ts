import express from "express";
import "express-async-errors";

import cookieSession from "cookie-session";

import { NotFoundError } from "@fixserv-colauncha/shared";
import { errorHandler } from "@fixserv-colauncha/shared";
import { reviewRouter } from "./routes/reviewRoute";

const app = express();

app.use(express.json());

app.use(
  cookieSession({
    signed: false,
    secure: false,
  })
);

app.use("/api/reviews", reviewRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export default app;
