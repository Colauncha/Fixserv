import axios, { AxiosInstance } from "axios";
import { ReviewDto } from "../../modules-from-other-services/reviewDto";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { IReviewRepository } from "../../modules-from-other-services/IReviewRepository";

export class ReviewRepositoryClient implements IReviewRepository {
  private httpClient: AxiosInstance;
  constructor() {
    this.httpClient = axios.create({
      baseURL: process.env.REVIEW_AND_FEEDBACK_URL,
      timeout: 8000,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Service": "true",
      },
    });
  }

  async findPublishedByService(
    serviceId: string,
  ): Promise<{ artisanRating: number; serviceRating: number }[]> {
    try {
      const response = await this.httpClient.get(`/service/${serviceId}`, {
        params: { status: "published" },
      });

      // return response.data.data.map((review) => ({
      //   artisanRating: review.artisanRating,
      //   serviceRating: review.serviceRating,
      // }));
      return response.data.data ?? response.data ?? [];
    } catch (error: any) {
      if (error.code === "ECONNABORTED") {
        console.error("⚠️ Axios timeout error:", error.message);
      } else if (error.response) {
        console.error(
          "⚠️ Axios response error:",
          error.response.status,
          error.response.data,
        );
      } else {
        console.error("⚠️ Axios unknown error:", error);
      }
      return [];
    }
  }
}
