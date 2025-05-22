import express from "express";
import "express-async-errors";
import cors from "cors";

import cookieSession from "cookie-session";

import { NotFoundError } from "@fixserv-colauncha/shared";
import { errorHandler } from "@fixserv-colauncha/shared";
import { reviewRouter } from "./routes/reviewRoute";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["https://user-management-4ec8bc3-dirty.onrender.com"],
    credentials: true,
  })
);

app.use(
  cookieSession({
    signed: false,
    secure: true,
    sameSite: "none",
    domain: ".onrender.com",
    maxAge: 24 * 60 * 60 * 1000,
  })
);

app.set("trust proxy", true);

app.use("/api/reviews", reviewRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export default app;
