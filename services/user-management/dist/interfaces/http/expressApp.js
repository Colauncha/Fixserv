"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const userRoutes_1 = require("./routes/userRoutes");
const authRoutes_1 = require("./routes/authRoutes");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const shared_1 = require("@fixserv-colauncha/shared");
const shared_2 = require("@fixserv-colauncha/shared");
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const rootRoutes_1 = __importDefault(require("./routes/rootRoutes"));
const app = (0, express_1.default)();
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
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, express_mongo_sanitize_1.default)());
//app.use(
//  cookieSession({
//    signed: false,
//    secure: false,
//    sameSite: "none",
//    maxAge: 24 * 60 * 60 * 1000,
//  })
//);
app.use((0, morgan_1.default)("dev"));
app.use("/", rootRoutes_1.default);
app.use("/api/users", userRoutes_1.userRouter);
app.use("/api/admin", authRoutes_1.adminRouter);
app.all("*", () => __awaiter(void 0, void 0, void 0, function* () {
    throw new shared_1.NotFoundError();
}));
app.use(shared_2.errorHandler);
exports.default = app;
