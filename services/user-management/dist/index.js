"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const expressApp_1 = __importDefault(require("./interfaces/http/expressApp"));
const shared_1 = require("@fixserv-colauncha/shared");
const serviceEventHandler_1 = require("./events/handlers/serviceEventHandler");
const reviewEventHandler_1 = require("./events/handlers/reviewEventHandler");
if (!process.env.JWT_KEY) {
    throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
    throw new Error("MongoDb connection string must be available");
}
(0, shared_1.connectDB)()
    .then(() => {
    expressApp_1.default.listen(4000, () => {
        console.log("user-management is running on port 4000");
    });
})
    .catch((error) => {
    console.error("Failed to conect to database", error);
});
const eventsHandler = new serviceEventHandler_1.ServiceEventsHandler();
const reviewEventHandler = new reviewEventHandler_1.ReviewEventsHandler();
eventsHandler.setupSubscriptions().catch(console.error);
reviewEventHandler.setupSubscriptions().catch(console.error);
