jest.mock("../../infrastructure/clients/reviewClient", () => {
  return {
    ReviewRepositoryClient: jest.fn().mockImplementation(() => ({
      findPublishedByService: jest
        .fn()
        .mockResolvedValue([{ serviceRating: 4.5 }]),
    })),
  };
});

console.log("✅ Mock ReviewRepositoryClient used");

jest.mock("../../domain/services/ratingCalculator", () => ({
  RatingCalculator: jest.fn().mockImplementation(() => ({
    calculateAverageServiceRating: jest.fn().mockResolvedValue(4.5),
  })),
}));

jest.mock("../../infrastructure/utils/redisUtils", () => ({
  clearServiceCache: jest.fn().mockResolvedValue(undefined),
}));

import app from "../../interfaces/http/expressApp";
import {
  capturedHandler,
  setCapturedHandler,
} from "../../test/__mocks__/redisBus";

import request from "supertest";

import { ServiceRatedEvent } from "../../events/serviceRatedEvent";
import { ServiceModel } from "../../infrastructure/persistence/model/service";
import { ServiceRepositoryImpl } from "../../infrastructure/serviceRepositoryImpl";
import { ArtisanModel } from "../../modules-from-other-services/artisan";

describe("ServiceRatedEvent Subscription", () => {
  beforeEach(async () => {
    await ArtisanModel.create({
      _id: "71f5df44-384b-4d5a-8012-88ccf517d113",
      email: "a@example.com",
      fullName: "Test Artisan",
      password: "secret",
      role: "ARTISAN",
      businessName: "Fix It Co",
      location: "Lagos",
      rating: 1,
      skillSet: ["plumbing"],
      businessHours: {
        _schedule: {
          monday: { open: "09:00", close: "17:00" },
        },
      },
    });
  });
  it("updates service rating in Mongo", async () => {
    const response = await request(app)
      .post("/api/service/createService")
      .send({
        artisanId: "71f5df44-384b-4d5a-8012-88ccf517d113",
        title: "Plumber",
        description: "Professional plumbling service",
        price: 90,
        estimatedDuration: "2 days",
        rating: 1,
      })
      .expect(201);

    const serviceId = response.body.id;

    const serviceRepo = new ServiceRepositoryImpl();
    setCapturedHandler(async (event: ServiceRatedEvent) => {
      const serviceId = event.payload?.serviceId;
      const newRating = event.payload?.newRating;
      console.log("🔥 Handler called with", { serviceId, newRating });
      await serviceRepo.updateRating(serviceId, newRating);
    });

    await capturedHandler!(
      new ServiceRatedEvent({ serviceId, newRating: 4.5 })
    );

    const updated = await ServiceModel.findById(serviceId);
    expect(updated).not.toBeNull();
    expect(updated!.rating).toBe(4.5);
  });
});
