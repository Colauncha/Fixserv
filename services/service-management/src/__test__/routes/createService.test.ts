jest.mock("../../infrastructure/utils/redisUtils", () => ({
  clearServiceCache: jest.fn().mockResolvedValue(undefined),
}));
import app from "../../interfaces/http/expressApp";
import request from "supertest";
import { ArtisanModel } from "../../modules-from-other-services/artisan";

describe("POST /api/service/createService", () => {
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

  it("should return 201 when service is created", async () => {
    const response = await request(app)
      .post("/api/service/createService")
      .send({
        artisanId: "71f5df44-384b-4d5a-8012-88ccf517d113",
        title: "Tiling",
        description: "Professional tile laying",
        price: 300,
        estimatedDuration: "1 day",
        rating: 4.8,
      });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe("Tiling");
  });

  it("should return 400 for missing fields", async () => {
    const response = await request(app)
      .post("/api/service/createService")
      .send({
        artisanId: "71f5df44-384b-4d5a-8012-88ccf517d113",
        title: "Tiling",
      });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
});
