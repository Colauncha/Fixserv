import { SearchFilter } from "../domain/value-ojects/searchFilter";
import { searchRepositoryImpls } from "../infrastructure/searchRepositoryImpls";

const searchRepo = new searchRepositoryImpls();

export class SearchService {
  async searchAll(
    keyword: string,
    filters: SearchFilter = {},
    page = 1,
    limit = 20
  ) {
    const [services, artisans] = await Promise.all([
      searchRepo.searchServices(keyword, filters, page, limit),
      searchRepo.searchArtisans(keyword, filters, page, limit),
    ]);

    return { services, artisans };
  }
}
