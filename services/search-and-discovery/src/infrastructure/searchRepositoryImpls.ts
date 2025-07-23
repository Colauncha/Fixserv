import {
  PaginatedResult,
  searchRepository,
} from "../domain/repositories/searchRepository";
import { SearchFilter } from "../domain/value-ojects/searchFilter";
import { ServiceModel } from "../modules-from-service-management/serviceModel";
import { ArtisanModel } from "../modules-from-user-management/artisanModel";
import { redis, connectRedis } from "@fixserv-colauncha/shared";
import { makeSearchKey } from "./utils/cacheKey";

export class searchRepositoryImpls implements searchRepository {
  async searchArtisans(
    keyword: string,
    filters: SearchFilter,
    page = 1,
    limit = 20
  ): Promise<PaginatedResult<any>> {
    const cacheKey = makeSearchKey("artisan", keyword, filters, page, limit);

    await connectRedis();

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    console.log(cacheKey);
    const query: any = {
      role: "ARTISAN",
    };

    /* text search – hits fullName, businessName, skillSet */
    if (keyword?.trim()) {
      query.$text = { $search: keyword };
    }
    /* extra filters */
    if (filters.location) {
      query.location = { $regex: filters.location, $options: "i" };
    }
    if (filters.rating) {
      query.rating = { $gte: filters.rating };
    }
    if (filters.isAvailableNow) appendAvailabilityQuery(query);

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      ArtisanModel.find(query)
        .lean()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ArtisanModel.countDocuments(query),
    ]);

    /* lean() = plain JS objects (faster, lighter) */
    const result = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    /* 3️⃣  write‑through cache (TTL 60 s) */
    await redis.setEx(cacheKey, 60, JSON.stringify(result));

    return result;
  }

  async searchServices(
    keyword: string,
    filters: SearchFilter,
    page = 1,
    limit = 20
  ): Promise<PaginatedResult<any>> {
    const cacheKey = makeSearchKey("service", keyword, filters, page, limit);
    await connectRedis();
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    console.log(cacheKey);
    const query: any = {
      isActive: true,
    };

    /* text search – title & description */
    if (keyword?.trim()) {
      query.$text = { $search: keyword };
    }

    /* map category/location to artisanId set */
    if (filters.category || filters.location) {
      const artisanQ: any = {};
      if (filters.category) artisanQ.skillSet = { $in: [filters.category] };
      if (filters.location)
        artisanQ.location = { $regex: filters.location, $options: "i" };

      const artisanIds = await ArtisanModel.find(artisanQ).select("_id").lean();

      /* no artisans matched ⇒ short‑circuit to empty list */
      if (!artisanIds.length) {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }
      query.artisanId = { $in: artisanIds.map((a) => a._id) };
    }

    /* price filter can now use the active_price_rating index */
    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = filters.minPrice;
      if (filters.maxPrice) query.price.$lte = filters.maxPrice;
    }

    if (filters.rating) {
      query.rating = { $gte: filters.rating };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ServiceModel.find(query)
        .lean()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ServiceModel.countDocuments(query),
    ]);

    const result = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await redis.setEx(cacheKey, 60, JSON.stringify(result));
    return result;
  }
}

/* helper for “isAvailableNow” */
function appendAvailabilityQuery(q: any) {
  const now = new Date();
  const currentDay = now
    .toLocaleString("en-US", { weekday: "long" })
    .toLowerCase();
  const hhmm = now.getHours() * 100 + now.getMinutes();

  q[`businessHours._schedule.${currentDay}.open`] = { $lte: hhmm };
  q[`businessHours._schedule.${currentDay}.close`] = { $gte: hhmm };
}
