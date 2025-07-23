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
exports.reviewAndFeedbackRepositoryImpls = void 0;
const review_1 = require("../domain/entities/review");
const review_2 = require("./persistence/model/review");
const feedback_1 = require("../domain/entities/feedback");
const rating_1 = require("../domain/value-objects/rating");
class reviewAndFeedbackRepositoryImpls {
    save(review) {
        return __awaiter(this, void 0, void 0, function* () {
            yield review_2.ReviewModel.findOneAndUpdate({ _id: review.id }, this.toPersistence(review), { upsert: true, new: true }).exec();
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield review_2.ReviewModel.findById(id).exec();
            if (!doc)
                return null;
            return this.toDomain(doc);
        });
    }
    findByArtisan(artisanId) {
        return __awaiter(this, void 0, void 0, function* () {
            const docs = yield review_2.ReviewModel.find({ artisanId });
            return docs.map((doc) => this.toDomain(doc));
        });
    }
    findByService(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const docs = yield review_2.ReviewModel.find({ serviceId });
            return docs.map((doc) => this.toDomain(doc));
        });
    }
    findByClient(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            const docs = yield review_2.ReviewModel.find({ clientId }).exec();
            return docs.map((doc) => this.toDomain(doc));
        });
    }
    findPublishedByArtisan(artisanId) {
        return __awaiter(this, void 0, void 0, function* () {
            const docs = yield review_2.ReviewModel.find({ artisanId, status: "published" });
            return docs.map((doc) => this.toDomain(doc));
        });
    }
    findPublishedByService(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const docs = yield review_2.ReviewModel.find({
                serviceId,
                status: "published",
            }).exec();
            return docs.map((doc) => this.toDomain(doc));
        });
    }
    getAverageArtisanRating(artisanId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield review_2.ReviewModel.aggregate([
                { $match: { artisanId, status: "published" } },
                { $group: { _id: null, avgRating: { $avg: "$artisanRating.value" } } },
            ]).exec();
            return ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.avgRating) || 0;
        });
    }
    getAverageServiceRating(serviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield review_2.ReviewModel.aggregate([
                { $match: { serviceId, status: "published" } },
                { $group: { _id: null, avgRating: { $avg: "$serviceRating.value" } } },
            ]).exec();
            return ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.avgRating) || 0;
        });
    }
    update(review) {
        return __awaiter(this, void 0, void 0, function* () {
            yield review_2.ReviewModel.updateOne({
                _id: review.id,
            }, {
                $set: {
                    feedback: {
                        comment: review.feedback.comment,
                        moderationNotes: review.feedback.moderationNotes,
                        attachments: review.feedback.attachments,
                    },
                    artisanRating: {
                        value: review.artisanRating.value,
                        dimensions: review.artisanRating.dimensions,
                    },
                    serviceRating: {
                        value: review.serviceRating.value,
                        dimensions: review.serviceRating.dimensions,
                    },
                    status: review.status,
                    updatedAt: new Date(),
                },
            });
        });
    }
    toDomain(doc) {
        return new review_1.Review(doc._id, doc.orderId, doc.artisanId, doc.clientId, doc.serviceId, new feedback_1.Feedback(doc.feedback.comment), new rating_1.Rating(doc.artisanRating.value, doc.artisanRating.dimensions), new rating_1.Rating(doc.serviceRating.value, doc.serviceRating.dimensions), doc.status, doc.createdAt);
    }
    toPersistence(review) {
        return {
            _id: review.id,
            orderId: review.orderId,
            artisanId: review.artisanId,
            clientId: review.clientId,
            serviceId: review.serviceId,
            feedback: {
                comment: review.feedback.comment,
                moderationNotes: review.feedback.moderationNotes,
                attachments: review.feedback.attachments,
            },
            artisanRating: {
                value: review.artisanRating.value,
                dimensions: review.artisanRating.dimensions,
            },
            serviceRating: {
                value: review.serviceRating.value,
                dimensions: review.serviceRating.dimensions,
            },
            status: review.status,
            createdAt: review.date,
        };
    }
}
exports.reviewAndFeedbackRepositoryImpls = reviewAndFeedbackRepositoryImpls;
