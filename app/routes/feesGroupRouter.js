import express from 'express';
import * as feesGroupController from '../controllers/feesGroupController.js';
import authMiddleware from '../middleware/auth.js';
const router = express.Router();

// Fees Group Routes
router.post('/', authMiddleware(["admin", "parent", "teacher"]), feesGroupController.createFeesGroup);
router.get('/', authMiddleware(["admin", "parent", "teacher"]), feesGroupController.getAllFeesGroups);
router.get('/:id', authMiddleware(["admin", "parent", "teacher"]), feesGroupController.getFeesGroupById);
router.put('/:id', authMiddleware(["admin", "parent", "teacher"]), feesGroupController.updateFeesGroup);
router.delete('/:id', authMiddleware(["admin", "parent", "teacher"]), feesGroupController.deleteFeesGroup);

export default router;