"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Artisan = void 0;
const user_1 = require("./user");
class Artisan extends user_1.User {
    constructor(id, email, password, fullName, businessName, location, rating, skillSet, businessHours) {
        super(id, email, password, fullName, "ARTISAN");
        this.businessName = businessName;
        this.location = location;
        this.rating = rating;
        this.skillSet = skillSet;
        this.businessHours = businessHours;
    }
    addSkill(newSkill) {
        return new Artisan(this.id, this.email, this.password, this.fullName, this.businessName, this.location, this.rating, this.skillSet.addSkill(newSkill), this.businessHours);
    }
    canProvideService(serviceType) {
        return this.skillSet.hasSkill(serviceType);
    }
}
exports.Artisan = Artisan;
