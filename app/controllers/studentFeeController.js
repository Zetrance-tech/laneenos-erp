import Student from "../models/student.js";
import StudentFee from "../models/studentFee.js";
import mongoose from "mongoose";

const groupQuarterlyFees = (fees) => {
  const quarterMap = {
    Q1: ["Apr", "May", "Jun"],
    Q2: ["Jul", "Aug", "Sep"], 
    Q3: ["Oct", "Nov", "Dec"],
    Q4: ["Jan", "Feb", "Mar"]
  };

  // Group by quarterlyGroupId for quarterly fees
  const grouped = {};
  
  fees.forEach(fee => {
    if (fee.periodicity === "Quarterly" && fee.quarterlyGroupId) {
      const groupKey = `${fee.studentId._id}-${fee.quarterlyGroupId}`;
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          ...fee.toObject(),
          months: quarterMap[fee.month] || [fee.month], // Include all months in quarter
          isQuarterly: true
        };
      }
    } else {
      // Monthly fees remain as-is
      grouped[fee._id] = {
        ...fee.toObject(),
        months: [fee.month],
        isQuarterly: false
      };
    }
  });
  
  return Object.values(grouped);
};
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

    // Group quarterly fees together
    const groupedFees = groupQuarterlyFees(fees);
    const formattedFees = groupedFees.map((fee) => formatFeeForResponse(fee));
    
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

    // Group quarterly fees together
    const groupedFees = groupQuarterlyFees(fees);
    const formattedFees = groupedFees.map((fee) => formatFeeForResponse(fee));
    
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

    const quarterMap = {
      Q1: ["Apr", "May", "Jun"],
      Q2: ["Jul", "Aug", "Sep"],
      Q3: ["Oct", "Nov", "Dec"],
      Q4: ["Jan", "Feb", "Mar"]
    };

    // Group quarterly payments together
    const paymentGroups = {};
    
    fees.forEach(fee => {
      const studentId = fee.studentId._id.toString();
      
      if (fee.periodicity === "Quarterly" && fee.quarterlyGroupId) {
        // Group quarterly payments
        const groupKey = `${studentId}-${fee.quarterlyGroupId}`;
        
        if (!paymentGroups[groupKey]) {
          const quarterMonths = fee.quarterMonths || quarterMap[fee.month] || [fee.month];
          paymentGroups[groupKey] = {
            _id: fee._id,
            student: {
              _id: studentId,
              name: fee.studentId.name,
              admissionNumber: fee.studentId.admissionNumber
            },
            type: "Quarterly Payment",
            quarter: fee.month,
            months: quarterMonths,
            totalAmount: fee.amount || 0,
            totalDiscount: fee.discount || 0,
            totalPaid: fee.amountPaid || 0,
            totalBalanceAmount: fee.balanceAmount || 0,
            status: fee.status,
            dueDate: fee.dueDate,
            updatedAt: fee.updatedAt,
            periodicity: "Quarterly",
            quarterlyGroupId: fee.quarterlyGroupId,
            paymentDetails: fee.paymentDetails || []
          };
        }
      } else {
        // Individual monthly payments
        const key = `${studentId}-${fee._id}`;
        paymentGroups[key] = {
          ...formatFeeForResponse(fee),
          type: "Monthly Payment"
        };
      }
    });

    const formattedPayments = Object.values(paymentGroups);
    res.status(200).json({ data: formattedPayments });
  } catch (error) {
    console.error("Error fetching payment history:", error.message);
    res.status(500).json({ message: error.message || "Failed to fetch payment history" });
  }
};
// Get fee summary (total, paid, pending, overdue, discounts)
export const getFeeSummary = async (req, res) => {
  try {
    const { branchId } = req.user;
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
      return res.status(200).json({ data: [], message: "No fees found for the student(s)" });
    }

    const summaryByStudent = {};
    const processedQuarterlyGroups = new Set();

    fees.forEach(fee => {
      const studentId = fee.studentId._id.toString();

      if (!summaryByStudent[studentId]) {
        summaryByStudent[studentId] = {
          student: {
            _id: studentId,
            name: fee.studentId.name || "Unknown",
            admissionNumber: fee.studentId.admissionNumber || "",
          },
          totalLateFee: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalPending: 0,
          totalDiscount: 0,
          totalBalanceAmount: 0,
          monthlyFees: [],
          quarterlyFees: [],
          fees: [],
        };
      }

      const amount = fee.amount || 0;
      const discount = fee.discount || 0;
      const amountPaid = fee.amountPaid || 0;
      const balanceAmount = fee.balanceAmount || 0;
      const lateFee = fee.excessAmount || 0;

      // Calculate totalPending correctly
      const pendingAmount = amount - amountPaid - discount + lateFee;

      // Handle quarterly fees - only process once per quarterly group
      if (fee.periodicity === "Quarterly" && fee.quarterlyGroupId) {
        const groupKey = `${studentId}-${fee.quarterlyGroupId}`;

        if (!processedQuarterlyGroups.has(groupKey)) {
          processedQuarterlyGroups.add(groupKey);

          // Find all fees in this quarterly group
          const quarterlyFees = fees.filter(qf =>
            qf.studentId._id.toString() === studentId &&
            qf.quarterlyGroupId === fee.quarterlyGroupId
          );

          // Aggregate quarterly data
          const totalAmount = quarterlyFees.reduce((sum, f) => sum + (f.amount || 0), 0);
          const totalDiscount = quarterlyFees.reduce((sum, f) => sum + (f.discount || 0), 0);
          const totalPaid = quarterlyFees.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
          const totalLateFee = quarterlyFees.reduce((sum, f) => sum + (f.excessAmount || 0), 0);

          // Calculate totalPending for the quarterly group
          const totalPending = totalAmount - totalPaid - totalDiscount + totalLateFee;

          summaryByStudent[studentId].quarterlyFees.push({
            _id: fee._id,
            quarter: fee.month,
            totalAmount,
            totalDiscount,
            totalPaid,
            totalPending,
            totalLateFee,
            dueDate: fee.dueDate,
            status: fee.status,
            periodicity: "Quarterly",
            quarterlyGroupId: fee.quarterlyGroupId,
          });

          // Add to totals
          summaryByStudent[studentId].totalAmount += totalAmount;
          summaryByStudent[studentId].totalDiscount += totalDiscount;
          summaryByStudent[studentId].totalPaid += totalPaid;
          summaryByStudent[studentId].totalPending += totalPending;
          summaryByStudent[studentId].totalLateFee += totalLateFee;
        }
      } else {
        // Handle monthly fees individually
        summaryByStudent[studentId].monthlyFees.push({
          ...formatFeeForResponse(fee),
          periodicity: "Monthly",
        });

        // Add to totals
        summaryByStudent[studentId].totalAmount += amount;
        summaryByStudent[studentId].totalDiscount += discount;
        summaryByStudent[studentId].totalPaid += amountPaid;
        summaryByStudent[studentId].totalPending += pendingAmount;
        summaryByStudent[studentId].totalLateFee += lateFee;
      }

      summaryByStudent[studentId].fees.push(formatFeeForResponse(fee));
    });

    const formattedSummary = Object.values(summaryByStudent).map(student => ({
      ...student,
      totalNetPayable: student.totalAmount - student.totalDiscount,
      quarterlyCount: student.quarterlyFees.length,
      monthlyCount: student.monthlyFees.length,
      hasQuarterlyFees: student.quarterlyFees.length > 0,
      hasMonthlyFees: student.monthlyFees.length > 0,
    }));

    res.status(200).json({ data: formattedSummary });
  } catch (error) {
    console.error("Error fetching fee summary:", error.message);
    res.status(500).json({ message: error.message || "Failed to fetch fee summary" });
  }
};
// Helper function to format fee response
function formatFeeForResponse(fee) {
  const quarterMap = {
    Q1: ["Apr", "May", "Jun"],
    Q2: ["Jul", "Aug", "Sep"], 
    Q3: ["Oct", "Nov", "Dec"],
    Q4: ["Jan", "Feb", "Mar"]
  };

  // Determine display info based on periodicity
  const isQuarterly = fee.periodicity === "Quarterly";
  const displayMonths = isQuarterly && fee.quarterMonths 
    ? fee.quarterMonths 
    : [fee.month];
  
  const displayLabel = isQuarterly 
    ? `Quarter ${fee.month?.charAt(1) || ''} (${displayMonths.join(", ")})`
    : fee.month;

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
    discount: fee.discount || 0,
    amountPaid: fee.amountPaid || 0,
    balanceAmount: fee.balanceAmount || 0,
    dueDate: fee.dueDate,
    month: fee.month,
    displayMonths: displayMonths,
    displayLabel: displayLabel,
    status: fee.status,
    generatedAt: fee.generatedAt,
    merchantTransactionId: fee.merchantTransactionId || "",
    periodicity: fee.periodicity || "Monthly",
    quarterlyGroupId: fee.quarterlyGroupId || null,
    isQuarterly: isQuarterly
  };
}