import { ReviewRepository } from "../repository/reviewRepository";

export class RatingCalculator {
  constructor(private reviewRepository: ReviewRepository) {}

  async calculateAverageArtisanRating(artisanId: string): Promise<number> {
    const reviews = await this.reviewRepository.findPublishedByArtisan(
      artisanId
    );
    if (reviews.length === 0) return 0;

    const total = reviews.reduce(
      (sum, review) => sum + review.artisanRating.value,
      0
    );
    return parseFloat((total / reviews.length).toFixed(1));
  }

  async calculateAverageServiceRating(serviceId: string): Promise<number> {
    const reviews = await this.reviewRepository.findPublishedByService(
      serviceId
    );
    if (reviews.length === 0) return 0;

    const total = reviews.reduce(
      (sum, review) => sum + review.serviceRating.value,
      0
    );
    return parseFloat((total / reviews.length).toFixed(1));
  }
}
