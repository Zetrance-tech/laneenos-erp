import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  sendMessage,
  getInbox,
  getSentMessages,
  markMessageRead,
  getMessageRecipients,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/send", authMiddleware(["admin", "parent", "teacher"]), sendMessage);
router.get("/inbox", authMiddleware(["admin", "parent", "teacher"]), getInbox);
router.get("/sent", authMiddleware(["admin", "parent", "teacher"]), getSentMessages);
router.put("/read/:messageId", authMiddleware(["admin", "parent", "teacher"]), markMessageRead);
router.get("/recipients", authMiddleware(["admin", "parent", "teacher"]), getMessageRecipients);

export default router;