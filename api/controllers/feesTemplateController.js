import FeesTemplate from '../models/feesTemplate.js';
import Class from '../models/class.js';
import FeesGroup from '../models/feesGroup.js';
import Session from '../models/session.js';
import Student from '../models/student.js';
import StudentFee from '../models/studentFee.js';
import mongoose from 'mongoose';

const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const quarterlyMonths = ["Apr", "Jul", "Oct", "Jan"];

// Create a new fee template
export const createFeeTemplate = async (req, res) => {
  try {
    const { templateId, name, sessionId, fees, status } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    for (const fee of fees) {
      const feesGroup = await FeesGroup.findById(fee.feesGroup);
      if (!feesGroup) return res.status(404).json({ message: `Fees Group ${fee.feesGroup} not found` });
      if (typeof fee.amount !== 'number' || fee.amount < 0) {
        return res.status(400).json({ message: `Invalid amount for Fees Group ${fee.feesGroup}` });
      }
    }

    const newFeeTemplate = new FeesTemplate({
      templateId,
      name,
      sessionId,
      classIds: [],
      fees,
      status,
    });

    const savedFeeTemplate = await newFeeTemplate.save();
    await savedFeeTemplate.populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
    ]);

    res.status(201).json(savedFeeTemplate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all fee templates
export const getAllFeeTemplates = async (req, res) => {
  try {
    const feeTemplates = await FeesTemplate.find().populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
    ]);
    res.json(feeTemplates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get fee template by ID
export const getFeeTemplateById = async (req, res) => {
  try {
    const feeTemplate = await FeesTemplate.findById(req.params.id).populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
    ]);
    if (!feeTemplate) return res.status(404).json({ message: 'Fee Template not found' });
    res.json(feeTemplate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a fee template
export const updateFeeTemplate = async (req, res) => {
  try {
    const { templateId, name, sessionId, classIds, fees, status } = req.body;

    // Validate session if provided
    if (sessionId) {
      const session = await Session.findById(sessionId);
      if (!session) return res.status(404).json({ message: 'Session not found' });
    }

    // Validate classIds and session association if provided
    if (classIds && classIds.length > 0) {
      const classes = await Class.find({ _id: { $in: classIds }, sessionId });
      if (classes.length !== classIds.length) {
        return res.status(404).json({ message: 'One or more classes not found or not associated with this session' });
      }
    }

    if (fees) {
      for (const fee of fees) {
        const feesGroup = await FeesGroup.findById(fee.feesGroup);
        if (!feesGroup) return res.status(404).json({ message: `Fees Group ${fee.feesGroup} not found` });
        if (typeof fee.amount !== 'number' || fee.amount < 0) {
          return res.status(400).json({ message: `Invalid amount for Fees Group ${fee.feesGroup}` });
        }
      }
    }

    const updatedFeeTemplate = await FeesTemplate.findByIdAndUpdate(
      req.params.id,
      { templateId, name, sessionId, classIds, fees, status, updatedAt: Date.now() },
      { new: true }
    ).populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
    ]);

    if (!updatedFeeTemplate) return res.status(404).json({ message: 'Fee Template not found' });
    res.json(updatedFeeTemplate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Assign fees to students or classes
export const assignFeesToStudents = async (req, res) => {
  const { templateId, sessionId, studentIds, classIds, customFees = null } = req.body;

  try {
    console.log("assignFeesToStudents Request Body:", JSON.stringify(req.body, null, 2));

    // Validate input
    if (!templateId || !sessionId || (!studentIds && !classIds)) {
      return res.status(400).json({ message: "Missing required fields: templateId, sessionId, and either studentIds or classIds" });
    }

    // Validate arrays
    if (studentIds && (!Array.isArray(studentIds) || studentIds.length === 0)) {
      return res.status(400).json({ message: "studentIds must be a non-empty array" });
    }
    if (classIds && (!Array.isArray(classIds) || classIds.length === 0)) {
      return res.status(400).json({ message: "classIds must be a non-empty array" });
    }

    // Validate fee template
    const feeTemplate = await FeesTemplate.findById(templateId).populate("classIds");
    if (!feeTemplate) {
      return res.status(404).json({ message: "Fee Template not found" });
    }

    // Validate session
    if (sessionId !== feeTemplate.sessionId.toString()) {
      return res.status(400).json({ message: "Session ID does not match the template's session" });
    }

    // Determine students to process
    let students = [];
    let addedClassIds = [];
    let removedClassIds = [];

    // Fetch students from studentIds
    if (studentIds) {
      const studentRecords = await Student.find({
        _id: { $in: studentIds },
        sessionId,
        status: "active",
      });
      students.push(...studentRecords);
    }

    // Fetch students from classIds and update template's classIds
    if (classIds) {
      // Validate classIds
      const classes = await Class.find({ _id: { $in: classIds }, sessionId });
      if (classes.length !== classIds.length) {
        return res.status(404).json({ message: "One or more classes not found or not associated with this session" });
      }

      // Compare with existing classIds
      const oldClassIds = feeTemplate.classIds.map(id => id.toString());
      const newClassIds = classIds.map(id => id.toString());
      addedClassIds = newClassIds.filter(id => !oldClassIds.includes(id));
      removedClassIds = oldClassIds.filter(id => !newClassIds.includes(id));

      // Update template's classIds
      await FeesTemplate.findByIdAndUpdate(templateId, { classIds }, { new: true });

      // Fetch students from all provided classIds
      const classStudents = await Student.find({
        classId: { $in: classIds },
        sessionId,
        status: "active",
      });
      students.push(...classStudents);
    }

    // Deduplicate students by _id
    const uniqueStudents = Array.from(new Map(students.map(s => [s._id.toString(), s])).values());

    if (uniqueStudents.length === 0) {
      return res.status(404).json({ message: "No valid students found for assignment" });
    }

    // Process fees to assign
    let feesToAssign = [];
    if (customFees && Array.isArray(customFees)) {
      feesToAssign = customFees
        .filter(fee => {
          if (!fee.feesGroup) return false;
          const groupId = fee.feesGroup._id ? fee.feesGroup._id.toString() : fee.feesGroup.toString();
          return mongoose.Types.ObjectId.isValid(groupId);
        })
        .map(fee => {
          const groupId = fee.feesGroup._id ? fee.feesGroup._id.toString() : fee.feesGroup.toString();
          const templateFee = feeTemplate.fees.find(tFee => tFee.feesGroup.toString() === groupId);
          const amount = typeof fee.amount === 'number' && fee.amount >= 0 ? fee.amount : 
                        (templateFee ? templateFee.amount : 0);
          
          return {
            feesGroup: groupId,
            amount,
            originalAmount: fee.originalAmount || amount,
            discount: fee.discount || 0,
            status: 'pending',
            isCustom: true,
          };
        });
    } else {
      feesToAssign = feeTemplate.fees
        .filter(fee => fee.feesGroup && typeof fee.amount === 'number' && fee.amount >= 0)
        .map(fee => ({
          feesGroup: fee.feesGroup._id,
          amount: fee.amount,
          originalAmount: fee.amount,
          discount: 0,
          status: 'pending',
          isCustom: false,
        }));
    }

    if (feesToAssign.length === 0) {
      return res.status(400).json({ message: "No valid fees to assign" });
    }

    const bulkOps = [];

    for (const student of uniqueStudents) {
      for (const fee of feesToAssign) {
        const feesGroup = await FeesGroup.findById(fee.feesGroup);
        if (!feesGroup) continue;

        const applicableMonths = feesGroup.periodicity === 'Monthly' ? months :
                               feesGroup.periodicity === 'Quarterly' ? quarterlyMonths :
                               feesGroup.periodicity === 'Yearly' || feesGroup.periodicity === 'One Time' ? ['Apr'] : [];

        for (const month of applicableMonths) {
          bulkOps.push({
            updateOne: {
              filter: {
                studentId: student._id,
                sessionId,
                feesGroup: fee.feesGroup,
                month,
              },
              update: {
                $set: {
                  studentId: student._id,
                  classId: student.classId,
                  sessionId,
                  feesGroup: fee.feesGroup,
                  amount: fee.amount,
                  originalAmount: fee.originalAmount,
                  discount: fee.discount || 0,
                  month,
                  status: fee.status,
                  isCustom: fee.isCustom,
                  updatedAt: new Date(),
                },
                $setOnInsert: {
                  createdAt: new Date(),
                },
              },
              upsert: true,
            },
          });
        }
      }
    }

    if (bulkOps.length > 0) {
      await StudentFee.bulkWrite(bulkOps);
    }

    if (removedClassIds.length > 0) {
      await StudentFee.deleteMany({
        sessionId,
        classId: { $in: removedClassIds },
        feeTemplateId: feeTemplate._id,
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Fees assigned successfully",
      stats: {
        studentsProcessed: uniqueStudents.length,
        feesAssigned: bulkOps.length,
        classesAdded: addedClassIds.length,
        classesRemoved: removedClassIds.length,
      },
    });
  } catch (error) {
    console.error("Error in assignFeesToStudents:", error);
    res.status(500).json({ 
      message: error.message || "Failed to assign fees",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Update fees for students
export const updateFeesForStudent = async (req, res) => {
  const { templateId, sessionId, studentIds, customFees, mergeTemplateFees = false } = req.body;

  try {
    console.log("updateFeesForStudent Request Body:", JSON.stringify(req.body, null, 2));

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
    console.log(`Found ${students.length} valid students out of ${studentIds.length} provided`);

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

    console.log(`Fees to update:`, JSON.stringify(feesToUpdate, null, 2));

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
        console.log(`Updated StudentFee for ${student._id}`);
      } catch (error) {
        console.error(`Error processing student ${student._id}:`, error);
        throw error;
      }
    });

    await Promise.all(studentFeePromises);

    console.log("Fee update completed successfully for all students");
    res.status(200).json({ success: true, message: "Fees updated successfully" });
  } catch (error) {
    console.error("Error in updateFeesForStudent:", error);
    res.status(500).json({ message: error.message || "Failed to update fees" });
  }
};

// Delete a fee template
export const deleteFeeTemplate = async (req, res) => {
  try {
    const deletedFeeTemplate = await FeesTemplate.findByIdAndDelete(req.params.id);
    if (!deletedFeeTemplate) return res.status(404).json({ message: 'Fee Template not found' });
    res.json({ message: 'Fee Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get classes by session ID with their templates
export const getClassesBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const classes = await Class.find({ sessionId }).populate('sessionId', 'name sessionId');
    const classIds = classes.map((c) => c._id);

    const templates = await FeesTemplate.find({ classIds: { $in: classIds } }).populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
    ]);

    const result = classes.map((classDoc) => ({
      ...classDoc.toObject(),
      templates: templates.filter((t) => t.classIds.some((id) => id.toString() === classDoc._id.toString())),
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get fee templates for a class
export const getFeeTemplatesForClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const feeTemplates = await FeesTemplate.find({ classIds: classId }).populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
    ]);
    if (!feeTemplates.length) return res.status(404).json({ message: 'No templates assigned to this class' });
    res.json(feeTemplates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all classes with their templates for a specific session
export const getClassesWithTemplatesBySession = async (req, res) => {
  try {
    const classes = await Class.find({ sessionId: req.params.sessionId });
    const feeTemplates = await FeesTemplate.find({ sessionId: req.params.sessionId }).populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
    ]);

    const result = classes.map((cls) => ({
      ...cls.toObject(),
      feeTemplates: feeTemplates.filter((template) => template.classIds.includes(cls._id)),
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get assigned students
export const getAssignedStudents = async (req, res) => {
  try {
    const { templateId, sessionId } = req.params;

    console.log(`Fetching assigned students for template ${templateId}, session ${sessionId}`);

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(templateId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      console.error("Invalid templateId or sessionId");
      return res.status(400).json({
        success: false,
        message: "Invalid templateId or sessionId",
      });
    }

    // Find student fees for the template and session
    const assignedStudentIds = await StudentFee.find({
      sessionId,
      feeTemplateId: templateId,
    })
      .distinct('studentId')
      .lean();

    console.log(`Found ${assignedStudentIds.length} assigned student IDs:`, assignedStudentIds);

    // Fetch student details
    const students = await Student.find({
      _id: { $in: assignedStudentIds },
    })
      .select('_id name admissionNumber')
      .lean();

    console.log(`Fetched ${students.length} students:`, JSON.stringify(students, null, 2));

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Error in getAssignedStudents:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch assigned students',
    });
  }
};

