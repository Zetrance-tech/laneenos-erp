import mongoose from "mongoose";
import Counter from "./counter.js";

const incomeSchema = new mongoose.Schema({
  branchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Branch", 
    required: true 
  },
  income_id: {
    type: String,
    required: true
  },
  income_title: {
    type: String,
    required: true
  },
  income_type: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  payment_method: {
    type: String,
  },
  receipt_date: {
    type: Date,
    required: true
  },
  received_from: {
    type: String,
    required: true
  },
  received_by: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    default: 'Unpaid'
  },
  paymentDate: {
    type: Date
  },
  bankName: {
    type: String
  },
  chequeNumber: {
    type: String
  },
  chequeDate: {
    type: Date
  },
  transactionId: {
    type: String
  },
  remarks: {
    type: String,
    trim: true
  },
}, {
  timestamps: true
});

// Pre-save hook to generate income_id
incomeSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { type: 'income_id', branchId: this.branchId },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );
      this.income_id = `INC-${counter.sequence.toString().padStart(6, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

export default mongoose.model("Income", incomeSchema);