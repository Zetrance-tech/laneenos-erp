// import mongoose from "mongoose";

// const cctvSchema = new mongoose.Schema({
//   channelId: {
//     type: String,
//     required: true,
//     unique: true // e.g., "channel1", "channel2", ..., "channel8"
//   },
//   rtspUrl: {
//     type: String,
//     required: true // RTSP URL, e.g., "rtsp://username:password@camera_ip:port/stream"
//   },
//   classId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Class",
//     required: true // Links CCTV to a specific class
//   },
//   description: {
//     type: String,
//     default: "" // e.g., "Front Gate Camera", "Classroom 1"
//   },
//   active: {
//     type: Boolean,
//     default: true // Whether the channel is operational
//   },
//   branchId: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: "Branch", 
//     required: true // References Branch._id
//   },
// }, { timestamps: true });

// export default mongoose.model("CCTV", cctvSchema);

import mongoose from "mongoose";

const cctvSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    cctvId: {
      type: String,
      required: true,
    },
    cctvName: {
      type: String,
      required: true,
    },
    cctvLink: {
      type: String,
      required: true,
    },
    photoUrl: {
      type: String,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("CCTV", cctvSchema);