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
exports.ReviewEventHandler = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
const serviceRepositoryImpl_1 = require("../../infrastructure/serviceRepositoryImpl");
const reviewProcessedEvent_1 = require("../reviewProcessedEvent");
class ReviewEventHandler {
    constructor() {
        this.serviceRepository = new serviceRepositoryImpl_1.ServiceRepositoryImpl();
        this.eventBus = new shared_1.RedisEventBus(process.env.REDIS_URL);
    }
    setupSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            const sub = yield this.eventBus.subscribe("review_events", (event) => __awaiter(this, void 0, void 0, function* () {
                if (event.eventName === "ReviewCreated") {
                    yield this.handleReviewCreated(event);
                }
            }));
            console.log("ServiceManagement subscribed to review_events");
            return sub.unsubscribe;
        });
    }
    handleReviewCreated(event) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("ServiceManagement received ReviewCreated:", event.payload.reviewId);
            try {
                //   // Verify the review exists in review service
                //   const reviewExists = await this.verifyReviewExists(
                //     event.payload.reviewId
                //   );
                //   if (!reviewExists) {
                //     throw new Error(`Review ${event.payload.reviewId} not found`);
                //   }
                // Update service rating
                yield this.serviceRepository.updateRating(event.payload.serviceId, event.payload.serviceRating);
                // Send ACK
                yield this.eventBus.publish("review_ack_events", new reviewProcessedEvent_1.ReviewProcessedEvent({
                    reviewId: event.payload.reviewId,
                    success: true,
                    serviceId: event.payload.serviceId,
                    newServiceRating: event.payload.serviceRating,
                }));
            }
            catch (error) {
                console.error("Failed to update service rating:", error);
                yield this.eventBus.publish("review_ack_events", new reviewProcessedEvent_1.ReviewProcessedEvent({
                    reviewId: event.payload.reviewId,
                    success: false,
                    error: `Service rating update failed: ${error.message}`,
                }));
            }
        });
    }
}
exports.ReviewEventHandler = ReviewEventHandler;
