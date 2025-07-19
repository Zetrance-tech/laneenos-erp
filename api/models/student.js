import mongoose from "mongoose"
import User from "./user.js"

const studentSchema = new mongoose.Schema({
  branchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Branch", 
      required: true 
    },
  admissionNumber: { type: String, required: true },
  admissionDate: { type: Date, required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    default: null
  }, 
  name: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ["male", "female", "other"], required: true },
  bloodGroup: { type: String },
  religion: { type: String },
  category: { type: String },
  fatherInfo: {
    name: { type: String },
    email: { type: String },
    phoneNumber: { type: String },
    occupation: { type: String },
    image: { type: String, default: null },
    showCCTV: {
    type: Boolean,
    default: false,
    },
    cctvStartTime: {
      type: String,
    },
    cctvEndTime: {
      type: String,
    },
  },
  motherInfo: {
    name: { type: String },
    email: { type: String },
    phoneNumber: { type: String },
    occupation: { type: String },
    image: { type: String, default: null },
    showCCTV: {
    type: Boolean,
    default: false,
    },
    cctvStartTime: {
      type: String,
    },
    cctvEndTime: {
      type: String,
    },
  },
  guardianInfo: {
    name: { type: String },
    relation: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    occupation: { type: String },
    image: { type: String, default: null }
  },

  currentAddress: { type: String },
  permanentAddress: { type: String },

  transportInfo: {
    route: { type: String },
    vehicleNumber: { type: String },
    pickupPoint: { type: String }
  },
  documents: [
  {
    name: { type: String, required: true },
    url: { type: String, default: null }
  }
  ],

  medicalHistory: {
    condition: { type: String, enum: ["good", "bad", "other"] },
    allergies: [{ type: String }],
    medications: [{ type: String }]
  },
  profilePhoto: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  }
})
import bcrypt from "bcryptjs"

studentSchema.pre("save", async function(next) {
  const student = this

  const createUserIfNotExists = async (info, role) => {
    if (info && info.email && info.phoneNumber) {
      const existingUser = await User.findOne({ email: info.email })
      if (!existingUser) {
        const namePart = info.name ? info.name.split(" ")[0] : "parent"
        const phone = info.phoneNumber
        const last4 = phone.slice(-4)
        const rawPassword = `${namePart}@${last4}`
        const hashedPassword = await bcrypt.hash(rawPassword, 10)

        const newUser = new User({
          role,
          name: info.name || "Unnamed Parent/Guardian",
          email: info.email,
          password: hashedPassword,
          phone: phone,
          status: "active",
          branchId: student.branchId 
        })
        await newUser.save()
        console.log(`Created user for ${role}: ${info.email}`)
      }
    }
  }

  try {
    await createUserIfNotExists(student.fatherInfo, "parent")
    await createUserIfNotExists(student.motherInfo, "parent")
    next()
  } catch (error) {
    console.error("Error in pre-save hook:", error)
    next(error)
  }
})
const Student = mongoose.model("Student", studentSchema)
export default Student
