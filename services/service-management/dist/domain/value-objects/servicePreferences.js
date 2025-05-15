"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicePreferences = void 0;
class ServicePreferences {
    constructor(categories) {
        if (!categories || categories.length === 0) {
            throw new Error("At least one service preference is required");
        }
        this._categories = [...new Set(categories)]; // Remove duplicates
    }
    get categories() {
        return [...this._categories]; // Return copy to prevent modification
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
}
exports.ServicePreferences = ServicePreferences;
