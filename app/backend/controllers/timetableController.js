// controllers/timetable.js
import Timetable from "../models/timetable.js";
import Class from "../models/class.js";
import Session from "../models/session.js";
import mongoose from "mongoose";
import Student from '../models/student.js'
// Create or update a weekly timetable
export const createOrUpdateTimetable = async (req, res) => {
  try {
    const { sessionId, classId, weekStartDate, weekEndDate, days } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!sessionId || !classId || !weekStartDate || !weekEndDate || !days) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate session and class
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if class belongs to the session
    if (classData.sessionId.toString() !== sessionId.toString()) {
      return res.status(400).json({ message: "Class does not belong to the specified session" });
    }

    // Check if the user is admin or teacher assigned to this class
    if (req.user.role === "teacher" && !classData.teacherId.includes(userId)) {
      return res.status(403).json({ message: "You are not authorized to manage this class timetable" });
    }

    // Check for existing timetable for this week
    const existingTimetable = await Timetable.findOne({
      sessionId,
      classId,
      weekStartDate: new Date(weekStartDate),
      weekEndDate: new Date(weekEndDate)
    });

    let timetable;
    if (existingTimetable) {
      // Update existing timetable
      existingTimetable.days = days;
      existingTimetable.lastUpdatedBy = userId;
      timetable = await existingTimetable.save();
    } else {
      // Create new timetable
      timetable = new Timetable({
        sessionId,
        classId,
        weekStartDate: new Date(weekStartDate),
        weekEndDate: new Date(weekEndDate),
        days,
        createdBy: userId
      });
      await timetable.save();
    }

    res.status(200).json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get timetable for a specific week and class
export const getTimetable = async (req, res) => {
  try {
    const { sessionId, classId, weekStartDate } = req.params;

    // Validate session and class
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if class belongs to the session
    if (classData.sessionId.toString() !== sessionId.toString()) {
      return res.status(400).json({ message: "Class does not belong to the specified session" });
    }

    // Find timetable for the week
    const startDate = new Date(weekStartDate);
    const timetable = await Timetable.findOne({
      sessionId,
      classId,
      weekStartDate: startDate
    }).populate("teacherId", "name");

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found for this week" });
    }

    res.status(200).json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update timetable activity status (for teachers)
export const updateActivityStatus = async (req, res) => {
  try {
    const { timetableId, dayIndex, slotIndex, status, notes } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!timetableId || dayIndex === undefined || slotIndex === undefined || !status) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const timetable = await Timetable.findById(timetableId);
    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    // Check if the user is a teacher assigned to this class
    const classData = await Class.findById(timetable.classId);
    if (req.user.role === "teacher" && !classData.teacherId.includes(userId)) {
      return res.status(403).json({ message: "You are not authorized to update this timetable" });
    }

    // Update the specific activity status
    if (dayIndex >= timetable.days.length || slotIndex >= timetable.days[dayIndex].slots.length) {
      return res.status(400).json({ message: "Invalid day or slot index" });
    }

    timetable.days[dayIndex].slots[slotIndex].status = status;
    if (notes) {
      timetable.days[dayIndex].slots[slotIndex].notes = notes;
    }
    timetable.lastUpdatedBy = userId;

    const updatedTimetable = await timetable.save();
    res.status(200).json(updatedTimetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student's timetable (for parents)
export const getStudentTimetable1 = async (req, res) => {
  const { weekStartDate } = req.params;
  const parentId = req.user.userId;

  try {
    // Validate weekStartDate format
    if (!weekStartDate || isNaN(new Date(weekStartDate).getTime())) {
      console.error("[ERROR] Invalid weekStartDate:", weekStartDate);
      return res.status(400).json({ message: "Valid week start date is required (YYYY-MM-DD)" });
    }

    // Find student by parent reference
    const student = await Student.findOne({
      $or: [
        { 'fatherInfo.email': req.user.email },
        { 'motherInfo.email': req.user.email },
        { 'guardianInfo.email': req.user.email }
      ]
    });
    console.log("[DEBUG] Student found:", student);

    if (!student) {
      console.error("[ERROR] No student linked to parent:", parentId);
      return res.status(404).json({ 
        message: "No student found linked to your account" 
      });
    }

    // Validate classId
    if (!mongoose.Types.ObjectId.isValid(student.classId)) {
      console.error("[ERROR] Invalid classId in student record:", student.classId);
      return res.status(400).json({ message: "Student class information is invalid" });
    }

    // Convert and validate the date
    const startDate = new Date(weekStartDate);
    if (isNaN(startDate.getTime())) {
      console.error("[ERROR] Invalid date conversion:", weekStartDate);
      return res.status(400).json({ message: "Invalid date format" });
    }

    console.log("[DEBUG] Querying timetable for:", {
      classId: student.classId,
      date: startDate.toISOString()
    });

    // Get timetable with populated teacher info
    const timetable = await Timetable.findOne({
      classId: student.classId,
      weekStartDate: startDate
    })
    .populate({
      path: 'days.slots.teacherId',
      select: 'firstName lastName'
    })
    .lean();

    if (!timetable) {
      console.log("[INFO] No timetable found for the specified week");
      return res.status(404).json({ 
        message: "Timetable not available for the selected week",
        suggestion: "Try a different week or contact school administration"
      });
    }

    console.log("[SUCCESS] Timetable retrieved successfully");
    res.status(200).json({
      studentName: student.name,
      timetable
    });

  } catch (error) {
    console.error("[FATAL] Controller error:", error);
    res.status(500).json({ 
      message: "An unexpected error occurred",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}