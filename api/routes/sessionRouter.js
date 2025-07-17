import express from "express";
import {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
  getNextSessionId,
  getAllSessionsForSuperadmin,
} from "../controllers/sessionController.js"; // Adjust the import path as needed
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

router.post("/create", authMiddleware(["admin", "parent", "superadmin","teacher"]), createSession);
router.get("/get", authMiddleware(["admin", "parent", "superadmin","teacher"]), getAllSessions);
router.get("/get/superadmin", authMiddleware(["admin", "parent", "superadmin","teacher"]), getAllSessionsForSuperadmin);
router.get("/next-id", authMiddleware(["admin", "parent", "superadmin","teacher"]), getNextSessionId);
router.get("/get/:id", authMiddleware(["admin", "parent", "superadmin","teacher"]), getSessionById);
router.put("/update/:id", authMiddleware(["admin", "parent", "superadmin","teacher"]), updateSession);
router.delete("/delete/:id", authMiddleware(["admin", "parent", "superadmin","teacher"]), deleteSession);

export default router;