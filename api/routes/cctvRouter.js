import express from "express";
import { 
  createCCTV,
  getAllCCTVs,
  getCCTVById,
  updateCCTV,
  deleteCCTV,
  getCCTVsByBranchId,
} from "../controllers/cctvController.js"
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/create", authMiddleware(["admin", "teacher"]), createCCTV);
router.put("/:id", authMiddleware(["admin", "teacher"]), updateCCTV);
router.delete("/:id", authMiddleware(["admin", "teacher"]), deleteCCTV);
router.get("/", authMiddleware(["admin", "teacher", "parent"]), getAllCCTVs);
router.get("/:id", authMiddleware(["admin", "teacher", "parent"]), getCCTVById);
router.get("/branch", authMiddleware(["admin", "teacher", "parent"]), getCCTVsByBranchId);

export default router;