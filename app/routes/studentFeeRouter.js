import express from "express";
import {
  getUpcomingFees,
  getPendingFees,
  getPaymentHistory,
  getFeeSummary,
} from "../controllers/studentFeeController.js";
import { initiatePayment, checkStatus} from "../controllers/paymentController.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();


// Get upcoming fees
router.get("/upcoming", authMiddleware(["admin", "parent", "teacher"]), getUpcomingFees);

// Get pending fees
router.get("/pending", authMiddleware(["admin", "parent", "teacher"]), getPendingFees);

// Get payment history
router.get("/history",authMiddleware(["admin", "parent", "teacher"]),getPaymentHistory);

// Get fee summary
router.get("/summary", authMiddleware(["admin", "parent", "teacher"]),getFeeSummary);



router.post("/pay", authMiddleware(["admin", "parent", "teacher"]), initiatePayment)

router.get("/payment/status/:merchantTransactionId", authMiddleware(["admin", "parent", "teacher"]), checkStatus);


export default router;