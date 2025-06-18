import Leave from "../models/leave.js";
import Student from "../models/student.js";
import User from "../models/user.js";

export const applyLeave = async (req, res) => {
  try {
    const { userId, role, email } = req.user;
    const { reason, startDate, endDate } = req.body;

    if (role !== "parent") {
      return res.status(403).json({ message: "Only parents can apply for leave." });
    }

    // Validate required fields
    if (!reason || !reason.title || !reason.message || !startDate || !endDate) {
      return res.status(400).json({ message: "Title, message, startDate, and endDate are required." });
    }

    // Ensure endDate is not before startDate
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: "End date cannot be earlier than start date." });
    }

    // Find student where either father or mother has the matching email
    const student = await Student.findOne({
      $or: [{ "fatherInfo.email": email }, { "motherInfo.email": email }],
    });

    if (!student) {
      return res.status(404).json({ message: "No student found for this parent." });
    }

    const leave = new Leave({
      studentId: student._id,
      parentId: userId,
      reason: {
        title: reason.title,
        message: reason.message,
      },
      startDate,
      endDate,
    });

    await leave.save();
    res.status(201).json({ message: "Leave request submitted successfully.", leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getLeaves = async (req, res) => {
  try {
    const { userId, role, email } = req.user;
    let leaves;

    if (role === "parent") {
      // Find the student related to the parent
      const student = await Student.findOne({
        $or: [{ "fatherInfo.email": email }, { "motherInfo.email": email }],
      });

      if (!student) {
        return res.status(404).json({ message: "No student found for this parent." });
      }

      leaves = await Leave.find({ studentId: student._id })
        .populate("studentId", "name")
        .populate("approvedBy", "name");
    } else if (role === "admin") {
      // Admin sees all leave requests
      leaves = await Leave.find()
        .populate("studentId", "name")
        .populate("parentId", "name email")
        .populate("approvedBy", "name");
    } else {
      return res.status(403).json({ message: "Access denied." });
    }

    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { leaveId, status } = req.body;

    if (role !== "teacher" && role !== "admin") {
      return res.status(403).json({ message: "Only teachers or admins can update leave status." });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status update." });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    leave.status = status;
    leave.approvedBy = userId;
    leave.updatedAt = new Date();
    await leave.save();

    res.status(200).json({ message: `Leave ${status} successfully.`, leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};