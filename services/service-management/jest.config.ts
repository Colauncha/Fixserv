import { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"], // automatically resolves
  testPathIgnorePatterns: ["<rootDir>/src/test"],
  setupFilesAfterEnv: [
    "<rootDir>/src/test/setup.ts",
    "<rootDir>/src/test/setupBus.ts",
  ],
};

export default config;
