"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rootRouter = express_1.default.Router();
rootRouter.get("/", (req, res) => {
    res.status(200).send({
        message: "Welcome to the Service Management Service",
        version: "1.0.0",
    });
});
rootRouter.get("/health", (req, res) => {
    res.status(200).send({
        status: "UP",
        timestamp: new Date().toISOString(),
    });
});
exports.default = rootRouter;
