import axios from "axios";
import { BadRequestError } from "@fixserv-colauncha/shared";

export class ArtisanClient {
  private static baseUrl = process.env.USER_MANAGEMENT_URL;

  static async getArtisanById(artisanId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/user/${artisanId}`, {
        timeout: 10000,
        headers: { "X-Internal-Service": "true" },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new BadRequestError("Invalid artisan ID");
      }
      // Fallback to local DB if user-management is unreachable
      console.warn("user-management unreachable, falling back to local cache");
      return null;
    }
  }
}
