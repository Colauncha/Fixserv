import express from "express";
import "express-async-errors";
import cors from "cors";
import morgan from "morgan";
import { NotFoundError } from "@fixserv-colauncha/shared";
import { errorHandler } from "@fixserv-colauncha/shared";
import { reviewRouter } from "./routes/reviewRoute";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
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
app.use("/api/reviews", reviewRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export default app;
