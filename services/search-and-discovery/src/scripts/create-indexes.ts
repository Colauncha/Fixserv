// scripts/create-indexes.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config(); // gets MONGO_URI from .env

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);

  const artisanCol = mongoose.connection.collection("artisanmodels");
  const serviceCol = mongoose.connection.collection("servicemodels");

  console.log("🚀 Creating indexes...");

  // ===============================
  // ARTISAN INDEXES
  // ===============================

  // 1️⃣ Text index for keyword search (primary search method)
  console.log("Creating artisan text search index...");
  await artisanCol.createIndex(
    {
      fullName: "text",
      businessName: "text",
      skillSet: "text",
    },
    {
      name: "txt_artisan_search",
      background: true,
      weights: {
        fullName: 10, // Higher weight for name matches
        businessName: 8, // Medium weight for business names
        skillSet: 5, // Lower weight for skills
      },
    }
  );

  // 2️⃣ Individual field indexes for regex fallback searches
  console.log("Creating artisan field-specific indexes...");
  await artisanCol.createIndex(
    { fullName: 1 },
    { name: "fullName_1", background: true }
  );

  await artisanCol.createIndex(
    { businessName: 1 },
    { name: "businessName_1", background: true }
  );

  await artisanCol.createIndex(
    { skillSet: 1 },
    { name: "skillSet_1", background: true }
  );

  // 3️⃣ Location index for location-based searches
  await artisanCol.createIndex(
    { location: 1 },
    { name: "location_1", background: true }
  );

  // 4️⃣ Compound indexes for filtering & sorting
  await artisanCol.createIndex(
    { role: 1, rating: -1 },
    { name: "role_rating", background: true }
  );

  await artisanCol.createIndex(
    { role: 1, location: 1, rating: -1 },
    { name: "role_location_rating", background: true }
  );

  // 5️⃣ Availability search support
  await artisanCol.createIndex(
    {
      role: 1,
      "businessHours._schedule.monday.open": 1,
      "businessHours._schedule.monday.close": 1,
    },
    { name: "availability_monday", background: true, sparse: true }
  );

  // Create similar indexes for other days of the week
  const weekDays = [
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  for (const day of weekDays) {
    await artisanCol.createIndex(
      {
        role: 1,
        [`businessHours._schedule.${day}.open`]: 1,
        [`businessHours._schedule.${day}.close`]: 1,
      },
      { name: `availability_${day}`, background: true, sparse: true }
    );
  }

  // ===============================
  // SERVICE INDEXES
  // ===============================

  // 1️⃣ Text index for service content search
  console.log("Creating service text search index...");
  await serviceCol.createIndex(
    {
      title: "text",
      description: "text",
    },
    {
      name: "txt_service_search",
      background: true,
      weights: {
        title: 10, // Higher weight for title matches
        description: 3, // Lower weight for description matches
      },
    }
  );

  // 2️⃣ Individual field indexes for regex fallback
  console.log("Creating service field-specific indexes...");
  await serviceCol.createIndex(
    { title: 1 },
    { name: "title_1", background: true }
  );

  await serviceCol.createIndex(
    { description: 1 },
    { name: "description_1", background: true }
  );

  // 3️⃣ ArtisanId index (crucial for linking services to artisans)
  await serviceCol.createIndex(
    { artisanId: 1 },
    { name: "artisanId_1", background: true }
  );

  // 4️⃣ Compound indexes for filtering & sorting
  await serviceCol.createIndex(
    { isActive: 1, price: 1, rating: -1 },
    { name: "active_price_rating", background: true }
  );

  await serviceCol.createIndex(
    { isActive: 1, artisanId: 1, rating: -1 },
    { name: "active_artisan_rating", background: true }
  );

  await serviceCol.createIndex(
    { isActive: 1, rating: -1, createdAt: -1 },
    { name: "active_rating_created", background: true }
  );

  // 5️⃣ Price range queries
  await serviceCol.createIndex(
    { isActive: 1, price: 1 },
    { name: "active_price", background: true }
  );

  // ===============================
  // PERFORMANCE OPTIMIZATION INDEXES
  // ===============================

  // 6️⃣ Multi-field compound indexes for common query patterns
  console.log("Creating performance optimization indexes...");

  // For artisan searches with location and category filters
  await artisanCol.createIndex(
    { role: 1, skillSet: 1, location: 1, rating: -1 },
    { name: "role_skill_location_rating", background: true }
  );

  // For service searches with category and price filters
  await serviceCol.createIndex(
    { isActive: 1, price: 1, rating: -1, createdAt: -1 },
    { name: "active_price_rating_created", background: true }
  );

  // For cross-referencing services by artisan skills and location
  await artisanCol.createIndex(
    { skillSet: 1, location: 1 },
    { name: "skill_location", background: true }
  );

  // ===============================
  // CLEANUP & VERIFICATION
  // ===============================

  console.log("📊 Verifying created indexes...");

  const artisanIndexes = await artisanCol.indexes();
  const serviceIndexes = await serviceCol.indexes();

  console.log(`✅ Artisan collection indexes: ${artisanIndexes.length}`);
  console.log(`✅ Service collection indexes: ${serviceIndexes.length}`);

  // Optional: Log index names for verification
  console.log("\n📝 Artisan indexes:");
  artisanIndexes.forEach((idx) => console.log(`  - ${idx.name}`));

  console.log("\n📝 Service indexes:");
  serviceIndexes.forEach((idx) => console.log(`  - ${idx.name}`));

  console.log("\n🎉 All indexes created successfully!");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Index creation failed:", err);
  console.error("Stack trace:", err.stack);
  process.exit(1);
});
// scripts/create-indexes.js
/*
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config(); // gets MONGO_URI from .env

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);

  const artisanCol = mongoose.connection.collection("artisanmodels");
  const serviceCol = mongoose.connection.collection("servicemodels");

  console.log("🚀 Creating indexes...");

  // ===============================
  // ARTISAN INDEXES
  // ===============================

  // 1️⃣ Text index for keyword search (primary search method)
  console.log("Creating artisan text search index...");
  await artisanCol.createIndex(
    {
      fullName: "text",
      businessName: "text",
      skillSet: "text",
    },
    {
      name: "txt_artisan_search",
      background: true,
      weights: {
        fullName: 10, // Higher weight for name matches
        businessName: 8, // Medium weight for business names
        skillSet: 5, // Lower weight for skills
      },
    }
  );

  // 2️⃣ Individual field indexes for regex fallback searches
  console.log("Creating artisan field-specific indexes...");
  await artisanCol.createIndex(
    { fullName: 1 },
    { name: "fullName_1", background: true }
  );

  await artisanCol.createIndex(
    { businessName: 1 },
    { name: "businessName_1", background: true }
  );

  await artisanCol.createIndex(
    { skillSet: 1 },
    { name: "skillSet_1", background: true }
  );

  // 3️⃣ Location index for location-based searches
  await artisanCol.createIndex(
    { location: 1 },
    { name: "location_1", background: true }
  );

  // 4️⃣ Compound indexes for filtering & sorting
  await artisanCol.createIndex(
    { role: 1, rating: -1 },
    { name: "role_rating", background: true }
  );

  await artisanCol.createIndex(
    { role: 1, location: 1, rating: -1 },
    { name: "role_location_rating", background: true }
  );

  // 5️⃣ Availability search support
  await artisanCol.createIndex(
    {
      role: 1,
      "businessHours._schedule.monday.open": 1,
      "businessHours._schedule.monday.close": 1,
    },
    { name: "availability_monday", background: true, sparse: true }
  );

  // Create similar indexes for other days of the week
  const weekDays = [
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  for (const day of weekDays) {
    await artisanCol.createIndex(
      {
        role: 1,
        [`businessHours._schedule.${day}.open`]: 1,
        [`businessHours._schedule.${day}.close`]: 1,
      },
      { name: `availability_${day}`, background: true, sparse: true }
    );
  }

  // ===============================
  // SERVICE INDEXES
  // ===============================

  // 1️⃣ Text index for service content search
  console.log("Creating service text search index...");
  await serviceCol.createIndex(
    {
      title: "text",
      description: "text",
    },
    {
      name: "txt_service_search",
      background: true,
      weights: {
        title: 10, // Higher weight for title matches
        description: 3, // Lower weight for description matches
      },
    }
  );

  // 2️⃣ Individual field indexes for regex fallback
  console.log("Creating service field-specific indexes...");
  await serviceCol.createIndex(
    { title: 1 },
    { name: "title_1", background: true }
  );

  await serviceCol.createIndex(
    { description: 1 },
    { name: "description_1", background: true }
  );

  // 3️⃣ ArtisanId index (crucial for linking services to artisans)
  await serviceCol.createIndex(
    { artisanId: 1 },
    { name: "artisanId_1", background: true }
  );

  // 4️⃣ Compound indexes for filtering & sorting
  await serviceCol.createIndex(
    { isActive: 1, price: 1, rating: -1 },
    { name: "active_price_rating", background: true }
  );

  await serviceCol.createIndex(
    { isActive: 1, artisanId: 1, rating: -1 },
    { name: "active_artisan_rating", background: true }
  );

  await serviceCol.createIndex(
    { isActive: 1, rating: -1, createdAt: -1 },
    { name: "active_rating_created", background: true }
  );

  // 5️⃣ Price range queries
  await serviceCol.createIndex(
    { isActive: 1, price: 1 },
    { name: "active_price", background: true }
  );

  // ===============================
  // PERFORMANCE OPTIMIZATION INDEXES
  // ===============================

  // 6️⃣ Multi-field compound indexes for common query patterns
  console.log("Creating performance optimization indexes...");

  // For artisan searches with location and category filters
  await artisanCol.createIndex(
    { role: 1, skillSet: 1, location: 1, rating: -1 },
    { name: "role_skill_location_rating", background: true }
  );

  // For service searches with category and price filters
  await serviceCol.createIndex(
    { isActive: 1, price: 1, rating: -1, createdAt: -1 },
    { name: "active_price_rating_created", background: true }
  );

  // For cross-referencing services by artisan skills and location
  await artisanCol.createIndex(
    { skillSet: 1, location: 1 },
    { name: "skill_location", background: true }
  );

  // ===============================
  // CLEANUP & VERIFICATION
  // ===============================

  console.log("📊 Verifying created indexes...");

  const artisanIndexes = await artisanCol.indexes();
  const serviceIndexes = await serviceCol.indexes();

  console.log(`✅ Artisan collection indexes: ${artisanIndexes.length}`);
  console.log(`✅ Service collection indexes: ${serviceIndexes.length}`);

  // Optional: Log index names for verification
  console.log("\n📝 Artisan indexes:");
  artisanIndexes.forEach((idx) => console.log(`  - ${idx.name}`));

  console.log("\n📝 Service indexes:");
  serviceIndexes.forEach((idx) => console.log(`  - ${idx.name}`));

  console.log("\n🎉 All indexes created successfully!");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Index creation failed:", err);
  console.error("Stack trace:", err.stack);
  process.exit(1);
});

*/
/*
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
*/
