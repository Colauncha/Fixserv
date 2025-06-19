import { SearchFilter } from "../domain/value-ojects/searchFilter";
import { searchRepositoryImpls } from "../infrastructure/searchRepositoryImpls";

const searchRepo = new searchRepositoryImpls();

export class SearchService {
  async searchAll(keyword: string, filters: SearchFilter = {}) {
    const [services, artisans] = await Promise.all([
      searchRepo.searchServices(keyword, filters),
      searchRepo.searchArtisans(keyword, filters),
    ]);

    return { services, artisans };
  }
}
