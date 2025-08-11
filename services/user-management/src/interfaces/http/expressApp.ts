import express from "express";
import "express-async-errors";
import { userRouter } from "./routes/userRoutes";
import { adminRouter } from "./routes/authRoutes";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";

import { NotFoundError } from "@fixserv-colauncha/shared";
import { errorHandler } from "@fixserv-colauncha/shared";
import morgan from "morgan";
import helmet from "helmet";
import rootRouter from "./routes/rootRoutes";
import { uploadRouter } from "./routes/uploadRoute";

const app = express();

app.set("trust proxy", true);

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(mongoSanitize());

app.use(morgan("dev"));

app.use("/user", rootRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/upload", uploadRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);
export default app;
