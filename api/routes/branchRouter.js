import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getAllBranches, unassignBranchAdmin,deleteBranch,assignBranch, createBranch, getBranchById, editBranch } from "../controllers/branchController.js";

const router = express.Router();
router.post("/", authMiddleware(["superadmin"]) ,createBranch);
router.put("/assign-admin", authMiddleware(["superadmin"]),  assignBranch);
router.put("/unassign-admin", authMiddleware(["superadmin"]),unassignBranchAdmin);
router.get("/", authMiddleware(["superadmin"]) , getAllBranches);
router.get("/details", authMiddleware(["superadmin", "admin", "teacher"]) , getBranchById);
router.put("/:id", authMiddleware(["superadmin"]), editBranch);
router.delete("/:id",authMiddleware(["superadmin"]), deleteBranch);
export default router;
