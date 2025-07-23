import express from "express";
import "express-async-errors";
import { userRouter } from "./routes/userRoutes";
import { adminRouter } from "./routes/authRoutes";
import cookieSession from "cookie-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";

import { NotFoundError } from "@fixserv-colauncha/shared";
import { errorHandler } from "@fixserv-colauncha/shared";
import morgan from "morgan";
import helmet from "helmet";
import rootRouter from "./routes/rootRoutes";

const app = express();

app.set("trust proxy", true);

/*
const allowedOrigins = [
  "http://localhost:3000", // frontend developer's local dev server
  "https://user-management-4ec8bc3-dirty.onrender.com", // your deployed frontend (if applicable)
];

app.use(cors({
//origin params:string|undefined callback:any
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman) or from allowedOrigins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
*/

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

//app.use(
//  cookieSession({
//    signed: false,
//    secure: false,
//    sameSite: "none",
//    maxAge: 24 * 60 * 60 * 1000,
//  })
//);

app.use(morgan("dev"));

app.use("/", rootRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);
export default app;
