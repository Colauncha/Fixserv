jest.mock("@fixserv-colauncha/shared", () => {
  const originalModule = jest.requireActual("@fixserv-colauncha/shared");
  const redisEventBusMock = require("../test/__mocks__/redisBus");

  return {
    ...originalModule,
    RedisEventBus: redisEventBusMock.RedisEventBus,
    mockPublish: redisEventBusMock.mockPublish,
    mockSubscribe: redisEventBusMock.mockSubscribe,
  };
});
