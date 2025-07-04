// // controllers/attendanceController.js
// import Attendance from "../models/attendance.js";
// import Class from "../models/class.js";
// import Student from "../models/student.js";

// // Add or update daily attendance for all students in a class
// export const addAttendance = async (req, res) => {
//   try {
//     const { classId, date, records } = req.body;
//     const userId = req.user.userId; // Teacher's User._id from token

//     // Validate input
//     if (!classId || !date || !records || !Array.isArray(records)) {
//       return res.status(400).json({ message: "Class ID, date, and records array are required" });
//     }

//     // Check if class exists and teacher is authorized
//     const classData = await Class.findById(classId);
//     if (!classData) {
//       return res.status(404).json({ message: "Class not found" });
//     }
//     if (req.user.role === "teacher" && !classData.teacherId.some(id => id.toString() === userId)) {
//       return res.status(403).json({ message: "You are not authorized to manage this class's attendance" });
//     }

//     // Fetch all students in the class
//     const students = await Student.find({ classId }).select("_id");
//     const studentIds = students.map(student => student._id.toString());

//     // Validate records: Ensure all students are included and no extras
//     const providedStudentIds = records.map(record => record.studentId.toString());
//     if (providedStudentIds.length !== studentIds.length ||
//         !studentIds.every(id => providedStudentIds.includes(id)) ||
//         !providedStudentIds.every(id => studentIds.includes(id))) {
//       return res.status(400).json({ message: "Records must include all and only students in the class" });
//     }

//     // Check for valid status values
//     const validStatuses = ["present", "absent", "late"];
//     for (const record of records) {
//       if (!validStatuses.includes(record.status)) {
//         return res.status(400).json({ message: `Invalid status: ${record.status}. Must be 'present', 'absent', or 'late'` });
//       }
//     }

//     // Check for existing attendance record
//     const existingAttendance = await Attendance.findOne({
//       classId,
//       date: new Date(date)
//     });

//     let attendance;
//     if (existingAttendance) {
//       // Update existing record
//       existingAttendance.records = records;
//       existingAttendance.createdBy = userId; // Update creator in case it's reassigned
//       attendance = await existingAttendance.save();
//     } else {
//       // Create new record
//       attendance = new Attendance({
//         classId,
//         date: new Date(date),
//         records,
//         createdBy: userId
//       });
//       await attendance.save();
//     }

//     res.status(200).json({ message: "Attendance recorded successfully", attendance });
//   } catch (error) {
//     console.error("Error adding attendance:", error.message);
//     res.status(500).json({ message: error.message });
//   }
// };

import Student from "../models/student.js";
import Attendance from "../models/attendance.js";
import Class from "../models/class.js";
import mongoose from "mongoose";

// Mark attendance (in or out) for students in a class
export const markAttendance = async (req, res) => {
  console.log("markAttendance INITIATED - body:", req.body, "user:", req.user);

  const { classId, date, attendanceRecords } = req.body; // Array of { studentId, inTime, outTime, notes }
  const teacherId = req.user.userId;

  try {
    console.log("Step 1: Validating input - classId:", classId, "date:", date);
    if (!classId || !date || !Array.isArray(attendanceRecords)) {
      console.log("Step 1a: Validation failed");
      return res.status(400).json({ message: "Class ID, date, and attendance records are required" });
    }

    // Validate teacher’s access to class
    const classData = await Class.findById(classId);
    if (!classData || !classData.teacherId.some(id => id.toString() === teacherId)) {
      console.log("Step 2: Teacher not authorized for class:", classId);
      return res.status(403).json({ message: "You are not authorized to mark attendance for this class" });
    }

    const results = [];
    for (const record of attendanceRecords) {
      const { studentId, inTime, outTime, notes } = record;
      console.log("Step 3: Processing studentId:", studentId);

      const student = await Student.findById(studentId);
      if (!student || student.classId.toString() !== classId) {
        results.push({ studentId, error: "Student not found or not in this class" });
        continue;
      }

      let attendance = await Attendance.findOne({ studentId, date: new Date(date) });
      if (!attendance) {
        attendance = new Attendance({
          studentId,
          classId,
          date: new Date(date),
          markedBy: teacherId
        });
      }

      if (inTime) attendance.inTime = new Date(inTime);
      if (outTime) attendance.outTime = new Date(outTime);
      if (notes) attendance.notes = notes;

      await attendance.save();
      results.push(attendance);
      console.log("Step 4: Attendance updated for studentId:", studentId, "record:", attendance);
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error in markAttendance:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while marking attendance" });
  }
};



export const getStudentAttendance = async (req, res) => {
  const { studentId, date } = req.params;
  const parentId = req.user.userId;
  const role = req.user.role;

  try {
    if (!studentId || !date) {
      return res.status(400).json({ message: "Student ID and date are required" });
    }

    // Validate studentId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Parse and normalize date
    let parsedDate;
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) {
      const [year, month, day] = date.split("-").map(num => parseInt(num, 10));
      parsedDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      parsedDate = new Date(date);
    }

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Please use a valid date (e.g., YYYY-MM-DD)" });
    }

    parsedDate.setUTCHours(0, 0, 0, 0);

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check parent authorization
    if (role === "parent") {
      const parentEmail = req.user.email;
      if (!parentEmail || !["fatherInfo.email", "motherInfo.email", "guardianInfo.email"].some(field => student[field.split(".")[0]].email === parentEmail)) {
        return res.status(403).json({ message: "You are not authorized to view this student’s data" });
      }
    }
    const attendance = await Attendance.findOne({
      studentId: new mongoose.Types.ObjectId(studentId),
      date: parsedDate
    });
    if (!attendance) {
      return res.status(200).json({
        studentId,
        date: parsedDate.toISOString(),
        present: false,
        inTime: null,
        outTime: null,
        notes: "No attendance record found"
      });
    }
    const isPresent = !!attendance.inTime;

    return res.status(200).json({
      studentId,
      date: attendance.date.toISOString(),
      present: isPresent,
      inTime: attendance.inTime ? attendance.inTime.toISOString() : null,
      outTime: attendance.outTime ? attendance.outTime.toISOString() : null,
      notes: attendance.notes || ""
    });
  } catch (error) {
    console.error("Error in getStudentAttendance:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while fetching attendance" });
  }
};

// Get all students in a class for attendance marking (for teachers)
export const getClassStudentsForAttendance = async (req, res) => {
  console.log("getClassStudentsForAttendance INITIATED - params:", req.params, "user:", req.user);

  const { classId, date } = req.params;
  const teacherId = req.user.userId;

  try {
    console.log("Step 1: Input - classId:", classId, "date:", date);
    if (!classId || !date) {
      console.log("Step 1a: Validation failed");
      return res.status(400).json({ message: "Class ID and date are required" });
    }

    // Validate teacher’s access
    const classData = await Class.findById(classId);
    if (!classData || !classData.teacherId.some(id => id.toString() === teacherId)) {
      console.log("Step 2: Teacher not authorized for class:", classId);
      return res.status(403).json({ message: "You are not authorized for this class" });
    }

    // Get all students in the class
    const students = await Student.find({ classId }).select("admissionNumber name rollNumber");
    console.log("Step 3: Students in class:", students.length);
    console.log("Step 3a: Raw student data:", students);

    // Get attendance records for the date
    const attendanceRecords = await Attendance.find({
      classId,
      date: new Date(date),
    });

    // Map students to include attendance data
    const studentAttendance = students.map(student => {
      const attendance = attendanceRecords.find(a => a.studentId.toString() === student._id.toString());
      return {
        id: student._id,
        admissionNo: student.admissionNumber || "N/A",
        name: student.name,
        rollNo: student.rollNumber || "N/A",
        inTime: attendance ? attendance.inTime : null,
        outTime: attendance ? attendance.outTime : null,
      };
    });

    console.log("Step 4: Prepared attendance list:", studentAttendance);
    return res.status(200).json(studentAttendance);
  } catch (error) {
    console.error("Error in getClassStudentsForAttendance:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while fetching class students" });
  }
};

// New controller: Get child's attendance history for a parent
export const getChildAttendanceHistory = async (req, res) => {
  console.log("getChildAttendanceHistory INITIATED - params:", req.params, "user:", req.user);

  const { studentId } = req.params;
  const { startDate, endDate } = req.query; // Optional date range
  const parentId = req.user.userId;
  const parentEmail = req.user.email;

  try {
    console.log("Step 1: Input - studentId:", studentId, "startDate:", startDate, "endDate:", endDate);
    if (!studentId) {
      console.log("Step 1a: Validation failed");
      return res.status(400).json({ message: "Student ID is required" });
    }

    // Validate student exists
    const student = await Student.findById(studentId);
    console.log("Step 2: Student query result:", student);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if parent is linked to student
    if (!parentEmail || !["fatherInfo.email", "motherInfo.email", "guardianInfo.email"].some(field => student[field.split(".")[0]].email === parentEmail)) {
      console.log("Step 3: Parent not linked to student");
      return res.status(403).json({ message: "You are not authorized to view this student’s data" });
    }

    // Build query for attendance records
    const query = { studentId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get attendance history
    const attendanceHistory = await Attendance.find(query)
      .select("date inTime outTime notes")
      .sort({ date: -1 }); // Sort by date descending

    console.log("Step 4: Attendance history retrieved:", attendanceHistory.length, "records");

    const formattedHistory = attendanceHistory.map(record => ({
      date: record.date,
      inTime: record.inTime,
      outTime: record.outTime,
      isStudentIn: record.isStudentIn(),
      notes: record.notes || ""
    }));

    return res.status(200).json({
      studentId,
      name: student.name,
      attendanceHistory: formattedHistory
    });
  } catch (error) {
    console.error("Error in getChildAttendanceHistory:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while fetching attendance history" });
  }
};