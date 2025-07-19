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
  getAllStudentsWithBranch,
  updateCCTVTimes,
  uploadStudentProfilePhoto,
  getStudentProfilePhoto
} from "../controllers/studentController.js";
import authMiddleware from "../middleware/auth.js";
import { upload, studentUpload } from "../middleware/multer.js";
const router = express.Router();

// Log all incoming requests
// router.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} /api/student${req.originalUrl}`);
//   next();
// });

// CCTV routes (admin-only)
router.get("/cctv-access", authMiddleware(["admin","superadmin"]), getParentsCCTVAccess);
router.put("/cctv-access/:studentId", authMiddleware(["admin","superadmin"]), toggleParentCCTVAccess);
router.put("/cctv-times/:studentId", authMiddleware(["admin", "superadmin", "parent", "teacher"]), updateCCTVTimes);

router.get("/next-id", authMiddleware(["admin","superadmin"]), getNextStudentId);
// Public routes (admin, parent, teacher)
router.get("/", authMiddleware(["admin", "parent", "superadmin", "teacher"]), getAllStudents);
router.get("/branch", authMiddleware(["admin", "parent", "superadmin","teacher"]), getAllStudentsWithBranch);
router.get("/admission/:admissionNumber", authMiddleware(["admin", "superadmin", "parent", "teacher"]), getStudentByAdmissionNumber);
router.get("/by-class-session/:classId/:sessionId", authMiddleware(["admin","superadmin",  "parent", "teacher"]), getStudentsByClassAndSession);
router.post("/filter", authMiddleware(["admin", "parent","superadmin",  "teacher"]), getStudentByFilter);


router.post("/profile-photo/:admissionNumber", authMiddleware(["admin", "superadmin"]), studentUpload.single('profilePhoto'), uploadStudentProfilePhoto);
router.get("/profile-photo/:admissionNumber", authMiddleware(["admin", "superadmin", "parent", "teacher"]), getStudentProfilePhoto);
// Must be after specific routes to avoid catching unintended paths
router.get("/:admissionNumber", authMiddleware(["admin", "parent", "superadmin", "teacher"]), getStudentById);

// Admin-only routes
router.post("/create", authMiddleware(["admin"]), createStudent);
router.put("/:admissionNumber", authMiddleware(["admin"]), updateStudent);
router.delete("/:admissionNumber", authMiddleware(["admin"]), deleteStudent);
export default router;