import express from "express";
import { addNotice, getNotices, getNoticesByRole, updateNotice, deleteNotice } from "../controllers/noticeController.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

router.post("/", authMiddleware(["admin", "parent", "teacher"]), addNotice);
router.get("/", getNotices);
router.get("/role/:role", authMiddleware(["admin", "parent", "teacher"]), getNoticesByRole);
router.put("/:id", authMiddleware(["admin", "parent", "teacher"]), updateNotice);
router.delete("/:id", authMiddleware(["admin", "parent", "teacher"]), deleteNotice);

export default router;