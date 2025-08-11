jest.mock("../../infrastructure/clients/reviewRepositoryClient", () => {
  return {
    ReviewRepositoryClient: jest.fn().mockImplementation(() => ({
      getPublishedReviewsByArtisan: jest
        .fn()
        .mockResolvedValue([{ artisanRating: 4.5 }]),
    })),
  };
});

console.log("✅ Mock ReviewRepositoryClient used");

jest.mock("../../domain/services/ratingCalculator", () => ({
  RatingCalculator: jest.fn().mockImplementation(() => ({
    calculateAverageArtisanRating: jest.fn().mockResolvedValue(4.5),
  })),
}));

import app from "../../interfaces/http/expressApp";
import {
  capturedHandler,
  setCapturedHandler,
} from "../../test/__mocks__/redisBus";
app;
import request from "supertest";

import { ArtisanRatedEvent } from "../../events/artisanRatedEvent";
import { ArtisanModel } from "../../infrastructure/persistence/models/artisan";
import { UserRepositoryImpl } from "../../infrastructure/persistence/userRepositoryImpl";

describe("ArtisanRatedEvent Subscription", () => {
  it("updates artisan rating in Mongo", async () => {
    //create an artisan first
    const { body } = await request(app)
      .post("/api/users/register")
      .send({
        fullName: "Artisan One",
        email: "a1@example.com",
        password: "secret",
        role: "ARTISAN",
        artisanData: {
          businessName: "Fix Co",
          location: "Anywhere",
          rating: 0,
          skillSet: ["fix"],
          businessHours: {
            monday: { open: "09:00", close: "17:00" },
          },
        },
      })
      .expect(201);

    const artisanId = body._id;

    // 👇 Set the event handler HERE (not in setup.ts)
    const userRepo = new UserRepositoryImpl();
    setCapturedHandler(async (event: ArtisanRatedEvent) => {
      const artisanId = event.payload?.artisanId;
      const newRating = event.payload?.newRating;
      console.log("🔥 Handler called with", { artisanId, newRating });
      await userRepo.updateRating(artisanId, newRating);
    });
    // 🔥 Simulate event

    await capturedHandler!(
      new ArtisanRatedEvent({ artisanId, newRating: 4.5 })
    );

    //3 assert DB state
    const updated = await ArtisanModel.findById(artisanId);

    expect(updated).not.toBeNull();
    expect(updated!.rating).toBe(4.5);
  });
});
