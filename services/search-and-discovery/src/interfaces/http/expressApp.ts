import express from "express";
import "express-async-errors";
import { searchRouter } from "./routes/routes";
import cookieSession from "cookie-session";

import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";

import { NotFoundError } from "@fixserv-colauncha/shared";
import { errorHandler } from "@fixserv-colauncha/shared";
import rootRouter from "./routes/rootRoutes";

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

app.use("/", rootRouter);
app.use("/api/search", searchRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);
export default app;
