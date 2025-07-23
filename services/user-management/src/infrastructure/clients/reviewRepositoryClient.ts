import { AxiosInstance } from "axios";
import { ReviewDto } from "../../modules-from-other-services/review-dto";
import { BadRequestError } from "@fixserv-colauncha/shared";

export class ReviewRepositoryClient {
  constructor(private httpClient: AxiosInstance) {}

  async getPublishedReviewsByArtisan(artisanId: string): Promise<ReviewDto[]> {
    try {
      const response = await this.httpClient.get<{
        success: boolean;
        data: ReviewDto[];
      }>(`/artisan/${artisanId}?status=published`);

      return response.data.data;
    } catch (error: any) {
      //throw new BadRequestError(
      //  `Failed to fetch published reviews for artisan:`
      //);
      console.log("Failed to fetch published reviews for artisan:", error);
      return [];
    }
  }
}
