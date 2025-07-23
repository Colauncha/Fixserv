"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feedback = void 0;
class Feedback {
    constructor(comment) {
        this._moderationNotes = [];
        this._attachments = [];
        if (!comment) {
            throw new Error("Feedback comment is required");
        }
        if (typeof comment !== "string") {
            throw new Error("Feedback comment must be a string");
        }
        if (comment.length > 500) {
            throw new Error("Feedback comment too long");
        }
        this._comment = comment;
    }
    addModerationNote(note) {
        this._moderationNotes.push(note);
    }
    addAttachment(url) {
        // Validate URL format
        this._attachments.push(url);
    }
    get comment() {
        return this._comment;
    }
    get attachments() {
        return [...this._attachments];
    }
    get moderationNotes() {
        return [...this._moderationNotes];
    }
}
exports.Feedback = Feedback;
