import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["feedback", "suggestion", "complaint"],
    required: true,
  },
  content: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "resolved"],
    default: "pending",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
});

export default mongoose.model("Feedback", feedbackSchema);
