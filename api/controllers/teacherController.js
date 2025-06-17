import Teacher from "../models/teacher.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";

import Counter from "../models/counter.js";

export const getNextSequence = async (name) => {
  console.log(`getNextSequence called for ${name}`);
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence;
};

export const generateId = async (entityType) => {
  const sequence = await getNextSequence(`${entityType}_id`);
  switch (entityType) {
    case "class":
      return `LN-144-C${String(sequence).padStart(3, "0")}`; // LN-144-C001
    case "session":
      return `LN-144-S${String(sequence).padStart(3, "0")}`; // LN-144-S001
    case "student":
      return `LNS-144-${sequence}`; // LNS-144-1
    case "teacher":
      return `LNE-144-${sequence}`; // LNE-144-1
    default:
      throw new Error("Invalid entity type");
  }
};

// Get next teacher ID
export const getNextStaffId = async (req, res) => {
  try {
    const counter = await Counter.findOne({ _id: "teacher_id" });
    const sequence = counter ? counter.sequence + 1 : 1;
    const id = `LNE-144-${sequence}`;
    res.status(200).json({ id });
  } catch (error) {
    console.error(`Error generating teacher ID: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const createTeacher = async (req, res) => {
  const id = await generateId("teacher");
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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (id) {
      const existingTeacher = await Teacher.findOne({ id });
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

// Get all teachers
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate("userId", "name email phoneNumber role");
    res.status(200).json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get a single teacher by ID (MongoDB _id)
export const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate("userId", "name email phoneNumber role");
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
    const teacher = await Teacher.findOne({ id: req.params.id }).populate("userId", "name email phoneNumber role");
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
    const teacher = await Teacher.findOne({ id: req.params.id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (id && id !== teacher.id) {
      const existingTeacher = await Teacher.findOne({ id });
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
      await User.findByIdAndUpdate(teacher.userId, { email });
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
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    await User.findByIdAndDelete(teacher.userId);

    res.status(200).json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error.message);
    res.status(500).json({ message: error.message });
  }
};