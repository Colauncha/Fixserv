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
exports.ReviewService = void 0;
const uuid_1 = require("uuid");
const shared_1 = require("@fixserv-colauncha/shared");
const review_1 = require("../../domain/entities/review");
const rating_1 = require("../../domain/value-objects/rating");
const reviewEvents_1 = require("../../events/reviewEvents");
class ReviewService {
    constructor(reviewRepository, ratingCalculator, userManagementClient, serviceManagementClient) {
        this.reviewRepository = reviewRepository;
        this.ratingCalculator = ratingCalculator;
        this.userManagementClient = userManagementClient;
        this.serviceManagementClient = serviceManagementClient;
        this.eventBus = new shared_1.RedisEventBus();
        this.processingReviews = new Map();
    }
    submitReview(orderId, artisanId, clientId, serviceId, feedback, artisanRating, serviceRating) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.validateReferences(artisanId, clientId, serviceId);
            const review = review_1.Review.create((0, uuid_1.v4)(), orderId, artisanId, clientId, serviceId, feedback, artisanRating, serviceRating);
            yield this.reviewRepository.save(review);
            console.log(`Review ${review.id} saved with status: ${review.status}`);
            this.processingReviews.set(review.id, this.processReview(review).catch((err) => console.error(`Processing failed for review ${review.id}:`, err)));
            return review;
        });
    }
    processReview(review) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                review.markAsProcessing();
                yield this.reviewRepository.save(review);
                yield this.eventBus.publish("review_events", new reviewEvents_1.ReviewCreatedEvent({
                    reviewId: review.id,
                    artisanId: review.artisanId,
                    serviceId: review.serviceId,
                    clientId: review.clientId,
                    artisanRating: review.artisanRating.value,
                    serviceRating: review.serviceRating.value,
                    status: review.status,
                }));
                console.log(`Published ReviewCreatedEvent for ${review.id}`);
                const ackResult = yield this.waitForProcessingAck(review.id, ["user", "service"], 15000);
                if (ackResult.success) {
                    review.markAsPublished();
                }
                else {
                    review.markAsFailed(ackResult.error || "Processing failed");
                }
                yield this.reviewRepository.save(review);
            }
            catch (error) {
                review.markAsFailed(error.message);
                yield this.reviewRepository.save(review);
                throw error;
            }
            finally {
                this.processingReviews.delete(review.id);
            }
        });
    }
    waitForProcessingAck1(reviewId_1) {
        return __awaiter(this, arguments, void 0, function* (reviewId, timeoutMs = 10000) {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                let resolved = false;
                const acks = [];
                const subscription = yield this.eventBus.subscribe("review_ack_events", (event) => {
                    if (event.payload.reviewId === reviewId) {
                        acks.push({
                            success: event.payload.success,
                            error: event.payload.error,
                        });
                        //resolve asap, if there is no error
                        if (!event.payload.success && !resolved) {
                            resolved = true;
                            subscription.unsubscribe();
                            resolve({ success: false, error: event.payload.error });
                        }
                    }
                });
                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        subscription.unsubscribe();
                        // Use latest ack if we have any, otherwise timeout
                        const latestAck = acks[acks.length - 1];
                        resolve(latestAck || {
                            success: false,
                            error: "Processing acknowledgement timeout",
                        });
                    }
                }, timeoutMs);
            }));
        });
    }
    waitForProcessingAck(reviewId_1, requiredServices_1) {
        return __awaiter(this, arguments, void 0, function* (reviewId, requiredServices, timeoutMs = 10000) {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                const receivedAcks = {};
                const subscription = yield this.eventBus.subscribe("review_ack_events", (event) => {
                    var _a;
                    if (event.payload.reviewId === reviewId) {
                        // Determine service type from event
                        const service = event.payload.artisanId
                            ? "user"
                            : event.payload.serviceId
                                ? "service"
                                : undefined;
                        if (service && requiredServices.includes(service)) {
                            receivedAcks[service] = {
                                success: event.payload.success,
                                error: event.payload.error,
                            };
                            // Check if all required services have responded
                            const allResponded = requiredServices.every((s) => receivedAcks[s] !== undefined);
                            if (allResponded) {
                                subscription.unsubscribe();
                                const allSuccess = requiredServices.every((s) => receivedAcks[s].success);
                                resolve({
                                    success: allSuccess,
                                    error: allSuccess
                                        ? undefined
                                        : (_a = Object.values(receivedAcks).find((ack) => !ack.success)) === null || _a === void 0 ? void 0 : _a.error,
                                    service: allSuccess
                                        ? undefined
                                        : requiredServices.find((s) => !receivedAcks[s].success),
                                });
                            }
                            // Fail fast if any service fails
                            if (!event.payload.success) {
                                subscription.unsubscribe();
                                resolve({
                                    success: false,
                                    error: event.payload.error,
                                    service,
                                });
                            }
                        }
                    }
                });
                setTimeout(() => {
                    subscription.unsubscribe();
                    const missingServices = requiredServices.filter((s) => !receivedAcks[s]);
                    resolve({
                        success: false,
                        error: `Timeout waiting for services: ${missingServices.join(", ")}`,
                        service: missingServices[0],
                    });
                }, timeoutMs);
            }));
        });
    }
    validateReferences(artisanId, clientId, serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const [artisan, service] = yield Promise.all([
                (_a = this.userManagementClient) === null || _a === void 0 ? void 0 : _a.getArtisan(artisanId),
                (_b = this.serviceManagementClient) === null || _b === void 0 ? void 0 : _b.getService(serviceId),
            ]);
            if (!(artisan === null || artisan === void 0 ? void 0 : artisan.exists))
                throw new Error("Artisan does not exist");
            if (!(service === null || service === void 0 ? void 0 : service.exists))
                throw new Error("Service does not exist");
        });
    }
    getArtisanAverageRating(artisanId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            return yield ((_a = this.ratingCalculator) === null || _a === void 0 ? void 0 : _a.calculateAverageArtisanRating(artisanId));
        });
    }
    getServiceAverageRating(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            return yield ((_a = this.ratingCalculator) === null || _a === void 0 ? void 0 : _a.calculateAverageServiceRating(serviceId));
        });
    }
    updateReview(reviewId, update) {
        return __awaiter(this, void 0, void 0, function* () {
            const review = yield this.reviewRepository.findById(reviewId);
            if (!review) {
                throw new Error("Review not found");
            }
            if (update.comment) {
                review.updateFeedback(update.comment);
            }
            if (update.artisanRating) {
                const newArtisanRating = new rating_1.Rating(update.artisanRating.value, update.artisanRating.dimensions);
                const newServiceRating = update.serviceRating
                    ? new rating_1.Rating(update.serviceRating.value, update.serviceRating.dimensions)
                    : review.serviceRating;
                review.updateRatings(newArtisanRating, newServiceRating);
            }
            else if (update.serviceRating) {
                const newServiceRating = new rating_1.Rating(update.serviceRating.value, update.serviceRating.dimensions);
                review.updateRatings(review.artisanRating, newServiceRating);
            }
            yield this.reviewRepository.update(review);
            return review;
        });
    }
}
exports.ReviewService = ReviewService;
