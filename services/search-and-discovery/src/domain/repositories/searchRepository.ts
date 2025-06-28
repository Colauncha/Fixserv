import { SearchFilter } from "../value-ojects/searchFilter";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface searchRepository {
  searchArtisans(
    keyword: string,
    filters: SearchFilter,
    page: number,
    limit: number
  ): Promise<PaginatedResult<any>>;
  searchServices(
    keyword: string,
    filters: SearchFilter,
    page: number,
    limit: number
  ): Promise<PaginatedResult<any>>;
}
