export class Feedback {
  private _comment: string;
  private _moderationNotes: string[] = [];
  private _attachments: string[] = [];

  constructor(comment?: string) {
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

  addModerationNote(note: string) {
    this._moderationNotes.push(note);
  }

  addAttachment(url: string) {
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
