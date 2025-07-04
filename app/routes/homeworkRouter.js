import express from "express";
import { getHomework, addHomework} from "../controllers/homeworkController.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

router.get("/", authMiddleware(["admin", "parent", "teacher"]), getHomework);
router.post("/add", authMiddleware(["admin", "parent", "teacher"]), addHomework);

export default router;