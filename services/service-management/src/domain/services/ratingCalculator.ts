import { IReviewRepository } from "../../modules-from-other-services/IReviewRepository";

export class RatingCalculator {
  constructor(private reviewRepository: IReviewRepository) {}

  async calculateAverageServiceRating(
    serviceId: string,
  ): Promise<{ average: number; count: number }> {
    const reviews =
      await this.reviewRepository.findPublishedByService(serviceId);
    if (reviews.length === 0) return { average: 0, count: 0 };

    const total = reviews.reduce(
      (sum, review) => sum + review.serviceRating,
      0,
    );
    return {
      average: parseFloat((total / reviews.length).toFixed(1)),
      count: reviews.length,
    };
  }
}
