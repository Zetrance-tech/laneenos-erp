import Student from "../models/student.js";
import StudentFee from "../models/studentFee.js";
import mongoose from "mongoose";

// Helper function to get student IDs for the logged-in parent
const getStudentIdsForParent = async (parentEmail,branchId) => {
  const students = await Student.find({
    branchId,
    $or: [
      { "fatherInfo.email": parentEmail },
      { "motherInfo.email": parentEmail },
    ],
    status: "active",
  }).select("_id");
  return students.map((student) => student._id);
};

// Get upcoming fees (due date in future, status "pending" or "partially_paid")
export const getUpcomingFees = async (req, res) => {
  try {
    const {branchId} = req.user;
    const { userId, role, email } = req.user;

    if (role !== "parent") {
      return res.status(403).json({ message: "Only parents can access this endpoint" });
    }

    const studentIds = await getStudentIdsForParent(email, branchId);
    if (!studentIds.length) {
      return res.status(404).json({ message: "No active students found for this parent" });
    }

    const currentDate = new Date();
    const fees = await StudentFee.find({
      studentId: { $in: studentIds },
      dueDate: { $gt: currentDate },
      branchId,
      status: { $in: ["pending", "partially_paid"] },
    })
    	    
      .populate([
        { path: "fees.feesGroup", select: "name periodicity" },
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

// Get pending fees (partially paid or due date passed)
export const getPendingFees = async (req, res) => {
  try {
    const {branchId} = req.user;
    const { userId, role, email } = req.user;
    
    if (role !== "parent") {
      return res.status(403).json({ message: "Only parents can access this endpoint" });
    }

    const studentIds = await getStudentIdsForParent(email, branchId);
    if (!studentIds.length) {
      return res.status(404).json({ message: "No active students found for this parent" });
    }

    const currentDate = new Date();
    const fees = await StudentFee.find({
      branchId,
      studentId: { $in: studentIds },
      $or: [
        { status: "partially_paid" },
        { dueDate: { $lte: currentDate }, status: { $in: ["pending", "overdue"] } },
      ],
    })
      .populate([
        { path: "fees.feesGroup", select: "name periodicity" },
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
// Get payment history (status "paid" or "partially_paid")
export const getPaymentHistory = async (req, res) => {
  try {
    const {branchId} = req.user;
    const { userId, role, email } = req.user;
    if (role !== "parent") {
      return res.status(403).json({ message: "Only parents can access this endpoint" });
    }

    const studentIds = await getStudentIdsForParent(email, branchId);
    if (!studentIds.length) {
      return res.status(404).json({ message: "No active students found for this parent" });
    }

    const fees = await StudentFee.find({
      branchId,
      studentId: { $in: studentIds },
      status: { $in: ["paid", "partially_paid"] },
    })
      .populate([
        { path: "fees.feesGroup", select: "name periodicity" },
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
    const {branchId} = req.user;
    const { userId, role, email } = req.user;
    if (role !== "parent") {
      return res.status(403).json({ message: "Only parents can access this endpoint" });
    }

    const studentIds = await getStudentIdsForParent(email, branchId);
    if (!studentIds.length) {
      return res.status(404).json({ message: "No active students found for this parent" });
    }

    const fees = await StudentFee.find({
      branchId,
      studentId: { $in: studentIds },
    })
      .populate([
        { path: "fees.feesGroup", select: "name periodicity" },
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
          totalLateFee:0,
          totalAmount: 0,
          totalPaid: 0,
          totalPending:0,
          totalDiscount: 0,
          totalBalanceAmount: 0,
          fees: [],
        };
      }
      const excessAmount = fee.excessAmount || 0;
      const amount = fee.amount || 0;
      const discount = fee.discount || 0;
      const netPayable = amount - discount;
      const amountPaid = fee.amountPaid || 0;
      const balanceAmount = fee.balanceAmount || 0;
      acc[studentId].totalAmount += amount;
      acc[studentId].totalDiscount += discount;
      acc[studentId].totalPaid += amountPaid;
      acc[studentId].totalBalanceAmount += balanceAmount;
      acc[studentId].totalLateFee += excessAmount;
      acc[studentId].totalPending += (amount - amountPaid)
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

// Helper function to format fee response
function formatFeeForResponse(fee) {
  return {
    _id: fee._id,
    student: {
      _id: fee.studentId._id || fee.studentId,
      name: fee.studentId?.name || fee.student?.name || "",
      admissionNumber: fee.studentId?.admissionNumber || fee.student?.admissionNumber || "",
    },
    fees: fee.fees.map(feeComponent => ({
      feesGroup: {
        _id: feeComponent.feesGroup._id,
        name: feeComponent.feesGroup.name,
        periodicity: feeComponent.feesGroup.periodicity,
      },
      amount: feeComponent.amount || 0,
      originalAmount: feeComponent.originalAmount || 0,
      discount: feeComponent.discount || 0,
    })),
    amount: fee.amount || 0,
    // discountPercent: fee.discount ? (fee.discount / fee.originalAmount * 100) : 0,
    // netPayable: (fee.amount || 0) - (fee.discount || 0),
    discount:fee.discount || 0,
    amountPaid: fee.amountPaid || 0,
    balanceAmount: fee.balanceAmount || 0,
    dueDate: fee.dueDate,
    month: fee.month,
    status: fee.status,
    generatedAt: fee.generatedAt,
    merchantTransactionId: fee.merchantTransactionId || "",
  };
}