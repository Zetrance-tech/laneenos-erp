import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  branchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Branch", 
      required: true 
    },
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  sessionId: { type: String, required: true},
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'completed'], 
    default: 'inactive' 
  }
}, { timestamps: true });

export default mongoose.model("Session", sessionSchema);