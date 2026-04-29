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

// async findById(id: string): Promise<Artisan |
// null> {
// const doc = await ArtisanModel.findById(id).lean
// ();
// if (!doc) return null;
// return this.toDomain(doc);
// }
// async exists(id: string): Promise<boolean> {
// const count = await ArtisanModel.countDocuments
// ({ _id: id });
// return count > 0;
// }
// Add method to get artisan's skillSet
// async getArtisanSkillSet(artisanId: string):
// Promise<SkillSet | null> {
// const doc = await ArtisanModel.findById
// (artisanId)
// .select("skillSet")
// .lean();
// if (!doc || !doc.skillSet) return null;
// return SkillSet.create(doc.skillSet);
// }
// private toDomain(doc: any): Artisan {
// return new Artisan(
// doc._id,
// doc.email,
// doc.password,
// doc.fullName,
// doc.businessName,
// doc.location,
// doc.rating,
// doc.skillSet,
// doc.businessHours
// );
// }
