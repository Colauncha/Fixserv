import express from "express";
import "express-async-errors";
import cors from "cors";

import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";

import { NotFoundError, isDBReady } from "@fixserv-colauncha/shared";
import { errorHandler } from "@fixserv-colauncha/shared";
import { orderRouter } from "./routes/orderRoute";
import { baseOrderRouter } from "./routes/baseOrderRoute";
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

// const requireDB = (
//   req: express.Request,
//   res: express.Response,
//   next: express.NextFunction
// ): any => {
//   if (!isDBReady()) {
//     return res.status(503).json({
//       error: "Database not available",
//       message:
//         "Service is starting up or database connection is unavailable. Please try again in a moment.",
//     });
//   }
//   next();
// };

app.use("/order", rootRouter);
app.use("/api/orders", orderRouter);
app.use("/api/baseOrders", baseOrderRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export default app;
