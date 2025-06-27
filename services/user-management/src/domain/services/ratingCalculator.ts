import { ReviewRepositoryClient } from "../../infrastructure/clients/reviewRepositoryClient";

export class RatingCalculator {
  constructor(private reviewClient: ReviewRepositoryClient) {}

  async calculateAverageArtisanRating(artisanId: string): Promise<number> {
    const reviews = await this.reviewClient.getPublishedReviewsByArtisan(
      artisanId
    );

    if (reviews.length === 0) {
      return 0; // No reviews, return average rating of 0
    }

    const totalRating = reviews.reduce(
      (sum, review) => sum + review.artisanRating,
      0
    );

    return parseFloat((totalRating / reviews.length).toFixed(1));
  }
}
