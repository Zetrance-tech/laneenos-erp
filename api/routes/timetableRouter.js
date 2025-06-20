import express from "express";
import {
  createOrUpdateTimetable,
  getTimetable,
  updateActivityStatus,
  getStudentTimetable1,
  editTimetableSlot,
  deleteTimetableSlot
} from "../controllers/timetableController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Only teachers can create/update timetables
router.post("/", authMiddleware(["admin", "parent", "teacher"]),createOrUpdateTimetable);
router.get("/student/:weekStartDate",authMiddleware(["admin", "parent", "teacher"]), getStudentTimetable1);

// Get timetable for a class (admin, teacher, and parents of students in that class)
router.get("/:classId/:weekStartDate",authMiddleware(["admin", "parent", "teacher"]), getTimetable);

// Teachers can update activity status
router.put("/status",authMiddleware(["admin", "parent", "teacher"]), updateActivityStatus);

router.put("/slot", authMiddleware(["admin", "teacher"]), editTimetableSlot);

// Teachers can delete a specific timetable slot
router.delete("/slot", authMiddleware(["admin", "teacher"]), deleteTimetableSlot);


export default router;