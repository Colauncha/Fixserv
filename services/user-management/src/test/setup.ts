import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

jest.setTimeout(180_000);

let mongo: MongoMemoryServer;

beforeAll(async () => {
  jest.clearAllMocks();
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri, {});
});

afterEach(async () => {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.collections();
  for (const col of collections) await col.deleteMany({});
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});
