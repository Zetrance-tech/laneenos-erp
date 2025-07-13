import mongoose from "mongoose";
import dotenv from "dotenv";
import Counter from "../models/counter.js"; // Adjust path as needed
// import counter from "../models/counter.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const MONGODB_URI = process.env.MONGODB_URI;



const migrateCounters = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const legacyDocs = await Counter.collection.find({ type: { $exists: false } }).toArray();

    for (const doc of legacyDocs) {
      const { _id, sequence, branchId } = doc;

      const exists = await Counter.findOne({ type: _id, branchId });
      if (exists) {
        console.log(`⚠️ Skipping duplicate: type=${_id} branch=${branchId}`);
        continue;
      }

      const newDoc = {
        type: _id,
        sequence,
        branchId,
        legacyId: _id
      };

      await Counter.collection.insertOne(newDoc);
      console.log(`✅ Migrated: ${_id} → { type: ${_id}, branch: ${branchId} }`);
    }

    await Counter.collection.deleteMany({ type: { $exists: false } });
    console.log("🧹 Removed legacy documents");

    await Counter.collection.createIndex({ type: 1, branchId: 1 }, { unique: true });
    console.log("📌 Created compound index on { type, branchId }");

    console.log("🎉 Migration complete and data preserved");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during migration:", error.message);
    process.exit(1);
  }
};

migrateCounters();
