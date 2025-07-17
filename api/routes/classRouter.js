// routes/classRouter.js
import express from "express";
import {
  getAllClasses,
  createClass,
  getClassById,
  updateClass,
  deleteClass,
  getClassesBySession,
  getClassesForTeacher,
  getNextClassId,
  getClassesCount,
  getAllClassesforSuperadmin
} from "../controllers/classController.js"; // Adjust the import path based on your project structure
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

// Route to get all classes
router.get("/", authMiddleware(["admin", "superadmin","parent", "teacher"]), getAllClasses);
router.get("/superadmin", authMiddleware(["admin", "superadmin","parent", "teacher"]), getAllClassesforSuperadmin);

// Route to create a new class
router.post("/create", authMiddleware(["admin", "superadmin", "parent", "teacher"]), createClass);

router.get("/teacher", authMiddleware(["admin", "superadmin","parent", "teacher"]), getClassesForTeacher);

router.get("/next-id", authMiddleware(["admin", "superadmin","parent", "teacher"]), getNextClassId);

router.get("/count-class", authMiddleware(["admin", "superadmin","parent", "teacher"]), getClassesCount);

// Route to get a class by ID (user-entered id or MongoDB _id)
router.get("/:id", authMiddleware(["admin", "superadmin","parent", "teacher"]), getClassById);

// Route to update a class by MongoDB _id
router.put("/:id", authMiddleware(["admin", "superadmin","parent", "teacher"]), updateClass);

// Route to delete a class by MongoDB _id
router.delete("/:id", authMiddleware(["admin", "parent", "teacher"]), deleteClass);

// Route to get all classes for a specific session
router.get("/session/:sessionId", authMiddleware(["admin", "parent", "teacher"]), getClassesBySession);


export default router;