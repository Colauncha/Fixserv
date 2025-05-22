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
const cors_1 = __importDefault(require("cors"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const shared_1 = require("@fixserv-colauncha/shared");
const shared_2 = require("@fixserv-colauncha/shared");
const serviceRoute_1 = require("./routes/serviceRoute");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ["https://user-management-4ec8bc3-dirty.onrender.com"],
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_session_1.default)({
    signed: false,
    secure: true,
    sameSite: "none",
    domain: "onrender.com",
    maxAge: 24 * 60 * 60 * 1000,
}));
app.set("trust proxy", true);
app.use("/api/service", serviceRoute_1.serviceRouter);
app.all("*", () => __awaiter(void 0, void 0, void 0, function* () {
    throw new shared_1.NotFoundError();
}));
app.use(shared_2.errorHandler);
exports.default = app;
