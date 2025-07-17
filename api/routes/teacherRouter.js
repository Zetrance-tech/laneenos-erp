// routes/teacher.js
import express from "express";
import {
  createTeacher,
  getAllTeachers,
  getTeacherByCustomId,
  updateTeacher,
  deleteTeacher,
  getNextStaffId,
  countTeacher,
  getAllStaffForSuperadmin
} from "../controllers/teacherController.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

// Routes
router.post("/create", authMiddleware(["admin", "parent", "teacher"]), createTeacher); // Create a new teacher
router.get("/", authMiddleware(["admin", "parent", "teacher"]), getAllTeachers); // Get all teachers
router.get("/superadmin", authMiddleware(["admin", "parent", "teacher", "superadmin"]), getAllStaffForSuperadmin); // Get all teachers
router.get("/next-id", authMiddleware(["admin", "parent", "teacher"]), getNextStaffId);
router.get("/count-teacher", authMiddleware(["admin", "parent", "teacher"]), countTeacher);
router.get("/:id", authMiddleware(["admin", "parent", "teacher"]), getTeacherByCustomId); // Get a teacher by ID
router.put("/:id", authMiddleware(["admin", "parent", "teacher"]), updateTeacher); // Update a teacher
router.delete("/:id", authMiddleware(["admin", "parent", "teacher"]), deleteTeacher); // Delete a teacher

export default router;