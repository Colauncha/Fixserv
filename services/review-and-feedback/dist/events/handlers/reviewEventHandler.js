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
const shared_2 = require("@fixserv-colauncha/shared");
const artisanRatedEvent_1 = require("../artisanRatedEvent");
const reviewEvents_1 = require("../reviewEvents");
class ReviewEventsHandler {
    constructor(ratingCalculator, userManagementClient, serviceManagementClient, reviewRepository) {
        this.ratingCalculator = ratingCalculator;
        this.userManagementClient = userManagementClient;
        this.serviceManagementClient = serviceManagementClient;
        this.reviewRepository = reviewRepository;
        this.eventBus = new shared_1.RedisEventBus();
        this.subscriptions = [];
    }
    setupSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            const reviewSub = yield this.eventBus.subscribe("review_events", (event) => __awaiter(this, void 0, void 0, function* () {
                if (event.eventName === "ReviewCreated") {
                    yield this.handleReviewCreated(event);
                }
                else if (event.eventName === "ReviewProcessed") {
                    yield this.handleReviewProcessed(event);
                }
            }));
            this.subscriptions.push(reviewSub);
            const ratingSub = yield this.eventBus.subscribe("rating_events", (event) => __awaiter(this, void 0, void 0, function* () {
                if (event.eventName === "ArtisanRated") {
                    yield this.handleArtisanRated(event);
                }
                else if (event.eventName === "serviceRated") {
                    yield this.handleServiceRated(event);
                }
            }));
            this.subscriptions.push(ratingSub);
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
            var _a, _b, _c;
            try {
                // 1. Validate the incoming event
                if (!event.payload.reviewId ||
                    !event.payload.artisanId ||
                    !event.payload.serviceId) {
                    throw new shared_1.BadRequestError("Invalid review created event payload");
                }
                const review = yield ((_a = this.reviewRepository) === null || _a === void 0 ? void 0 : _a.findById(event.payload.reviewId));
                if ((review === null || review === void 0 ? void 0 : review.status) === "published") {
                    console.log(`Review ${review.id} already published - skipping`);
                    return;
                }
                if (!review || review.status === "flagged") {
                    throw new Error(`Review ${event.payload.reviewId} not found`);
                }
                if (event.payload.status !== "published") {
                    throw new Error("Only published reviews can be processed");
                }
                if (review.status !== "processing") {
                    review.markAsProcessing();
                    yield ((_b = this.reviewRepository) === null || _b === void 0 ? void 0 : _b.save(review));
                    console.log(`Marked review ${review.id} as processing`);
                }
                const [artisanAvg, serviceAvg] = yield Promise.all([
                    this.ratingCalculator.calculateAverageArtisanRating(event.payload.artisanId),
                    this.ratingCalculator.calculateAverageServiceRating(event.payload.serviceId),
                ]);
                // Update dependent services
                yield Promise.all([
                    this.userManagementClient.updateArtisanRating(event.payload.artisanId, artisanAvg),
                    this.serviceManagementClient.updateServiceRating(event.payload.serviceId, serviceAvg),
                ]);
                review.markAsPublished();
                yield ((_c = this.reviewRepository) === null || _c === void 0 ? void 0 : _c.save(review));
                const processedEvent = new reviewEvents_1.ReviewProcessedEvent({
                    reviewId: event.payload.reviewId,
                    success: true,
                    artisanId: event.payload.artisanId,
                    serviceId: event.payload.serviceId,
                    newArtisanRating: artisanAvg,
                    newServiceRating: serviceAvg,
                });
                yield this.eventBus.publish("review_ack_events", processedEvent);
            }
            catch (error) {
                const ack = new shared_2.EventAck(event.payload.reviewId, "failed", "review-and-feedback", error.message);
                yield this.eventBus.publish("event_acks", ack);
                // Publish failed processing event
                const processedEvent = new reviewEvents_1.ReviewProcessedEvent({
                    reviewId: event.payload.reviewId,
                    success: false,
                    error: error.message,
                });
                yield this.eventBus.publish("review_ack_events", processedEvent);
            }
        });
    }
    handleReviewProcessed(event) {
        return __awaiter(this, void 0, void 0, function* () {
            // Here you would handle the result of the processing
            // For example, update some internal state or trigger notifications
            if (event.payload.success) {
                console.log(`Successfully processed review ${event.payload.reviewId}`);
                console.log(`New artisan rating: ${event.payload.newArtisanRating}`);
                console.log(`New service rating: ${event.payload.newServiceRating}`);
            }
            else {
                console.error(`Failed to process review ${event.payload.reviewId}: ${event.payload.error}`);
            }
        });
    }
    handleArtisanRated(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Artisan ${event.payload.artisanId} received new rating: ${event.payload.newRating}`);
                const ack = new artisanRatedEvent_1.ArtisanRatedEvent({
                    artisanId: event.payload.artisanId,
                    newRating: event.payload.newRating,
                });
                yield this.eventBus.publish("event_acks", ack);
            }
            catch (error) {
                // Send NACK
                const ack = new shared_2.EventAck(event.payload.artisanId, "failed", "review-and-feedback", error.message);
                yield this.eventBus.publish("event_acks", ack);
            }
        });
    }
    handleServiceRated(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Similar to handleArtisanRated but for services
                console.log(`Service ${event.payload.serviceId} received new rating: ${event.payload.newRating}`);
                // Send ACK
                const ack = new shared_2.EventAck(event.payload.serviceId, "processed", "review-and-feedback");
                yield this.eventBus.publish("event_acks", ack);
            }
            catch (error) {
                // Send NACK
                const ack = new shared_2.EventAck(event.payload.serviceId, "failed", "review-and-feedback", error.message);
                yield this.eventBus.publish("event_acks", ack);
            }
        });
    }
}
exports.ReviewEventsHandler = ReviewEventsHandler;
