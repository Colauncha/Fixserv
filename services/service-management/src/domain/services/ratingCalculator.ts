import { IReviewRepository } from "../../modules-from-other-services/IReviewRepository";

export class RatingCalculator {
  constructor(private reviewRepository: IReviewRepository) {}

  async calculateAverageServiceRating(serviceId: string): Promise<number> {
    const reviews = await this.reviewRepository.findPublishedByService(
      serviceId
    );
    if (reviews.length === 0) return 0;

    const total = reviews.reduce(
      (sum, review) => sum + review.serviceRating,
      0
    );
    return parseFloat((total / reviews.length).toFixed(2));
  }
}
