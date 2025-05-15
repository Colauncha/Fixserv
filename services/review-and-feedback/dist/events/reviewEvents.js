"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewProcessedEvent = exports.ReviewCreatedEvent = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
class ReviewCreatedEvent extends shared_1.BaseEvent {
    constructor(payload) {
        super(payload);
        this.payload = payload;
        this.eventName = "ReviewCreated";
        this.version = 1;
    }
}
exports.ReviewCreatedEvent = ReviewCreatedEvent;
class ReviewProcessedEvent extends shared_1.BaseEvent {
    constructor(payload) {
        super(payload);
        this.payload = payload;
        this.eventName = "ReviewProcessed";
        this.version = 1;
    }
}
exports.ReviewProcessedEvent = ReviewProcessedEvent;
