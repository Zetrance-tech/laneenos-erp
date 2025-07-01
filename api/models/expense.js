import mongoose from "mongoose";
import Counter from "./counter.js";

const expenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    unique: true,
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  dateOfExpense: {
    type: Date,
    required: true
  },
  vendorName: {
    type: String,
    required: true
  },
  expenseCategory: {
    type: String,
    required: true,
  },
  amountSpent: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Unpaid'
  },
  paymentDate: {
    type: Date,
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Cheque', 'Online Payment', ''], // Added payment modes
    default: ''
  },
  bankName: {
    type: String,
    required: function() { return this.paymentMode === 'Cheque'; } // Required if paymentMode is Cheque
  },
  chequeNumber: {
    type: String,
    required: function() { return this.paymentMode === 'Cheque'; } // Required if paymentMode is Cheque
  },
  chequeDate: {
    type: Date,
    required: function() { return this.paymentMode === 'Cheque'; } // Required if paymentMode is Cheque
  },
  transactionId: {
    type: String,
    required: function() { return this.paymentMode === 'Online Payment'; } // Required if paymentMode is Online Payment
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Pre-save hook to generate expense number
expenseSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: 'expense_number' },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );
      this.expenseNumber = `EXP-${counter.sequence.toString().padStart(6, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

export default mongoose.model("Expense", expenseSchema);