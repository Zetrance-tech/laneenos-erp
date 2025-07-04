import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  month: {
    type: String, 
    required: true,
  },
  dayOfWeek: {
    type: String, 
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
    default: null,
  },
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "snack"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


export default mongoose.model("Meal", mealSchema);