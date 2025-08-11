/*
import { ObjectId } from "mongodb";

export class NotificationId {
  private _value: string;

  constructor(value?: string | ObjectId) {
    if (value) {
      this._value = value.toString();
    } else {
      // Generate a new ObjectId if no value provided
      this._value = new ObjectId().toString();
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: NotificationId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  // Static factory method for creating from MongoDB ObjectId
  static fromObjectId(objectId: ObjectId): NotificationId {
    return new NotificationId(objectId.toString());
  }

  // Static factory method for creating from string
  static fromString(id: string): NotificationId {
    return new NotificationId(id);
  }

  // Convert to MongoDB ObjectId
  toObjectId(): ObjectId {
    return new ObjectId(this._value);
  }
}
*/
import { Types } from "mongoose";

export class NotificationId {
  private _value: string;

  constructor(value?: string) {
    if (value) {
      // Validate that it's a valid ObjectId format
      if (Types.ObjectId.isValid(value)) {
        this._value = value;
      } else {
        throw new Error(`Invalid ObjectId format: ${value}`);
      }
    } else {
      // Generate a new ObjectId if no value provided
      this._value = new Types.ObjectId().toString();
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: NotificationId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  // Static factory method for creating from string
  static fromString(id: string): NotificationId {
    return new NotificationId(id);
  }

  // Convert to MongoDB ObjectId
  toObjectId(): Types.ObjectId {
    return new Types.ObjectId(this._value);
  }
}
