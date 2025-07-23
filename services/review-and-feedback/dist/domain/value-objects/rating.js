"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rating = void 0;
class Rating {
    constructor(value, dimensions) {
        if (value < 1 || value > 5) {
            throw new Error("Rating must be between 1 and 5");
        }
        this._value = value;
        this._dimensions = dimensions || {};
    }
    get value() {
        return this._value;
    }
    get dimensions() {
        return Object.assign({}, this._dimensions);
    }
}
exports.Rating = Rating;
