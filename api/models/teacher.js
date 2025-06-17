// // models/teacher.js
// import mongoose from "mongoose";

// const teacherSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//     unique: true, 
//   },
//   role: {
//     type: String,
//     required: true,
//   },
//   id:{
//     type: String,
//     required: true,
//     unique: true,
//   },
//   name: {
//     type: String,
//     required: true, 
//   },
//   email:{
//     type: String,
//     required:true,
//     unique: true
//   },
//   phoneNumber: {
//     type: String,
//     required: true,
//   },
//   dateOfBirth: {
//     type: Date,
//     required: true, 
//   },
//   gender: {
//     type: String,
//     enum: ["male", "female", "other"],
//     required: true,
//   },
  
//   address: {
//     street: { type: String, required: true },
//     city: { type: String, required: true },
//     state: { type: String, required: true },
//     postalCode: { type: String, required: true },
//   },
//   emergencyContact:{
//     type: String, 
//     required: true
//   },
//   joiningDate: {
//     type: Date,
//     required: true,
//   },
//   experienceYears: {
//     type: Number,
//     required: true,
//     min: 0,
//   },
//   class:{
//     type:String,
//     required:true
//   },
//   documents: [
//     {
//       name: { type: String, required: true },
//       url: { type: String, default: null }
//     }
//   ],
//   // qualifications: [{
//   //   degree: { type: String, required: true },
//   //   institution: { type: String, required: true },
//   //   completionYear: { type: Number, required: true }, 
//   // }],
  
//   payroll: {
//     epfNo: { type: String},
//     basicSalary: { type: Number, required: true, min: 0 },
//   },
//   contractType: {
//     type: String,
//     required: true,
//   },
//   workShift: {
//     type: String,
//     required: true,
//   },
//   workLocation: {
//     type: String,
//     required: true, 
//   },
//   dateOfLeaving: {
//     type: Date,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   },
// });
// teacherSchema.pre("save", function (next) {
//   this.updatedAt = new Date();
//   next();
// });

// export default mongoose.model("Teacher", teacherSchema);

import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  role: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
    unique: true,
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
  phoneNumber: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  emergencyContact: {
    type: String,
  },
  joiningDate: {
    type: Date,
    required: true,
  },
  experienceYears: {
    type: Number,
    required: true,
    min: 0,
  },
  documents: [
    {
      name: { type: String, required: true },
      url: { type: String, default: null },
    },
  ],
  payroll: {
    epfNo: { type: String },
    basicSalary: { type: Number, min: 0 },
  },
  contractType: {
    type: String,
    required: true,
  },
  workShift: {
    type: String,
    required: true,
  },
  workLocation: {
    type: String,
  },
  dateOfLeaving: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

teacherSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Teacher", teacherSchema);