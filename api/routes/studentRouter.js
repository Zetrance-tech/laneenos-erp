import express from "express";
import {
  getAllStudents,
  getStudentById,
  getStudentByFilter,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClassAndSession,
  getStudentByAdmissionNumber,
  getParentsCCTVAccess,
  toggleParentCCTVAccess,
  getNextStudentId,
  updateCCTVTimes,
} from "../controllers/studentController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Log all incoming requests
// router.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} /api/student${req.originalUrl}`);
//   next();
// });

// CCTV routes (admin-only)
router.get("/cctv-access", authMiddleware(["admin"]), getParentsCCTVAccess);
router.put("/cctv-access/:studentId", authMiddleware(["admin"]), toggleParentCCTVAccess);
router.put("/cctv-times/:studentId", authMiddleware(["admin", "parent", "teacher"]), updateCCTVTimes);

router.get("/next-id", authMiddleware(["admin"]), getNextStudentId);
// Public routes (admin, parent, teacher)
router.get("/", authMiddleware(["admin", "parent", "teacher"]), getAllStudents);
router.get("/admission/:admissionNumber", authMiddleware(["admin", "parent", "teacher"]), getStudentByAdmissionNumber);
router.get("/by-class-session/:classId/:sessionId", authMiddleware(["admin", "parent", "teacher"]), getStudentsByClassAndSession);
router.post("/filter", authMiddleware(["admin", "parent", "teacher"]), getStudentByFilter);

// Must be after specific routes to avoid catching unintended paths
router.get("/:admissionNumber", authMiddleware(["admin", "parent", "teacher"]), getStudentById);

// Admin-only routes
router.post("/create", authMiddleware(["admin"]), createStudent);
router.put("/:admissionNumber", authMiddleware(["admin"]), updateStudent);
router.delete("/:admissionNumber", authMiddleware(["admin"]), deleteStudent);
export default router;