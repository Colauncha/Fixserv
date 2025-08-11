jest.mock("../infrastructure/utils/redisUtils", () => ({
  clearServiceCache: jest.fn().mockResolvedValue(undefined),
}));

import { ServiceService } from "../application/services/serviceService";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { Artisan } from "../modules-from-other-services/domain/entities/artisan";
import { Service } from "../domain/entities/service";
import { mockPublish } from "../test/__mocks__/redisBus";

const mockSave = jest.fn();
const mockFindById = jest.fn();

describe("serviceService", () => {
  const artisanRepository = { findById: mockFindById } as any;
  const serviceRepository = { save: mockSave } as any;
  const serviceService = new ServiceService(
    serviceRepository,
    artisanRepository
  );
  it("should throw BadRequestError for invalid Artisan", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(
      serviceService.createService(
        "invalid-id",
        "Tiling",
        "Tile work",
        200,
        "2 days",
        4.5
      )
    ).rejects.toThrow(BadRequestError);
  });

  it("should create a service and publish event", async () => {
    const mockArtisan: Artisan = {
      id: "artisan-123",
      email: "artisan@test.com",
      role: "ARTISAN",
    } as any;
    mockFindById.mockResolvedValue(mockArtisan);
    mockSave.mockResolvedValue(undefined);
    const result = await serviceService.createService(
      mockArtisan.id,
      "Plumbing",
      "Pipe fixing",
      100,
      "3 hours",
      5
    );
    expect(result).toBeInstanceOf(Service);
    expect(mockSave).toHaveBeenCalled();
    expect(mockPublish).toHaveBeenCalledWith(
      "service_events",
      expect.any(Object)
    );
  });
});
