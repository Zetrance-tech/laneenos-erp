import User from "../models/user.js";
import Homework from "../models/homework.js";
import Student from "../models/student.js";
import mongoose from "mongoose";
export const getHomework = async (req, res) => {
  try {
    const parentEmail = req.user.email;
    console.log("Parent email:", parentEmail);
    const children = await Student.find({
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
    const homework = await Homework.find({ classId: { $in: classIds } })
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
    const { userId, role, email } = req.user; // Adjusted destructuring
    if (role !== "teacher") {
      return res.status(403).json({ message: "Access denied. Only teachers can add homework." });
    }

    const { title, subject, description, dueDate, classId } = req.body;
    if (!title || !subject || !description || !dueDate || !classId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Fetch the teacher's name from the User collection using userId
    const teacher = await User.findById(userId).select("name");
    if (!teacher || !teacher.name) {
      return res.status(400).json({ message: "Teacher name not found in user profile" });
    }
    const teacherName = teacher.name;

    const newHomework = new Homework({
      title,
      subject,
      description,
      teacherId: userId, // Use userId instead of _id
      teacherName,
      dueDate,
      classId,
    });

    await newHomework.save();
    res.status(201).json({ message: "Homework added successfully", homework: newHomework });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};