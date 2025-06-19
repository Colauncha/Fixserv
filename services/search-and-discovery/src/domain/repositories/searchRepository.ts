import { SearchFilter } from "../value-ojects/searchFilter";

export interface searchRepository {
  searchArtisans(keyword: string, filters: SearchFilter): Promise<any[]>;
  searchServices(keyword: string, filters: SearchFilter): Promise<any[]>;
}
