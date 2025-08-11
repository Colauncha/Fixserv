jest.mock("@fixserv-colauncha/shared", () => {
  const originalModule = jest.requireActual("@fixserv-colauncha/shared");
  const redisEventBusMock = require("../test/__mocks__/redisBus");
  const authMock = require("../test/__mocks__/requireAuth");
  const roleMock = require("../test/__mocks__/requireRole");

  return {
    ...originalModule,
    RedisEventBus: redisEventBusMock.RedisEventBus,
    mockPublish: redisEventBusMock.mockPublish,
    mockSubscribe: redisEventBusMock.mockSubscribe,
    AuthMiddleware: authMock.AuthMiddleware,
    requireRole: roleMock.requireRole,
  };
});
