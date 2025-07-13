import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  branchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Branch", 
      required: true 
    },
  status: {
    type: String,
    enum: ["enquiry generated", "in process", "admission taken"],
    default: "enquiry generated",
  },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  name: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ["male", "female", "other"], required: true },
  bloodGroup: { type: String },
  religion: { type: String },
  category: { type: String },
  fatherInfo: {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    occupation: { type: String, default: "" },
  },
  motherInfo: {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    occupation: { type: String, default: "" },
  },
  guardianInfo: {
    name: { type: String, default: "" },
    relation: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    email: { type: String, default: "" },
    occupation: { type: String, default: "" },
  },
  currentAddress: { type: String, default: "" },
  permanentAddress: { type: String, default: "" },
  remark: { type: String, default: "" },
});

export default mongoose.model("Enquiry", enquirySchema);