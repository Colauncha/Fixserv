"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRatedEvent = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
class ServiceRatedEvent extends shared_1.BaseEvent {
    constructor(payload) {
        super(payload);
        this.payload = payload;
        this.eventName = "ServiceRated";
        this.version = 1;
    }
}
exports.ServiceRatedEvent = ServiceRatedEvent;
