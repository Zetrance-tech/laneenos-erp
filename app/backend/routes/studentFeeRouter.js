import express from "express";
import {
  getStudentsWithFees,
  editStudentFees,
  sendFeeReminder,
  getFeePaymentsBySession,
  collectFees,
  getReminders, // New controller function
  getPendingPayments,
  getUpcomingPayments,
  getPaymentHistory,
  getPaymentSummary,
} from "../controllers/studentFeeController.js";
import {
  initiatePayment,
  handleCallback,
  checkStatus,
  getReceipt,
  
} from "../controllers/paymentController.js";
import mongoose from "mongoose";
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get("/students-fees", authMiddleware(["admin", "parent", "teacher"]),getStudentsWithFees); // Query params: sessionId, classId
router.put("/edit-student-fees",authMiddleware(["admin", "parent", "teacher"]), editStudentFees); // Body: { studentId, sessionId, customFees }
router.post("/send-reminder", authMiddleware(["admin", "parent", "teacher"]),sendFeeReminder); // Body: { studentId, sessionId, feesGroupId, feesTypeId }
router.get("/fee-payments/:sessionId", authMiddleware(["admin", "parent", "teacher"]),getFeePaymentsBySession); // New route
router.post("/collect", authMiddleware(["admin", "parent", "teacher"]),collectFees);
router.get("/reminders", authMiddleware(["admin", "parent", "teacher"]), getReminders); 
router.post("/payment", authMiddleware(["admin", "parent", "teacher"]), initiatePayment);
router.post("/payment/callback", handleCallback);
router.get("/payment/status/:merchantTransactionId", authMiddleware(["admin", "parent", "teacher"]), checkStatus);
router.get("/payment/receipt/:merchantTransactionId", authMiddleware(["admin", "parent", "teacher"]), getReceipt);
router.get("/fees/pending",authMiddleware(["admin", "parent", "teacher"]),  getPendingPayments);
router.get("/fees/upcoming",authMiddleware(["admin", "parent", "teacher"]),  getUpcomingPayments);
router.get("/fees/history", authMiddleware(["admin", "parent", "teacher"]), getPaymentHistory);
router.get("/fees/summary",authMiddleware(["admin", "parent", "teacher"]),  getPaymentSummary);
router.post("/fees/collect",authMiddleware(["admin", "parent", "teacher"]),  collectFees);
export default router;