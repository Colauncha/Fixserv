import { ReviewRepository } from "../repository/reviewRepository";

export class RatingCalculator {
  constructor(private reviewRepository: ReviewRepository) {}

  async calculateAverageArtisanRating(
    artisanId: string,
  ): Promise<{ average: number; count: number }> {
    const reviews =
      await this.reviewRepository.findPublishedByArtisan(artisanId);
    if (reviews.length === 0) return { average: 0, count: 0 };

    const total = reviews.reduce(
      (sum, review) => sum + review.artisanRating.value,
      0,
    );
    return {
      average: parseFloat((total / reviews.length).toFixed(1)),
      count: reviews.length,
    };
  }

  async calculateAverageServiceRating(
    serviceId: string,
  ): Promise<{ average: number; count: number }> {
    const reviews =
      await this.reviewRepository.findPublishedByService(serviceId);
    if (reviews.length === 0) return { average: 0, count: 0 };

    const total = reviews.reduce(
      (sum, review) => sum + review.serviceRating.value,
      0,
    );
    return {
      average: parseFloat((total / reviews.length).toFixed(1)),
      count: reviews.length,
    };
  }
}
