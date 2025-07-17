import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import Class from "../models/class.js";
import Session from "../models/session.js";
import Student from "../models/student.js";
import Teacher from "../models/teacher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGODB_URI;
// console.log(MONGO_URI)

const updateClassIds = async () => {
  const classes = await Class.find({});
  for (const cls of classes) {
    const originalId = cls.id;
    const updatedId = originalId.replace(/-[0-9]+-/, '-');

    if (originalId !== updatedId) {
      cls.id = updatedId;
      await cls.save();
      console.log(`Class Updated: ${originalId} → ${updatedId}`);
    }
  }
};

const updateSessionIds = async () => {
  const sessions = await Session.find({});
  for (const session of sessions) {
    const originalSessionId = session.sessionId;
    const updatedSessionId = originalSessionId.replace(/-[0-9]+-/, '-');

    if (originalSessionId !== updatedSessionId) {
      session.sessionId = updatedSessionId;
      await session.save();
      console.log(`Session Updated: ${originalSessionId} → ${updatedSessionId}`);
    }
  }
};

const updateStudentAdmissionNumbers = async () => {
  const students = await Student.find({});
  for (const student of students) {
    const originalAdmissionNumber = student.admissionNumber;
    const updatedAdmissionNumber = originalAdmissionNumber.replace(/-[0-9]+-/, '-');

    if (originalAdmissionNumber !== updatedAdmissionNumber) {
      student.admissionNumber = updatedAdmissionNumber;
      await student.save({ validateBeforeSave: false });
      console.log(`Student Updated: ${originalAdmissionNumber} → ${updatedAdmissionNumber}`);
    }
  }
};


const updateStaffIds = async () => {
  const staffMembers = await Teacher.find({});
  for (const staff of staffMembers) {
    const originalId = staff.id;
    const updatedId = originalId.replace(/-[0-9]+-/, '-');

    if (originalId !== updatedId) {
      staff.id = updatedId;
      await staff.save({ validateBeforeSave: false });
      console.log(`Staff Updated: ${originalId} → ${updatedId}`);
    }
  }
};

const runUpdates = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await updateClassIds();
    await updateSessionIds();
    await updateStudentAdmissionNumbers();
    await updateStaffIds();

    console.log("✅ All IDs updated.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during update:", err);
    process.exit(1);
  }
};

runUpdates();
