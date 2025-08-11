import { OfferedService } from "../entities/offeredService";

export interface IOfferedServiceRepository {
  create(offeredService: OfferedService): Promise<void>;
  findById(id: string): Promise<OfferedService | null>;
  findByArtisanId(artisanId: string): Promise<OfferedService[]>;
  findByBaseServiceId(baseServiceId: string): Promise<OfferedService[]>;
  findByArtisanAndBaseService(
    artisanId: string,
    baseServiceId: string
  ): Promise<OfferedService | null>;
}
