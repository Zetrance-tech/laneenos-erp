import Student from "../models/student.js";
import StudentFee from "../models/studentFee.js";
import mongoose from "mongoose";

// Helper function to get student IDs for the logged-in parent
const getStudentIdsForParent = async (parentEmail) => {
  const students = await Student.find({
    $or: [
      { "fatherInfo.email": parentEmail },
      { "motherInfo.email": parentEmail },
    ],
    status: "active",
  }).select("_id");
  return students.map((student) => student._id);
};

// Get upcoming fees (due date in future, status "pending")
export const getUpcomingFees = async (req, res) => {
  try {
    const { userId, role, email } = req.user;

    if (role !== "parent") {
      return res.status(403).json({ message: "Only parents can access this endpoint" });
    }

    const studentIds = await getStudentIdsForParent(email);
    if (!studentIds.length) {
      return res.status(404).json({ message: "No active students found for this parent" });
    }

    const currentDate = new Date();
    const fees = await StudentFee.find({
      studentId: { $in: studentIds },
      status: "pending",
      dueDate: { $gt: currentDate },
    })
      .populate([
        { path: "feesGroup", select: "name periodicity" },
        { path: "studentId", select: "name admissionNumber" },
      ])
      .sort({ dueDate: 1 });

    if (!fees.length) {
      return res.status(200).json({ data: [], message: "No upcoming fees found" });
    }

    const formattedFees = fees.map((fee) => formatFeeForResponse(fee));
    res.status(200).json({ data: formattedFees });
  } catch (error) {
    console.error("Error fetching upcoming fees:", error.message);
    res.status(500).json({ message: error.message || "Failed to fetch upcoming fees" });
  }
};

// Get pending fees (due date in past or present, status "pending" or "overdue")
export const getPendingFees = async (req, res) => {
  try {
    const { userId, role, email } = req.user;
    if (role !== "parent") {
      return res.status(403).json({ message: "Only parents can access this endpoint" });
    }

    const studentIds = await getStudentIdsForParent(email);
    if (!studentIds.length) {
      return res.status(404).json({ message: "No active students found for this parent" });
    }

    const currentDate = new Date();
    const fees = await StudentFee.find({
      studentId: { $in: studentIds },
      status: { $in: ["pending", "overdue"] },
      dueDate: { $lte: currentDate },
    })
      .populate([
        { path: "feesGroup", select: "name periodicity" },
        { path: "studentId", select: "name admissionNumber" },
      ])
      .sort({ dueDate: 1 });

    if (!fees.length) {
      return res.status(200).json({ data: [], message: "No pending or overdue fees found" });
    }

    const formattedFees = fees.map((fee) => formatFeeForResponse(fee));
    res.status(200).json({ data: formattedFees });
  } catch (error) {
    console.error("Error fetching pending fees:", error.message);
    res.status(500).json({ message: error.message || "Failed to fetch pending fees" });
  }
};

// Get payment history (status "paid")
export const getPaymentHistory = async (req, res) => {
  try {
    const { userId, role, email } = req.user;
    if (role !== "parent") {
      return res.status(403).json({ message: "Only parents can access this endpoint" });
    }

    const studentIds = await getStudentIdsForParent(email);
    if (!studentIds.length) {
      return res.status(404).json({ message: "No active students found for this parent" });
    }

    const fees = await StudentFee.find({
      studentId: { $in: studentIds },
      status: "paid",
    })
      .populate([
        { path: "feesGroup", select: "name periodicity" },
        { path: "studentId", select: "name admissionNumber" },
      ])
      .sort({ updatedAt: -1 });

    if (!fees.length) {
      return res.status(200).json({ data: [], message: "No payment history found" });
    }

    const formattedFees = fees.map((fee) => formatFeeForResponse(fee));
    res.status(200).json({ data: formattedFees });
  } catch (error) {
    console.error("Error fetching payment history:", error.message);
    res.status(500).json({ message: error.message || "Failed to fetch payment history" });
  }
};

// Get fee summary (total, paid, pending, overdue, discounts)
export const getFeeSummary = async (req, res) => {
  try {
    const { userId, role, email } = req.user;
    if (role !== "parent") {
      return res.status(403).json({ message: "Only parents can access this endpoint" });
    }

    const studentIds = await getStudentIdsForParent(email);
    if (!studentIds.length) {
      return res.status(404).json({ message: "No active students found for this parent" });
    }

    const fees = await StudentFee.find({
      studentId: { $in: studentIds },
    })
      .populate([
        { path: "feesGroup", select: "name periodicity" },
        { path: "studentId", select: "name admissionNumber" },
      ])
      .lean();

    if (!fees.length) {
      return res.status(200).json({ data: {}, message: "No fees found for the student(s)" });
    }

    const summaryByStudent = fees.reduce((acc, fee) => {
      const studentId = fee.studentId._id.toString();
      if (!acc[studentId]) {
        acc[studentId] = {
          student: {
            _id: studentId,
            name: fee.studentId.name || "Unknown",
            admissionNumber: fee.studentId.admissionNumber || "",
          },
          totalAmount: 0,
          totalNetPayable: 0,
          totalPaid: 0,
          totalPending: 0,
          totalOverdue: 0,
          totalDiscount: 0,
          fees: [],
        };
      }

      const amount = fee.amount || 0;
      const discount = fee.discount || 0;
      const netPayable = amount - discount;

      acc[studentId].totalAmount += amount;
      acc[studentId].totalNetPayable += netPayable;
      acc[studentId].totalDiscount += discount;

      if (fee.status === "paid") {
        acc[studentId].totalPaid += netPayable;
      } else if (fee.status === "pending") {
        acc[studentId].totalPending += netPayable;
      } else if (fee.status === "overdue") {
        acc[studentId].totalOverdue += netPayable;
      }

      acc[studentId].fees.push(formatFeeForResponse(fee));
      return acc;
    }, {});

    const formattedSummary = Object.values(summaryByStudent);
    res.status(200).json({ data: formattedSummary });
  } catch (error) {
    console.error("Error fetching fee summary:", error.message);
    res.status(500).json({ message: error.message || "Failed to fetch fee summary" });
  }
};
function formatFeeForResponse(fee) {
  return {
    _id: fee._id,
    student: {
      _id: fee.studentId._id || fee.studentId,
      name: fee.studentId?.name || fee.student?.name || "",
      admissionNumber: fee.studentId?.name || fee.student?.admissionNumber || "",
    },
    feesGroup: {
      _id: fee.feesGroup._id,
      name: fee.feesGroup.name,
      periodicity: fee.feesGroup.periodicity,
    },
    amount: fee.amount || 0,
    dueDate: fee.dueDate,
    month: fee.month,
    status: fee.status,
    generatedAt: fee.generatedAt,
  };
}
