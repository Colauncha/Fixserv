import { BadRequestError } from "@fixserv-colauncha/shared";

export class Rating {
  private readonly _value: number;
  private readonly _dimensions: {
    quality?: number;
    professionalism?: number;
    communication?: number;
    punctuality?: number;
  };

  constructor(
    value: number,
    dimensions?: {
      quality?: number;
      professionalism?: number;
      communication?: number;
      punctuality?: number;
    }
  ) {
    if (value < 1 || value > 5) {
      throw new BadRequestError("Rating must be between 1 and 5");
    }

    this._value = value;
    this._dimensions = dimensions || {};
  }

  get value() {
    return this._value;
  }
  get dimensions() {
    return { ...this._dimensions };
  }
}
