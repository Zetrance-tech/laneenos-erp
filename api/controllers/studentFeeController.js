import Student from "../models/student.js";
import StudentFee from "../models/studentFee.js";
import mongoose from "mongoose";
import FeesTemplate from "../models/feesTemplate.js";
import { v4 as uuidv4 } from "uuid"; // Import uuid for generationGroupId

export const updateStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { fees } = req.body;

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

    const student = await Student.findById(studentId).select("sessionId classId name admissionNumber");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    for (const fee of fees) {
      const updateData = {
        amount: fee.amount,
        isCustom: fee.isCustom || true,
        status: "pending",
      };

      if (fee.applyToAll) {
        if (fee.periodicity === "Monthly") {
          await StudentFee.updateMany(
            {
              studentId,
              feesGroup: fee.feesGroup,
              periodicity: "Monthly"
            },
            updateData
          );

          const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", 
                         "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
          
          for (const month of months) {
            await StudentFee.findOneAndUpdate(
              {
                studentId,
                feesGroup: fee.feesGroup,
                month,
                periodicity: "Monthly"
              },
              updateData,
              { upsert: true, new: true }
            );
          }
        } else {
          await StudentFee.updateMany(
            {
              studentId,
              feesGroup: fee.feesGroup,
            },
            updateData
          );
        }
      } else {
        await StudentFee.findOneAndUpdate(
          {
            studentId,
            sessionId: student.sessionId,
            classId: student.classId,
            feesGroup: fee.feesGroup,
            ...(fee.month && { month: fee.month })
          },
          updateData,
          { upsert: true, new: true }
        );
      }
    }

    const updatedFees = await StudentFee.find({
      studentId,
      sessionId: student.sessionId,
      classId: student.classId,
    }).populate("feesGroup", "name periodicity");

    const responseFees = updatedFees.map((fee) => ({
      feesGroup: {
        _id: fee.feesGroup._id,
        name: fee.feesGroup.name,
        periodicity: fee.feesGroup.periodicity,
      },
      amount: fee.amount,
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
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const student = await Student.findById(studentId)
      .select("name admissionNumber sessionId classId")
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentFees = await StudentFee.find({
      studentId,
      sessionId: student.sessionId,
      classId: student.classId,
    }).populate("feesGroup", "name periodicity");

    const fees = studentFees.map((fee) => ({
      feesGroup: {
        _id: fee.feesGroup._id,
        name: fee.feesGroup.name,
        periodicity: fee.feesGroup.periodicity,
      },
      amount: fee.amount,
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

  try {
    if (!templateId || !sessionId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      console.error("Validation failed: Missing required fields or invalid studentIds");
      return res.status(400).json({ message: "Missing required fields: templateId, sessionId, or studentIds" });
    }

    const feeTemplate = await FeesTemplate.findById(templateId).populate("classIds fees.feesGroup");
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
    });

    if (students.length === 0) {
      console.error("No valid students found for update");
      return res.status(404).json({ message: "No valid students found for update" });
    }

    const defaultFees = [];
    for (const fee of feeTemplate.fees) {
      const feesGroup = await FeesGroup.findById(fee.feesGroup);
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
          discountType: "fixed",
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
            discountType: fee.discountType || "fixed",
            month,
          }));
        })
        .flat()
        .filter((fee) => fee !== null);
    }

    const feesToUpdate = mergeTemplateFees
      ? [...inputFees, ...defaultFees.filter(
          (defFee) => !inputFees.some((inFee) => inFee.feesGroup === defFee.feesGroup && inFee.month === defFee.month)
        )]
      : inputFees;

    if (feesToUpdate.length === 0) {
      console.error("No valid fees to update");
      return res.status(400).json({ message: "No valid fees provided" });
    }

    const studentFeePromises = students.map(async (student) => {
      try {
        const bulkOps = feesToUpdate.map(fee => ({
          updateOne: {
            filter: {
              studentId: student._id,
              sessionId,
              feesGroup: fee.feesGroup,
              month: fee.month,
            },
            update: {
              $set: {
                studentId: student._id,
                classId: student.classId,
                sessionId,
                feesGroup: fee.feesGroup,
                amount: fee.amount,
                originalAmount: fee.originalAmount,
                discount: fee.discount,
                discountType: fee.discountType,
                status: 'pending',
                isCustom: true,
                updatedAt: new Date(),
                month: fee.month,
              },
              $setOnInsert: {
                createdAt: new Date(),
              },
            },
            upsert: true,
          },
        }));

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

export const generateStudentFees = async (req, res) => {
  const { studentId, sessionId, months, dueDate } = req.body;
  const generatedAt = new Date();
  const generationGroupId = uuidv4(); // Unique ID for this generation group
  try {
    if (!studentId || !sessionId || !months || !Array.isArray(months) || months.length === 0 || !dueDate) {
      return res.status(400).json({ message: "Missing required fields: studentId, sessionId, months (non-empty array), or dueDate" });
    }

    const validMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    if (!months.every(month => validMonths.includes(month))) {
      return res.status(400).json({ message: "Invalid month provided" });
    }

    const student = await Student.findOne({ _id: studentId, sessionId, status: "active" })
      .select("_id name admissionNumber classId");
    if (!student) {
      return res.status(404).json({ message: "Student not found or not active" });
    }

    const feeTemplate = await FeesTemplate.findOne({
      sessionId,
      classIds: student.classId,
    }).populate("fees.feesGroup");

    if (!feeTemplate) {
      return res.status(404).json({ message: "No fee template found for this student's class and session" });
    }

    const bulkOps = [];
    const generatedFeesByMonth = {};

    for (const month of months) {
      // Fetch existing custom fees for this student, month, and session
      const existingCustomFees = await StudentFee.find({
        studentId,
        sessionId,
        month,
        isCustom: true,
      }).select("feesGroup amount discount");

      const existingCustomFeesMap = new Map(
        existingCustomFees.map(fee => [fee.feesGroup.toString(), { amount: fee.amount, discount: fee.discount }])
      );

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

      feesToGenerate.forEach(fee => {
        const feesGroupId = fee.feesGroup._id.toString();
        const customFee = existingCustomFeesMap.get(feesGroupId);

        // Use custom amount and discount if available, otherwise use template amount
        const amountToUse = customFee ? customFee.amount : fee.amount;
        const discountToUse = customFee ? customFee.discount : 0;

        bulkOps.push({
          updateOne: {
            filter: {
              studentId,
              sessionId,
              feesGroup: fee.feesGroup._id,
              month,
            },
            update: {
              $set: {
                studentId,
                classId: student.classId,
                sessionId,
                feesGroup: fee.feesGroup._id,
                amount: amountToUse,
                originalAmount: fee.amount, // Always set originalAmount from template
                discount: discountToUse,
                dueDate: new Date(dueDate),
                generatedAt,
                updatedAt: generatedAt,
                month,
                status: "pending",
                generationGroupId,
              },
              $setOnInsert: {
                createdAt: generatedAt,
              },
            },
            upsert: true,
          },
        });
      });

      generatedFeesByMonth[month] = feesToGenerate.map(fee => {
        const feesGroupId = fee.feesGroup._id.toString();
        const customFee = existingCustomFeesMap.get(feesGroupId);
        const amountToUse = customFee ? customFee.amount : fee.amount;
        const discountToUse = customFee ? customFee.discount : 0;

        return {
          feesGroup: {
            _id: fee.feesGroup._id,
            name: fee.feesGroup.name,
            periodicity: fee.feesGroup.periodicity,
          },
          amount: amountToUse,
          discount: discountToUse,
          netPayable: amountToUse - discountToUse,
          month,
          status: "pending",
          dueDate: new Date(dueDate),
          generatedAt,
          student: {
            _id: student._id,
            name: student.name,
            admissionNumber: student.admissionNumber,
          },
        };
      });
    }

    if (bulkOps.length === 0) {
      return res.status(400).json({ message: "No applicable fees for the specified months" });
    }

    await StudentFee.bulkWrite(bulkOps);

    const tally = {
      totalAmount: Object.values(generatedFeesByMonth).flat().reduce((sum, fee) => sum + fee.amount, 0),
      totalNetPayable: Object.values(generatedFeesByMonth).flat().reduce((sum, fee) => sum + fee.netPayable, 0),
      feesByMonth: generatedFeesByMonth,
      student: {
        _id: student._id,
        name: student.name,
        admissionNumber: student.admissionNumber,
      },
      generationGroupId,
      months,
    };

    res.status(200).json({
      success: true,
      message: "Fees generated successfully for the specified months",
      tally: [tally],
    });
  } catch (error) {
    console.error("Error in generateStudentFees:", error);
    res.status(500).json({ message: error.message || "Failed to generate fees" });
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
    discountPercent: fee.discount ? (fee.discount / fee.originalAmount * 100) : 0,
    netPayable: (fee.amount || 0) - (fee.discount || 0),
    dueDate: fee.dueDate,
    month: fee.month,
    status: fee.status,
    generatedAt: fee.generatedAt,
    generationGroupId: fee.generationGroupId, // Include in response
  };
}

export const getStudentFeesByMonth = async (req, res) => {
  const { studentId, month } = req.query; // Changed to query to support multiple params

  try {
    const studentFees = await StudentFee.find({
      studentId,
      month,
    }).populate([
      { path: "feesGroup", select: "name periodicity amount" },
      { path: "studentId", select: "name admissionNumber" },
    ]);

    if (!studentFees.length) {
      return res.status(404).json({ message: `No fees found for ${month}` });
    }

    const formattedFees = studentFees.map(fee => formatFeeForResponse(fee));

    res.status(200).json(formattedFees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllStudentFeesByAdmission = async (req, res) => {
  const { admissionNumber } = req.params;
  const { sessionId } = req.query;
  try {
    const student = await Student.findOne({ admissionNumber, sessionId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentFees = await StudentFee.find({
      studentId: student._id,
      sessionId,
    }).populate([
      { path: "feesGroup", select: "name periodicity" },
    ]);

    if (!studentFees.length) {
      return res.status(404).json({ message: "No fees found for this student" });
    }

    const formattedFees = studentFees.map((fee) => formatFeeForResponse(fee));

    res.status(200).json(formattedFees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Failed to fetch fees" });
  }
};

export const getStudentsWithFeesByClassSession = async (req, res) => {
  const { classId, sessionId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid classId or sessionId format" });
    }

    const students = await Student.find({
      classId,
      sessionId,
      status: "active",
    }).select("_id name admissionNumber classId sessionId");

    if (!students.length) {
      return res.status(404).json({ message: "No students found for the specified class and session" });
    }

    const studentIds = students.map(student => student._id);
    const studentFees = await StudentFee.find({
      studentId: { $in: studentIds },
      sessionId,
      classId,
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

    res.status(200).json({ data: formattedStudents });
  } catch (error) {
    console.error("Error fetching students with generated fees:", error.message);
    res.status(500).json({ message: error.message || "Failed to fetch students with fees" });
  }
};

export const getMonthsWithFeesByStudent = async (req, res) => {
  const { studentId } = req.params;
  const { sessionId } = req.query;

  try {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid studentId format" });
    }
    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid or missing sessionId" });
    }

    const student = await Student.findOne({ _id: studentId, sessionId }).select("_id");
    if (!student) {
      return res.status(404).json({ message: "Student not found for the specified session" });
    }

    const monthsWithFees = await StudentFee.find({
      studentId,
      sessionId,
    }).select("month").distinct("month");

    res.status(200).json(monthsWithFees.filter(month => month && month !== ""));
  } catch (error) {
    console.error("Error fetching months with fees:", error.message);
    res.status(500).json({ message: error.message || "Failed to fetch months with fees" });
  }
};

export const getGeneratedFeesSummaryByClass = async (req, res) => {
  const { classId, sessionId } = req.params;
  
  try {
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid classId or sessionId format" });
    }

    const students = await Student.find({
      classId,
      sessionId,
      status: "active",
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
    }).populate([
      { path: "feesGroup", select: "name periodicity" },
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
          totalAmount: 0,
          totalNetPayable: 0,
          dueDate: fee.dueDate,
          generatedAt: fee.generatedAt || fee.createdAt,
          status: fee.status,
          generationGroupId: fee.generationGroupId,
        };
      }
      acc[key].fees.push({
        _id: fee._id,
        feesGroup: fee.feesGroup,
        amount: fee.amount,
        discountPercent: fee.discount ? (fee.discount / fee.originalAmount * 100) : 0,
        netPayable: fee.amount - (fee.discount || 0),
        status: fee.status,
      });
      
      acc[key].totalAmount += fee.amount;
      acc[key].totalNetPayable += fee.netPayable || (fee.amount - (fee.discount || 0));
      
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
  try {
    if (!studentId || !sessionId || !month || !dueDate) {
      return res.status(400).json({ message: "Missing required fields: studentId, sessionId, month, or dueDate" });
    }
    const student = await Student.findOne({ _id: studentId, sessionId, status: "active" });
    if (!student) {
      return res.status(404).json({ message: "Student not found or not active" });
    }

    const updatedFees = await StudentFee.updateMany(
      {
        studentId,
        sessionId,
        month,
        dueDate: { $exists: true },
      },
      {
        $set: {
          dueDate: new Date(dueDate),
          updatedAt: new Date(),
        },
      }
    );

    if (updatedFees.matchedCount === 0) {
      return res.status(404).json({ message: `No generated fees found for ${month}` });
    }

    const updatedFeeRecords = await StudentFee.find({
      studentId,
      sessionId,
      month,
    }).populate([
      { path: "feesGroup", select: "name periodicity" },
      { path: "studentId", select: "name admissionNumber" },
    ]);

    res.status(200).json({
      success: true,
      message: "Due date updated successfully",
      fees: updatedFeeRecords.map(fee => formatFeeForResponse(fee)),
    });
  } catch (error) {
    console.error("Error in updateStudentFeeDueDate:", error);
    res.status(500).json({ message: error.message || "Failed to update due date" });
  }
};

export const deleteGeneratedFees = async (req, res) => {
  const { studentId, sessionId, month } = req.body;
  try {
    if (!studentId || !sessionId || !month) {
      return res.status(400).json({ message: "Missing required fields: studentId, sessionId, or month" });
    }

    const student = await Student.findOne({ _id: studentId, sessionId, status: "active" });
    if (!student) {
      return res.status(404).json({ message: "Student not found or not active" });
    }

    const updatedFees = await StudentFee.updateMany(
      {
        studentId,
        sessionId,
        month,
        dueDate: { $exists: true, $ne: null },
      },
      {
        $set: {
          dueDate: null,
          generatedAt: null,
          updatedAt: new Date(),
        },
      }
    );

    if (updatedFees.matchedCount === 0) {
      return res.status(404).json({ message: `No generated fees found for ${month}` });
    }

    const updatedFeeRecords = await StudentFee.find({
      studentId,
      sessionId,
      month,
    }).populate([
      { path: "feesGroup", select: "name periodicity" },
      { path: "studentId", select: "name admissionNumber" },
    ]);

    res.status(200).json({
      success: true,
      message: "Generated fees deleted successfully",
      fees: updatedFeeRecords.map(fee => formatFeeForResponse(fee)),
    });
  } catch (error) {
    console.error("Error in deleteGeneratedFees:", error);
    res.status(500).json({ message: error.message || "Failed to delete generated fees" });
  }
};

export const generateFeesForClass = async (req, res) => {
  const { classId, sessionId, months, dueDate, generatedAt } = req.body;
  const generationGroupId = uuidv4(); // Unique ID for this generation group
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

    const students = await Student.find({ classId, sessionId, status: "active" })
      .select("_id classId name admissionNumber");
    if (!students.length) {
      return res.status(404).json({ message: "No active students found in the class" });
    }

    const feeTemplate = await FeesTemplate.findOne({
      sessionId,
      classIds: classId,
    }).populate("fees.feesGroup");
    if (!feeTemplate) {
      return res.status(404).json({ message: "No fee template found for this class and session" });
    }

    const results = [];
    const tallyByStudent = {};

    for (const student of students) {
      const bulkOps = [];
      const studentFeesByMonth = {};

      // Fetch existing custom fees for this student across all requested months
      const existingCustomFees = await StudentFee.find({
        studentId: student._id,
        sessionId,
        month: { $in: months },
        isCustom: true,
      }).select("feesGroup month amount discount");

      const existingCustomFeesMap = new Map(
        existingCustomFees.map(fee => [`${fee.feesGroup.toString()}-${fee.month}`, { amount: fee.amount, discount: fee.discount }])
      );

      for (const month of months) {
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

        feesToGenerate.forEach(fee => {
          const feesGroupId = fee.feesGroup._id.toString();
          const customFee = existingCustomFeesMap.get(`${feesGroupId}-${month}`);

          // Use custom amount and discount if available, otherwise use template amount
          const amountToUse = customFee ? customFee.amount : fee.amount;
          const discountToUse = customFee ? customFee.discount : 0;

          bulkOps.push({
            updateOne: {
              filter: {
                studentId: student._id,
                sessionId,
                feesGroup: fee.feesGroup._id,
                month,
              },
              update: {
                $set: {
                  studentId: student._id,
                  classId: student.classId,
                  sessionId,
                  feesGroup: fee.feesGroup._id,
                  amount: amountToUse,
                  originalAmount: fee.amount, // Always set originalAmount from template
                  discount: discountToUse,
                  netPayable: amountToUse - discountToUse,
                  dueDate: new Date(dueDate),
                  generatedAt: new Date(generatedAt),
                  updatedAt: new Date(generatedAt),
                  month,
                  status: "pending",
                  generationGroupId,
                },
                $setOnInsert: {
                  createdAt: new Date(generatedAt),
                },
              },
              upsert: true,
            },
          });
        });

        studentFeesByMonth[month] = feesToGenerate.map(fee => {
          const feesGroupId = fee.feesGroup._id.toString();
          const customFee = existingCustomFeesMap.get(`${feesGroupId}-${month}`);
          const amountToUse = customFee ? customFee.amount : fee.amount;
          const discountToUse = customFee ? customFee.discount : 0;

          return {
            feesGroup: {
              _id: fee.feesGroup._id,
              name: fee.feesGroup.name,
              periodicity: fee.feesGroup.periodicity,
            },
            amount: amountToUse,
            discount: discountToUse,
            netPayable: amountToUse - discountToUse,
            month,
            status: "pending",
            dueDate: new Date(dueDate),
            generatedAt: new Date(generatedAt),
          };
        });
      }

      if (bulkOps.length > 0) {
        await StudentFee.bulkWrite(bulkOps);
        results.push({ studentId: student._id, status: "generated", months });
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
            months,
          },
        };
      } else {
        results.push({ studentId: student._id, status: "skipped", reason: "No applicable fees for the specified months" });
      }
    }

    res.status(200).json({
      success: true,
      message: "Class fee generation completed for the specified months",
      results,
      tally: Object.values(tallyByStudent),
    });
  } catch (error) {
    console.error("Error in generateFeesForClass:", error);
    res.status(500).json({ message: error.message || "Failed to generate fees for class" });
  }
};


// Fetch all generation groups for a student or class
export const getGenerationGroups = async (req, res) => {
  console.log(req.query);
  const { studentId, classId, sessionId } = req.query;
  try {
    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid or missing sessionId" });
    }

    let query = { sessionId, dueDate: { $exists: true, $ne: null } };
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
        { path: "feesGroup", select: "name periodicity" },
      ])
      .select("month generatedAt generationGroupId amount discount dueDate");

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
      acc[groupId].students[studentId].tally.totalNetPayable += (fee.amount || 0) - (fee.discount || 0);
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