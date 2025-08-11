import { BaseEvent } from "@fixserv-colauncha/shared";

export const mockPublish = jest.fn();
export let capturedHandler: ((event: BaseEvent) => Promise<void>) | null = null;

export const RedisEventBus = {
  instance: jest.fn(() => ({
    publish: mockPublish,
    subscribe: jest.fn((_, handler) => {
      capturedHandler = handler;
      return { unsubscribe: async () => {} };
    }),
  })),
};

export function setCapturedHandler(fn: (event: BaseEvent) => Promise<void>) {
  capturedHandler = fn;
}
