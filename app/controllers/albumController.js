import mongoose from "mongoose";
import Album from "../models/album.js";
import Session from "../models/session.js";
import Class from "../models/class.js";
import Student from "../models/student.js";
import fs from 'fs';
import path from 'path';
import { uploadsRoot } from "../uploadsRoot.js";

const fsPromises = fs.promises;

const getStudentIdsForParent = async (parentEmail, branchId) => {
  const students = await Student.find({
    branchId: new mongoose.Types.ObjectId(branchId),
    $or: [
      { 'fatherInfo.email': parentEmail },
      { 'motherInfo.email': parentEmail },
    ],
    status: 'active',
  }).select('_id');
  return students.map((student) => student._id);
};

export const getParentAlbums = async (req, res) => {
  try {
    const { email, branchId, role } = req.user;

    console.log("User Info:", { email, branchId, role });

    if (role !== "parent") {
      console.log("Access denied: User is not a parent");
      return res.status(403).json({ message: "Access denied: Only parents can access this endpoint" });
    }

    const studentIds = await getStudentIdsForParent(email, branchId);
    console.log("Student IDs for parent:", studentIds);

    if (studentIds.length === 0) {
      console.log("No student IDs found for parent");
      return res.status(200).json([]);
    }

    const students = await Student.find({
      _id: { $in: studentIds },
      branchId: new mongoose.Types.ObjectId(branchId),
      status: "active"
    }).select("classId");

    const classIds = [...new Set(students.map(s => s.classId.toString()))];
    console.log("Class IDs found for students:", classIds);

    if (classIds.length === 0) {
      console.log("No classes found for the given students");
      return res.status(200).json([]);
    }

    const query = {
      branchId: new mongoose.Types.ObjectId(branchId),
      classId: { $in: classIds }
    };

    console.log("Final Album Query:", query);

    const albums = await Album.find(query)
      .populate("sessionId", "name sessionId")
      // .populate("classId", "name id")
      .populate("createdBy", "name email");

    console.log("Fetched Albums:", albums);

    res.status(200).json(albums);
  } catch (error) {
    console.error("getParentAlbums: Error fetching albums for parent:", error.message);
    res.status(500).json({ message: "Server error while fetching parent albums" });
  }
};
