import User from "../models/user.js";
import Homework from "../models/homework.js";
import Student from "../models/student.js";
import mongoose from "mongoose";
export const getHomework = async (req, res) => {
  try {
    const parentEmail = req.user.email;
    const {branchId} = req.user;
    console.log("Parent email:", parentEmail);
    const children = await Student.find({
      branchId,
      $or: [
        { "fatherInfo.email": parentEmail },
        { "motherInfo.email": parentEmail },
      ],
    }).select("classId");

    if (!children.length) {
      return res.status(404).json({ message: "No children found for this parent" });
    }
    const classIds = children.map(child => child.classId);
    console.log("Class IDs:", classIds); 
    const homework = await Homework.find({ classId: { $in: classIds }, branchId })
      .populate("classId", "name")
      .populate("teacherId", "name email") 
      .sort({ createdAt: -1 });

    if (!homework.length) {
      return res.status(404).json({ message: "No homework found for your children's classes" });
    }
    res.json(homework);
  } catch (error) {
    console.error("Error in getHomework:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addHomework = async (req, res) => {
  try {
    const { userId, role, email, branchId } = req.user; // Adjusted destructuring
    console.log("addHomework request body:", req.body); // Debug log

    const { title, subject, description, dueDate, classIds } = req.body;
    if (!title || !subject || !description || !dueDate || !classIds) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Fetch the teacher's name from the User collection using userId
    const teacher = await User.findOne({ _id: userId, branchId });
    if (!teacher || !teacher.name) {
      return res.status(400).json({ message: "Teacher name not found in user profile" });
    }
    const teacherName = teacher.name;

    let targetClassIds = [];
    if (classIds.includes("all")) {
      const classes = await Class.find({branchId}).select("_id");
      targetClassIds = classes.map((cls) => cls._id);
    } else {
      targetClassIds = classIds;
    }

    // Validate class IDs
    const validClasses = await Class.find({ _id: { $in: targetClassIds }, branchId });
    if (validClasses.length !== targetClassIds.length) {
      return res.status(400).json({ message: "One or more class IDs are invalid" });
    }

    // Create homework for each class
    const newHomeworks = await Promise.all(
      targetClassIds.map(async (classId) => {
        const newHomework = new Homework({
          title,
          subject,
          description,
          teacherId: userId,
          teacherName,
          dueDate,
          classId,
          branchId
        });
        return await newHomework.save();
      })
    );

    res.status(201).json({ message: "Homework added successfully", homeworks: newHomeworks });
  } catch (error) {
    console.error("Error in addHomework:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};