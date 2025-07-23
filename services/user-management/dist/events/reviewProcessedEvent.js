"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewProcessedEvent = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
class ReviewProcessedEvent extends shared_1.BaseEvent {
    constructor(payload) {
        super(payload);
        this.payload = payload;
        this.eventName = "ReviewProcessed";
        this.version = 1;
    }
    // Optional: Add helper methods
    isSuccess() {
        return this.payload.success;
    }
}
exports.ReviewProcessedEvent = ReviewProcessedEvent;
