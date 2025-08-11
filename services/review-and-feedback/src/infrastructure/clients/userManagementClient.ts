import { AxiosInstance } from "axios";

export class UserManagementClient {
  constructor(private httpClient: AxiosInstance) {}

  async getArtisan(
    artisanId: string
  ): Promise<{ exists: boolean; rating?: number }> {
    try {
      const response = await this.httpClient.get(`/artisan/${artisanId}`);
      return {
        exists: true,
        rating: response.data.rating,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { exists: false };
      }
      throw new Error(`Failed to fetch artisan: ${error.message}`);
    }
  }

  async updateArtisanRating(
    artisanId: string,
    newRating: number
  ): Promise<void> {
    try {
      await this.httpClient.patch(`/${artisanId}`, {
        rating: newRating,
      });
    } catch (error: any) {
      throw new Error(`Failed to update artisan rating: ${error.message}`);
    }
  }
}
