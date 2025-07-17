// routes/attendance.js
import express from "express";
import {
  markAttendance, getStudentAttendanceAndCCTV, getClassStudentsForAttendance, getStudentAttendanceByPeriod,
  getBranchStudentsAttendance,
  getBranchTeachersAttendance
} from "../controllers/attendanceController.js";
import authMiddleware from "../middleware/auth.js";
import {
  getRoles,
  getStaffAttendance,
  createOrUpdateAttendance,
  getTeacherAttendanceByPeriod
} from "../controllers/attendanceController.js"
const router = express.Router();



//Staff attendance
router.get("/staff/roles", authMiddleware(["teacher", "superadmin", "parent", "admin"]),getRoles);
router.get("/staff-attendance/data", authMiddleware(["teacher","superadmin",  "parent", "admin"]),getBranchTeachersAttendance);
router.get("/staff-attendance/:date", authMiddleware(["teacher","superadmin",  "parent", "admin"]),getStaffAttendance);
router.post("/staff-attendance", authMiddleware(["teacher","superadmin",  "parent", "admin"]),createOrUpdateAttendance);
router.get("/staff/:teacherId/period", authMiddleware(["admin", "superadmin", "teacher"]), getTeacherAttendanceByPeriod); // New route
//Student attendance
router.post("/", authMiddleware(["teacher", "superadmin", "parent", "admin"]), markAttendance); // Mark in/out
router.get("/attendance-data/data", authMiddleware(["teacher", "superadmin", "parent", "admin"]), getBranchStudentsAttendance);
router.get("/:studentId/:date", authMiddleware(["teacher","superadmin",  "parent", "admin"]), getStudentAttendanceAndCCTV); // Parent view
router.get("/class/:classId/:date", authMiddleware(["teacher", "superadmin", "parent", "admin"]), getClassStudentsForAttendance); // Teacher view all students
router.get("/student/:studentId/period", authMiddleware(["teacher","superadmin",  "parent", "admin"]), getStudentAttendanceByPeriod);



export default router;