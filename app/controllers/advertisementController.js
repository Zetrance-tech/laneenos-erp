import mongoose from 'mongoose';
import Advertisement from '../models/advertisement.js';
import Session from '../models/session.js';
import Class from '../models/class.js';
import Student from '../models/student.js';

const getStudentIdsForParent = async (parentEmail, branchId) => {
  const students = await Student.find({
    branchId,
    $or: [
      { 'fatherInfo.email': parentEmail },
      { 'motherInfo.email': parentEmail },
    ],
    status: 'active',
  }).select('_id');
  return students.map((student) => student._id);
};

export const getParentAdvertisements = async (req, res) => {
  try {
    const { email, branchId, role } = req.user;

    console.log("User Info:", { email, branchId, role });

    // Verify user is a parent
    if (role !== "parent") {
      console.log("Access denied: User is not a parent");
      return res.status(403).json({ message: "Access denied: Only parents can access this endpoint" });
    }

    // Get student IDs for the parent
    const studentIds = await getStudentIdsForParent(email, branchId);
    console.log("Student IDs for parent:", studentIds);

    if (studentIds.length === 0) {
      console.log("No student IDs found for parent");
      return res.status(200).json([]); // No students found, return empty array
    }

    // Find classes for the students
    const students = await Student.find({
      _id: { $in: studentIds },
      branchId,
      status: "active"
    }).select("classId");

    const classIds = [...new Set(students.map(s => s.classId.toString()))];
    console.log("Class IDs found for students:", classIds);

    if (classIds.length === 0) {
      console.log("No classes found for the given students");
      return res.status(200).json([]); // No classes found, return empty array
    }

    // Build query for advertisements
    const query = {
      branchId,
      classId: { $in: classIds },
      status: 'active' // Only fetch active advertisements
    };

    console.log("Final Advertisement Query:", query);

    // Fetch advertisements for the classes
    const advertisements = await Advertisement.find(query)
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id")
      .populate("createdBy", "name email");

    console.log("Fetched Advertisements:", advertisements);

    res.status(200).json(advertisements);
  } catch (error) {
    console.error("getParentAdvertisements: Error fetching advertisements for parent:", error.message);
    res.status(500).json({ message: "Server error while fetching parent advertisements" });
  }
};