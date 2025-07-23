"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicePreferences = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
class ServicePreferences {
    constructor(categories) {
        if (!categories || categories.length === 0) {
            throw new shared_1.BadRequestError("At least one service preference is required");
        }
        this._categories = [...new Set(categories)];
    }
    get categories() {
        return [...this._categories];
    }
    addPreference(newPreference) {
        return new ServicePreferences([...this._categories, newPreference]);
    }
    removePreference(preferenceToRemove) {
        return new ServicePreferences(this._categories.filter((p) => p !== preferenceToRemove));
    }
    hasPreference(preference) {
        return this._categories.includes(preference);
    }
    toJSON() {
        return this._categories;
    }
    static fromJSON(data) {
        if (!Array.isArray(data)) {
            throw new shared_1.BadRequestError("Invalid service preferences data");
        }
        return new ServicePreferences(data);
    }
}
exports.ServicePreferences = ServicePreferences;
