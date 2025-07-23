"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtisanCreatedEvent = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
class ArtisanCreatedEvent extends shared_1.BaseEvent {
    constructor(payload) {
        super(payload);
        this.payload = payload;
        this.eventName = "ArtisanCreated";
        this.version = 1;
    }
}
exports.ArtisanCreatedEvent = ArtisanCreatedEvent;
