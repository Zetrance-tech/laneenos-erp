import FeesTemplate from '../models/feesTemplate.js';
import Class from "../models/class.js";
import FeesGroup from '../models/feesGroup.js';
import FeesType from '../models/feesType.js';
import Session from "../models/session.js";
import Student from '../models/student.js';
import StudentFee from '../models/studentFee.js';
import FeePayments from "../models/feePayments.js";
// Create a new fee template
export const createFeeTemplate = async (req, res) => {
  try {
    const { templateId, name, sessionId, fees, status } = req.body;
    const branchId = req.user.branchId;
    const session = await Session.findOne({_id:sessionId, branchId});
    if (!session) return res.status(404).json({ message: 'Session not found' });

    for (const fee of fees) {
      const feesGroup = await FeesGroup.findOne({ _id: fee.feesGroup, branchId });
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
      branchId
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
    const branchId = req.user.branchId;
    const feeTemplates = await FeesTemplate.find({branchId}).populate([
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
    const branchId = req.user.branchId;
    const feeTemplate = await FeesTemplate.findOne({ _id: req.params.id, branchId }).populate([
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
    const branchId = req.user.branchId;
    // Validate session if provided
    if (sessionId) {
      const session = await Session.findOne({_id:sessionId, branchId});
      if (!session) return res.status(404).json({ message: 'Session not found' });
    }

    // Validate classIds and session association if provided
    if (classIds && classIds.length > 0) {
      const classes = await Class.find({ _id: { $in: classIds }, sessionId, branchId });
      if (classes.length !== classIds.length) {
        return res.status(404).json({ message: 'One or more classes not found or not associated with this session' });
      }
    }

    if (fees) {
      for (const fee of fees) {
        const feesGroup = await FeesGroup.findOne({_id:fee.feesGroup, branchId});
        if (!feesGroup) return res.status(404).json({ message: `Fees Group ${fee.feesGroup} not found` });
        if (typeof fee.amount !== 'number' || fee.amount < 0) {
          return res.status(400).json({ message: `Invalid amount for Fees Group ${fee.feesGroup}` });
        }
      }
    }

    const updatedFeeTemplate = await FeesTemplate.findByIdAndUpdate(
      {_id:req.params.id, branchId},
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

// controllers/feesTemplateController.js
export const assignFeesToStudents = async (req, res) => {
  const { templateId, sessionId, studentIds, classIds, customFees = null } = req.body;
  const branchId = req.user.branchId;

  console.log("➡️ assignFeesToStudents called with:");
  console.log("templateId:", templateId);
  console.log("sessionId:", sessionId);
  console.log("studentIds:", studentIds);
  console.log("classIds:", classIds);
  console.log("branchId:", branchId);

  try {
    if (!templateId || !sessionId || (!studentIds && !classIds)) {
      return res.status(400).json({ message: "Missing required fields: templateId, sessionId, and either studentIds or classIds" });
    }

    if (studentIds && (!Array.isArray(studentIds) || studentIds.length === 0)) {
      return res.status(400).json({ message: "studentIds must be a non-empty array" });
    }

    if (classIds && (!Array.isArray(classIds) || classIds.length === 0)) {
      return res.status(400).json({ message: "classIds must be a non-empty array" });
    }

    console.log("🔄 Fetching feeTemplate, students, classes...");
    const [feeTemplate, students, classes] = await Promise.all([
      FeesTemplate.findOne({ _id: templateId, branchId }).populate("classIds fees.feesGroup").lean(),
      Student.find({
        $or: [
          { _id: { $in: studentIds || [] }, sessionId, status: 'active', branchId },
          { classId: { $in: classIds || [] }, sessionId, status: 'active', branchId },
        ],
      }).lean(),
      Class.find({ _id: { $in: classIds || [] }, sessionId, branchId }).lean(),
    ]);

    console.log("✅ feeTemplate:", feeTemplate);
    console.log("✅ students.length:", students.length);
    console.log("✅ classes.length:", classes.length);

    if (!feeTemplate) {
      return res.status(404).json({ message: "Fee Template not found" });
    }

    if (sessionId !== feeTemplate.sessionId.toString()) {
      return res.status(400).json({ message: "Session ID does not match the template's session" });
    }

    if (classIds && classes.length !== classIds.length) {
      return res.status(404).json({ message: "One or more classes not found or not associated with this session" });
    }

    feeTemplate.classIds = Array.isArray(feeTemplate.classIds) ? feeTemplate.classIds : [];

    const studentIdSet = new Set(students.map(s => s._id.toString()));
    const uniqueStudents = Array.from(studentIdSet).map(id => students.find(s => s._id.toString() === id));

    console.log("✅ uniqueStudents.length:", uniqueStudents.length);

    if (uniqueStudents.length === 0) {
      return res.status(404).json({ message: "No valid students found for assignment" });
    }

    let addedClassIds = [];
    let removedClassIds = [];
    if (classIds) {
      const oldClassIds = feeTemplate.classIds.map(id => id.toString());
      const newClassIds = classIds.map(id => id.toString());
      addedClassIds = newClassIds.filter(id => !oldClassIds.includes(id));
      removedClassIds = oldClassIds.filter(id => !newClassIds.includes(id));
      await FeesTemplate.findOneAndUpdate({ _id: templateId, branchId }, { classIds }, { new: true });
    }

    const feesGroupIds = new Set(feeTemplate.fees.map(fee => fee.feesGroup._id.toString()));
    const feesGroups = await FeesGroup.find({ _id: { $in: Array.from(feesGroupIds) }, branchId }).lean();
    const feesGroupMap = new Map(feesGroups.map(fg => [fg._id.toString(), fg]));

    let feesToAssign = [];

    if (customFees && Array.isArray(customFees)) {
      feesToAssign = customFees
        .filter(fee => {
          const groupId = fee.feesGroup._id ? fee.feesGroup._id.toString() : fee.feesGroup.toString();
          return mongoose.Types.ObjectId.isValid(groupId) && feesGroupMap.has(groupId);
        })
        .map(fee => {
          const groupId = fee.feesGroup._id ? fee.feesGroup._id.toString() : fee.feesGroup.toString();
          const templateFee = feeTemplate.fees.find(tFee => tFee.feesGroup._id.toString() === groupId);
          const amount = typeof fee.amount === 'number' && fee.amount >= 0 ? fee.amount : 
                         (templateFee ? templateFee.amount : 0);
          return {
            feesGroup: groupId,
            amount,
            originalAmount: fee.originalAmount || amount,
            discount: fee.discount || 0,
          };
        });
    } else {
      feesToAssign = feeTemplate.fees
        .filter(fee => fee.feesGroup && typeof fee.amount === 'number' && fee.amount >= 0)
        .map(fee => ({
          feesGroup: fee.feesGroup._id.toString(),
          amount: fee.amount,
          originalAmount: fee.amount,
          discount: 0,
        }));
    }

    console.log("✅ feesToAssign:", feesToAssign);

    if (feesToAssign.length === 0) {
      return res.status(400).json({ message: "No valid fees to assign" });
    }

    const feesByMonth = {};
    for (const fee of feesToAssign) {
      const feesGroup = feesGroupMap.get(fee.feesGroup);
      const applicableMonths = feesGroup.periodicity === 'Monthly' ? months :
                              feesGroup.periodicity === 'Quarterly' ? quarterlyMonths :
                              ['Apr'];
      for (const month of applicableMonths) {
        if (!feesByMonth[month]) feesByMonth[month] = [];
        feesByMonth[month].push(fee);
      }
    }

    const bulkOps = [];
    for (const student of uniqueStudents) {
      for (const month of months) {
        const validFees = feesByMonth[month] || [];
        if (validFees.length === 0) continue;

        const totalAmount = validFees.reduce((sum, fee) => sum + fee.amount, 0);
        const totalOriginalAmount = validFees.reduce((sum, fee) => sum + fee.originalAmount, 0);
        const totalDiscount = validFees.reduce((sum, fee) => sum + fee.discount, 0);

        console.log("💾 Preparing bulk write for student:", student._id.toString(), "classId:", student.classId);

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
                sessionId,
                classId: new mongoose.Types.ObjectId(
  student.classId && student.classId._id ? student.classId._id : student.classId
),


                fees: validFees,
                amount: totalAmount,
                originalAmount: totalOriginalAmount,
                discount: totalDiscount,
                month,
                status: 'pending',
                isCustom: !!customFees,
                updatedAt: new Date(),
                branchId
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

    console.log("🧾 bulkOps.length:", bulkOps.length);

    const chunkSize = 1000;
    for (let i = 0; i < bulkOps.length; i += chunkSize) {
      await StudentFee.bulkWrite(bulkOps.slice(i, i + chunkSize));
    }

    if (removedClassIds.length > 0) {
      await StudentFee.deleteMany({
        sessionId,
        classId: { $in: removedClassIds },
        feeTemplateId: feeTemplate._id,
        branchId
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
    console.error("❌ Error in assignFeesToStudents:");
    console.error(error);
    res.status(500).json({ 
      message: error.message || "Failed to assign fees",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Delete a fee template
export const deleteFeeTemplate = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const deletedFeeTemplate = await FeesTemplate.findOneAndDelete({ _id: req.params.id, branchId });
    if (!deletedFeeTemplate) return res.status(404).json({ message: 'Fee Template not found' });
    res.json({ message: 'Fee Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get classes by session ID with their templates
export const getClassesBySession = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const { sessionId } = req.params;
    const classes = await Class.find({ _id:sessionId,branchId }).populate('sessionId', 'name sessionId');
    const classIds = classes.map((c) => c._id);

    const templates = await FeesTemplate.find({ classIds: { $in: classIds } ,branchId}).populate([
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
}

// Get fee templates for a class
export const getFeeTemplatesForClass = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const { classId } = req.params;
    const feeTemplates = await FeesTemplate.find({ classIds: classId , branchId}).populate([
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
    const { sessionId } = req.params;
    const {branchId} = req.user;
    // Validate session exists
    const session = await Session.findOne({_id:sessionId, branchId});
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Get all classes for this session
    const classes = await Class.find({ _id:sessionId , branchId})
      .populate('sessionId', 'name sessionId')
      .lean();

    // Get all templates that have any of these classes assigned
    const templates = await FeesTemplate.find({ 
      sessionId,
      classIds: { $exists: true, $not: { $size: 0 } },
      branchId
    })
    .populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
      { path: 'fees.feeTypes.feesType', select: 'name' }
    ])
    .lean();

    // Map templates to their respective classes
    const classesWithTemplates = classes.map(classDoc => {
      const classTemplates = templates.filter(template => 
        template.classIds.some(classId => 
          classId._id.toString() === classDoc._id.toString()
        )
      );

      return {
        ...classDoc,
        templates: classTemplates.map(t => ({
          _id: t._id,
          name: t.name,
          fees: t.fees.map(feeGroup => ({
            feesGroup: feeGroup.feesGroup,
            feeTypes: feeGroup.feeTypes.map(feeType => ({
              feesType: feeType.feesType,
              amount: feeType.amount
            }))
          })),
          status: t.status,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt
        }))
      };
    });

    res.json({
      session: {
        _id: session._id,
        name: session.name,
        sessionId: session.sessionId
      },
      classes: classesWithTemplates
    });
  } catch (error) {
    console.log('Error fetching classes with templates:', error);
    res.status(500).json({ 
      message: 'Failed to fetch classes with templates',
      error: error.message 
    });
  }
};

export const getAssignedStudents = async (req, res) => {
  try {
    const { templateId, sessionId } = req.params;
    const {branchId} = req.user;
    // First, get the template to access its fees groups
    const template = await FeesTemplate.findOne({_id:templateId, branchId})
      .populate('fees.feesGroup');
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Fee template not found'
      });
    }

    // Extract all fees group IDs from the template
    const feesGroupIds = template.fees.map(f => f.feesGroup._id);
    
    // Find all student fees that reference this template
    const assignedStudents = await StudentFee.find({
      sessionId,
      feeTemplateId: templateId,
      branchId
    }).distinct('studentId');
    
    // If you want to include student details, you can populate them
    const students = await Student.find({
      _id: { $in: assignedStudents },
      branchId
    }).select('name admissionNumber');

    res.status(200).json({
      success: true,
      count: assignedStudents.length,
      data: students
    });
  } catch (error) {
    console.error('Error in getAssignedStudents:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getStudentFees = async (req, res) => {
  const { studentId, sessionId } = req.params;
  const {branchId} = req.user;
  try {
    const studentFee = await StudentFee.findOne({ studentId, sessionId , branchId}).populate([
      { path: "customFees.feesGroup", select: "name" }, // Populate nested feesGroup
      { path: "customFees.feeTypes.feesType", select: "name" }, // Populate nested feesType
    ]);

    if (!studentFee) {
      return res.status(404).json({ message: "Student fee not found" });
    }

    res.status(200).json(studentFee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};