import express from "express";
import "express-async-errors";
import cors from "cors";
import cookieParser from "cookie-parser";

import cookieSession from "cookie-session";

import { AuthMiddleware, NotFoundError } from "@fixserv-colauncha/shared";
import { errorHandler } from "@fixserv-colauncha/shared";
import { serviceRouter } from "./routes/serviceRoute";

const app = express();

app.set("trust proxy", true);

app.use(
  cors({
    origin: "https://user-management-4ec8bc3-dirty.onrender.com",

    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  cookieSession({
    signed: false,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  })
);

app.use("/api/service", serviceRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export default app;
