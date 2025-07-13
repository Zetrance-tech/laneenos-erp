import express from "express";
import {
  sendMessage,
  getInbox,
  getSentMessages,
  getAllClasses,
  getTeacherClasses,
  getAllStudents,
  getAdmins,
  getStudentByParent,
  getClassTeachers,
  getStudentByEmail,
  getParentsByClasses,
  getTeachersByClasses,
} from "../controllers/messageController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Message actions
router.post("/send", authMiddleware(["admin", "parent", "teacher"]), sendMessage);
router.get("/inbox", authMiddleware(["admin", "parent", "teacher"]), getInbox);
router.get("/sent", authMiddleware(["admin", "parent", "teacher"]), getSentMessages);

// Supporting routes for recipient selection
router.get("/classes", authMiddleware(["admin", "parent", "teacher"]), getAllClasses);
router.get("/classes/teacher/:teacherId", authMiddleware(["admin", "parent", "teacher"]), getTeacherClasses);
router.post("/classes/teachers", authMiddleware(["admin", "parent", "teacher"]), getTeachersByClasses); // Changed to POST to match frontend
router.post("/students/parents", authMiddleware(["admin", "parent", "teacher"]), getParentsByClasses); // Changed to POST to match frontend
router.post("/students", authMiddleware(["admin", "parent", "teacher"]), getAllStudents);
router.get("/users/admins", authMiddleware(["admin", "parent", "teacher"]), getAdmins);
router.get("/students/parent/:parentId", authMiddleware(["admin", "parent", "teacher"]), getStudentByParent);
router.get("/classes/:classId/teachers", authMiddleware(["admin", "parent", "teacher"]), getClassTeachers);
router.get("/students/by-email", authMiddleware(["admin", "parent", "teacher"]), getStudentByEmail);

export default router;