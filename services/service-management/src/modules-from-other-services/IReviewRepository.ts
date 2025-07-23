import { ReviewDto } from "./reviewDto";

export interface IReviewRepository {
  findPublishedByService(serviceId: string): Promise<ReviewDto[]>;
}
