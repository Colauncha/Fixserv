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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewEventsHandler = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
const userRepositoryImpl_1 = require("../../infrastructure/persistence/userRepositoryImpl");
const reviewProcessedEvent_1 = require("../reviewProcessedEvent");
class ReviewEventsHandler {
    constructor() {
        this.userRepository = new userRepositoryImpl_1.UserRepositoryImpl();
        this.eventBus = new shared_1.RedisEventBus(process.env.REDIS_URL);
        this.subscriptions = [];
    }
    setupSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            const sub = yield this.eventBus.subscribe("review_events", (event) => __awaiter(this, void 0, void 0, function* () {
                if (event.eventName === "ReviewCreated") {
                    yield this.handleReviewCreated(event);
                }
            }));
            console.log("UserManagement subscribed to review_events");
            return sub.unsubscribe;
        });
    }
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
            this.subscriptions = [];
        });
    }
    handleReviewCreated(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("UserManagement received ReviewCreated:", event.payload.reviewId);
                // const newRating = await this.ratingCalculator.calculateAverage(
                // event.payload.artisanId
                // );
                //update artisan rating
                yield this.userRepository.updateRating(event.payload.artisanId, event.payload.artisanRating);
                yield this.eventBus.publish("review_ack_events", new reviewProcessedEvent_1.ReviewProcessedEvent({
                    reviewId: event.payload.reviewId,
                    success: true,
                    artisanId: event.payload.artisanId,
                    newArtisanRating: event.payload.artisanRating,
                }));
            }
            catch (error) {
                console.error("Failed to update artisan rating:", error);
                yield this.eventBus.publish("review_ack_events", new reviewProcessedEvent_1.ReviewProcessedEvent({
                    reviewId: event.payload.reviewId,
                    success: false,
                    error: error.message,
                }));
            }
        });
    }
    handleArtisanRated(event) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Artisan ${event.payload.artisanId} received new rating: ${event.payload.newRating}`);
        });
    }
}
exports.ReviewEventsHandler = ReviewEventsHandler;
