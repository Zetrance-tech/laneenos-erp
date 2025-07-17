import Teacher from "../models/teacher.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Counter from "../models/counter.js";
import Branch from "../models/branch.js";

export const getNextSequence = async (type, branchId) => {
  const counter = await Counter.findOneAndUpdate(
   { type: `${type}_id`, branchId },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true  }
  );
  return counter.sequence;
};

export const generateId = async (entityType, branchId) => {
  const sequence = await getNextSequence(entityType, branchId);
  switch (entityType) {
    case "class":
      return `LN-C${String(sequence).padStart(3, "0")}`;
    case "session":
      return `LN-S${String(sequence).padStart(3, "0")}`;
    case "student":
      return `LNS-${sequence}`;
    case "teacher":
      return `LNE-${sequence}`;
    default:
      throw new Error("Invalid entity type");
  }
};

// Get next teacher ID
export const getNextStaffId = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const counter = await Counter.findOne({ type: "teacher_id", branchId });
    const sequence = counter ? counter.sequence + 1 : 1;
    const id = `LNE-${sequence}`;
    res.status(200).json({ id });
  } catch (error) {
    console.error(`Error generating teacher ID: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const createTeacher = async (req, res) => {
  const { branchId } = req.user;
  console.log(req.user);
  const id = await generateId("teacher", branchId);
  console.log("Teacher-id-----------------------", id)
  const {
    role,
    email,
    name,
    phoneNumber,
    dateOfBirth,
    gender,
    address,
    emergencyContact,
    joiningDate,
    experienceYears,
    payroll,
    contractType,
    workShift,
    workLocation,
    dateOfLeaving,
    documents,
  } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Staff ID is required" });
  }
  if (!role) {
    return res.status(400).json({ message: "Role is required" });
  }
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone number is required" });
  }
  if (!address) {
    return res.status(400).json({ message: "Address is required" });
  }

  try {
    const phoneDigits = phoneNumber.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }
    const lastFourDigits = phoneDigits.slice(-4);

    const firstName = name.split(" ")[0].toLowerCase();
    const generatedPassword = `${firstName}@${lastFourDigits}`;

    const existingUser = await User.findOne({ email, branchId });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (id) {
      const existingTeacher = await Teacher.findOne({ id, branchId });
      if (existingTeacher) {
        return res.status(400).json({ message: "Teacher ID already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone: phoneNumber,
      role: role.toLowerCase(),
      status: "active",
      branchId
    });
    await newUser.save();
    console.log("New User: ", newUser);

    const newTeacher = new Teacher({
      userId: newUser._id,
      id,
      role,
      name,
      email,
      phoneNumber,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      joiningDate,
      experienceYears,
      payroll,
      contractType,
      workShift,
      workLocation,
      dateOfLeaving,
      documents,
      branchId
    });
    await newTeacher.save();
    console.log("NEW TEACHER ADDED");

    res.status(201).json({
      message: "Teacher added successfully",
      teacher: newTeacher,
    });
  } catch (error) {
    console.error("Error adding teacher:", error.message);
    res.status(500).json({ message: error.message });
  }
};


export const getAllStaffForSuperadmin = async (req, res) => {
  try {
    const { branchId, sessionId, classId, role } = req.query;
    const query = {};

    if (branchId) query.branchId = branchId;
    if (role) query.role = role;

    // Add class filter if needed (assuming teachers might be associated with classes)
    if (classId) {
      query['class'] = classId;
    }

    const staff = await Teacher.find(query)
      .populate({
        path: 'branchId',
        select: 'name',
        model: Branch
      })
      .populate('userId', 'email')
      .select('-__v -createdAt -updatedAt -documents');

    res.status(200).json({ 
      success: true, 
      data: staff,
      count: staff.length
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get all teachers
export const getAllTeachers = async (req, res) => {
  try {
  const { branchId } = req.user;
    console.log(req.user.branchId);

    const teachers = await Teacher.find({branchId}).populate("userId", "name email phoneNumber role");
    res.status(200).json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get a single teacher by ID (MongoDB _id)
export const getTeacherById = async (req, res) => {
  try {
  const { branchId } = req.user;

    const teacher = await Teacher.findOne({ _id: req.params.id, branchId }).populate("userId", "name email phoneNumber role");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.status(200).json(teacher);
  } catch (error) {
    console.error("Error fetching teacher:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get a single teacher by custom ID (id field)
export const getTeacherByCustomId = async (req, res) => {
  try {
  const { branchId } = req.user;

    const teacher = await Teacher.findOne({ id: req.params.id, branchId }).populate("userId", "name email phoneNumber role");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.status(200).json(teacher);
  } catch (error) {
    console.error("Error fetching teacher by custom ID:", error.message);
    res.status(500).json({ message: error.message });
  }
};



export const updateTeacher = async (req, res) => {
  const { branchId } = req.user;

  const {
    id,
    role,
    name,
    email,
    phoneNumber,
    dateOfBirth,
    gender,
    address,
    emergencyContact,
    joiningDate,
    experienceYears,
    payroll,
    contractType,
    workShift,
    workLocation,
    dateOfLeaving,
    documents,
  } = req.body;

  try {
    const teacher = await Teacher.findOne({ id: req.params.id , branchId});
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (id && id !== teacher.id) {
      const existingTeacher = await Teacher.findOne({ id, branchId });
      if (existingTeacher) {
        return res.status(400).json({ message: "Teacher ID already exists" });
      }
      teacher.id = id;
    }

    teacher.name = name || teacher.name;
    teacher.role = role || teacher.role;
    teacher.dateOfBirth = dateOfBirth || teacher.dateOfBirth;
    teacher.gender = gender || teacher.gender;
    teacher.phoneNumber = phoneNumber || teacher.phoneNumber;
    teacher.address = address || teacher.address;
    teacher.joiningDate = joiningDate || teacher.joiningDate;
    teacher.experienceYears = experienceYears !== undefined ? experienceYears : teacher.experienceYears;
    teacher.payroll = payroll || teacher.payroll;
    teacher.contractType = contractType || teacher.contractType;
    teacher.workShift = workShift || teacher.workShift;
    teacher.workLocation = workLocation || teacher.workLocation;
    teacher.dateOfLeaving = dateOfLeaving !== undefined ? dateOfLeaving : teacher.dateOfLeaving;
    teacher.emergencyContact = emergencyContact !== undefined ? emergencyContact : teacher.emergencyContact;
    teacher.documents = documents || teacher.documents;

    if (email && teacher.userId) {
      await User.findOneAndUpdate({ _id: teacher.userId, branchId }, { email });
    }

    const updatedTeacher = await teacher.save();
    await updatedTeacher.populate("userId", "name email phoneNumber");
    res.status(200).json({ message: "Teacher updated successfully", teacher: updatedTeacher });
  } catch (error) {
    console.error("Error updating teacher:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
  const { branchId } = req.user;

    const teacher = await Teacher.findOneAndDelete({ _id: req.params.id, branchId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    await User.findOneAndDelete({ _id: teacher.userId, branchId });

    res.status(200).json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error.message);
    res.status(500).json({ message: error.message });
  }
};


export const countTeacher = async (req, res) => {
  try {
    const { branchId } = req.user;

    const allTeachers = await mongoose.model("Teacher").find({ branchId }).populate({
      path: "userId",
      select: "status",
    });

    let active = 0, inactive = 0;

    for (const teacher of allTeachers) {
      if (teacher.userId?.status === "active") active++;
      else if (teacher.userId?.status === "inactive") inactive++;
    }

    const total = allTeachers.length;

    res.status(200).json({ total, active, inactive });
  } catch (error) {
    console.error("Error counting teachers:", error.message);
    res.status(500).json({ message: error.message });
  }
};

