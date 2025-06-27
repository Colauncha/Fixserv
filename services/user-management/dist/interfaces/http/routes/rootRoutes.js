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
const shared_1 = require("@fixserv-colauncha/shared");
const rootRouter = express_1.default.Router();
rootRouter.get("/", (req, res) => {
    res.status(200).send({
        message: "Welcome to the User Management Service",
        version: "1.0.0",
    });
});
rootRouter.get("/health", (req, res) => {
    res.status(200).send({
        status: "UP",
        timestamp: new Date().toISOString(),
    });
});
rootRouter.get("/debug-cache/:email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const key = `user:email:${req.params.email}`;
    const raw = yield shared_1.redis.get(key);
    res.json({ key, raw: JSON.parse(raw || "{}") });
}));
exports.default = rootRouter;
