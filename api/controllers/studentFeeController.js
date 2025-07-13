import Student from "../models/student.js";
import StudentFee from "../models/studentFee.js";
import mongoose from "mongoose";
import FeesTemplate from "../models/feesTemplate.js";
import FeesGroup from "../models/feesGroup.js";
import { v4 as uuidv4 } from "uuid";
import Counter from "../models/counter.js";

const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const quarterlyMonths = ["Apr", "Jul", "Oct", "Jan"];

// Get next payment ID
const getNextPaymentId = async (branchId) => {
  const counter = await Counter.findOneAndUpdate(
    { type: "payment_id", branchId },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return `FC${String(counter.sequence).padStart(6, '0')}`; // Format: PAY000001
};

export const nextTransactionId = async (req, res) => {
  const {branchId} = req.user;
  try {
    const paymentId = await getNextPaymentId(branchId);
    res.status(200).json({ paymentId });
  } catch (error) {
    console.error("Error in getNextPaymentId:", error);
    res.status(500).json({ message: "Failed to generate payment ID" });
  }
};

export const updateStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { fees } = req.body;
    const { branchId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    if (!Array.isArray(fees) || fees.length === 0) {
      return res.status(400).json({ message: "Fees must be a non-empty array" });
    }

    for (const fee of fees) {
      if (!mongoose.Types.ObjectId.isValid(fee.feesGroup)) {
        return res.status(400).json({ message: "Invalid feesGroup ID" });
      }
      if (typeof fee.amount !== "number" || fee.amount < 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
    }

    const student = await Student.findOne({ _id: studentId, branchId }).select("sessionId classId name admissionNumber");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const feesByMonth = {};
    for (const fee of fees) {
      const feesGroup = await FeesGroup.findOne({ _id: fee.feesGroup, branchId });
      if (!feesGroup) continue;

      const applicableMonths = feesGroup.periodicity === "Monthly" ? months :
                              feesGroup.periodicity === "Quarterly" ? quarterlyMonths :
                              feesGroup.periodicity === "Yearly" || feesGroup.periodicity === "One Time" ? ["Apr"] : [];

      for (const month of applicableMonths) {
        if (!feesByMonth[month]) feesByMonth[month] = [];
        feesByMonth[month].push({
          feesGroup: fee.feesGroup,
          amount: fee.amount,
          originalAmount: fee.originalAmount || fee.amount,
          discount: fee.discount || 0,
        });
      }
    }

    const bulkOps = Object.entries(feesByMonth).map(([month, feeComponents]) => {
      const totalAmount = feeComponents.reduce((sum, f) => sum + f.amount, 0);
      const totalOriginalAmount = feeComponents.reduce((sum, f) => sum + f.originalAmount, 0);
      const totalDiscount = feeComponents.reduce((sum, f) => sum + f.discount, 0);

      return {
        updateOne: {
          filter: {
            studentId,
            sessionId: student.sessionId,
            month,
            branchId
          },
          update: {
            $set: {
              studentId,
              classId: student.classId,
              sessionId: student.sessionId,
              fees: feeComponents,
              amount: totalAmount,
              originalAmount: totalOriginalAmount,
              discount: totalDiscount,
              isCustom: true,
              status: "pending",
              updatedAt: new Date(),
              branchId
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      };
    });

    await StudentFee.bulkWrite(bulkOps);

    const updatedFees = await StudentFee.find({
      studentId,
      sessionId: student.sessionId,
      branchId
    }).populate("fees.feesGroup", "name periodicity");

    const responseFees = updatedFees.map((fee) => ({
      month: fee.month,
      fees: fee.fees.map(f => ({
        feesGroup: {
          _id: f.feesGroup._id,
          name: f.feesGroup.name,
          periodicity: f.feesGroup.periodicity,
        },
        amount: f.amount,
        originalAmount: f.originalAmount,
        discount: f.discount,
      })),
      amount: fee.amount,
      originalAmount: fee.originalAmount,
      discount: fee.discount,
      isCustom: fee.isCustom,
      status: fee.status,
    }));

    res.status(200).json({
      student: {
        _id: student._id,
        name: student.name,
        admissionNumber: student.admissionNumber,
        session: student.sessionId,
        class: student.classId,
      },
      fees: responseFees,
    });
  } catch (error) {
    console.error("Error updating student fees:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getStudentFees = async (req, res) => {
  try {
    const { branchId } = req.user;

    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const student = await Student.findOne({ _id: studentId, branchId })
      .select("name admissionNumber sessionId classId")
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentFees = await StudentFee.find({
      studentId,
      sessionId: student.sessionId,
      branchId
    }).populate("fees.feesGroup", "name periodicity");

    const fees = studentFees.map((fee) => ({
      month: fee.month,
      fees: fee.fees.map(f => ({
        feesGroup: {
          _id: f.feesGroup._id,
          name: f.feesGroup.name,
          periodicity: f.feesGroup.periodicity,
        },
        amount: f.amount,
        originalAmount: f.originalAmount,
        discount: f.discount,
      })),
      amount: fee.amount,
      originalAmount: fee.originalAmount,
      discount: fee.discount,
      isCustom: fee.isCustom,
      status: fee.status,
    }));

    res.status(200).json({
      student: {
        _id: student._id,
        name: student.name,
        admissionNumber: student.admissionNumber,
        session: student.sessionId,
        class: student.classId,
      },
      fees,
    });
  } catch (error) {
    console.error("Error fetching student fees:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const updateFeesForStudent = async (req, res) => {
  const { templateId, sessionId, studentIds, customFees, mergeTemplateFees = false } = req.body;
    const { branchId } = req.user;

  try {
    if (!templateId || !sessionId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      console.error("Validation failed: Missing required fields or invalid studentIds");
      return res.status(400).json({ message: "Missing required fields: templateId, sessionId, or studentIds" });
    }

    const feeTemplate = await FeesTemplate.findOne({ _id: templateId, branchId }).populate("classIds fees.feesGroup");
    if (!feeTemplate) {
      console.error(`Fee Template not found for ID: ${templateId}`);
      return res.status(404).json({ message: "Fee Template not found" });
    }

    if (sessionId !== feeTemplate.sessionId.toString()) {
      console.error(`Session ID mismatch: provided ${sessionId}, expected ${feeTemplate.sessionId}`);
      return res.status(400).json({ message: "Session ID does not match the template's session" });
    }

    const students = await Student.find({
      _id: { $in: studentIds },
      sessionId,
      classId: { $in: feeTemplate.classIds.map((c) => c._id) },
      status: "active",
      branchId
    });

    if (students.length === 0) {
      console.error("No valid students found for update");
      return res.status(404).json({ message: "No valid students found for update" });
    }

    const defaultFees = [];
    for (const fee of feeTemplate.fees) {
      const feesGroup = await FeesGroup.findOne({ _id: fee.feesGroup, branchId });
      if (!feesGroup) continue;

      const applicableMonths = feesGroup.periodicity === 'Monthly' ? months :
                             feesGroup.periodicity === 'Quarterly' ? quarterlyMonths :
                             feesGroup.periodicity === 'Yearly' || feesGroup.periodicity === 'One Time' ? ['Apr'] : [];

      for (const month of applicableMonths) {
        defaultFees.push({
          feesGroup: fee.feesGroup.toString(),
          amount: fee.amount,
          originalAmount: fee.amount,
          discount: 0,
          month,
        });
      }
    }

    let inputFees = [];
    if (customFees && Array.isArray(customFees)) {
      inputFees = customFees
        .map((fee) => {
          const groupId = typeof fee.feesGroup === "object" ? fee.feesGroup._id : fee.feesGroup;
          if (!groupId) {
            console.warn(`Invalid fee group format:`, fee.feesGroup);
            return null;
          }
          const templateFee = feeTemplate.fees.find(
            (tFee) => tFee.feesGroup.toString() === groupId
          );
          if (!templateFee) {
            console.warn(`Invalid fee group ${groupId}`);
            return null;
          }
          const applicableMonths = templateFee.feesGroup.periodicity === 'Monthly' ? months :
                                  templateFee.feesGroup.periodicity === 'Quarterly' ? quarterlyMonths :
                                  templateFee.feesGroup.periodicity === 'Yearly' || templateFee.feesGroup.periodicity === 'One Time' ? ['Apr'] : [];

          return applicableMonths.map(month => ({
            feesGroup: groupId,
            amount: fee.amount || templateFee.amount,
            originalAmount: fee.originalAmount || fee.amount || templateFee.amount,
            discount: fee.discount || 0,
            month,
          }));
        })
        .flat()
        .filter((fee) => fee !== null);
    }

    const feesByMonth = {};
    const allFees = mergeTemplateFees ? [...inputFees, ...defaultFees] : inputFees;

    allFees.forEach(fee => {
      if (!feesByMonth[fee.month]) feesByMonth[fee.month] = [];
      feesByMonth[fee.month].push({
        feesGroup: fee.feesGroup,
        amount: fee.amount,
        originalAmount: fee.originalAmount,
        discount: fee.discount,
      });
    });

    if (Object.keys(feesByMonth).length === 0) {
      console.error("No valid fees to update");
      return res.status(400).json({ message: "No valid fees provided" });
    }

    const studentFeePromises = students.map(async (student) => {
      try {
        const bulkOps = Object.entries(feesByMonth).map(([month, fees]) => {
          const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
          const totalOriginalAmount = fees.reduce((sum, f) => sum + f.originalAmount, 0);
          const totalDiscount = fees.reduce((sum, f) => sum + f.discount, 0);

          return {
            updateOne: {
              filter: {
                studentId: student._id,
                sessionId,
                month,
                branchId
              },
              update: {
                $set: {
                  studentId: student._id,
                  classId: student.classId,
                  sessionId,
                  fees,
                  amount: totalAmount,
                  originalAmount: totalOriginalAmount,
                  discount: totalDiscount,
                  status: 'pending',
                  isCustom: true,
                  updatedAt: new Date(),
                  month,
                  branchId
                },
                $setOnInsert: {
                  createdAt: new Date(),
                },
              },
              upsert: true,
            },
          };
        });

        await StudentFee.bulkWrite(bulkOps);
      } catch (error) {
        console.error(`Error processing student ${student._id}:`, error);
        throw error;
      }
    });

    await Promise.all(studentFeePromises);

    res.status(200).json({ success: true, message: "Fees updated successfully" });
  } catch (error) {
    console.error("Error in updateFeesForStudent:", error);
    res.status(500).json({ message: error.message || "Failed to update fees" });
  }
};


export const getStudentFeesByMonth = async (req, res) => {
  const { studentId, month } = req.params;
    const { branchId } = req.user;

  try {
    const studentFee = await StudentFee.findOne({
      studentId,
      month,
      branchId
    }).populate([
      { path: "fees.feesGroup", select: "name periodicity" },
      { path: "studentId", select: "name admissionNumber fatherInfo.name motherInfo.name" },
    ]);

    if (!studentFee) {
      return res.status(404).json({ message: `No fees found for ${month}` });
    }

    const formattedFee = formatFeeForResponse(studentFee);

    res.status(200).json([formattedFee]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllStudentFeesByAdmission = async (req, res) => {
    const { branchId } = req.user;

  const { admissionNumber } = req.params;
  const { sessionId } = req.query;
  try {
    const student = await Student.findOne({ admissionNumber, sessionId, branchId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentFees = await StudentFee.find({
      studentId: student._id,
      sessionId,
      branchId
    }).populate([
      { path: "fees.feesGroup", select: "name periodicity" },
    ]);

    if (!studentFees.length) {
      return res.status(404).json({ message: "No fees found for this student" });
    }

    const formattedFees = studentFees.map(fee => formatFeeForResponse(fee));

    res.status(200).json(formattedFees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Failed to fetch fees" });
  }
};

export const getStudentsWithFeesByClassSession = async (req, res) => {
  const { classId, sessionId } = req.params;
    const { branchId } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid classId or sessionId format" });
    }

    const students = await Student.find({
      classId,
      sessionId,
      status: "active",
      branchId,
    }).select("_id name admissionNumber classId sessionId motherInfo.name fatherInfo.name");

    if (!students.length) {
      return res.status(404).json({ message: "No students found for the specified class and session" });
    }

    const studentIds = students.map(student => student._id);
    const studentFees = await StudentFee.find({
      studentId: { $in: studentIds },
      sessionId,
      classId,
      branchId
    }).select("studentId").distinct("studentId");

    const studentsWithFees = students.filter(student => 
      studentFees.some(feeStudentId => feeStudentId.valueOf() === student._id.valueOf())
    );

    if (!studentsWithFees.length) {
      return res.status(200).json({ data: [], message: "No students with generated fees found" });
    }

    const formattedStudents = studentsWithFees.map(student => ({
      _id: student._id,
      admissionNumber: student.admissionNumber || "",
      name: student.name || "Unknown Student",
      classId: student.classId,
      sessionId: student.sessionId,
      fatherInfo: student.fatherInfo || { name: "" },
      motherInfo: student.motherInfo || { name: "" },
    }));

    res.status(200).json({ data: formattedStudents });
  } catch (error) {
    console.error("Error fetching students with generated fees:", error.message);
    res.status(500).json({ message: error.message || "Failed to fetch students with fees" });
  }
};

export const getStudentsWithFeesBySession = async (req, res) => {
  const {sessionId } = req.params;
    const { branchId } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid sessionId format" });
    }

    const students = await Student.find({
      sessionId,
      status: "active",
      branchId,
    }).select("_id name admissionNumber classId sessionId");

    if (!students.length) {
      return res.status(404).json({ message: "No students found for the specified session" });
    }

    const studentIds = students.map(student => student._id);
    const studentFees = await StudentFee.find({
      studentId: { $in: studentIds },
      sessionId,
      branchId
    }).select("studentId").distinct("studentId");

    const studentsWithFees = students.filter(student => 
      studentFees.some(feeStudentId => feeStudentId.valueOf() === student._id.valueOf())
    );

    if (!studentsWithFees.length) {
      return res.status(200).json({ data: [], message: "No students with generated fees found" });
    }

    const formattedStudents = studentsWithFees.map(student => ({
      _id: student._id,
      admissionNumber: student.admissionNumber || "",
      name: student.name || "Unknown Student",
      classId: student.classId,
      sessionId: student.sessionId,
    }));
    console.log(formattedStudents)
    res.status(200).json({ data: formattedStudents });
  } catch (error) {
    console.error("Error fetching students with generated fees:", error.message);
    res.status(500).json({ message: error.message || "Failed to fetch students with fees" });
  }
};

export const getMonthsWithFeesByStudent = async (req, res) => {
  const { studentId } = req.params;
  const { sessionId } = req.query;
    const { branchId } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid studentId format" });
    }
    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid or missing sessionId" });
    }

    const student = await Student.findOne({ _id: studentId, sessionId, branchId }).select("_id");
    if (!student) {
      return res.status(404).json({ message: "Student not found for the specified session" });
    }

    const monthsWithFees = await StudentFee.find({
      studentId,
      sessionId,
      branchId
    }).select("month").distinct("month");

    res.status(200).json(monthsWithFees.filter(month => month && month !== ""));
  } catch (error) {
    console.error("Error fetching months with fees:", error.message);
    res.status(500).json({ message: error.message || "Failed to fetch months with fees" });
  }
};

export const getGeneratedFeesSummaryByClass = async (req, res) => {
  const { classId, sessionId } = req.params;
    const { branchId } = req.user;

  
  try {
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid classId or sessionId format" });
    }

    const students = await Student.find({
      classId,
      sessionId,
      status: "active",
      branchId
    }).select("_id name admissionNumber");

    if (!students.length) {
      return res.status(404).json({ message: "No students found for the specified class and session" });
    }

    const studentIds = students.map(student => student._id);

    const generatedFees = await StudentFee.find({
      studentId: { $in: studentIds },
      sessionId,
      classId,
      dueDate: { $exists: true, $ne: null },
      branchId,
    }).populate([
      { path: "fees.feesGroup", select: "name periodicity" },
      { path: "studentId", select: "name admissionNumber" },
    ]).sort({ studentId: 1, month: 1, createdAt: -1 });

    const grouped = generatedFees.reduce((acc, fee) => {
      const key = `${fee.studentId._id}-${fee.month}`;
      if (!acc[key]) {
        acc[key] = {
          student: {
            _id: fee.studentId._id,
            name: fee.studentId.name,
            admissionNumber: fee.studentId.admissionNumber,
          },
          month: fee.month,
          fees: [],
          totalAmount: fee.amount,
          totalNetPayable: fee.amount - (fee.discount || 0),
          dueDate: fee.dueDate,
          generatedAt: fee.generatedAt || fee.createdAt,
          status: fee.status,
          generationGroupId: fee.generationGroupId,
        };
      }
      acc[key].fees = fee.fees.map(f => ({
        feesGroup: f.feesGroup,
        amount: f.amount,
        discountPercent: f.discount ? (f.discount / f.originalAmount * 100) : 0,
        netPayable: f.amount - (f.discount || 0),
      }));
      
      return acc;
    }, {});

    const feesSummary = Object.values(grouped).map(group => ({
      student: group.student,
      month: group.month,
      totalAmount: group.totalAmount,
      totalNetPayable: group.totalNetPayable,
      dueDate: group.dueDate,
      generatedAt: group.generatedAt,
      status: group.status,
      feeDetails: group.fees,
      generationGroupId: group.generationGroupId,
    }));

    res.status(200).json(feesSummary);
  } catch (error) {
    console.error("Error fetching generated fees summary by class:", error);
    res.status(500).json({ 
      message: "Failed to fetch generated fees summary", 
      error: error.message 
    });
  }
};

export const updateStudentFeeDueDate = async (req, res) => {
  const { studentId, sessionId, month, dueDate } = req.body;
    const { branchId } = req.user;

  try {
    if (!studentId || !sessionId || !month || !dueDate) {
      return res.status(400).json({ message: "Missing required fields: studentId, sessionId, month, or dueDate" });
    }
    const student = await Student.findOne({ _id: studentId, sessionId, status: "active", branchId });
    if (!student) {
      return res.status(404).json({ message: "Student not found or not active" });
    }

    const updatedFee = await StudentFee.findOneAndUpdate(
      {
        studentId,
        sessionId,
        month,
        dueDate: { $exists: true },
        branchId
      },
      {
        $set: {
          dueDate: new Date(dueDate),
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).populate([
      { path: "fees.feesGroup", select: "name periodicity" },
      { path: "studentId", select: "name admissionNumber" },
    ]);

    if (!updatedFee) {
      return res.status(404).json({ message: `No generated fees found for ${month}` });
    }

    res.status(200).json({
      success: true,
      message: "Due date updated successfully",
      fees: [formatFeeForResponse(updatedFee)],
    });
  } catch (error) {
    console.error("Error in updateStudentFeeDueDate:", error);
    res.status(500).json({ message: error.message || "Failed to update due date" });
  }
};

export const deleteGeneratedFees = async (req, res) => {
  const { studentId, sessionId, month } = req.body;
    const { branchId } = req.user;

  try {
    if (!studentId || !sessionId || !month) {
      return res.status(400).json({ message: "Missing required fields: studentId, sessionId, or month" });
    }

    const student = await Student.findOne({ _id: studentId, sessionId, status: "active" , branchId});
    if (!student) {
      return res.status(404).json({ message: "Student not found or not active" });
    }

    const updatedFee = await StudentFee.findOneAndUpdate(
      {
        studentId,
        sessionId,
        month,
        dueDate: { $exists: true, $ne: null },
        branchId
      },
      {
        $set: {
          dueDate: null,
          generatedAt: null,
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).populate([
      { path: "fees.feesGroup", select: "name periodicity" },
      { path: "studentId", select: "name admissionNumber" },
    ]);

    if (!updatedFee) {
      return res.status(404).json({ message: `No generated fees found for ${month}` });
    }

    res.status(200).json({
      success: true,
      message: "Generated fees deleted successfully",
      fees: [formatFeeForResponse(updatedFee)],
    });
  } catch (error) {
    console.error("Error in deleteGeneratedFees:", error);
    res.status(500).json({ message: error.message || "Failed to delete generated fees" });
  }
};
export const generateStudentFees = async (req, res) => {
  const { studentId, sessionId, months, dueDate } = req.body;
  const generatedAt = new Date();
  const generationGroupId = uuidv4();
    const { branchId } = req.user;


  try {
    if (!studentId || !sessionId || !months || !Array.isArray(months) || months.length === 0 || !dueDate) {
      return res.status(400).json({ message: "Missing required fields: studentId, sessionId, months (non-empty array), or dueDate" });
    }

    const validMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    if (!months.every(month => validMonths.includes(month))) {
      return res.status(400).json({ message: "Invalid month provided" });
    }

    const student = await Student.findOne({ _id: studentId, sessionId, status: "active", branchId })
      .select("_id name admissionNumber classId");
    if (!student) {
      return res.status(404).json({ message: "Student not found or not active" });
    }

    const feeTemplate = await FeesTemplate.findOne({
      sessionId,
      classIds: student.classId,
      branchId
    }).populate("fees.feesGroup");

    if (!feeTemplate) {
      return res.status(404).json({ message: "No fee template found for this student's class and session" });
    }

    // Fetch existing generated fees for the requested months
    const existingGeneratedFees = await StudentFee.find({
      studentId,
      sessionId,
      month: { $in: months },
      dueDate: { $exists: true, $ne: null },
      branchId,
    }).populate("fees.feesGroup");

    const existingGeneratedMonths = new Set(existingGeneratedFees.map(fee => fee.month));
    const monthsToGenerate = months.filter(month => !existingGeneratedMonths.has(month));

    if (monthsToGenerate.length === 0) {
      return res.status(400).json({ message: "All requested months already have generated fees" });
    }

    const bulkOps = [];
    const generatedFeesByMonth = {};

    // Handle existing non-generated fees or create new ones
    for (const month of monthsToGenerate) {
      const existingStudentFee = await StudentFee.findOne({
        studentId,
        sessionId,
        month,
      branchId,
        
      }).populate("fees.feesGroup");

      if (existingStudentFee) {
        bulkOps.push({
          updateOne: {
            filter: {
              studentId,
              sessionId,
              month,
      branchId,

            },
            update: {
              $set: {
                dueDate: new Date(dueDate),
                generatedAt,
                updatedAt: generatedAt,
                status: "pending",
                generationGroupId,
              },
            },
          },
        });

        generatedFeesByMonth[month] = existingStudentFee.fees.map(f => ({
          feesGroup: {
            _id: f.feesGroup?._id?.toString() || "",
            name: f.feesGroup?.name || "Unknown",
            periodicity: f.feesGroup?.periodicity || "Unknown",
          },
          amount: Number(f.amount) || 0,
          discount: Number(f.discount) || 0,
          netPayable: (Number(f.amount) || 0) - (Number(f.discount) || 0),
          month,
          status: "pending",
          dueDate: new Date(dueDate),
          generatedAt,
          student: {
            _id: student._id.toString(),
            name: student.name || "Unknown",
            admissionNumber: student.admissionNumber || "",
          },
        }));
      } else {
        const feesToGenerate = feeTemplate.fees.filter(fee => {
          if (fee.feesGroup.periodicity === "Yearly" || fee.feesGroup.periodicity === "One Time") {
            return month === "Apr";
          } else if (fee.feesGroup.periodicity === "Quarterly") {
            return ["Apr", "Jul", "Oct", "Jan"].includes(month);
          }
          return true;
        });

        if (feesToGenerate.length === 0) {
          continue;
        }

        const feeComponents = feesToGenerate.map(fee => ({
          feesGroup: fee.feesGroup._id,
          amount: Number(fee.amount) || 0,
          originalAmount: Number(fee.amount) || 0,
          discount: 0,
        }));

        const totalAmount = feeComponents.reduce((sum, f) => sum + f.amount, 0);
        const totalOriginalAmount = feeComponents.reduce((sum, f) => sum + f.originalAmount, 0);
        const totalDiscount = feeComponents.reduce((sum, f) => sum + f.discount, 0);

        bulkOps.push({
          updateOne: {
            filter: {
              studentId,
              sessionId,
              month,
      branchId,

            },
            update: {
              $set: {
                studentId,
                classId: student.classId,
                sessionId,
                fees: feeComponents,
                amount: totalAmount,
                originalAmount: totalOriginalAmount,
                discount: totalDiscount,
                dueDate: new Date(dueDate),
                generatedAt,
                updatedAt: generatedAt,
                month,
                status: "pending",
                generationGroupId,
      branchId,

              },
              $setOnInsert: {
                createdAt: generatedAt,
              },
            },
            upsert: true,
          },
        });

        generatedFeesByMonth[month] = feeComponents.map(f => ({
          feesGroup: {
            _id: f.feesGroup.toString(),
            name: feesToGenerate.find(fee => fee.feesGroup._id.toString() === f.feesGroup.toString())?.feesGroup?.name || "Unknown",
            periodicity: feesToGenerate.find(fee => fee.feesGroup._id.toString() === f.feesGroup.toString())?.feesGroup?.periodicity || "Unknown",
          },
          amount: f.amount,
          discount: f.discount,
          netPayable: f.amount - f.discount,
          month,
          status: "pending",
          dueDate: new Date(dueDate),
          generatedAt,
          student: {
            _id: student._id.toString(),
            name: student.name || "Unknown",
            admissionNumber: student.admissionNumber || "",
          },
        }));
      }
    }

    if (bulkOps.length === 0) {
      return res.status(400).json({ message: "No applicable fees for the specified months" });
    }

    await StudentFee.bulkWrite(bulkOps);

    const tally = {
      totalAmount: Object.values(generatedFeesByMonth).flat().reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0),
      totalNetPayable: Object.values(generatedFeesByMonth).flat().reduce((sum, fee) => sum + (Number(fee.netPayable) || 0), 0),
      feesByMonth: generatedFeesByMonth,
      student: {
        _id: student._id.toString(),
        name: student.name || "Unknown",
        admissionNumber: student.admissionNumber || "",
      },
      generationGroupId,
      months: monthsToGenerate,
    };

    res.status(200).json({
      success: true,
      message: "Fees generated successfully for the specified months",
      tally: [tally],
      skippedMonths: Array.from(existingGeneratedMonths),
    });
  } catch (error) {
    console.error("Error in generateStudentFees:", error);
    res.status(500).json({ message: error.message || "Failed to generate fees" });
  }
};

export const generateFeesForClass = async (req, res) => {
  const { classId, sessionId, months, dueDate, generatedAt } = req.body;
  const generationGroupId = uuidv4();
    const { branchId } = req.user;


  try {
    if (!classId || !sessionId || !months || !Array.isArray(months) || months.length === 0 || !dueDate || !generatedAt) {
      return res.status(400).json({ message: "Missing required fields: classId, sessionId, months (non-empty array), dueDate, or generatedAt" });
    }
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid classId or sessionId format" });
    }

    const validMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    if (!months.every(month => validMonths.includes(month))) {
      return res.status(400).json({ message: "Invalid month provided" });
    }

    const [students, feeTemplate] = await Promise.all([
      Student.find({ classId, sessionId, status: "active", branchId })
        .select("_id classId name admissionNumber")
        .lean(),
      FeesTemplate.findOne({ sessionId, classIds: classId , branchId})
        .populate("fees.feesGroup")
        .lean(),
    ]);

    if (!students.length) {
      return res.status(404).json({ message: "No active students found in the class" });
    }
    if (!feeTemplate) {
      return res.status(404).json({ message: "No fee template found for this class and session" });
    }

    const studentIds = students.map(s => s._id);
    const existingGeneratedFees = await StudentFee.find({
      studentId: { $in: studentIds },
      sessionId,
      month: { $in: months },
      dueDate: { $exists: true, $ne: null },
       branchId
    }).populate("fees.feesGroup").lean();

    const existingFeesMap = new Map(
      existingGeneratedFees.map(fee => [`${fee.studentId}-${fee.month}`, fee])
    );

    const results = [];
    const tallyByStudent = {};
    const bulkOps = [];

    for (const student of students) {
      const studentFeesByMonth = {};
      const monthsToGenerate = months.filter(month => !existingFeesMap.has(`${student._id}-${month}`));

      if (monthsToGenerate.length === 0) {
        results.push({ studentId: student._id, status: "skipped", reason: "All requested months already have generated fees" });
        continue;
      }

      for (const month of monthsToGenerate) {
        const existingFee = await StudentFee.findOne({
          studentId: student._id,
          sessionId,
          month,
           branchId
        }).populate("fees.feesGroup").lean();

        if (existingFee) {
          bulkOps.push({
            updateOne: {
              filter: {
                studentId: student._id,
                sessionId,
                month,
                 branchId
              },
              update: {
                $set: {
                  dueDate: new Date(dueDate),
                  generatedAt: new Date(generatedAt),
                  status: "pending",
                  updatedAt: new Date(generatedAt),
                  generationGroupId,
                },
              },
            },
          });

          studentFeesByMonth[month] = existingFee.fees.map(f => ({
            feesGroup: {
              _id: f.feesGroup._id,
              name: f.feesGroup.name,
              periodicity: f.feesGroup.periodicity,
            },
            amount: f.amount,
            discount: f.discount || 0,
            netPayable: f.amount - (f.discount || 0),
            month,
            status: "pending",
            dueDate: new Date(dueDate),
            generatedAt: new Date(generatedAt),
          }));

          results.push({ studentId: student._id, status: "updated", months: [month] });
        } else {
          const feesToGenerate = feeTemplate.fees.filter(fee => {
            if (fee.feesGroup.periodicity === "Yearly" || fee.feesGroup.periodicity === "One Time") {
              return month === "Apr";
            } else if (fee.feesGroup.periodicity === "Quarterly") {
              return ["Apr", "Jul", "Oct", "Jan"].includes(month);
            }
            return true;
          });

          if (!feesToGenerate.length) {
            continue;
          }

          const feeComponents = feesToGenerate.map(fee => ({
            feesGroup: fee.feesGroup._id,
            amount: fee.amount,
            originalAmount: fee.amount,
            discount: 0,
          }));

          const totalAmount = feeComponents.reduce((sum, f) => sum + f.amount, 0);
          const totalOriginalAmount = feeComponents.reduce((sum, f) => sum + f.originalAmount, 0);
          const totalDiscount = feeComponents.reduce((sum, f) => sum + f.discount, 0);

          bulkOps.push({
            updateOne: {
              filter: {
                studentId: student._id,
                sessionId,
                month,
                 branchId
              },
              update: {
                $set: {
                  studentId: student._id,
                  classId: classId,
                  sessionId,
                  fees: feeComponents,
                  amount: totalAmount,
                  originalAmount: totalOriginalAmount,
                  discount: totalDiscount,
                  dueDate: new Date(dueDate),
                  generatedAt: new Date(generatedAt),
                  updatedAt: new Date(generatedAt),
                  month,
                  status: "pending",
                  generationGroupId,
                   branchId
                },
                $setOnInsert: {
                  createdAt: new Date(generatedAt),
                },
              },
              upsert: true,
            },
          });

          studentFeesByMonth[month] = feeComponents.map(f => ({
            feesGroup: {
              _id: f.feesGroup,
              name: feesToGenerate.find(fee => fee.feesGroup._id.toString() === f.feesGroup.toString()).feesGroup.name,
              periodicity: feesToGenerate.find(fee => fee.feesGroup._id.toString() === f.feesGroup.toString()).feesGroup.periodicity,
            },
            amount: f.amount,
            discount: f.discount,
            netPayable: f.amount - f.discount,
            month,
            status: "pending",
            dueDate: new Date(dueDate),
            generatedAt: new Date(generatedAt),
          }));

          results.push({ studentId: student._id, status: "generated", months: [month] });
        }
      }

      if (Object.keys(studentFeesByMonth).length > 0) {
        tallyByStudent[student._id] = {
          student: {
            _id: student._id,
            name: student.name || "Unknown",
            admissionNumber: student.admissionNumber || "",
          },
          tally: {
            totalAmount: Object.values(studentFeesByMonth).flat().reduce((sum, fee) => sum + fee.amount, 0),
            totalNetPayable: Object.values(studentFeesByMonth).flat().reduce((sum, fee) => sum + fee.netPayable, 0),
            feesByMonth: studentFeesByMonth,
            generationGroupId,
            months: monthsToGenerate,
          },
        };
      }
    }

    if (bulkOps.length === 0) {
      return res.status(400).json({ message: "No new fees to generate for the specified months" });
    }

    const chunkSize = 1000;
    for (let i = 0; i < bulkOps.length; i += chunkSize) {
      await StudentFee.bulkWrite(bulkOps.slice(i, i + chunkSize));
    }

    res.status(200).json({
      success: true,
      message: "Class fee assignments completed successfully",
      results,
      tally: Object.values(tallyByStudent),
      skippedMonths: Array.from(new Set(existingGeneratedFees.map(fee => fee.month))),
    });
  } catch (error) {
    console.error("Error in generateFeesForClass:", error);
    res.status(500).json({ 
      message: error.message || "Failed to generate fees for class",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};


export const getGenerationGroups = async (req, res) => {
  const { studentId, classId, sessionId } = req.query;
    const { branchId } = req.user;

  try {
    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid or missing sessionId" });
    }

    let query = { sessionId, dueDate: { $exists: true, $ne: null },  branchId };
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      query.studentId = studentId;
    } else if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      query.classId = classId;
    } else {
      return res.status(400).json({ message: "Must provide valid studentId or classId" });
    }

    const fees = await StudentFee.find(query)
      .populate([
        { path: "studentId", select: "name admissionNumber" },
        { path: "fees.feesGroup", select: "name periodicity" },
      ])
      .select("month generatedAt generationGroupId amount discount dueDate fees");

    const groups = fees.reduce((acc, fee) => {
      const groupId = fee.generationGroupId || "unknown";
      if (!acc[groupId]) {
        acc[groupId] = {
          generationGroupId: groupId,
          months: new Set(),
          generatedAt: fee.generatedAt,
          students: {},
        };
      }
      acc[groupId].months.add(fee.month);
      const studentId = fee.studentId._id.toString();
      if (!acc[groupId].students[studentId]) {
        acc[groupId].students[studentId] = {
          student: {
            _id: studentId,
            name: fee.studentId.name || "Unknown",
            admissionNumber: fee.studentId.admissionNumber || "",
          },
          tally: {
            totalAmount: 0,
            totalNetPayable: 0,
            feesByMonth: {},
          },
        };
      }
      acc[groupId].students[studentId].tally.totalAmount += fee.amount || 0;
      acc[groupId].students[studentId].tally.netPayable += (fee.amount || 0) - (fee.discount || 0);
      if (!acc[groupId].students[studentId].tally.feesByMonth[fee.month]) {
        acc[groupId].students[studentId].tally.feesByMonth[fee.month] = [];
      }
      acc[groupId].students[studentId].tally.feesByMonth[fee.month].push(formatFeeForResponse(fee));
      return acc;
    }, {});

    const formattedGroups = Object.values(groups).map(group => ({
      generationGroupId: group.generationGroupId,
      months: Array.from(group.months),
      generatedAt: group.generatedAt,
      tally: Object.values(group.students),
    }));

    res.status(200).json(formattedGroups);
  } catch (error) {
    console.error("Error fetching generation groups:", error);
    res.status(500).json({ message: error.message || "Failed to fetch generation groups" });
  }
};

export const collectStudentFees = async (req, res) => {
  const { studentId, sessionId, month, paymentDetails, excessAmount, discount } = req.body;
    const { branchId } = req.user;

  try {
    // Input validation
    if (!studentId || !sessionId || !month || !paymentDetails || !paymentDetails.amountPaid) {
      return res.status(400).json({ message: "Missing required fields: studentId, sessionId, month, paymentDetails, or amountPaid" });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid studentId or sessionId format" });
    }

    const validMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    if (!validMonths.includes(month)) {
      return res.status(400).json({ message: "Invalid month provided" });
    }

    if (typeof paymentDetails.amountPaid !== 'number' || paymentDetails.amountPaid <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const validModes = ["Cash", "BankTransfer", "Cheque", "CardPayment", "Wallet", "IMPS"];
    if (!validModes.includes(paymentDetails.modeOfPayment)) {
      return res.status(400).json({ message: "Invalid mode of payment" });
    }

    // Fetch student and fee records
    const student = await Student.findOne({ _id: studentId, sessionId, status: "active",  branchId })
      .select("_id name admissionNumber classId");
    if (!student) {
      return res.status(404).json({ message: "Student not found or not active" });
    }

    const studentFee = await StudentFee.findOne({
      studentId,
      sessionId,
      month,
      dueDate: { $exists: true, $ne: null },
       branchId
    }).populate("fees.feesGroup", "name periodicity");

    if (!studentFee) {
      return res.status(404).json({ message: `No generated fees found for ${month}` });
    }

    // Calculate payment status
    const currentDiscount = studentFee.discount || 0;
    const newDiscount = currentDiscount + (discount || 0);
    const totalAmountDue = studentFee.amount - newDiscount
    const currentAmountPaid = studentFee.amountPaid || 0;
    const newAmountPaid = currentAmountPaid + paymentDetails.amountPaid;
    let newExcessAmount = excessAmount || 0;
    
    // Handle excess payment
    if (newAmountPaid > totalAmountDue) {
      newExcessAmount = newAmountPaid - totalAmountDue;
    }
    
    const newBalanceAmount = Math.max(0, totalAmountDue - newAmountPaid);
    let status = 'pending';
    if (newAmountPaid >= totalAmountDue) {
      status = 'paid';
    } else if (newAmountPaid > 0 && newAmountPaid < totalAmountDue) {
      status = 'partially_paid';
    }

    // Generate payment ID
    const paymentId = await getNextPaymentId( branchId);

    // Prepare payment details
    const newPayment = {
      _id: new mongoose.Types.ObjectId(),
      paymentId,
      modeOfPayment: paymentDetails.modeOfPayment,
      collectionDate: new Date(paymentDetails.collectionDate || Date.now()),
      amountPaid: paymentDetails.amountPaid,
      transactionNo: paymentDetails.transactionNo || null,
      transactionDate: paymentDetails.transactionDate ? new Date(paymentDetails.transactionDate) : null,
      chequeNo: paymentDetails.chequeNo || null,
      chequeDate: paymentDetails.chequeDate ? new Date(paymentDetails.chequeDate) : null,
      bankName: paymentDetails.bankName || null,
      remarks: paymentDetails.remarks || null,
      internalNotes: paymentDetails.internalNotes || null,
    };

    // Update fee record
    const updatedFee = await StudentFee.findOneAndUpdate(
      { _id: studentFee._id, branchId },
      {
        $push: { paymentDetails: newPayment },
        $set: {
          amountPaid: newAmountPaid,
          balanceAmount: newBalanceAmount,
          excessAmount: newExcessAmount,
          discount: newDiscount || 0,
          status,
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).populate("fees.feesGroup", "name periodicity");

    if (!updatedFee) {
      throw new Error("Failed to update fee record");
    }

    res.status(200).json({
      success: true,
      message: `Fees ${status === "partially_paid" ? "partially" : "fully"} paid for ${month}`,
      fees: [formatFeeForResponse(updatedFee)],
      excessAmount: newExcessAmount,
      paymentId,
    });
  } catch (error) {
    console.error("Error in collectStudentFees:", error);
    res.status(500).json({ message: error.message || "Failed to collect fees" });
  }
};

export const editPaymentDetails = async (req, res) => {
  const { studentId, sessionId, month, paymentId, paymentDetails, excessAmount, discount} = req.body;
    const { branchId } = req.user;

  try {
    // Input validation
    if (!studentId || !sessionId || !month || !paymentDetails || !paymentDetails._id) {
      return res.status(400).json({ 
        message: "Missing required fields: studentId, sessionId, month, paymentDetails, or paymentDetails._id" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(sessionId) || !mongoose.Types.ObjectId.isValid(paymentDetails._id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const validMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    if (!validMonths.includes(month)) {
      return res.status(400).json({ message: "Invalid month provided" });
    }

    const validModes = ["Cash", "BankTransfer", "Cheque", "CardPayment", "Wallet", "IMPS"];
    if (!validModes.includes(paymentDetails.modeOfPayment)) {
      return res.status(400).json({ message: "Invalid mode of payment" });
    }

    if (typeof paymentDetails.amountPaid !== 'number' || paymentDetails.amountPaid <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    // Fetch student and fee records
    const student = await Student.findOne({ _id: studentId, sessionId, status: "active", branchId })
      .select("_id").select("name admissionNumber classId");
    if (!student) {
      return res.status(404).json({ message: "Student not found or not active" });
    }

    const studentFee = await StudentFee.findOne({
      studentId:   studentId,
      sessionId:   sessionId,
      month:   month,
      dueDate: { $exists: true, $ne: null },
      "paymentDetails._id": paymentDetails._id,
       branchId
    }).populate("fees.feesGroup", "name periodicity");

    if (!studentFee) {
      return res.status(404).json({ message: `No fee record or payment details found for ${month}` });
    }

    // Calculate new totals
    const oldPayment = studentFee.paymentDetails.find(p => p._id.toString() === paymentDetails._id.toString());
    if (!oldPayment) {
      return res.status(404).json({ message: "Payment detail not found" });
    }

    const totalAmountDue = studentFee.amount - (studentFee.discount || discount || 0);
    const currentAmountPaid = (studentFee.amountPaid || 0) - oldPayment.amountPaid + paymentDetails.amountPaid;
    const newBalanceAmount = Math.max(
0, totalAmountDue - currentAmountPaid);
    let newExcessAmount = excessAmount || 0;
    
    // Handle excess payment
    if (currentAmountPaid > totalAmountDue) {
      newExcessAmount = currentAmountPaid - totalAmountDue;
    }
    
    const status = newBalanceAmount > 0 
  ? (currentAmountPaid === 0 ? 'pending' : 'partially_paid') 
  : 'paid';

    // Update payment details
    const updatedFee = await StudentFee.findOneAndUpdate(
      { 
        _id: studentFee._id,
        "paymentDetails._id": paymentDetails._id,
         branchId
      },
      {
        $set: {
          "paymentDetails.$": {
            _id: paymentDetails._id,
            paymentId: oldPayment.paymentId,
            modeOfPayment: paymentDetails.modeOfPayment,
            collectionDate: new Date(paymentDetails.collectionDate || Date.now()),
            amountPaid: paymentDetails.amountPaid,
            transactionNo: paymentDetails.transactionNo || null,
            transactionDate: paymentDetails.transactionDate ? new Date(paymentDetails.transactionDate) : null,
            chequeNo: paymentDetails.chequeNo || null,
            chequeDate: paymentDetails.chequeDate ? new Date(paymentDetails.chequeDate) : null,
            bankName: paymentDetails.bankName || null,
            remarks: paymentDetails.remarks || null,
            internalNotes: paymentDetails.internalNotes || null,
          },
          amountPaid: currentAmountPaid,
          balanceAmount: newBalanceAmount,
          excessAmount: newExcessAmount,
          discount: discount || studentFee.discount || 0,
          status,
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).populate("fees.feesGroup", "name periodicity");

    if (!updatedFee) {
      return res.status(404).json({ message: "Failed to update payment details" });
    }

    res.status(200).json({
      success: true,
      message: "Payment details updated successfully",
      fees: [formatFeeForResponse(updatedFee)],
      excessAmount: newExcessAmount,
    });
  } catch (error) {
    console.error("Error in editPaymentDetails:", error);
    res.status(500).json({ message: error.message || "Failed to update payment details" });
  }
};

function formatFeeForResponse(fee) {
  return {
    _id: fee._id,
    student: {
      _id: fee.studentId._id || fee.studentId,
      name: fee.studentId?.name || fee.student?.name || "",
      admissionNumber: fee.studentId?.admissionNumber || fee.student?.admissionNumber || "",
      fatherName: fee.studentId?.fatherInfo?.name,
      motherName: fee.studentId?.motherInfo?.name,
    },
    fees: fee.fees.map(f => ({
      feesGroup: {
        _id: f.feesGroup._id,
        name: f.feesGroup.name,
        periodicity: f.feesGroup.periodicity,
      },
      amount: f.amount,
      originalAmount: f.originalAmount,
      discount: f.discount,
    })),
    amount: fee.amount || 0,
    discountPercent: fee.discount ? (fee.discount / fee.originalAmount * 100) : 0,
    discount:fee.discount,
    netPayable: (fee.amount || 0) - (fee.discount || 0),
    dueDate: fee.dueDate,
    month: fee.month,
    status: fee.status,
    generatedAt: fee.generatedAt,
    generationGroupId: fee.generationGroupId,
    paymentDetails: fee.paymentDetails || [],
    excessAmount: fee.excessAmount || 0,
    amountPaid:fee.amountPaid,
    balanceAmount:fee.balanceAmount
  };
}

export const getFeesByMonth = async (req, res) => {
  try {
    const { branchId } = req.user;

    const { studentId, month } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const fees = await StudentFee.find({
      studentId: new mongoose.Types.ObjectId(studentId),
      month,
       branchId
    }).populate('fees.feesGroup', 'name periodicity');

    if (!fees.length) {
      return res.status(404).json({ message: `No fees found for month ${month}` });
    }

    const formattedFees = fees.map(fee => formatFeeForResponse(fee));

    res.status(200).json(formattedFees);
  } catch (error) {
    console.error('Error fetching fees by month:', error);
    res.status(500).json({ message: 'Server error while fetching fees' });
  }
};

export const getFeesBySession = async (req, res) => {
  try {
    const { studentId, sessionId } = req.params;
    const { branchId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid student or session ID' });
    }

    const fees = await StudentFee.find({
      studentId: new mongoose.Types.ObjectId(studentId),
      sessionId: new mongoose.Types.ObjectId(sessionId),
       branchId
    }).populate([
      { path: 'fees.feesGroup', select: 'name periodicity' },
      { path: 'studentId', select: 'name admissionNumber fatherInfo.name motherInfo.name' }, // Add this to populate student data
    ]);

    if (!fees.length) {
      return res.status(404).json({ message: 'No fees found for this session' });
    }

    const formattedFees = fees.map(fee => formatFeeForResponse(fee));

    res.status(200).json(formattedFees);
  } catch (error) {
    console.error('Error fetching fees by session:', error);
    res.status(500).json({ message: 'Server error while fetching fees' });
  }
};

export const previewNextPaymentId = async (req, res) => {
  try {
    const branchId = req.user.branchId
    const counter = await Counter.findOne({ type: "payment_id", branchId });
    console.log(counter)
    if (!counter) {
      return res.status(200).json({ paymentId: "FC000001" });
    }
    const nextId = `FC${String(counter.sequence + 1).padStart(6, '0')}`;
    res.status(200).json({ paymentId: nextId });
  } catch (error) {
    res.status(500).json({ message: "Failed to preview next ID" });
  }
};

export const editFeesForMonth = async (req, res) => {
  const { studentId, sessionId, month, fees } = req.body;
  // console.log(req.body);
    const { branchId } = req.user;

  try {
    // Input validation
    if (!studentId || !sessionId || !month || !Array.isArray(fees) || fees.length === 0) {
      return res.status(400).json({ message: "Missing required fields: studentId, sessionId, month, or fees (non-empty array)" });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid studentId or sessionId format" });
    }

    const validMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    if (!validMonths.includes(month)) {
      return res.status(400).json({ message: "Invalid month provided" });
    }

    for (const fee of fees) {
      if (!mongoose.Types.ObjectId.isValid(fee.feesGroup)) {
        return res.status(400).json({ message: "Invalid feesGroup ID" });
      }
      if (typeof fee.amount !== "number" || fee.amount < 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      if (typeof fee.originalAmount !== "number" || fee.originalAmount < 0) {
        return res.status(400).json({ message: "Invalid original amount" });
      }
      if (typeof fee.discount !== "number" || fee.discount < 0) {
        return res.status(400).json({ message: "Invalid discount" });
      }
    }

    // Fetch student and fee records
    const student = await Student.findOne({ _id: studentId, sessionId, status: "active",  branchId })
      .select("_id name admissionNumber classId");
    if (!student) {
      return res.status(404).json({ message: "Student not found or not active" });
    }

    const studentFee = await StudentFee.findOne({
      studentId,
      sessionId,
      month,
       branchId
    }).populate("fees.feesGroup", "name periodicity");

    if (!studentFee) {
      return res.status(404).json({ message: `No fee record found for ${month}` });
    }

    // Validate fee groups
    for (const fee of fees) {
      const feesGroup = await FeesGroup.findOne({ _id: fee.feesGroup, branchId });
      if (!feesGroup) {
        return res.status(404).json({ message: `FeesGroup ${fee.feesGroup} not found` });
      }
    }

    // Calculate totals
    const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalOriginalAmount = fees.reduce((sum, f) => sum + f.originalAmount, 0);
    const totalDiscount = fees.reduce((sum, f) => sum + f.discount, 0);
    const totalAmountDue = totalAmount - totalDiscount;
    const currentAmountPaid = studentFee.amountPaid || 0;

    // Update fee record without modifying status
    const updatedFee = await StudentFee.findOneAndUpdate(
      { studentId, sessionId, month, branchId },
      {
        $set: {
          fees,
          amount: totalAmount,
          // originalAmount: totalOriginalAmount,
          // discount: totalDiscount,
          // balanceAmount: newBalanceAmount,
          isCustom: true,
        },
      },
      { new: true }
    ).populate([
      { path: "fees.feesGroup", select: "name periodicity" },
      { path: "studentId", select: "name admissionNumber" },
    ]);

    if (!updatedFee) {
      return res.status(404).json({ message: `Failed to update fees for ${month}` });
    }

    res.status(200).json({
      success: true,
      message: `Fees updated successfully for ${month}`,
      fees: [formatFeeForResponse(updatedFee)],
    });
  } catch (error) {
    console.error("Error in editFeesForMonth:", error);
    res.status(500).json({ message: error.message || "Failed to edit fees" });
  }
};