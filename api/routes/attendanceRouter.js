// routes/attendance.js
import express from "express";
import {
  markAttendance, getStudentAttendanceAndCCTV, getClassStudentsForAttendance, getStudentAttendanceByPeriod
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
router.get("/staff/roles", authMiddleware(["teacher", "parent", "admin"]),getRoles);
router.get("/staff-attendance/:date", authMiddleware(["teacher", "parent", "admin"]),getStaffAttendance);
router.post("/staff-attendance", authMiddleware(["teacher", "parent", "admin"]),createOrUpdateAttendance);
router.get("/staff/:teacherId/period", authMiddleware(["admin", "teacher"]), getTeacherAttendanceByPeriod); // New route
//Student attendance
router.post("/", authMiddleware(["teacher", "parent", "admin"]), markAttendance); // Mark in/out
router.get("/:studentId/:date", authMiddleware(["teacher", "parent", "admin"]), getStudentAttendanceAndCCTV); // Parent view
router.get("/class/:classId/:date", authMiddleware(["teacher", "parent", "admin"]), getClassStudentsForAttendance); // Teacher view all students
router.get("/student/:studentId/period", authMiddleware(["teacher", "parent", "admin"]), getStudentAttendanceByPeriod);



export default router;