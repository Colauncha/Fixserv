"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtisanRatedEvent = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
class ArtisanRatedEvent extends shared_1.BaseEvent {
    // artisanId: any;
    // newRating: any;
    constructor(payload) {
        super(payload);
        this.payload = payload;
        this.eventName = "ArtisanRated";
        this.version = 1;
    }
}
exports.ArtisanRatedEvent = ArtisanRatedEvent;
