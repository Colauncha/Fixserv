import { ReviewRepositoryClient } from "../../infrastructure/clients/reviewRepositoryClient";

export class RatingCalculator {
  constructor(private reviewClient: ReviewRepositoryClient) {}

  async calculateAverageArtisanRating(
    artisanId: string,
  ): Promise<{ average: number; count: number }> {
    const reviews =
      await this.reviewClient.getPublishedReviewsByArtisan(artisanId);

    if (reviews.length === 0) {
      return { average: 0, count: 0 };
    }

    const total = reviews.reduce(
      (sum, review) => sum + review.artisanRating,
      0,
    );

    return {
      average: parseFloat((total / reviews.length).toFixed(1)),
      count: reviews.length,
    };
  }
}
