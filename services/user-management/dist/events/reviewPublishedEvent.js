"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewPublishedEvent = void 0;
// packages/shared/src/events/reviewPublishedEvent.ts
const shared_1 = require("@fixserv-colauncha/shared");
class ReviewPublishedEvent extends shared_1.BaseEvent {
    constructor(payload) {
        super(payload);
        this.payload = payload;
        this.eventName = "ReviewPublished";
        this.version = 1;
    }
}
exports.ReviewPublishedEvent = ReviewPublishedEvent;
