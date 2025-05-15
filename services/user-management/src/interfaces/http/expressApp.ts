import express from "express";
import "express-async-errors";
import { userRouter } from "./routes/userRoutes";
import { adminRouter } from "./routes/authRoutes";
import cookieSession from "cookie-session";
import cors from "cors";

import { NotFoundError } from "@fixserv-colauncha/shared";
import { errorHandler } from "@fixserv-colauncha/shared";

const app = express();

app.use(cors())

app.use(express.json());

app.use(
  cookieSession({
    signed: false,
    secure: false,
  })
);

app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);
export default app;
