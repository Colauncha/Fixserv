import { searchRepository } from "../domain/repositories/searchRepository";
import { SearchFilter } from "../domain/value-ojects/searchFilter";
import { ServiceModel } from "../modules-from-service-management/serviceModel";
import { ArtisanModel } from "../modules-from-user-management/artisanModel";

export class searchRepositoryImpls implements searchRepository {
  async searchArtisans(keyword: string, filters: SearchFilter): Promise<any[]> {
    const query: any = {
      role: "ARTISAN",
      $or: [
        { businessName: { $regex: keyword, $options: "i" } },
        { fullName: { $regex: keyword, $options: "i" } },
        { skillSet: { $elemMatch: { $regex: keyword, $options: "i" } } },
      ],
    };
    if (filters.location)
      query.location = { $regex: filters.location, $options: "i" };
    if (filters.rating) query.rating = { $gte: filters.rating };

    if (filters.isAvailableNow) {
      const now = new Date();
      const currentDay = now
        .toLocaleString("en-US", { weekday: "long" })
        .toLowerCase();
      const currentTime = now.getHours() * 100 + now.getMinutes();

      query[`businessHours._schedule.${currentDay}.open`] = { $ne: "closed" };
      query[`businessHours._schedule.${currentDay}.close`] = { $ne: "closed" };
      query[`businessHours._schedule.${currentDay}.open`] = {
        $lte: currentTime,
      };
      query[`businessHours._schedule.${currentDay}.close`] = {
        $gte: currentTime,
      };
    }
    return await ArtisanModel.find(query);
  }

  async searchServices(keyword: string, filters: SearchFilter): Promise<any[]> {
    const query: any = {
      isActive: true,
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
    };
    if (filters.category) {
      const artisans = await ArtisanModel.find({
        skillSet: { $in: [filters.category] },
      }).select("_id");
      query.artisanId = { $in: artisans.map((a) => a._id) };
    }
    if (filters.location) {
      const artisans = await ArtisanModel.find({
        location: { $regex: filters.location, $options: "i" },
      }).select("_id");
      query.artisanId = { $in: artisans.map((a) => a._id) };
    }
    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = filters.minPrice;
      if (filters.maxPrice) query.price.$lte = filters.maxPrice;
    }
    if (filters.rating) query.rating = { $gte: filters.rating };

    return await ServiceModel.find(query);
  }
}
