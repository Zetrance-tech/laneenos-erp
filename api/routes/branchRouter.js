import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getAllBranches, assignBranch, createBranch, getBranchById, editBranch } from "../controllers/branchController.js";

const router = express.Router();
router.post("/", authMiddleware(["superadmin"]) ,createBranch);
router.put("/assign-admin", authMiddleware(["superadmin"]),  assignBranch);
router.get("/", authMiddleware(["superadmin"]) , getAllBranches);
router.get("/details", authMiddleware(["superadmin", "admin", "teacher"]) , getBranchById);
router.put("/:id", authMiddleware(["superadmin"]), editBranch);

export default router;
