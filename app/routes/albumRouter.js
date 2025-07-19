import express from "express";
import { 
  getParentAlbums 
} from "../controllers/albumController.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

// Routes for all authenticated users (admin and teacher)
router.get("/", authMiddleware(["admin", "superadmin", "teacher", "parent"]), getParentAlbums);
// router.get("/:id", authMiddleware(["admin", "superadmin", "teacher","parent"]), getAlbumById);


export default router;