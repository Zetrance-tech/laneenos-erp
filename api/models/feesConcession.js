import mongoose from 'mongoose';

const feesConcessionSchema = new mongoose.Schema({
  branchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Branch", 
      required: true 
    },
  category: {
    type: String,
    required: true,
    enum: [
      'EWS',
      'Corporate Concession',
      'First Sibling Concession',
      'Staff Concession',
      'Management Concession',
      'Armed Forces Concession',
      'Second Sibling Concession',
      'Scholarship Concession',
      'Readmission Concession',
      'Girl Child Concession',
      'Early Enrollment Concession',
      'Other'
    ],
    trim: true
  },
  discounts: [{
    feesGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeesGroup',
      required: true
    },
    percentageDiscount: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
});

feesConcessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('FeesConcession', feesConcessionSchema);