import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  branchId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  branchType: {
    type: String,
    enum: ["Daycare", "Daycare Kindergarten", "Premium Daycare", "Corporate Daycare"],
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  directorName: {
    type: String,
    required: true,
  },
  directorEmail: {
    type: String,
    required: true,
    unique: true,
  },
  directorPhoneNumber: {
    type: String,
    required: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
}, { timestamps: true });

export default mongoose.model("Branch", branchSchema);