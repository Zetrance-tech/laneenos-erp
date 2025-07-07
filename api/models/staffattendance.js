import mongoose from "mongoose";
const staffAttendanceSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  status: {
    type: String, // e.g., "Present", "Absent", "Holiday", "Closed"
    default: null,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

staffAttendanceSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("StaffAttendance", staffAttendanceSchema);