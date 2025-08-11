import request from "supertest";
import app from "../../interfaces/http/expressApp";
import { ClientModel } from "../../infrastructure/persistence/models/client";
import { mockPublish } from "../../test/__mocks__/redisBus";

describe("POST /api/users/register", () => {
  it("should create a new client user", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({
        email: "test@example.com",
        password: "password123",
        fullName: "Test User",
        role: "CLIENT",
        clientData: {
          deliveryAddress: {
            street: "123 New Street",
            city: "New City",
            state: "Delta",
            postalCode: "10001",
            country: "Nigeria",
          },
          servicePreferences: ["plumbing", "repair"],
        },
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("email", "test@example.com");
    expect(res.body).toHaveProperty("role", "CLIENT");

    const userInDb = await ClientModel.findOne({ email: "test@example.com" });
    expect(userInDb).not.toBeNull();
  });
});

describe("Artisan Registration", () => {
  it("should publish artisanCreatedEvent to redis", async () => {
    const response = await request(app)
      .post("/api/users/register")
      .send({
        fullName: "Test Artisan",
        email: "artisan@example.com",
        password: "strongPassword",
        role: "ARTISAN",
        artisanData: {
          businessName: "Fixer Pro",
          location: "123 Tech Avenue",
          rating: 5,
          skillSet: ["phone repair", "screen replacement"],
          businessHours: {
            monday: { open: "09:00", close: "17:00" },
            tuesday: { open: "09:00", close: "17:00" },
            wednesday: { open: "09:00", close: "17:00" },
            thursday: { open: "09:00", close: "17:00" },
            friday: { open: "09:00", close: "17:00" },
            saturday: { open: "10:00", close: "14:00" },
            sunday: { open: "closed", close: "closed" },
          },
        },
      })
      .expect(201);

    expect(mockPublish).toHaveBeenCalledTimes(1);
    expect(mockPublish).toHaveBeenCalledWith(
      "artisan_events",
      expect.objectContaining({
        eventName: "ArtisanCreated",
        payload: expect.objectContaining({
          fullName: "Test Artisan",
          skills: expect.arrayContaining(["phone repair"]),
        }),
      })
    );
  });
});
