import express from "express";
import "express-async-errors";
import { searchRouter } from "./routes/routes";
import cookieSession from "cookie-session";

import cors from "cors";

import { NotFoundError } from "@fixserv-colauncha/shared";
import { errorHandler } from "@fixserv-colauncha/shared";

const app = express();

app.set("trust proxy", true);

app.use(cors());

app.use(express.json());

app.use(
  cookieSession({
    signed: false,
    secure: false,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  })
);

app.use("/api/search", searchRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);
export default app;
