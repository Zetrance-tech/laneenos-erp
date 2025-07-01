import express from 'express';
import { createExpense, getAllExpenses, updateExpense, deleteExpense, previewNextPaymentId } from '../controllers/expenseController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware(["admin"]), createExpense);
router.get('/', authMiddleware(["admin"]), getAllExpenses);
router.get('/next-id', authMiddleware(["admin"]), previewNextPaymentId);
router.put('/:id', authMiddleware(["admin"]), updateExpense);
router.delete('/:id', authMiddleware(["admin"]), deleteExpense);

export default router;