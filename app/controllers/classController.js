// controllers/Class.js
import mongoose from "mongoose";
import Class from "../models/class.js";
import Session from "../models/session.js";
import Teacher from "../models/teacher.js";
import User from "../models/user.js";
// Get all classes
export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("sessionId", "name sessionId") 
      .populate("teacherId", "name");
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new class
export const createClass = async (req, res) => {
  try {
    const { id, name, teacherId, sessionId } = req.body;
    if (!id || !name || !teacherId || !sessionId) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const sessionExists = await Session.findById(sessionId);
    if (!sessionExists) {
      return res.status(404).json({ message: "Session not found" });
    }
    const teachersExist = await User.find({ 
      _id: { $in: teacherId }, 
      role: "teacher" 
    });
    if (teachersExist.length !== teacherId.length) {
      return res.status(404).json({ message: "One or more teachers not found" });
    }
    const classExists = await Class.findOne({ id });
    if (classExists) {
      return res.status(400).json({ message: "Class ID already exists" });
    }

    const newClass = new Class({
      id,
      name,
      teacherId,
      sessionId,
    });

    const savedClass = await newClass.save();
    res.status(201).json(savedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get class by ID (user-entered ID or MongoDB _id)
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    let classData;
    // if (mongoose.Types.ObjectId.isValid(id)) {
    //   classData = await Class.findById(id)
    //     .populate("sessionId", "name sessionId")
    //     .populate("teacherId", "name");
    // } else {
    //   classData = await Class.findOne({ id })
    //     .populate("sessionId", "name sessionId")
    //     .populate("teacherId", "name");
    // }
    if (mongoose.Types.ObjectId.isValid(id)) {
      classData = await Class.findById(id)
        .populate("sessionId", "name sessionId")
        .populate("teacherId", "name email"); // Updated to populate from User
    } else {
      classData = await Class.findOne({ id })
        .populate("sessionId", "name sessionId")
        .populate("teacherId", "name email"); // Updated to populate from User
    }

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.status(200).json(classData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a class
export const updateClass = async (req, res) => {
  try {
    const { id, name, teacherId, sessionId } = req.body;
    if (sessionId) {
      const sessionExists = await Session.findById(sessionId);
      if (!sessionExists) {
        return res.status(404).json({ message: "Session not found" });
      }
    }
    if (teacherId) {
      // const teachersExist = await Teacher.find({ _id: { $in: teacherId } });
      const teachersExist = await User.find({ 
        _id: { $in: teacherId }, 
        role: "teacher" 
      });
      if (teachersExist.length !== teacherId.length) {
        return res.status(404).json({ message: "One or more teachers not found" });
      }
    }
    if (id) {
      const existingClassWithId = await Class.findOne({ id });
      if (existingClassWithId && existingClassWithId._id.toString() !== req.params.id) {
        return res.status(400).json({ message: "Class ID already exists" });
      }
    }

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { id, name, teacherId, sessionId },
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json(updatedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a class
export const deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all classes for a specific session
export const getClassesBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const classes = await Class.find({ sessionId })
      .populate("teacherId", "name email");
    if (classes.length === 0) {
      return res.status(404).json({ message: "No classes found for this session" });
    }
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};