import axios, { AxiosInstance } from "axios";
import { ReviewDto } from "../../modules-from-other-services/reviewDto";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { IReviewRepository } from "../../modules-from-other-services/IReviewRepository";

export class ReviewRepositoryClient implements IReviewRepository {
  private httpClient: AxiosInstance;
  constructor() {
    this.httpClient = axios.create({
      baseURL: process.env.REVIEW_AND_FEEDBACK_URL,
      timeout: 3000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async findPublishedByService(serviceId: string): Promise<ReviewDto[]> {
    try {
      const response = await this.httpClient.get<{
        success: boolean;
        data: ReviewDto[];
      }>(`/service/${serviceId}?status=published`, {
        params: { status: "published" },
      });

      return response.data.data;
    } catch (error: any) {
      //throw new BadRequestError(
      //  `Failed to fetch published reviews for artisan:`
      //);
      console.log("Failed to fetch published reviews for service:", error);
      return [];
    }
  }
}
