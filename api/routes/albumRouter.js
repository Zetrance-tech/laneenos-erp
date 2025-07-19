import express from "express";
import { 
  createAlbum, 
  getAllAlbums, 
  getAlbumById, 
  updateAlbum, 
  deleteAlbum,
  getAllAlbumsForSuperadmin 
} from "../controllers/albumController.js";
import authMiddleware from "../middleware/auth.js";
import { upload, albumUpload } from "../middleware/multer.js";
const router = express.Router();

// Routes for all authenticated users (admin and teacher)
router.get("/", authMiddleware(["admin", "superadmin", "teacher"]), getAllAlbums);
router.get("/:id", authMiddleware(["admin", "superadmin", "teacher"]), getAlbumById);
router.post("/", authMiddleware(["admin", "superadmin", "teacher"]), albumUpload.array("images", 10), createAlbum);
router.put("/:id", authMiddleware(["admin", "superadmin", "teacher"]), albumUpload.array("images", 10), updateAlbum);
router.delete("/:id", authMiddleware(["admin", "superadmin", "teacher"]), deleteAlbum);

// Route for superadmin
router.get("/superadmin", authMiddleware(["admin", "superadmin"]), getAllAlbumsForSuperadmin);

export default router;