import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  type: { type: String, required: true },
  sequence: { type: Number, default: 0 },
  branchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Branch", 
    required: true 
  },
});
counterSchema.index({ type: 1, branchId: 1 }, { unique: true });
export default mongoose.model("Counter", counterSchema);