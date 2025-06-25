// // import mongoose from "mongoose";

// // const studentFeeSchema = new mongoose.Schema({
// //   studentId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: "Student",
// //     required: true,
// //   },
// //   classId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: "Class",
// //     required: true,
// //   },
// //   sessionId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: "Session",
// //     required: true,
// //   },
// //   feesGroup: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: "FeesGroup",
// //     required: true,
// //   },
// //   amount: {
// //     type: Number,
// //     required: true,
// //     min: 0,
// //   },
// //   isCustom: {
// //     type: Boolean,
// //     default: false,
// //   },
// //   status: {
// //     type: String,
// //     enum: ["pending", "paid", "overdue"],
// //     default: "pending",
// //   },
// //   createdAt: {
// //     type: Date,
// //     default: Date.now,
// //   },
// //   updatedAt: {
// //     type: Date,
// //     default: Date.now,
// //   },
// // });
// // studentFeeSchema.pre("save", function (next) {
// //   this.updatedAt = Date.now();
// //   next();
// // });

// // export default mongoose.model("StudentFee", studentFeeSchema);

// import mongoose from "mongoose";
// const paymentDetailSchema = new mongoose.Schema({
//   modeOfPayment: {
//     type: String,
//     enum: ["Cash", "BankTransfer", "Cheque", "CardPayment", "Wallet", "IMPS"],
//     required: true,
//   },
//   collectionDate: {
//     type: Date,
//     required: true,
//   },
//   transactionNo: {
//     type: String,
//     default: null,
//   },
//   transactionDate: {
//     type: Date,
//     default: null,
//   },
//   chequeNo: {
//     type: String,
//     default: null,
//   },
//   chequeDate: {
//     type: Date,
//     default: null,
//   },
//   bankName: {
//     type: String,
//     default: null,
//   },
//   remarks: {
//     type: String,
//     default: null,
//   },
//   internalNotes: {
//     type: String,
//     default: null,
//   },
// });

// const studentFeeSchema = new mongoose.Schema({
//   studentId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Student",
//     required: true,
//   },
//   classId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Class",
//     required: true,
//   },
//   sessionId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Session",
//     required: true,
//   },
//   feesGroup: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "FeesGroup",
//     required: true,
//   },
//   amount: {
//     type: Number,
//     required: true,
//     min: 0,
//   },
//   originalAmount: {
//     type: Number,
//     required: true,
//     min: 0,
//   },
//   discount: {
//     type: Number,
//     default: 0,
//     min: 0,
//   },
//   dueDate: {
//     type: Date,
//     default:null,
//   },
//   month: {
//     type: String,
//     enum: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
//     required: true,
//   },
//   isCustom: {
//     type: Boolean,
//     default: false,
//   },
//   status: {
//     type: String,
//     enum: ["pending", "paid", "overdue"],
//     default: "pending",
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   },
//   generatedAt: {
//     type: Date,
//     default: null,
//   },
//   generationGroupId: { type: String },
//   merchantTransactionId: {
//     type: String,
//     default: null,
//   },
//   paymentDetails: [paymentDetailSchema],
//   excessAmount: {
//     type: Number,
//     default: 0,
//     min: 0,
//   },
// });

// studentFeeSchema.pre("save", function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// export default mongoose.model("StudentFee", studentFeeSchema);


import mongoose from "mongoose";

const paymentDetailSchema = new mongoose.Schema({
  paymentId: { type: String, required: true },
  modeOfPayment: {
    type: String,
    enum: ["Cash", "BankTransfer", "Cheque", "CardPayment", "Wallet", "IMPS"],
    required: true,
  },
  collectionDate: {
    type: Date,
    required: true,
  },
  amountPaid: { type: Number, required: true },
  transactionNo: {
    type: String,
    default: null,
  },
  transactionDate: {
    type: Date,
    default: null,
  },
  chequeNo: {
    type: String,
    default: null,
  },
  chequeDate: {
    type: Date,
    default: null,
  },
  bankName: {
    type: String,
    default: null,
  },
  remarks: {
    type: String,
    default: null,
  },
  internalNotes: {
    type: String,
    default: null,
  },
});

const feeComponentSchema = new mongoose.Schema({
  feesGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FeesGroup",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  originalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const studentFeeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
  },
  fees: [feeComponentSchema],
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  originalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  amountPaid: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  dueDate: {
    type: Date,
    default: null,
  },
  month: {
    type: String,
    enum: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
    required: true,
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
  status: { 
    type: String, 
    enum: ['pending', 'partially_paid', 'paid', 'overdue'],
    default: 'pending' 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  generatedAt: {
    type: Date,
    default: null,
  },
  generationGroupId: { type: String },
  merchantTransactionId: {
    type: String,
    default: null,
  },
  paymentDetails: [paymentDetailSchema],
  excessAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
});
studentFeeSchema.index({ studentId: 1, sessionId: 1, month: 1 });
studentFeeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("StudentFee", studentFeeSchema);