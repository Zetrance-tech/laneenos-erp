import express from 'express';
import {
  createIncome,
  getAllIncomes,
  updateIncome,
  deleteIncome,
  previewNextIncomeId
} from '../controllers/incomeController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware(["admin"]), createIncome);
router.get('/', authMiddleware(["admin"]), getAllIncomes);
router.get('/next-id', authMiddleware(["admin"]), previewNextIncomeId);
router.put('/:id', authMiddleware(["admin"]), updateIncome);
router.delete('/:id', authMiddleware(["admin"]), deleteIncome);

export default router;