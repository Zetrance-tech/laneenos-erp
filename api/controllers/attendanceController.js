import Student from "../models/student.js";
import Attendance from "../models/attendance.js";
import CCTV from "../models/cctv.js";
import Class from "../models/class.js"; // Assuming you have a Class model
import mongoose from "mongoose";
import StaffAttendance from "../models/staffAttendance.js";
import Teacher from "../models/teacher.js";
import User from "../models/user.js";
//*******************Student Attendance******************** *//
// Mark attendance (in or out) for students in a class
export const markAttendance = async (req, res) => {

  const { classId, date, attendanceRecords } = req.body; // Array of { studentId, status, notes }
  const userId = req.user.userId;
  const role = req.user.role;

  try {
    if (!classId || !date || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ message: "Class ID, date, and attendance records are required" });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }
    // if (role !== "admin" && !classData.teacherId.some(id => id.toString() === userId)) {
    //   console.log("Step 2: Teacher not authorized for class:", classId);
    //   return res.status(403).json({ message: "You are not authorized to mark attendance for this class" });
    // }

    const results = [];
    for (const record of attendanceRecords) {
      const { studentId, status, notes } = record;

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
          markedBy: userId
        });
      }

      if (status) attendance.status = status;
      if (notes) attendance.notes = notes;

      await attendance.save();
      results.push(attendance);
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error in markAttendance:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while marking attendance" });
  }
};

// Update getClassStudentsForAttendance to return status
export const getClassStudentsForAttendance = async (req, res) => {

  const { classId, date } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;

  try {
    if (!classId || !date) {
      return res.status(400).json({ message: "Class ID and date are required" });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // if (role !== "admin" && !classData.teacherId.some(id => id.toString() === userId)) {
    //   console.log("Step 2: Teacher not authorized for class:", classId);
    //   return res.status(403).json({ message: "You are not authorized for this class" });
    // }

    const students = await Student.find({ classId }).select("admissionNumber name");

    const attendanceRecords = await Attendance.find({
      classId,
      date: new Date(date),
    });

    const studentAttendance = students.map(student => {
      const attendance = attendanceRecords.find(a => a.studentId.toString() === student._id.toString());
      return {
        id: student._id,
        admissionNo: student.admissionNumber || "N/A",
        name: student.name,
        status: attendance ? attendance.status : null,
      };
    });

    return res.status(200).json(studentAttendance);
  } catch (error) {
    console.error("Error in getClassStudentsForAttendance:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while fetching class students" });
  }
};

export const getStudentAttendanceAndCCTV = async (req, res) => {

  const { studentId, date } = req.params;
  const parentId = req.user.userId;
  const role = req.user.role;

  try {
    if (!studentId || !date) {
      return res.status(400).json({ message: "Student ID and date are required" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (role === "parent") {
      const parentEmail = req.user.email;
      if (!parentEmail || !["fatherInfo.email", "motherInfo.email", "guardianInfo.email"].some(field => student[field.split(".")[0]].email === parentEmail)) {
        return res.status(403).json({ message: "You are not authorized to view this student’s data" });
      }
    }

    const attendance = await Attendance.findOne({
      studentId,
      date: new Date(date)
    });

    if (!attendance) {
      return res.status(404).json({ message: "No attendance record found for this date" });
    }

    let cctvFeeds = [];
    if (attendance.status === "Present") {
      cctvFeeds = await CCTV.find({ classId: student.classId, active: true });
    }

    return res.status(200).json({
      attendance,
      isStudentIn: attendance.status === "Present",
      cctvFeeds: attendance.status === "Present" ? cctvFeeds : []
    });
  } catch (error) {
    console.error("Error in getStudentAttendanceAndCCTV:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while fetching attendance and CCTV" });
  }
};
// Get attendance for a student over a period
export const getStudentAttendanceByPeriod = async (req, res) => {

  const { studentId } = req.params;
  const { startDate, endDate } = req.query;
  const { userId, role, email } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    if (end < start) {
      return res.status(400).json({ message: "endDate cannot be earlier than startDate" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (role === "parent") {
      const parentEmail = email;
      if (
        !parentEmail ||
        !["fatherInfo.email", "motherInfo.email", "guardianInfo.email"].some(
          (field) => student[field.split(".")[0]]?.email === parentEmail
        )
      ) {
        return res.status(403).json({ message: "You are not authorized to view this student’s data" });
      }
    }

    const attendanceRecords = await Attendance.find({
      studentId: new mongoose.Types.ObjectId(studentId),
      date: {
        $gte: start,
        $lte: end,
      },
    })
      .select("date status notes")
      .lean();


    return res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error("Error in getStudentAttendanceByPeriod:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while fetching attendance"});
  }
};








//*******************Staff Attendance******************** *//

export const getRoles = async (req, res) => {
  try {
    const roles = await User.distinct("role");
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStaffAttendance = async (req, res) => {
  try {
    const { date } = req.params;
    const { role } = req.query;


    if (!date || isNaN(Date.parse(date))) {
      console.warn("Invalid date received:", date);
      return res.status(400).json({ message: "Invalid date" });
    }

    const userQuery = role && role !== "all" ? { role } : {};

    const users = await User.find(userQuery).select("_id role name");

    const teacherUserIds = users.map((user) => user._id);

    const teachers = await Teacher.find({
      userId: { $in: teacherUserIds },
    }).select("_id userId id name role");


    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);


    const attendanceRecords = await StaffAttendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    const staffData = teachers.map((teacher) => {
      const user = users.find(
        (u) => u._id.toString() === teacher.userId.toString()
      );
      const attendance = attendanceRecords.find(
        (record) => record.staffId.toString() === teacher._id.toString()
      );
      return {
        _id: teacher._id,
        id: teacher.id,
        name: teacher.name,
        role: user ? user.role : teacher.role,
        status: attendance ? attendance.status : null,
      };
    });

    res.status(200).json(staffData);
  } catch (error) {
    console.error("Error fetching staff attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createOrUpdateAttendance = async (req, res) => {
  try {
    const { staffId, date, name, role, status } = req.body;


    if (!staffId || !date || !name || !role) {
      console.warn("Missing fields:", { staffId, date, name, role });
      return res.status(400).json({ message: "Missing required fields" });
    }

    const teacher = await Teacher.findById(staffId).populate("userId");
    if (!teacher) {
      console.warn("Teacher not found for ID:", staffId);
      return res.status(404).json({ message: "Staff not found" });
    }

    if (!teacher.userId) {
      console.warn("No associated user for teacher:", staffId);
      return res.status(404).json({ message: "Associated user not found" });
    }

    if (isNaN(Date.parse(date))) {
      console.warn("Invalid date provided:", date);
      return res.status(400).json({ message: "Invalid date" });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let attendance = await StaffAttendance.findOne({
      staffId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (attendance) {
      attendance.name = name;
      attendance.role = role;
      attendance.status = status || attendance.status;
      await attendance.save();
    } else {
      attendance = new StaffAttendance({
        staffId,
        name,
        role,
        status,
        date: new Date(date),
      });
      await attendance.save();
    }

    res.status(200).json({
      _id: teacher._id,
      id: teacher.id,
      name,
      role,
      status: attendance.status,
    });
  } catch (error) {
    console.error("Error saving attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTeacherAttendanceByPeriod = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { startDate, endDate } = req.query;
    const { userId, role } = req.user;


    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn("Invalid date range:", { start, end });
      return res.status(400).json({ message: "Invalid date format" });
    }
    if (end < start) {
      console.warn("End date before start date:", { start, end });
      return res.status(400).json({ message: "endDate cannot be earlier than startDate" });
    }

    const teacher = await Teacher.findOne({ id: teacherId }).populate("userId");
    if (!teacher) {
      console.warn("Teacher not found:", teacherId);
      return res.status(404).json({ message: "Teacher not found" });
    }


    const attendanceRecords = await StaffAttendance.find({
      staffId: teacher._id,
      date: {
        $gte: start,
        $lte: end,
      },
    })
      .select("date status")
      .lean();

    const formattedRecords = attendanceRecords.map(record => ({
      date: record.date.toISOString().split("T")[0],
      status: record.status || null,
    }));

    return res.status(200).json(formattedRecords);
  } catch (error) {
    console.error("Error in getTeacherAttendanceByPeriod:", error.message);
    return res.status(500).json({ message: "Server error while fetching attendance" });
  }
};
