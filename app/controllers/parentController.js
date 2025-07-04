import Student from "../models/student.js";
import Leave from "../models/leave.js";
import Feedback from "../models/feedback.js";

export const getChildren = async (req, res) => {
  try {
    const parentEmail = req.user.email;
    console.log("Parent email from token:", parentEmail); // Debug
    const children = await Student.find({
      $or: [{ "fatherInfo.email": parentEmail }, { "motherInfo.email": parentEmail }],
    }).populate("classId sessionId");

    console.log("Found children:", children); // Debug
    if (!children.length) {
      return res.status(404).json({ message: "No children found" });
    }
    res.json(children);
  } catch (error) {
    console.error("Error in getChildren:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const applyLeave = async (req, res) => {
  const { studentId, reason, leaveDate } = req.body;

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const parentEmail = req.user.email;
    if (
      student.fatherInfo.email !== parentEmail &&
      student.motherInfo.email !== parentEmail
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const leave = new Leave({
      studentId,
      parentId: req.user.userId,
      reason,
      leaveDate,
    });
    await leave.save();

    res.status(201).json({ message: "Leave applied successfully", leave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getLeaveHistory = async (req, res) => {
  const { status } = req.query;

  try {
    const query = { parentId: req.user.userId };
    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .populate("studentId", "name")
      .populate("approvedBy", "name")
      .sort({ appliedAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all feedback/suggestions/complaints
export const getFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ parentId: req.user.userId })
      .sort({ submittedAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add feedback/suggestion/complaint
export const addFeedback = async (req, res) => {
  const { type, content } = req.body;

  if (!["feedback", "suggestion", "complaint"].includes(type)) {
    return res.status(400).json({ message: "Invalid type. Must be feedback, suggestion, or complaint." });
  }

  try {
    if (!content || content.length < 5) {
      return res.status(400).json({ message: "Content must be at least 5 characters" });
    }

    const feedback = new Feedback({
      parentId: req.user.userId,
      type,
      content,
    });

    await feedback.save();
    res.status(201).json({ message: `${type} submitted successfully`, feedback });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

