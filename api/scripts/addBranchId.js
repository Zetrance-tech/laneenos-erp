import mongoose from "mongoose";
import dotenv from "dotenv"
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const MONGO_URI = process.env.MONGODB_URI;





const BRANCH_ID = new mongoose.Types.ObjectId("6873f10a4cea2fb711bb6434");







const collectionsToUpdate = [
  "users",
  "classes",
  "consentresponses",
  "consents",
  "counters",
  "enquiries",
  "events",
  "expenses",
  "feedbacks",
  "feesconcessions",
  "feesgroups",
  "feetemplates",
  "homework",
  "leaves",
  "meals",
  "messages",
  "notices",
  "parents",
  "sessions",
  "staffattendances",
  "studentfees",
  "students",
  "suggestions",
  "teachers",
  "timetables",
  "attendances",
  "homeworks"
];

async function updateDocuments() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("Connected to MongoDB");

    for (const collection of collectionsToUpdate) {
      const result = await mongoose.connection.db.collection(collection).updateMany(
        { branchId: { $exists: false } },
        { $set: { branchId: BRANCH_ID } }
      );
      console.log(`✅ Updated '${collection}': ${result.modifiedCount} documents`);
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error updating documents:", error.message);
  }
}

updateDocuments();
