import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    default: null // Present, Absent, Holiday, Closed
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  timetableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Timetable",
    required: false
  },
}, { timestamps: true });

export default mongoose.model("Attendance", attendanceSchema);