import express from "express";
import { 
  createVideo, 
  getAllVideos, 
  getVideoById, 
  updateVideo, 
  deleteVideo,
  getAllVideosForSuperadmin 
} from "../controllers/videoController.js";
import authMiddleware from "../middleware/auth.js";
import { videoUpload } from "../middleware/multer.js";

const router = express.Router();

// Routes for all authenticated users (admin, superadmin, teacher)
router.get("/", authMiddleware(["admin", "superadmin", "teacher"]), getAllVideos);
router.get("/:id", authMiddleware(["admin", "superadmin", "teacher"]), getVideoById);
router.post("/", authMiddleware(["admin", "superadmin", "teacher"]), videoUpload.single("video"), createVideo);
router.put("/:id", authMiddleware(["admin", "superadmin", "teacher"]), videoUpload.single("video"), updateVideo);
router.delete("/:id", authMiddleware(["admin", "superadmin", "teacher"]), deleteVideo);

// Route for superadmin
router.get("/superadmin", authMiddleware(["admin", "superadmin"]), getAllVideosForSuperadmin);

export default router;