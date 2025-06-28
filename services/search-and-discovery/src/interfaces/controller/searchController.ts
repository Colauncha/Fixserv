import { Request, Response } from "express";
import { SearchService } from "../../application/searchService";

export class SearchController {
  constructor(private searchService: SearchService) {}
  async search(req: Request, res: Response) {
    const {
      keyword="",
      location,
      category,
      minPrice,
      maxPrice,
      rating,
      isAvailableNow,
      page = "1",
      limit = "20",
    } = req.query;

    const filters = {
      category: category as string,
      location: location as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      rating: rating ? Number(rating) : undefined,
      isAvailableNow: isAvailableNow === "true",
    };

    const results = await this.searchService.searchAll(
      keyword as string,
      filters,
      Number(page),
      Number(limit)
    );
    res.json({ success: true, data: results });
  }
}
