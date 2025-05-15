"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const servicePreferences_1 = require("../value-objects/servicePreferences");
const user_1 = require("./user");
class Client extends user_1.User {
    constructor(id, email, password, fullName, deliveryAddress, servicePreferences) {
        super(id, email, password, fullName, "CLIENT");
        this.deliveryAddress = deliveryAddress;
        this.servicePreferences = servicePreferences;
    }
    updatePreferences(newPreferences) {
        return new Client(this.id, this.email, this.password, this.fullName, this.deliveryAddress, new servicePreferences_1.ServicePreferences(newPreferences));
    }
}
exports.Client = Client;
