import express from "express";
import { markAttendance, getStudentAttendance, getClassStudentsForAttendance, getChildAttendanceHistory } from "../controllers/attendanceController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware(["teacher"]), markAttendance);

router.get("/student/:studentId/:date", authMiddleware(["parent", "teacher"]), getStudentAttendance);

router.get("/class/:classId/:date", authMiddleware(["teacher"]), getClassStudentsForAttendance);

router.get("/history/:studentId", authMiddleware(["parent"]), getChildAttendanceHistory);

export default router;