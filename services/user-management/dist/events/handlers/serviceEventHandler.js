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
exports.ServiceEventsHandler = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
class ServiceEventsHandler {
    constructor() {
        this.eventBus = new shared_1.RedisEventBus();
    }
    setupSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.eventBus.subscribe("service_events", (event) => {
                if (event.eventName === "ServiceCreated") {
                    this.handleServiceCreated(event);
                }
            });
            yield this.eventBus.subscribe("rating_updated", (event) => {
                this.handleRatingUpdate(event);
            });
        });
    }
    handleServiceCreated(event) {
        console.log("Service created event received:", event);
        // Handle the event - update user preferences, send notifications, etc.
    }
    handleRatingUpdate(event) {
        console.log("Rating updated:", event);
        // Handle the event - update user preferences,  send notifications, etc.
    }
}
exports.ServiceEventsHandler = ServiceEventsHandler;
