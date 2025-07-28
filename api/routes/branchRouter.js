import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getAllBranches, unassignBranchAdmin,deleteBranch,assignBranch, createBranch, getBranchById, editBranch } from "../controllers/branchController.js";

const router = express.Router();
router.post("/", authMiddleware(["superadmin", "admin"]) ,createBranch);
router.put("/assign-admin", authMiddleware(["superadmin", "admin"]),  assignBranch);
router.put("/unassign-admin", authMiddleware(["superadmin", "admin"]),unassignBranchAdmin);
router.get("/", authMiddleware(["superadmin", "admin"]) , getAllBranches);
router.get("/details", authMiddleware(["superadmin", "admin", "teacher"]) , getBranchById);
router.put("/:id", authMiddleware(["superadmin", "admin"]), editBranch);
router.delete("/:id",authMiddleware(["superadmin", "admin"]), deleteBranch);
export default router;
