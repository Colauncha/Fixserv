import express from "express";
import "express-async-errors";
import cors from "cors";
import cookieParser from "cookie-parser";
import { NotFoundError } from "@fixserv-colauncha/shared";
import { errorHandler } from "@fixserv-colauncha/shared";
import { serviceRouter } from "./routes/serviceRoute";
import morgan from "morgan";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rootRouter from "./routes/rootRoutes";
import { adminServiceRoutes } from "./routes/adminServiceRoutes";
import { artisanServiceRoutes } from "./routes/artisanServiceRoutes";

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

app.use("/service", rootRouter);
app.use("/api/service", serviceRouter);
app.use("/api/service/admin", adminServiceRoutes);
app.use("/api/service/artisan", artisanServiceRoutes);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export default app;
