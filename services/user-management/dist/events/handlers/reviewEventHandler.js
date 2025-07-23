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
const reviewCreatedEvent_1 = require("../reviewCreatedEvent");
const ratingCalculator_1 = require("../../domain/services/ratingCalculator");
const reviewRepositoryClient_1 = require("../../infrastructure/clients/reviewRepositoryClient");
const axiosClient_1 = require("../../interfaces/http/axiosClient");
const reviewPublishedEvent_1 = require("../reviewPublishedEvent");
class ReviewEventsHandler {
    constructor() {
        this.userRepository = new userRepositoryImpl_1.UserRepositoryImpl();
        this.eventBus = shared_1.RedisEventBus.instance(process.env.REDIS_URL);
        this.subscriptions = [];
        this.reviewClient = new reviewRepositoryClient_1.ReviewRepositoryClient((0, axiosClient_1.createAxiosClient)(process.env.REVIEW_AND_FEEDBACK_URL));
        this.ratingCalculator = new ratingCalculator_1.RatingCalculator(this.reviewClient);
    }
    //async setupSubscriptions() {
    //  const sub = await this.eventBus.subscribe(
    //    "review_events",
    //    async (event: any) => {
    //      if (event.eventName === "ReviewCreated") {
    //        await this.handleReviewCreated(event);
    //      }
    //    }
    //  );
    //  console.log("UserManagement subscribed to review_events");
    //  return sub.unsubscribe;
    //}
    setupSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.eventBus.subscribe("review_events", (evt) => __awaiter(this, void 0, void 0, function* () {
                switch (evt.eventName) {
                    case "ReviewCreated":
                        yield this.handleReviewCreated(new reviewCreatedEvent_1.ReviewCreatedEvent(evt.payload));
                        break;
                    case "ReviewPublished":
                        yield this.handleReviewPublished(new reviewPublishedEvent_1.ReviewPublishedEvent(evt.payload));
                        break;
                }
            }));
            console.log("User-Management subscribed to review_events");
        });
    }
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
            this.subscriptions = [];
        });
    }
    /*
    private async handleReviewCreated(event: ReviewCreatedEvent) {
      try {
        console.log(
          "UserManagement received ReviewCreated:",
          event.payload.reviewId
        );
        // const newRating = await this.ratingCalculator.calculateAverage(
        // event.payload.artisanId
        // );
        //update artisan rating
        // await this.userRepository.updateRating(
        //   event.payload.artisanId,
        //   event.payload.artisanRating
        // );
  
        const averageRating =
          await this.ratingCalculator.calculateAverageArtisanRating(
            event.payload.artisanId
          );
  
        await this.userRepository.updateRating(
          event.payload.artisanId,
          averageRating
        );
  
        await this.eventBus.publish(
          "review_ack_events",
          new ReviewProcessedEvent({
            reviewId: event.payload.reviewId,
            success: true,
            artisanId: event.payload.artisanId,
            newArtisanRating: event.payload.artisanRating,
          })
        );
      } catch (error: any) {
        console.error("Failed to update artisan rating:", error);
        await this.eventBus.publish(
          "review_ack_events",
          new ReviewProcessedEvent({
            reviewId: event.payload.reviewId,
            success: false,
            error: error.message,
          })
        );
      }
    }
      */
    handleReviewCreated(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // tell review‐and‐feedback we accepted the task
                yield this.eventBus.publish("review_ack_events", new reviewProcessedEvent_1.ReviewProcessedEvent({
                    reviewId: event.payload.reviewId,
                    success: true,
                    artisanId: event.payload.artisanId, // optional
                }));
            }
            catch (e) {
                yield this.eventBus.publish("review_ack_events", new reviewProcessedEvent_1.ReviewProcessedEvent({
                    reviewId: event.payload.reviewId,
                    success: false,
                    error: e.message,
                }));
            }
        });
    }
    /** 2️⃣ final rating update after review is published */
    handleReviewPublished(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const avg = yield this.ratingCalculator.calculateAverageArtisanRating(event.payload.artisanId);
                yield this.userRepository.updateRating(event.payload.artisanId, avg);
                yield this.eventBus.publish("review_ack_events", new reviewProcessedEvent_1.ReviewProcessedEvent({
                    reviewId: event.payload.reviewId,
                    success: true,
                    artisanId: event.payload.artisanId,
                    newArtisanRating: avg,
                }));
            }
            catch (e) {
                yield this.eventBus.publish("review_ack_events", new reviewProcessedEvent_1.ReviewProcessedEvent({
                    reviewId: event.payload.reviewId,
                    success: false,
                    error: e.message,
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
