"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const expressApp_1 = __importDefault(require("./interfaces/http/expressApp"));
const shared_1 = require("@fixserv-colauncha/shared");
const reviewEventHandler_1 = require("./events/handlers/reviewEventHandler");
const ratingCalculator_1 = require("./domain/services/ratingCalculator");
const review_and_feedbackRepositoryImpls_1 = require("./infrastructure/review-and-feedbackRepositoryImpls");
const userManagementClient_1 = require("./infrastructure/clients/userManagementClient");
const axiosClient_1 = require("./interfaces/http/axiosClient");
const serviceManagementClient_1 = require("./infrastructure/clients/serviceManagementClient");
if (!process.env.JWT_KEY) {
    throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
    throw new Error("MongoDb connection string must be available");
}
const userManagementClient = new userManagementClient_1.UserManagementClient((0, axiosClient_1.createAxiosClient)(process.env.USER_MANAGEMENT_URL));
const serviceManagementClient = new serviceManagementClient_1.ServiceManagementClient((0, axiosClient_1.createAxiosClient)(process.env.SERVICE_MANAGEMENT_URL));
const reviewRepo = new review_and_feedbackRepositoryImpls_1.reviewAndFeedbackRepositoryImpls();
const ratingCalculator = new ratingCalculator_1.RatingCalculator(reviewRepo);
(0, shared_1.connectDB)()
    .then(() => {
    expressApp_1.default.listen(4002, () => {
        console.log("review-service is running on port 4002");
    });
})
    .catch((error) => {
    console.error("Failed to conect to database", error);
});
const reviewEventsHandler = new reviewEventHandler_1.ReviewEventsHandler(ratingCalculator, userManagementClient, serviceManagementClient);
reviewEventsHandler.setupSubscriptions().catch(console.error);
