import { Review } from "../entities/review";

export interface ReviewRepository {
  save(review: Review): Promise<void>;
  findAll(): Promise<Review[]>;
  findById(id: string): Promise<Review | null>;
  findByArtisan(artisanId: string): Promise<Review[]>;
  update(review: Review): Promise<void>;
  findByService(serviceId: string): Promise<Review[]>;
  findByClient(clientId: string): Promise<Review[]>;
  findPublishedByArtisan(artisanId: string): Promise<Review[]>;
  findPublishedByService(serviceId: string): Promise<Review[]>;
  getAverageArtisanRating(artisanId: string): Promise<number>;
  getAverageServiceRating(serviceId: string): Promise<number>;
  delete(id: string): Promise<void>;
}
