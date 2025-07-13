import mongoose from "mongoose";
import Class from "../models/class.js";
import Session from "../models/session.js";
import User from "../models/user.js";
import Counter from "../models/counter.js";

// Get next sequence for ID generation, scoped to branch
export const getNextSequence = async (type, branchId) => {
  if (!branchId) {
    throw new Error("Branch ID is required for sequence generation");
  }
  const counter = await Counter.findOneAndUpdate(
    {type: `${type}_id`, branchId },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true  }
  );
  return counter.sequence;
};

// Generate custom ID for entities, scoped to branch
export const generateId = async (entityType, branchId) => {
  const sequence = await getNextSequence(entityType, branchId);
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

// Get next class ID for the user's branch
export const getNextClassId = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is missing from request" });
    }

    const counter = await Counter.findOne({ type: "class_id", branchId });
    const sequence = counter ? counter.sequence + 1 : 1;
const id = `LN-144-C${String(sequence).padStart(3, "0")}`;

    res.status(200).json({ id });
  } catch (error) {
    console.error("error", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all classes for the user's branch
export const getAllClasses = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is missing from request" });
    }

    const classes = await Class.find({ branchId })
      .populate("sessionId", "name sessionId")
      .populate("teacherId", "name email");
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new class
export const createClass = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is missing from request" });
    }

    const id = await generateId("class", branchId);
    const { name, teacherId, sessionId } = req.body;
    console.log("Received request body:", req.body);

    if (!id || !name || !teacherId || !sessionId) {
      console.warn("Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    const sessionExists = await Session.findOne({ _id: sessionId, branchId });
    console.log("Session lookup result:", sessionExists);
    if (!sessionExists) {
      console.warn("Session not found for ID:", sessionId, "and branch:", branchId);
      return res.status(404).json({ message: "Session not found in this branch" });
    }

    const teachersExist = await User.find({
      _id: { $in: teacherId },
      role: "teacher",
      branchId
    });
    console.log("Teachers found:", teachersExist);

    if (teachersExist.length !== teacherId.length) {
      console.warn("Mismatch in teacher count. Sent:", teacherId.length, "Found:", teachersExist.length);
      return res.status(404).json({ message: "One or more teachers not found in this branch" });
    }

    const classExists = await Class.findOne({ id, branchId });
    console.log("Class existence check:", classExists);
    if (classExists) {
      console.warn("Class with ID already exists:", id, "in branch:", branchId);
      return res.status(400).json({ message: "Class ID already exists in this branch" });
    }

    const newClass = new Class({
      id,
      name,
      teacherId,
      sessionId,
      branchId
    });

    const savedClass = await newClass.save();
    console.log("New class saved successfully:", savedClass);
    res.status(201).json(savedClass);
  } catch (error) {
    console.error("Error while creating class:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get class by ID (user-entered ID or MongoDB _id)
export const getClassById = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is missing from request" });
    }

    const { id } = req.params;
    let classData;
    if (mongoose.Types.ObjectId.isValid(id)) {
      classData = await Class.findOne({ _id: id, branchId })
        .populate("sessionId", "name sessionId")
        .populate("teacherId", "name email");
    } else {
      classData = await Class.findOne({ id, branchId })
        .populate("sessionId", "name sessionId")
        .populate("teacherId", "name email");
    }

    if (!classData) {
      return res.status(404).json({ message: "Class not found in this branch" });
    }
    res.status(200).json(classData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a class
export const updateClass = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is missing from request" });
    }

    const { id, name, teacherId, sessionId } = req.body;
    if (sessionId) {
      const sessionExists = await Session.findOne({ _id: sessionId, branchId });
      if (!sessionExists) {
        return res.status(404).json({ message: "Session not found in this branch" });
      }
    }
    if (teacherId) {
      const teachersExist = await User.find({
        _id: { $in: teacherId },
        role: "teacher",
        branchId
      });
      if (teachersExist.length !== teacherId.length) {
        return res.status(404).json({ message: "One or more teachers not found in this branch" });
      }
    }
    if (id) {
      const existingClassWithId = await Class.findOne({ id, branchId });
      if (existingClassWithId && existingClassWithId._id.toString() !== req.params.id) {
        return res.status(400).json({ message: "Class ID already exists in this branch" });
      }
    }

    const updatedClass = await Class.findOneAndUpdate(
      { _id: req.params.id, branchId },
      { id, name, teacherId, sessionId, branchId },
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found in this branch" });
    }

    res.status(200).json(updatedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a class
export const deleteClass = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is missing from request" });
    }

    const deletedClass = await Class.findOneAndDelete({ _id: req.params.id, branchId });
    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found in this branch" });
    }
    res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all classes for a specific session
export const getClassesBySession = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is missing from request" });
    }

    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const sessionExists = await Session.findOne({ _id: sessionId, branchId });
    if (!sessionExists) {
      return res.status(404).json({ message: "Session not found in this branch" });
    }

    const classes = await Class.find({ sessionId, branchId })
      .populate("teacherId", "name email");
    if (classes.length === 0) {
      return res.status(404).json({ message: "No classes found for this session in this branch" });
    }
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get classes for a specific teacher
export const getClassesForTeacher = async (req, res) => {
  try {
    console.log("Starting getClassesForTeacher function...");
    const branchId = req.user.branchId;
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is missing from request" });
    }

    console.log("req.user:", JSON.stringify(req.user, null, 2));
    const teacherId = req.user.userId;
    console.log("Extracted teacherId:", teacherId);

    if (!teacherId) {
      console.log("teacherId is undefined or null");
      return res.status(400).json({ message: "Teacher ID is missing from request user" });
    }

    console.log("Executing Class.find with query:", { teacherId: { $in: [teacherId] }, branchId });

    const populatedClasses = await Class.find({ teacherId: { $in: [teacherId] }, branchId })
      .populate("sessionId", "name sessionId")
      .populate("teacherId", "name email");
    console.log("Populated classes:", JSON.stringify(populatedClasses, null, 2));

    if (populatedClasses.length === 0) {
      console.log("No classes found for teacherId:", teacherId, "in branch:", branchId);
      return res.status(404).json({ message: "No classes found for this teacher in this branch" });
    }

    console.log("Classes found, sending response:", populatedClasses.length, "classes");
    res.status(200).json(populatedClasses);
  } catch (error) {
    console.error("Error in getClassesForTeacher:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    res.status(500).json({ message: error.message });
  }
};