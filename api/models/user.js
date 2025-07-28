import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      // enum: ["parent", "teacher", "admin", "student"],
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    lastLogin: {
      type: Date,
    },
    photo: { type: String, default: '' },
    branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: function () {
      return this.role !== "superadmin" && this.role !== "admin";
    },
  },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;