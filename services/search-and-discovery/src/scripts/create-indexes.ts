// scripts/create-indexes.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config(); // gets MONGO_URI from .env

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);

  const artisanCol = mongoose.connection.collection("artisanmodels");
  const serviceCol = mongoose.connection.collection("servicemodels");

  // 1️⃣ text index for keyword search
  await artisanCol.createIndex(
    { fullName: "text", businessName: "text", skillSet: "text" },
    { name: "txt_artisan_search", background: true }
  );
  await serviceCol.createIndex(
    { title: "text", description: "text" },
    { name: "txt_service_search", background: true }
  );

  // 2️⃣ small compound indexes that help filtering & sorting
  await artisanCol.createIndex(
    { role: 1, rating: -1 },
    { name: "role_rating", background: true }
  );
  await serviceCol.createIndex(
    { isActive: 1, price: 1, rating: -1 },
    { name: "active_price_rating", background: true }
  );

  console.log("✅ indexes ensured");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ index creation failed:", err);
  process.exit(1);
});
