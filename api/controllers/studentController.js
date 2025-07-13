import Student from "../models/student.js";
import Class from "../models/class.js"; 
import Session from "../models/session.js"; 
import Teacher from "../models/teacher.js";
import mongoose from "mongoose";
import User from "../models/user.js";
import Counter from "../models/counter.js";
import StudentFee from "../models/studentFee.js";
export const getNextSequence = async (type, branchId) => {
  const counter = await Counter.findOneAndUpdate(
    { type: `${type}_id`, branchId },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true  }
  );
  return counter.sequence;
};

export const generateId = async (entityType, branchId) => {
  const sequence = await getNextSequence(entityType, branchId);
  switch (entityType) {
    case "class":
      return `LN-144-C${sequence}`; // LN-144-C001
    case "session":
      return `LN-144-S${sequence}`; // LN-144-S001
    case "student":
      return `LNS-144-${sequence}`; // LNS-144-1
    case "teacher":
      return `LNE-144-${sequence}`; // LNE-144-1
    default:
      throw new Error("Invalid entity type");
  }
};

export const getNextStudentId = async (req, res) => {
  try {
    const { branchId } = req.user;
    const counter = await Counter.findOne({ type : "student_id", branchId });
    const sequence = counter ? counter.sequence + 1 : 1;
    const id = `LNS-144-${sequence}`;
    res.status(200).json({ id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const getParentsCCTVAccess = async (req, res) => {
    const { branchId } = req.user;
  const { sessionId, classId } = req.query;
  const { userId, role } = req.user || {};

  try {
    if (!role || role !== "admin") {
      return res.status(403).json({ message: "Only admins can view parent CCTV access" });
    }

    if (!sessionId || !classId) {
      return res.status(400).json({ message: "sessionId and classId are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(sessionId) || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "Invalid session ID or class ID format" });
    }

    const session = await Session.findOne({_id:sessionId, branchId}).select("name startDate endDate");
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const classData = await Class.findOne({ _id: classId, sessionId, branchId }).select("name");
    if (!classData) {
      return res.status(404).json({ message: "Class not found or does not belong to the specified session" });
    }

    const students = await Student.find({ sessionId, classId, status: "active" , branchId})
      .select("name fatherInfo motherInfo")
      .lean();

    const parents = students.flatMap((student) => {
      const parentList = [];
      const addParent = (info, type) => {
        if (info?.email && info?.name) {
          parentList.push({
            email: info.email,
            name: info.name,
            phoneNumber: info.phoneNumber || "",
            type,
            studentId: student._id.toString(),
            studentName: student.name || "",
            showCCTV: info.showCCTV || false,
            cctvStartTime: info.cctvStartTime || "",
            cctvEndTime: info.cctvEndTime || "",
          });
        }
      };
      addParent(student.fatherInfo, "father");
      addParent(student.motherInfo, "mother");
      return parentList;
    });

    const response = {
      session: {
        id: session._id.toString(),
        name: session.name,
        startDate: session.startDate,
        endDate: session.endDate,
      },
      class: {
        id: classData._id.toString(),
        name: classData.name,
      },
      parents,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in getParentsCCTVAccess:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while fetching parent CCTV access", error: error.message });
  }
};

export const toggleParentCCTVAccess = async (req, res) => {
  const { studentId } = req.params;
  const { parentType } = req.body; // Expect "father" or "mother"
  const { userId, role, branchId } = req.user;

  try {
    if (role !== "admin") {
      return res.status(403).json({ message: "Only admins can toggle CCTV access" });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    if (!["father", "mother"].includes(parentType)) {
      return res.status(400).json({ message: "Invalid parent type. Must be 'father' or 'mother'" });
    }

    const student = await Student.findOne({ _id: studentId, branchId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const infoField = `${parentType}Info`;
    if (!student[infoField]) {
      return res.status(404).json({ message: `${parentType.charAt(0).toUpperCase() + parentType.slice(1)} info not found` });
    }

    student[infoField].showCCTV = !student[infoField].showCCTV;
    await student.save();

    return res.status(200).json({ studentId, parentType, showCCTV: student[infoField].showCCTV });
  } catch (error) {
    console.error("Error in toggleParentCCTVAccess:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while toggling CCTV access", error: error.message });
  }
};

export const updateCCTVTimes = async (req, res) => {
  const { studentId } = req.params;
  const { cctvStartTime, cctvEndTime, parentType } = req.body;
  const { role , branchId} = req.user;

  try {
    if (role !== "admin") {
      return res.status(403).json({ message: "Only admins can update CCTV times" });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    if (!["father", "mother"].includes(parentType)) {
      return res.status(400).json({ message: "Invalid parent type. Must be 'father' or 'mother'" });
    }

    const student = await Student.findOne({ _id: studentId, branchId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const infoField = `${parentType}Info`;
    if (!student[infoField]) {
      return res.status(404).json({ message: `${parentType.charAt(0).toUpperCase() + parentType.slice(1)} info not found` });
    }

    // Allow empty strings for unset times
    if (cctvStartTime === "" && cctvEndTime === "") {
      student[infoField].cctvStartTime = "";
      student[infoField].cctvEndTime = "";
      await student.save();
      return res.status(200).json({
        studentId,
        parentType,
        cctvStartTime: "",
        cctvEndTime: "",
      });
    }

    if (!cctvStartTime || !cctvEndTime) {
      return res.status(400).json({ message: "CCTV start and end times are required if not unset" });
    }

    // Validate time format (e.g., "HH:MM AM/PM") for non-empty strings
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    if (!timeRegex.test(cctvStartTime) || !timeRegex.test(cctvEndTime)) {
      return res.status(400).json({ message: "Invalid time format. Use HH:MM AM/PM" });
    }

    // Convert times to 24-hour format for comparison
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
      if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const startMinutes = parseTime(cctvStartTime);
    const endMinutes = parseTime(cctvEndTime);

    if (startMinutes >= endMinutes) {
      return res.status(400).json({ message: "Start time must be before end time" });
    }

    student[infoField].cctvStartTime = cctvStartTime;
    student[infoField].cctvEndTime = cctvEndTime;
    await student.save();

    return res.status(200).json({
      studentId,
      parentType,
      cctvStartTime: student[infoField].cctvStartTime,
      cctvEndTime: student[infoField].cctvEndTime,
    });
  } catch (error) {
    console.error("Error in updateCCTVTimes:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while updating CCTV times", error: error.message });
  }
};
export const getAllStudents = async (req, res) => {
  try {
    const { role, userId, branchId } = req.user; 
    let students;

    if (role === "teacher") {
      const classes = await Class.find({ teacherId: userId, branchId }).select("_id");
      if (!classes || classes.length === 0) {
        return res.status(404).json({ message: "No classes assigned to this teacher" });
      }

      const classIds = classes.map((cls) => cls._id);
      students = await Student.find({ classId: { $in: classIds }, branchId })
        .select(
          "name admissionNumber admissionDate status sessionId classId profileImage dateOfBirth gender bloodGroup religion category motherTongue languagesKnown fatherInfo motherInfo guardianInfo currentAddress permanentAddress transportInfo documents medicalHistory previousSchool"
        )
        .populate("sessionId", "name sessionId")
        .populate("classId", "name id");

    } else if (role === "admin") {
      students = await Student.find({branchId})
        .select(
          "name admissionNumber admissionDate status sessionId classId profileImage dateOfBirth gender bloodGroup religion category motherTongue languagesKnown fatherInfo motherInfo guardianInfo currentAddress permanentAddress transportInfo documents medicalHistory previousSchool"
        )
        .populate("sessionId", "name sessionId")
        .populate("classId", "name id");

    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    if (students.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error.message);
    res.status(500).json({ message: error.message });
  }
};


// Get student by admissionNumber
export const getStudentById = async (req, res) => {
  try {
    const { admissionNumber } = req.params;
    const { branchId } = req.user;

    const student = await Student.findOne({ admissionNumber, branchId })
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id");

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get students by filter
export const getStudentByFilter = async (req, res) => {
    const { branchId } = req.user;

  try {
    const students = await Student.find({ ...req.body, branchId })
      .select("name admissionNumber academicYear dateOfBirth gender status sessionId classId")
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id");

    res.status(200).json(students);
  } catch (error) {
    console.error("Error filtering students:", error.message);
    res.status(500).json({ message: error.message });
  }
};
export const getStudentByAdmissionNumber = async (req, res) => {
    const { branchId } = req.user;

  try {
    const { admissionNumber } = req.params;
    const student = await Student.findOne({ admissionNumber , branchId}).select("_id classId");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const createStudent = async (req, res) => {
    const { branchId } = req.user;

  const {
    admissionDate,
    status,
    sessionId,
    classId,
    name,
    dateOfBirth,
    gender,
    bloodGroup,
    religion,
    category,
    fatherInfo,
    motherInfo,
    guardianInfo,
    currentAddress,
    permanentAddress,
    transportInfo,
    medicalHistory,
    documents,
  } = req.body;

  try {
    if (!name || !sessionId || !admissionDate || !dateOfBirth || !gender) {
      console.warn("Missing required fields:", { name, sessionId, admissionDate, dateOfBirth, gender });
      return res.status(400).json({ message: "Name, sessionId, admissionDate, dateOfBirth, and gender are required" });
    }
    const admissionNumber = await generateId("student", branchId);
    console.log("Generated admissionNumber:", admissionNumber);

    const existingStudent = await Student.findOne({ admissionNumber, branchId });
    if (existingStudent) {
      console.error("Admission number conflict:", admissionNumber);
      return res.status(400).json({ message: "Admission number already exists" });
    }

    const session = await Session.findOne({ _id: sessionId, branchId });
    if (!session) {
      console.warn("Invalid session ID:", sessionId);
      return res.status(400).json({ message: "Invalid session ID" });
    }

    if (classId) {
      const classExists = await Class.findOne({ _id: classId, branchId });
      if (!classExists) {
        console.warn("Invalid class ID:", classId);
        return res.status(400).json({ message: "Invalid class ID" });
      }
      if (classExists.sessionId.toString() !== sessionId.toString()) {
        console.warn("Class does not belong to session:", { classId, sessionId });
        return res.status(400).json({ message: "Class does not belong to the specified session" });
      }
    }

    const newStudent = new Student({
      admissionNumber,
      admissionDate,
      status: status || "active",
      sessionId,
      classId: classId || null,
      name,
      dateOfBirth,
      gender,
      bloodGroup,
      religion,
      category,
      fatherInfo,
      motherInfo,
      guardianInfo,
      currentAddress,
      permanentAddress,
      transportInfo,
      medicalHistory,
      documents,
      branchId
    });

    const savedStudent = await newStudent.save();
    console.log("Created student:", savedStudent);
    res.status(201).json(savedStudent);
  } catch (error) {
    console.error("Error creating student:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Update student (Admin only)
export const updateStudent = async (req, res) => {
    const { branchId } = req.user;

  try {
    const { admissionNumber } = req.params;
    const {
      admissionDate,
      status,
      sessionId,
      classId,
      name,
      dateOfBirth,
      gender,
      bloodGroup,
      religion,
      category,
      fatherInfo,
      motherInfo,
      guardianInfo,
      currentAddress,
      permanentAddress,
      transportInfo,
      medicalHistory,
      documents,
    } = req.body;

    if (!name || !sessionId || !admissionDate || !dateOfBirth || !gender) {
      console.warn("Missing required fields:", { name, sessionId, admissionDate, dateOfBirth, gender });
      return res.status(400).json({ message: "Name, sessionId, admissionDate, dateOfBirth, and gender are required" });
    }
    if (sessionId) {
      const session = await Session.findOne({ _id: sessionId, branchId });
      if (!session) {
        console.warn("Invalid session ID:", sessionId);
        return res.status(400).json({ message: "Invalid session ID" });
      }
    }

    if (classId) {
      const classExists = await Class.findOne({ _id: classId, branchId });
      if (!classExists) {
        console.warn("Invalid class ID:", classId);
        return res.status(400).json({ message: "Invalid class ID" });
      }
      if (sessionId && classExists.sessionId.toString() !== sessionId.toString()) {
        console.warn("Class does not belong to session:", { classId, sessionId });
        return res.status(400).json({ message: "Class does not belong to the specified session" });
      }
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { admissionNumber, branchId },
      {
        admissionDate,
        status,
        sessionId,
        classId,
        name,
        dateOfBirth,
        gender,
        bloodGroup,
        religion,
        category,
        fatherInfo,
        motherInfo,
        guardianInfo,
        currentAddress,
        permanentAddress,
        transportInfo,
        medicalHistory,
        documents,
      },
      { new: true }
    )
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id");

    if (!updatedStudent) {
      console.warn("Student not found:", admissionNumber);
      return res.status(404).json({ message: "Student not found" });
    }

    console.log("Updated student:", updatedStudent);
    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Delete student by admissionNumber (Admin only)
export const deleteStudent = async (req, res) => {
  try {
    const { admissionNumber } = req.params;
    const { branchId } = req.user;

    const deletedStudent = await Student.findOneAndDelete({ admissionNumber, branchId });
    if (!deletedStudent) {
      console.warn("Student not found:", admissionNumber);
      return res.status(404).json({ message: "Student not found" });
    }
    console.log("Deleted student:", admissionNumber);
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error.message);
    res.status(500).json({ message: error.message });
  }
};
// Get students by class and session
export const getStudentsByClassAndSession = async (req, res) => {
    const { branchId } = req.user;

  try {
    const { classId, sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId) || 
        !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid class or session ID format" });
    }

    const classExists = await Class.findOne({ 
      _id: classId, 
      sessionId: sessionId ,
      branchId
    });

    if (!classExists) {
      return res.status(404).json({ 
        message: "Class not found in the specified session" 
      });
    }

    const students = await Student.find({ 
      classId: classId, 
      sessionId: sessionId ,
      branchId
    })
    .select("name admissionNumber gender category profileImage classId")

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error("Error fetching students by class and session:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching students",
      error: error.message 
    });
  }
};

