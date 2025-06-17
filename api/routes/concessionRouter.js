import express from "express";
import { 
  addFeesConcession, 
  updateFeesConcession, 
  deleteFeesConcession, 
  getAllFeesConcessions,
  getAllFeeGroupsForConcession
} from "../controllers/concessionController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get('/', authMiddleware(["admin", "parent", "teacher"]), getAllFeesConcessions);
router.get('/fee-groups', authMiddleware(["admin", "parent", "teacher"]), getAllFeeGroupsForConcession);
router.post('/', authMiddleware(["admin", "parent", "teacher"]), addFeesConcession);
router.put('/:id', authMiddleware(["admin", "parent", "teacher"]), updateFeesConcession);
router.delete('/:id', authMiddleware(["admin", "parent", "teacher"]), deleteFeesConcession);

export default router;