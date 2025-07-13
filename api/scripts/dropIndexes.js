import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });


const MONGODB_URI = process.env.MONGODB_URI;
// console.log(MONGODB_URI)
const indexesToDrop = [
  { collection: "classes", indexName: "id_1" },
  { collection: "sessions", indexName: "sessionId_1" },
  { collection: "expenses", indexName: "expenseNumber_1" },
  { collection: "teachers", indexName: "id_1" },
  { collection: "students", indexName: "admissionnumber_1" },
  { collection: "studentfees", indexName: "paymentId_1" }, 
  {collection:"cctv", indexName:"channelId_1"},
  {collection:"cctv", indexName:"cctvId_1"},
];

const dropIndexes = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    for (const { collection, indexName } of indexesToDrop) {
      const coll = mongoose.connection.collection(collection);
      try {
        await coll.dropIndex(indexName);
        console.log(`🗑️ Dropped index '${indexName}' from '${collection}'`);
      } catch (err) {
        if (err.codeName === "IndexNotFound" || err.message.includes("index not found")) {
          console.warn(`⚠️ Index '${indexName}' not found in '${collection}', skipping...`);
        } else {
          console.warn(`❌ Failed to drop '${indexName}' from '${collection}': ${err.message}`);
        }
      }
    }

    console.log("✅ Index drop process completed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to connect or process indexes:", error.message);
    process.exit(1);
  }
};

dropIndexes();
