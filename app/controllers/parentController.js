import Student from "../models/student.js";
import Leave from "../models/leave.js";
import Feedback from "../models/feedback.js";

export const getChildren = async (req, res) => {
  try {
    const parentEmail = req.user.email;
    const branchId = req.user.branchId;
    console.log(parentEmail)
    console.log(branchId)
    const children = await Student.find({
      branchId,
      $or: [
        { "fatherInfo.email": parentEmail },
        { "motherInfo.email": parentEmail }
      ]
    }).populate("classId sessionId");
    console.log(children)
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
  const branchId = req.user.branchId;

  try {
    const student = await Student.findOne({ _id: studentId, branchId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const parentEmail = req.user.email;
    if (
      student.fatherInfo.email !== parentEmail &&
      student.motherInfo.email !== parentEmail
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const leave = new Leave({
      branchId,
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
  const { userId, branchId } = req.user;

  try {
    const query = { parentId: userId, branchId };
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

export const getFeedback = async (req, res) => {
  const { userId, branchId } = req.user;

  try {
    const feedbacks = await Feedback.find({
      parentId: userId,
      branchId,
    }).sort({ submittedAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addFeedback = async (req, res) => {
  const { type, content } = req.body;
  const { userId, branchId } = req.user;

  if (!["feedback", "suggestion", "complaint"].includes(type)) {
    return res.status(400).json({ message: "Invalid type. Must be feedback, suggestion, or complaint." });
  }

  if (!content || content.length < 5) {
    return res.status(400).json({ message: "Content must be at least 5 characters" });
  }

  try {
    const feedback = new Feedback({
      parentId: userId,
      branchId,
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
