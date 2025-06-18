import express from "express";
import {
  getAllStudents,
  getStudentById,
  getStudentByFilter,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();
;

router.get("/", authMiddleware(["admin", "parent", "teacher"]), getAllStudents);
router.get("/:admissionNumber", authMiddleware(["admin", "parent", "teacher"]), getStudentById);
router.post("/filter", authMiddleware(["admin", "parent", "teacher"]), getStudentByFilter);
router.post("/create", authMiddleware(["admin", "parent", "teacher"]), createStudent);
router.put("/:admissionNumber", authMiddleware(["admin", "parent", "teacher"]), updateStudent);
router.delete("/:admissionNumber", authMiddleware(["admin", "parent", "teacher"]), deleteStudent);

export default router;