import express from "express";
import { 
  getParentVideos
} from "../controllers/videoController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware(["parent"]), getParentVideos);

export default router;