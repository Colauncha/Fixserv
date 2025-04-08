import express, { Request, Response } from "express";
import "express-async-errors";
import { userRouter } from "./routes/userRoutes";
import { adminRouter } from "./routes/authRoutes";
import cookieSession from "cookie-session";
import { ErrorHandler } from "../middlewares/errorHandler";
import { NotFoundError } from "../../errors/notFoundError";

const app = express();

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

app.use(ErrorHandler.errorHandler);
export default app;
