import express from "express";
import { getChildren, applyLeave, getLeaveHistory, getFeedback, addFeedback} from "../controllers/parentController.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

router.get("/children", authMiddleware(["admin", "parent", "teacher"]), getChildren);
router.post("/leave", authMiddleware(["admin", "parent", "teacher"]), applyLeave);
router.get("/leave-history", authMiddleware(["admin", "parent", "teacher"]), getLeaveHistory);
router.get("/feedback", authMiddleware(["admin", "parent", "teacher"]), getFeedback); // Get all feedback/suggestions/complaints
router.post("/feedback", authMiddleware(["admin", "parent", "teacher"]), addFeedback); // Add feedback/suggestion/complaint

export default router;