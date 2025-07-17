import express from "express";
import mongoose from "mongoose";
const router = express.Router();
import authMiddleware from "../middleware/auth.js";

import { getStudentFees, updateStudentFees ,getStudentsWithFeesBySession, editFeesForMonth ,editPaymentDetails,updateFeesForStudent, getStudentFeesByMonth,collectStudentFees ,getGenerationGroups, generateStudentFees, getAllStudentFeesByAdmission, getStudentsWithFeesByClassSession, getMonthsWithFeesByStudent, getGeneratedFeesSummaryByClass, updateStudentFeeDueDate, deleteGeneratedFees, generateFeesForClass, getFeesByMonth, getFeesBySession, previewNextPaymentId, getFeeCollectionByMonth} from "../controllers/studentFeeController.js";

router.get("/:studentId/fees", authMiddleware(["admin","parent", "teacher" ]), getStudentFees);
router.put("/:studentId/fees", authMiddleware(["admin","parent", "teacher"]), updateStudentFees);
router.post('/update-fees-for-student', authMiddleware(['admin']), updateFeesForStudent);
router.post('/fees/generate', authMiddleware(['admin']), generateStudentFees);
router.get('/:studentId/fees/month/:month', authMiddleware(['admin', 'parent', 'teacher']), getStudentFeesByMonth);
router.get('/admission/:admissionNumber/fees', authMiddleware(['admin', 'parent', 'teacher']), getAllStudentFeesByAdmission);
router.get("/students-by-class-session/:classId/:sessionId", authMiddleware(['admin', 'parent', 'teacher']), getStudentsWithFeesByClassSession);
router.get("/students-by-session/:sessionId", authMiddleware(['admin', 'parent', 'teacher']), getStudentsWithFeesBySession);
router.get("/months/:studentId", authMiddleware(['admin', 'parent', 'teacher']), getMonthsWithFeesByStudent);
router.get('/class/:classId/session/:sessionId/generated-summary', authMiddleware(['admin', 'parent', 'teacher']), getGeneratedFeesSummaryByClass);
router.patch('/update-due-date', authMiddleware(['admin']),authMiddleware(['admin', 'parent', 'teacher']), updateStudentFeeDueDate);
router.put('/delete-generated-fees', authMiddleware(['admin']), deleteGeneratedFees);
router.post("/fees/generate-class", authMiddleware(["admin"]), generateFeesForClass);
router.get("/generation-groups", authMiddleware(["admin"]), getGenerationGroups);
router.get("/fees-collection-summary", authMiddleware(["admin"]), getFeeCollectionByMonth);
router.get('/:studentId/fees-by-month/:month', authMiddleware(["admin"]), getFeesByMonth);
router.get('/:studentId/fees-by-session/:sessionId', authMiddleware(["admin"]), getFeesBySession);
router.post("/collect", authMiddleware(["admin"]), collectStudentFees);
router.put("/edit-payment", authMiddleware(["admin"]), editPaymentDetails);
router.get("/preview-next-id", authMiddleware(["admin"]), previewNextPaymentId);
router.patch('/edit-fees-month',authMiddleware(["admin"]), editFeesForMonth);
export default router;