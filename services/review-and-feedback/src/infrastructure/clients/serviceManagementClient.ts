import { AxiosInstance } from "axios";

export class ServiceManagementClient {
  constructor(private httpClient: AxiosInstance) {}

  async getService(
    serviceId: string
  ): Promise<{ exists: boolean; rating?: number }> {
    try {
      const response = await this.httpClient.get(`/${serviceId}`);
      return {
        exists: true,
        rating: response.data.rating, 
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { exists: false };
      }
      throw new Error(`Failed to fetch service: ${error.message}`);
    }
  }

  async updateServiceRating(
    serviceId: string,
    newRating: number
  ): Promise<void> {
    try {
      await this.httpClient.patch(`/${serviceId}`, {
        rating: newRating,
      });
    } catch (error: any) {
      throw new Error(`Failed to update service rating: ${error.message}`);
    }
  }
}
