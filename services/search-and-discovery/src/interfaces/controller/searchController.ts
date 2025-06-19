import { Request, Response } from "express";
import { SearchService } from "../../application/searchService";

export class SearchController {
  constructor(private searchService:SearchService){}
  async search(req: Request, res: Response) {
    const {
      keyword,
      location,
      category,
      minPrice,
      maxPrice,
      rating,
      isAvailableNow,
    } = req.query;

    const filters = {
      category: category as string,
      location: location as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      rating: rating ? Number(rating) : undefined,
      isAvailableNow: isAvailableNow === "true",
    };

    const results = await this.searchService.searchAll(keyword as string, filters);
    res.json(results);
  }
}
