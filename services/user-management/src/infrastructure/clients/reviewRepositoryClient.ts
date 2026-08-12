import { AxiosInstance } from "axios";
import { ReviewDto } from "../../modules-from-other-services/review-dto";

export class ReviewRepositoryClient {
  constructor(private httpClient: AxiosInstance) {}

  async getPublishedReviewsByArtisan(
    artisanId: string,
  ): Promise<{ artisanRating: number; serviceRating: number }[]> {
    try {
      const response = await this.httpClient.get(
        `/artisan/${artisanId}?status=published`,
      );

      // return response.data.data;
      return response.data?.data ?? response.data ?? [];
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
