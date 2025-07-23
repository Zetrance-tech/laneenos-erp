import express from "express";
import {
  createTeacher,
  getAllTeachers,
  getTeacherByCustomId,
  updateTeacher,
  deleteTeacher,
  getNextStaffId,
  countTeacher,
  getAllStaffForSuperadmin,
  uploadTeacherProfilePhoto,
  getTeacherProfilePhoto,uploadTeacherDocuments
} from "../controllers/teacherController.js";
import authMiddleware from "../middleware/auth.js";
import { upload, teacherUpload , teacherDocUpload} from "../middleware/multer.js";
const router = express.Router();

// Routes
router.post("/create", authMiddleware(["admin"]), teacherDocUpload, createTeacher); // Create a new teacher (admin only)
router.get("/", authMiddleware(["admin", "parent", "teacher"]), getAllTeachers); // Get all teachers
router.get("/superadmin", authMiddleware(["superadmin"]), getAllStaffForSuperadmin); // Get all staff for superadmin
router.get("/next-id", authMiddleware(["admin"]), getNextStaffId); // Get next teacher ID (admin only)
router.get("/count-teacher", authMiddleware(["admin"]), countTeacher); // Count teachers (admin only)
router.get("/:id", authMiddleware(["admin", "parent", "teacher"]), getTeacherByCustomId); // Get a teacher by custom ID
router.put("/:id", authMiddleware(["admin"]), teacherDocUpload,updateTeacher); // Update a teacher (admin only)
router.post("/:id/documents", authMiddleware(["admin"]), teacherDocUpload,uploadTeacherDocuments); // Update a teacher (admin only)
router.delete("/:id", authMiddleware(["admin"]), deleteTeacher); // Delete a teacher (admin only)
router.post("/:id/profile-photo", authMiddleware(["admin", "superadmin"]), teacherUpload.single("profilePhoto"), uploadTeacherProfilePhoto); // Upload teacher profile photo (admin only)
router.get("/:id/profile-photo", authMiddleware(["admin", "parent", "teacher", "superadmin"]), getTeacherProfilePhoto); // Get teacher profile photo

export default router;