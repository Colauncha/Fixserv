import express, { Request, Response, NextFunction } from "express";
import "express-async-errors";
import multer from "multer";
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
import { categoryRouter } from "./routes/categoryRoutes";
import { certificateRouter } from "./routes/certificateRoute";
import expressListEndpoints from "express-list-endpoints";
import { trackActivity } from "../middlewares/trackActivity";

const app = express();

app.set("trust proxy", true);

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use(mongoSanitize());

app.use(morgan("dev"));

app.use("/user", rootRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/category", categoryRouter);
app.use("/api/certificate", certificateRouter);

//app.get("/api/endpoints", (req, res) //=> {
//  const endpoints = //expressListEndpoints(app);
//  res.json({ endpoints });
//});

// Track activity on all authenticated routes
app.use(trackActivity);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        errors: [
          {
            message:
              "File is too large. Maximum size is 5MB for images and 10MB for PDFs",
          },
        ],
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        errors: [{ message: "Too many files. Maximum 5 files allowed" }],
      });
    }
    return res.status(400).json({
      errors: [{ message: err.message }],
    });
  }

  // File type error from fileFilter
  if (err.message?.includes("Only")) {
    return res.status(400).json({
      errors: [{ message: err.message }],
    });
  }

  next(err);
});

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);
export default app;
