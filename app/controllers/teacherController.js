import Teacher from "../models/teacher.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";

// ✅ Create a new teacher (admin-only)
export const createTeacher = async (req, res) => {
  const {
    id, email, password, name, dateOfBirth, gender, phoneNumber,
    address, joiningDate, qualifications, experienceYears, subjects,
    payroll, contractType, workShift, workLocation, languagesSpoken,
    emergencyContact, bio,
  } = req.body;

  const { branchId } = req.user;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  try {
    const existingUser = await User.findOne({ email, branchId });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const existingTeacher = await Teacher.findOne({ id, branchId });
    if (existingTeacher) return res.status(400).json({ message: "Teacher ID already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone: phoneNumber,
      role: "teacher",
      status: "active",
      branchId,
    });
    await newUser.save();

    const newTeacher = new Teacher({
      userId: newUser._id,
      branchId,
      id,
      name,
      email,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      joiningDate,
      qualifications,
      experienceYears,
      subjects,
      payroll,
      contractType,
      workShift,
      workLocation,
      languagesSpoken,
      emergencyContact,
      bio,
    });
    await newTeacher.save();

    res.status(201).json({ message: "Teacher added successfully", teacher: newTeacher });
  } catch (error) {
    console.error("Error adding teacher:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get all teachers
export const getAllTeachers = async (req, res) => {
  try {
    const { branchId } = req.user;
    const teachers = await Teacher.find({ branchId }).populate("userId", "name email phone");
    res.status(200).json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get teacher by MongoDB _id
export const getTeacherById = async (req, res) => {
  try {
    const { branchId } = req.user;
    const teacher = await Teacher.findOne({ _id: req.params.id, branchId }).populate("userId", "name email phone");
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.status(200).json(teacher);
  } catch (error) {
    console.error("Error fetching teacher:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get teacher by custom `id` field
export const getTeacherByCustomId = async (req, res) => {
  try {
    const { branchId } = req.user;
    const teacher = await Teacher.findOne({ id: req.params.id, branchId }).populate("userId", "name email phone");
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.status(200).json(teacher);
  } catch (error) {
    console.error("Error fetching teacher by custom ID:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update teacher
export const updateTeacher = async (req, res) => {
  const {
    id, name, dateOfBirth, gender, phoneNumber, address,
    joiningDate, qualifications, experienceYears, subjects,
    payroll, contractType, workShift, workLocation, dateOfLeaving,
    languagesSpoken, emergencyContact, bio, email,
  } = req.body;

  try {
    const { branchId } = req.user;
    const teacher = await Teacher.findOne({ id: req.params.id, branchId });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    if (id && id !== teacher.id) {
      const existingTeacher = await Teacher.findOne({ id, branchId });
      if (existingTeacher) return res.status(400).json({ message: "Teacher ID already exists" });
      teacher.id = id;
    }

    // Update fields
    Object.assign(teacher, {
      name: name ?? teacher.name,
      dateOfBirth: dateOfBirth ?? teacher.dateOfBirth,
      gender: gender ?? teacher.gender,
      phoneNumber: phoneNumber ?? teacher.phoneNumber,
      address: address ?? teacher.address,
      joiningDate: joiningDate ?? teacher.joiningDate,
      qualifications: qualifications ?? teacher.qualifications,
      experienceYears: experienceYears ?? teacher.experienceYears,
      subjects: subjects ?? teacher.subjects,
      payroll: payroll ?? teacher.payroll,
      contractType: contractType ?? teacher.contractType,
      workShift: workShift ?? teacher.workShift,
      workLocation: workLocation ?? teacher.workLocation,
      dateOfLeaving: dateOfLeaving ?? teacher.dateOfLeaving,
      languagesSpoken: languagesSpoken ?? teacher.languagesSpoken,
      emergencyContact: emergencyContact ?? teacher.emergencyContact,
      bio: bio ?? teacher.bio,
    });

    if (email && teacher.userId) {
      await User.findOneAndUpdate({ _id: teacher.userId, branchId }, { email });
    }

    const updatedTeacher = await teacher.save();
    await updatedTeacher.populate("userId", "name email phone");
    res.status(200).json({ message: "Teacher updated successfully", teacher: updatedTeacher });
  } catch (error) {
    console.error("Error updating teacher:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete teacher
export const deleteTeacher = async (req, res) => {
  try {
    const { branchId } = req.user;
    const teacher = await Teacher.findOneAndDelete({ _id: req.params.id, branchId });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    await User.findOneAndDelete({ _id: teacher.userId, branchId });

    res.status(200).json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error.message);
    res.status(500).json({ message: error.message });
  }
};
