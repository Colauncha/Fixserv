import express from "express";
import "express-async-errors";
import { userRouter } from "./routes/userRoutes";
import { adminRouter } from "./routes/authRoutes";
import cookieSession from "cookie-session";
import cookieParser from "cookie-parser";
import cors from "cors";

import { NotFoundError } from "@fixserv-colauncha/shared";
import { errorHandler } from "@fixserv-colauncha/shared";

const app = express();

app.set("trust proxy", true);

app.use(
  cors({
    origin: [
      "https://service-management-4ec8bc3-dirty.onrender.com",
      "https://review-and-feedback-4ec8bc3-dirty.onrender.com",
    ],
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

app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);
export default app;
