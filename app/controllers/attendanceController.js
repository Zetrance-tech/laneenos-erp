import Student from "../models/student.js";
import Attendance from "../models/attendance.js";
import Class from "../models/class.js";
import mongoose from "mongoose";

// Mark attendance for students in a class
export const markAttendance = async (req, res) => {
  const {branchId} = req.user;
  const { classId, date, attendanceRecords, timetableId } = req.body; // Array of { studentId, status }
  const teacherId = req.user.userId;

  try {
    if (!classId || !date || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ message: "Class ID, date, and attendance records are required" });
    }

    // Validate teacher’s access to class
    const classData = await Class.findOne({_id:classId, branchId});
    if (!classData || !classData.teacherId.some(id => id.toString() === teacherId)) {
      return res.status(403).json({ message: "You are not authorized to mark attendance for this class" });
    }

    const validStatuses = ["Present", "Absent", "Holiday", "Closed"];
    const results = [];
    for (const record of attendanceRecords) {
      const { studentId, status } = record;

      const student = await Student.findOne({_id:studentId, branchId});
      if (!student || student.classId.toString() !== classId) {
        results.push({ studentId, error: "Student not found or not in this class" });
        continue;
      }

      if (!validStatuses.includes(status)) {
        results.push({ studentId, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        continue;
      }

      let attendance = await Attendance.findOne({ studentId, date: new Date(date), branchId });
      if (!attendance) {
        attendance = new Attendance({
          studentId,
          classId,
          date: new Date(date),
          markedBy: teacherId,
          timetableId: timetableId || null,
          branchId
        });
      }

      attendance.status = status || null;
      await attendance.save();
      results.push(attendance);
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error in markAttendance:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while marking attendance" });
  }
};

// Get attendance for a specific student on a specific date
export const getStudentAttendance = async (req, res) => {
  const { studentId, date } = req.params;
  const parentId = req.user.userId;
  const role = req.user.role;
  const {branchId} = req.user;

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
    const student = await Student.findOne({_id:studentId,branchId});
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
      date: parsedDate,
      branchId
    });

    if (!attendance) {
      return res.status(200).json({
        studentId,
        date: parsedDate.toISOString(),
        status: null,
        message: "No attendance record found"
      });
    }

    return res.status(200).json({
      studentId,
      date: attendance.date.toISOString(),
      status: attendance.status || null
    });
  } catch (error) {
    console.error("Error in getStudentAttendance:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while fetching attendance" });
  }
};

// Get all students in a class for attendance marking (for teachers)
export const getClassStudentsForAttendance = async (req, res) => {
  const { classId, date } = req.params;
  const teacherId = req.user.userId;
  const { branchId } = req.user;

  try {
    if (!classId || !date) {
      return res.status(400).json({ message: "Class ID and date are required" });
    }

    const classData = await Class.findOne({ _id: classId, branchId });
    if (!classData || !classData.teacherId.includes(teacherId)) {
      return res.status(403).json({ message: "Unauthorized access to this class" });
    }

    const students = await Student.find({ classId, branchId }).select("admissionNumber name rollNumber");

    const attendanceRecords = await Attendance.find({
      classId,
      date: new Date(date),
      branchId
    });

    const studentAttendance = students.map(student => {
      const attendance = attendanceRecords.find(a => a.studentId.toString() === student._id.toString());
      return {
        id: student._id,
        admissionNo: student.admissionNumber || "N/A",
        name: student.name,
        rollNo: student.rollNumber || "N/A",
        status: attendance ? attendance.status : null
      };
    });

    return res.status(200).json(studentAttendance);
  } catch (error) {
    console.error("Error in getClassStudentsForAttendance:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while fetching class students" });
  }
};

// Get child's attendance history for a parent
export const getChildAttendanceHistory = async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate } = req.query;
  const { userId: parentId, email: parentEmail, branchId } = req.user;

  try {
    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findOne({ _id: studentId, branchId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!parentEmail || !["fatherInfo.email", "motherInfo.email", "guardianInfo.email"].some(field => student[field.split(".")[0]].email === parentEmail)) {
      return res.status(403).json({ message: "You are not authorized to view this student’s data" });
    }

    const query = { studentId, branchId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendanceHistory = await Attendance.find(query)
      .select("date status timetableId")
      .sort({ date: -1 });

    const formattedHistory = attendanceHistory.map(record => ({
      date: record.date,
      status: record.status || null,
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