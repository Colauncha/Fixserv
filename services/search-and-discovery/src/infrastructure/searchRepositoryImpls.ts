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
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private createSearchConditions(searchTerm: string, fields: string[]): any[] {
    const conditions: any[] = [];
    const trimmed = searchTerm.trim().toLowerCase();

    if (!trimmed) return conditions;

    fields.forEach((field) => {
      // 1. Exact phrase search (case insensitive)
      conditions.push({
        [field]: { $regex: this.escapeRegex(trimmed), $options: "i" },
      });

      // 2. Handle space-separated words - require ALL words to be present
      const words = trimmed.split(/\s+/).filter((word) => word.length > 1);
      if (words.length > 1) {
        // Create regex that requires ALL words to be present (in any order)
        const allWordsRegex = words
          .map((word) => `(?=.*${this.escapeRegex(word)})`)
          .join("");
        conditions.push({
          [field]: {
            $regex: `^${allWordsRegex}.*`,
            $options: "i",
          },
        });
      }

      // 3. Handle concatenated search like "walletartisan" -> "wallet artisan"
      if (trimmed.length > 4 && !trimmed.includes(" ")) {
        // Try common word boundaries
        const commonBreakPoints = [3, 4, 5, 6];
        commonBreakPoints.forEach((breakPoint) => {
          if (breakPoint < trimmed.length - 1) {
            const firstPart = trimmed.substring(0, breakPoint);
            const secondPart = trimmed.substring(breakPoint);

            if (firstPart.length >= 2 && secondPart.length >= 2) {
              // Match "firstpart.*secondpart" pattern
              conditions.push({
                [field]: {
                  $regex: `${this.escapeRegex(firstPart)}.*${this.escapeRegex(
                    secondPart
                  )}`,
                  $options: "i",
                },
              });
            }
          }
        });
      }
    });

    return conditions;
  }

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

    console.log("Search keyword:", keyword);
    console.log("Cache key:", cacheKey);

    const query: any = {
      role: "ARTISAN",
    };

    // Only add search conditions if keyword is provided
    if (keyword?.trim()) {
      const searchTerm = keyword.trim();
      const searchConditions: any[] = [];

      console.log("Processing search term:", searchTerm);

      // Create search conditions for relevant fields
      const fieldConditions = this.createSearchConditions(searchTerm, [
        "fullName",
        "businessName",
      ]);
      searchConditions.push(...fieldConditions);

      // Special handling for skillSet array field
      const words = searchTerm
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 1);

      // For skillSet, search for the exact term and ALL individual words must match
      searchConditions.push({
        skillSet: { $regex: this.escapeRegex(searchTerm), $options: "i" },
      });

      // If multiple words, require ALL words to be present in skillSet
      if (words.length > 1) {
        const allWordsRegex = words
          .map((word) => `(?=.*${this.escapeRegex(word)})`)
          .join("");
        searchConditions.push({
          skillSet: {
            $regex: `^${allWordsRegex}.*`,
            $options: "i",
          },
        });
      }

      // ADDITION: Find artisans whose services match the search term
      try {
        const serviceSearchConditions = this.createSearchConditions(
          searchTerm,
          ["title", "description"]
        );

        if (serviceSearchConditions.length > 0) {
          const matchingServices = await ServiceModel.find({
            isActive: true,
            $or: serviceSearchConditions,
          })
            .select("artisanId")
            .lean();

          if (matchingServices.length > 0) {
            searchConditions.push({
              _id: { $in: matchingServices.map((s) => s.artisanId) },
            });
          }
        }
      } catch (error) {
        console.log("Error finding artisans by service match:", error);
      }

      if (searchConditions.length > 0) {
        query.$or = searchConditions;
        console.log("Search query:", JSON.stringify(query, null, 2));
      }
    }

    // Apply additional filters
    if (filters.location) {
      query.location = { $regex: filters.location, $options: "i" };
    }
    if (filters.rating) {
      query.rating = { $gte: filters.rating };
    }
    if (filters.isAvailableNow) {
      appendAvailabilityQuery(query);
    }

    const skip = (page - 1) * limit;

    try {
      console.log("Final query:", JSON.stringify(query, null, 2));

      const [data, total] = await Promise.all([
        ArtisanModel.find(query)
          .lean()
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        ArtisanModel.countDocuments(query),
      ]);

      console.log(`Found ${total} artisans matching search criteria`);

      const result = {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      // Cache for 60 seconds
      await redis.setEx(cacheKey, 60, JSON.stringify(result));
      return result;
    } catch (error) {
      console.error("Artisan search error:", error);
      throw error;
    }
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

    console.log("Service search keyword:", keyword);
    console.log("Cache key:", cacheKey);

    const query: any = {
      isActive: true,
    };

    if (keyword?.trim()) {
      const searchTerm = keyword.trim();
      const serviceSearchConditions: any[] = [];

      console.log("Processing service search term:", searchTerm);

      // Search in service fields
      const serviceFieldConditions = this.createSearchConditions(searchTerm, [
        "title",
        "description",
      ]);
      serviceSearchConditions.push(...serviceFieldConditions);

      // Find artisans that match the search term
      const artisanSearchConditions = this.createSearchConditions(searchTerm, [
        "fullName",
        "businessName",
      ]);

      // Add skillSet search for artisans
      const words = searchTerm
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 1);

      // For skillSet, search for the exact term
      artisanSearchConditions.push({
        skillSet: { $regex: this.escapeRegex(searchTerm), $options: "i" },
      });

      // If multiple words, require ALL words to be present in skillSet
      if (words.length > 1) {
        const allWordsRegex = words
          .map((word) => `(?=.*${this.escapeRegex(word)})`)
          .join("");
        artisanSearchConditions.push({
          skillSet: {
            $regex: `^${allWordsRegex}.*`,
            $options: "i",
          },
        });
      }

      if (artisanSearchConditions.length > 0) {
        const matchingArtisans = await ArtisanModel.find({
          role: "ARTISAN",
          $or: artisanSearchConditions,
        })
          .select("_id")
          .lean();

        if (matchingArtisans.length > 0) {
          serviceSearchConditions.push({
            artisanId: { $in: matchingArtisans.map((a) => a._id) },
          });
        }
      }

      if (serviceSearchConditions.length > 0) {
        query.$or = serviceSearchConditions;
        console.log("Service search query:", JSON.stringify(query, null, 2));
      }
    }

    // Apply category/location filters
    if (filters.category || filters.location) {
      const artisanQ: any = { role: "ARTISAN" };
      if (filters.category) artisanQ.skillSet = { $in: [filters.category] };
      if (filters.location)
        artisanQ.location = { $regex: filters.location, $options: "i" };

      const artisanIds = await ArtisanModel.find(artisanQ).select("_id").lean();

      if (!artisanIds.length) {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }

      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { artisanId: { $in: artisanIds.map((a) => a._id) } },
        ];
        delete query.$or;
      } else {
        query.artisanId = { $in: artisanIds.map((a) => a._id) };
      }
    }

    // Apply other filters
    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = filters.minPrice;
      if (filters.maxPrice) query.price.$lte = filters.maxPrice;
    }

    if (filters.rating) {
      query.rating = { $gte: filters.rating };
    }

    const skip = (page - 1) * limit;

    try {
      console.log("Final service query:", JSON.stringify(query, null, 2));

      const [data, total] = await Promise.all([
        ServiceModel.find(query)
          .lean()
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        ServiceModel.countDocuments(query),
      ]);

      console.log(`Found ${total} services matching search criteria`);

      const result = {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      await redis.setEx(cacheKey, 60, JSON.stringify(result));
      return result;
    } catch (error) {
      console.error("Service search error:", error);
      throw error;
    }
  }
}

// Helper for "isAvailableNow"
function appendAvailabilityQuery(q: any) {
  const now = new Date();
  const currentDay = now
    .toLocaleString("en-US", { weekday: "long" })
    .toLowerCase();
  const currentTime = now.getHours() * 100 + now.getMinutes();

  q[`businessHours._schedule.${currentDay}.open`] = { $ne: "closed" };
  q[`businessHours._schedule.${currentDay}.close`] = { $ne: "closed" };

  // Convert time strings to numbers for comparison
  q.$expr = {
    $and: [
      {
        $lte: [
          {
            $toInt: {
              $replaceAll: {
                input: `$businessHours._schedule.${currentDay}.open`,
                find: ":",
                with: "",
              },
            },
          },
          currentTime,
        ],
      },
      {
        $gte: [
          {
            $toInt: {
              $replaceAll: {
                input: `$businessHours._schedule.${currentDay}.close`,
                find: ":",
                with: "",
              },
            },
          },
          currentTime,
        ],
      },
    ],
  };
}
