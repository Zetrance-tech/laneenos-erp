// // import axios from "axios";
// // import crypto from "crypto";
// // import PDFDocument from "pdfkit";
// // import fs from "fs";
// // import path from "path";
// // import { v4 as uuidv4 } from "uuid";
// // import FeePayments from "../models/feePayments.js";
// // import FeeReminderNotification from "../models/feeReminderNotification.js";
// // import mongoose from "mongoose";
// // // Environment variables
// // const {
// //   PHONEPE_MERCHANT_ID,
// //   PHONEPE_SALT_KEY,
// //   PHONEPE_SALT_INDEX,
// //   PHONEPE_SANDBOX_URL
// // } = process.env;

// // export const updatePaymentStatus = async (feePayment, responseCode, paymentData, session) => {
// //   feePayment.rawResponseCode = responseCode;
// //   feePayment.rawPaymentInstrument = paymentData?.paymentInstrument || {};

// //   // Explicitly handle known response codes
// //   if (responseCode === "PAYMENT_SUCCESS") {
// //     feePayment.amountPaid = feePayment.amountDue;
// //     feePayment.status = "Paid";
// //     feePayment.paymentDate = new Date();
// //     feePayment.transactionStatus = "SUCCESS";
// //     // Override payment method for UPI_QR
// //     feePayment.paymentMethod = feePayment.paymentType === "UPI_QR" ? "UPI" : (paymentData?.paymentInstrument?.type || "UNKNOWN");
// //     feePayment.receiptUrl = await generateReceipt(feePayment);
// //   } else if (responseCode === "PAYMENT_PENDING") {
// //     feePayment.transactionStatus = "PENDING";
// //   } else {
// //     // Handle timeout and error codes explicitly
// //     feePayment.transactionStatus = ["PAYMENT_EXPIRED", "PAYMENT_TIMEOUT", "PAYMENT_ERROR"].includes(responseCode) ? "FAILED" : "FAILED";
// //   }
// //   await feePayment.save({ session });
// // };

// // // Initiate payment
// // export const initiatePayment = async (req, res) => {
// //   const session = await mongoose.startSession();
// //   session.startTransaction();
// //   try {
// //     const { feePaymentId, mobileNumber, parentId } = req.body;
// //     if (!feePaymentId || !parentId) {
// //       return res.status(400).json({ message: "Missing required fields" });
// //     }
// //     const feePayment = await FeePayments.findById(feePaymentId).populate(
// //       "feesGroupId feesTypeId studentId"
// //     );
// //     if (!feePayment) {
// //       return res.status(404).json({ message: "Fee payment not found" });
// //     }
// //     if (feePayment.status === "Paid") {
// //       return res.status(400).json({ message: "Fee already paid" });
// //     }

// //     const amount = feePayment.amountDue - feePayment.amountPaid;
// //     const merchantTransactionId = `MT${uuidv4()}`;
// //     const payload = {
// //       merchantId: PHONEPE_MERCHANT_ID,
// //       merchantTransactionId,
// //       merchantUserId: `MUID${parentId}`,
// //       amount: Math.round(amount * 100), // INR to paisa
// //       redirectUrl: `http://localhost:5000/api/feesPayment/payment/status`,
// //       redirectMode: "POST",
// //       callbackUrl: `http://localhost:5000/api/feesPayment/payment/callback`,
// //       mobileNumber: mobileNumber || "9999999999",
// //       paymentInstrument: { type: "PAY_PAGE" }
// //     };

// //     const payloadStr = JSON.stringify(payload);
// //     const payloadBase64 = Buffer.from(payloadStr).toString("base64");
// //     const string = payloadBase64 + "/pg/v1/pay" + PHONEPE_SALT_KEY;
// //     const sha256 = crypto.createHash("sha256").update(string).digest("hex");
// //     const checksum = sha256 + "###" + PHONEPE_SALT_INDEX;

// //     const response = await axios.post(
// //       `${PHONEPE_SANDBOX_URL}/pg/v1/pay`,
// //       { request: payloadBase64 },
// //       {
// //         headers: {
// //           "Content-Type": "application/json",
// //           "X-VERIFY": checksum,
// //           accept: "application/json"
// //         }
// //       }
// //     );

// //     feePayment.merchantTransactionId = merchantTransactionId;
// //     feePayment.transactionStatus = "PENDING";
// //     await feePayment.save({ session });
// //     await session.commitTransaction();
// //     res.json({
// //       paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
// //       merchantTransactionId
// //     });
// //   } catch (error) {
// //     await session.abortTransaction();
// //     res.status(500).json({ message: "Payment initiation failed" });
// //   } finally {
// //     session.endSession();
// //   }
// // };

// // // Handle callback
// // export const handleCallback = async (req, res) => {
// //   const session = await mongoose.startSession();
// //   session.startTransaction()
// //   try {
// //     const { merchantTransactionId, responseCode } = req.body;
// //     const feePayment = await FeePayments.findOne({ merchantTransactionId })
// //       .populate("feesGroupId feesTypeId studentId")
// //       .session(session);
// //     if (!feePayment) {
// //       return res.status(404).json({ message: "Transaction not found" });
// //     }

// //     await updatePaymentStatus(feePayment, responseCode, req.body, session)
// //     await session.commitTransaction();
// //     res.status(200).json({ message: "Callback processed" });
// //   } catch (error) {
// //     await session.abortTransaction();
// //     res.status(500).json({ message: "Callback processing failed" });
// //   } finally {
// //     session.endSession();
// //   }

// // };

// // // Check payment status
// // export const checkStatus = async (req, res) => {
// //   const session = await mongoose.startSession();
// //   session.startTransaction();
// //   try {
// //     const { merchantTransactionId } = req.params;
// //     const feePayment = await FeePayments.findOne({ merchantTransactionId }).populate(
// //       "feesGroupId feesTypeId studentId"
// //     ).session(session);
// //     if (!feePayment) {
// //       return res.status(404).json({ message: "Transaction not found" });
// //     }

// //     const string = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}${PHONEPE_SALT_KEY}`;
// //     const sha256 = crypto.createHash("sha256").update(string).digest("hex");
// //     const checksum = sha256 + "###" + PHONEPE_SALT_INDEX;

// //     const response = await axios.get(
// //       `${PHONEPE_SANDBOX_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`,
// //       {
// //         headers: {
// //           "Content-Type": "application/json",
// //           "X-VERIFY": checksum,
// //           "X-MERCHANT-ID": PHONEPE_MERCHANT_ID,
// //           accept: "application/json"
// //         }
// //       }
// //     );

// //     const { code, data } = response.data;
// //     if (data.state === "COMPLETED") {
// //       await updatePaymentStatus(feePayment, "PAYMENT_SUCCESS", data, session);
// //     } else if (data.state === "PENDING") {
// //       await updatePaymentStatus(feePayment, "PAYMENT_PENDING", data, session);
// //     } else {
// //       await updatePaymentStatus(feePayment, "PAYMENT_FAILED", data, session);
// //     }
// //     // await updatePaymentStatus(feePayment, code, data, session);

// //     await session.commitTransaction();
// //     res.json({ status: feePayment.transactionStatus, feePayment });
// //   } catch (error) {
// //     console.error("Status check error:", error.message);
// //     await session.abortTransaction();
// //     res.status(500).json({ message: "Status check failed" });
// //   }finally {
// //     session.endSession();
// //   }
// // };

// // // Generate PDF receipt
// // const generateReceipt = async (feePayment) => {
// //   const doc = new PDFDocument();
// //   const fileName = `receipt_${feePayment.merchantTransactionId}.pdf`;
// //   const filePath = path.join("receipts", fileName);
// //   fs.mkdirSync("receipts", { recursive: true });
// //   const stream = fs.createWriteStream(filePath);

// //   doc.pipe(stream);
// //   doc.fontSize(20).text("Payment Receipt", { align: "center" });
// //   doc.moveDown();
// //   doc.fontSize(12).text(`Student: ${feePayment.studentId.name}`);
// //   doc.text(`Fee Type: ${feePayment.feesTypeId.name}`);
// //   doc.text(`Fee Group: ${feePayment.feesGroupId.name}`);
// //   doc.text(`Amount Paid: ₹${feePayment.amountPaid / 100}`);
// //   doc.text(`Payment Date: ${feePayment.paymentDate.toLocaleDateString()}`);
// //   doc.text(`Transaction ID: ${feePayment.merchantTransactionId}`);
// //   doc.end();

// //   return `/receipts/${fileName}`;
// // };
// // // Serve receipt
// // export const getReceipt = async (req, res) => {
// //   try {
// //     const { merchantTransactionId } = req.params;
// //     const feePayment = await FeePayments.findOne({ merchantTransactionId });
// //     if (!feePayment || !feePayment.receiptUrl) {
// //       return res.status(404).json({ message: "Receipt not found" });
// //     }

// //     const filePath = path.join(process.cwd(), feePayment.receiptUrl);
// //     res.download(filePath);
// //   } catch (error) {
// //     console.error("Receipt download error:", error.message);
// //     res.status(500).json({ message: "Failed to download receipt" });
// //   }
// // };

// import axios from "axios";
// import crypto from "crypto";
// import PDFDocument from "pdfkit";
// import fs from "fs";
// import path from "path";
// import { v4 as uuidv4 } from "uuid";
// import StudentFee from "../models/studentFee.js";
// import Student from "../models/student.js";
// import mongoose from "mongoose";

// // Environment variables
// const {
//   PHONEPE_MERCHANT_ID,
//   PHONEPE_SALT_KEY,
//   PHONEPE_SALT_INDEX,
//   PHONEPE_SANDBOX_URL
// } = process.env;

// // Update payment status in StudentFee model
// export const updatePaymentStatus = async (studentFee, responseCode, paymentData, session) => {
//   if (responseCode === "PAYMENT_SUCCESS") {
//     studentFee.status = "paid";
//     studentFee.updatedAt = new Date();
//     // Unset merchantTransactionId as it's no longer needed
//     studentFee.merchantTransactionId = undefined;
//     // studentFee.receiptUrl = await generateReceipt(studentFee);
//   } else if (responseCode === "PAYMENT_PENDING") {
//     studentFee.status = "pending";
//   } else {
//     // Handle timeout and error codes
//     studentFee.status = ["PAYMENT_EXPIRED", "PAYMENT_TIMEOUT", "PAYMENT_ERROR"].includes(responseCode) ? "overdue" : "pending";
//     studentFee.merchantTransactionId = undefined; // Clean up on failure
//   }
//   await studentFee.save({ session });
// };

// // Initiate payment
// export const initiatePayment = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { feeId, mobileNumber } = req.body;
//     const { email, role } = req.user;

//     if (role !== "parent") {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(403).json({ message: "Only parents can initiate payments" });
//     }

//     if (!feeId) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ message: "Missing required field: feeId" });
//     }

//     // Find student(s) linked to parent
//     const students = await Student.find({
//       $or: [
//         { "fatherInfo.email": email },
//         { "motherInfo.email": email },
//       ],
//       status: "active",
//     }).select("_id").session(session);

//     const studentIds = students.map((student) => student._id);
//     if (!studentIds.length) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ message: "No active students found for this parent" });
//     }

//     // Find the StudentFee record
//     const studentFee = await StudentFee.findOne({
//       _id: feeId,
//       studentId: { $in: studentIds },
//     })
//       .populate([
//         { path: "feesGroup", select: "name periodicity" },
//         { path: "studentId", select: "name admissionNumber" },
//       ])
//       .session(session);

//     if (!studentFee) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ message: "Fee record not found or not associated with this parent" });
//     }

//     if (studentFee.status === "paid") {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ message: "Fee already paid" });
//     }

//     const amount = studentFee.amount; // Net payable
//     const merchantTransactionId = `MT${uuidv4()}`;
//     const payload = {
//       merchantId: PHONEPE_MERCHANT_ID,
//       merchantTransactionId,
//       merchantUserId: `MUID${email}`,
//       amount: Math.round(amount * 100), // INR to paisa
//       redirectUrl: `http://localhost:5000/api/parent/fees/payment/status`,
//       redirectMode: "POST",
//       callbackUrl: `http://localhost:5000/api/parent/fees/payment/callback`,
//       mobileNumber: mobileNumber || "9999999999",
//       paymentInstrument: { type: "PAY_PAGE" },
//     };

//     const payloadStr = JSON.stringify(payload);
//     const payloadBase64 = Buffer.from(payloadStr).toString("base64");
//     const string = payloadBase64 + "/pg/v1/pay" + PHONEPE_SALT_KEY;
//     const sha256 = crypto.createHash("sha256").update(string).digest("hex");
//     const checksum = sha256 + "###" + PHONEPE_SALT_INDEX;

//     const response = await axios.post(
//       `${PHONEPE_SANDBOX_URL}/pg/v1/pay`,
//       { request: payloadBase64 },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "X-VERIFY": checksum,
//           accept: "application/json",
//         },
//       }
//     );

//     studentFee.merchantTransactionId = merchantTransactionId;
//     studentFee.status = "pending";
//     await studentFee.save({ session });
//     await session.commitTransaction();
//     res.json({
//       paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
//       merchantTransactionId,
//     });
//   } catch (error) {
//     console.error("Payment initiation error:", error.message);
//     await session.abortTransaction();
//     res.status(500).json({ message: "Payment initiation failed", error: error.message });
//   } finally {
//     session.endSession();
//   }
// };

// // Handle callback
// export const handleCallback = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { merchantTransactionId, responseCode } = req.body;
//     const studentFee = await StudentFee.findOne({ merchantTransactionId })
//       .populate([
//         { path: "feesGroup", select: "name periodicity" },
//         { path: "studentId", select: "name admissionNumber" },
//       ])
//       .session(session);

//     if (!studentFee) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ message: "Fee record not found" });
//     }

//     await updatePaymentStatus(studentFee, responseCode, req.body, session);
//     await session.commitTransaction();
//     res.status(200).json({ message: "Callback processed" });
//   } catch (error) {
//     console.error("Callback processing error:", error.message);
//     await session.abortTransaction();
//     res.status(500).json({ message: "Callback processing failed", error: error.message });
//   } finally {
//     session.endSession();
//   }
// };

// export const checkStatus = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { merchantTransactionId } = req.params;
//     const { email, role } = req.user;

//     if (role !== "parent") {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(403).json({ message: "Only parents can check payment status" });
//     }

//     // Find student(s) linked to parent
//     const students = await Student.find({
//       $or: [
//         { "fatherInfo.email": email },
//         { "motherInfo.email": email },
//       ],
//       status: "active",
//     }).select("_id").session(session);

//     const studentIds = students.map((student) => student._id);
//     if (!studentIds.length) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ message: "No active students found for this parent" });
//     }

//     const studentFee = await StudentFee.findOne({
//       merchantTransactionId,
//       studentId: { $in: studentIds },
//     })
//       .populate([
//         { path: "feesGroup", select: "name periodicity" },
//         { path: "studentId", select: "name admissionNumber" },
//       ])
//       .session(session);

//     if (!studentFee) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ message: "Fee record not found" });
//     }

//     const string = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}${PHONEPE_SALT_KEY}`;
//     const sha256 = crypto.createHash("sha256").update(string).digest("hex");
//     const checksum = sha256 + "###" + PHONEPE_SALT_INDEX;

//     let response;
//     try {
//       response = await axios.get(
//         `${PHONEPE_SANDBOX_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             "X-VERIFY": checksum,
//             "X-MERCHANT-ID": PHONEPE_MERCHANT_ID,
//             accept: "application/json",
//           },
//         }
//       );
//     } catch (apiError) {
//       console.error("PhonePe API error:", {
//         message: apiError.message,
//         status: apiError.response?.status,
//         data: apiError.response?.data,
//       });
//       await updatePaymentStatus(studentFee, "PAYMENT_ERROR", {}, session);
//       await session.commitTransaction();
//       return res.status(500).json({ message: "Failed to check payment status with PhonePe", error: apiError.message });
//     }

//     // Log the full response for debugging
//     console.log("PhonePe status response:", {
//       status: response.status,
//       data: response.data,
//     });

//     // Validate response structure
//     if (!response.data || typeof response.data !== "object") {
//       console.error("Invalid PhonePe response: No data received");
//       await updatePaymentStatus(studentFee, "PAYMENT_ERROR", {}, session);
//       await session.commitTransaction();
//       return res.status(500).json({ message: "Invalid response from PhonePe" });
//     }

//     const { code, data } = response.data;

//     // Check if data exists and has state
//     if (!data || typeof data.state !== "string") {
//       console.error("Invalid PhonePe response data:", { code, data });
//       await updatePaymentStatus(studentFee, code || "PAYMENT_ERROR", data || {}, session);
//       await session.commitTransaction();
//       return res.status(500).json({ message: "Invalid or missing state in PhonePe response", code });
//     }

//     // Update based on state
//     if (data.state === "COMPLETED") {
//       await updatePaymentStatus(studentFee, "PAYMENT_SUCCESS", data, session);
//     } else if (data.state === "PENDING") {
//       await updatePaymentStatus(studentFee, "PAYMENT_PENDING", data, session);
//     } else {
//       await updatePaymentStatus(studentFee, "PAYMENT_FAILED", data, session);
//     }

//     await session.commitTransaction();
//     res.json({ status: studentFee.status, fee: formatFeeForResponse(studentFee) });
//   } catch (error) {
//     console.error("Status check error:", {
//       message: error.message,
//       stack: error.stack,
//     });
//     await session.abortTransaction();
//     res.status(500).json({ message: "Status check failed", error: error.message });
//   } finally {
//     session.endSession();
//   }
// };
// // Generate PDF receipt
// const generateReceipt = async (studentFee) => {
//   const doc = new PDFDocument();
//   const fileName = `receipt_${studentFee.merchantTransactionId || studentFee._id}.pdf`;
//   const filePath = path.join("receipts", fileName);
//   fs.mkdirSync("receipts", { recursive: true });
//   const stream = fs.createWriteStream(filePath);

//   doc.pipe(stream);
//   doc.fontSize(20).text("Payment Receipt", { align: "center" });
//   doc.moveDown();
//   doc.fontSize(12).text(`Student: ${studentFee.studentId.name}`);
//   doc.text(`Fee Group: ${studentFee.feesGroup.name}`);
//   doc.text(`Amount Paid: ₹${(studentFee.amount - (studentFee.discount || 0)) / 100}`);
//   doc.text(`Payment Date: ${studentFee.updatedAt.toLocaleDateString()}`);
//   doc.text(`Transaction ID: ${studentFee.merchantTransactionId || studentFee._id}`);
//   doc.text(`Month: ${studentFee.month}`);
//   doc.end();

//   return `/receipts/${fileName}`;
// };

// // Serve receipt
// // export const getReceipt = async (req, res) => {
// //   try {
// //     const { merchantTransactionId } = req.params;
// //     const { email, role } = req.user;

// //     if (role !== "parent") {
// //       return res.status(403).json({ message: "Only parents can access receipts" });
// //     }

// //     const students = await Student.find({
// //       $or: [
// //         { "fatherInfo.email": email },
// //         { "motherInfo.email": email },
// //       ],
// //       status: "active",
// //     }).select("_id");

// //     const studentIds = students.map((student) => student._id);
// //     if (!studentIds.length) {
// //       return res.status(404).json({ message: "No active students found for this parent" });
// //     }

// //     const studentFee = await StudentFee.findOne({
// //       merchantTransactionId,
// //       studentId: { $in: studentIds },
// //       // receiptUrl: { $exists: true, $ne: null },
// //     });

// //     if (!studentFee || !studentFee.receiptUrl) {
// //       return res.status(404).json({ message: "Receipt not found" });
// //     }

// //     const filePath = path.join(process.cwd(), studentFee.receiptUrl);
// //     res.download(filePath);
// //   } catch (error) {
// //     console.error("Receipt download error:", error.message);
// //     res.status(500).json({ message: "Failed to download receipt", error: error.message });
// //   }
// // };

// // Helper function to format fee response (consistent with parentFeeController.js)
// function formatFeeForResponse(fee) {
//   return {
//     _id: fee._id,
//     student: {
//       _id: fee.studentId._id || fee.studentId,
//       name: fee.studentId?.name || fee.student?.name || "",
//       admissionNumber: fee.studentId?.admissionNumber || fee.student?.admissionNumber || "",
//     },
//     feesGroup: {
//       _id: fee.feesGroup._id,
//       name: fee.feesGroup.name,
//       periodicity: fee.feesGroup.periodicity,
//     },
//     amount: fee.amount || 0,
//     discountPercent: fee.discount ? (fee.discount / fee.originalAmount * 100) : 0,
//     netPayable: (fee.amount || 0) - (fee.discount || 0),
//     dueDate: fee.dueDate,
//     month: fee.month,
//     status: fee.status,
//     generatedAt: fee.generatedAt,
//     merchantTransactionId: fee.merchantTransactionId || "",
//   };
// }

import axios from "axios";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import StudentFee from "../models/studentFee.js";
import Student from "../models/student.js";
import mongoose from "mongoose";

// Environment variables
const {
  PHONEPE_MERCHANT_ID,
  PHONEPE_SALT_KEY,
  PHONEPE_SALT_INDEX,
  PHONEPE_SANDBOX_URL
} = process.env;

// Update payment status in StudentFee model
export const updatePaymentStatus = async (studentFee, responseCode, paymentData, session) => {
  const amountPaid = paymentData.amount ? paymentData.amount / 100 : studentFee.balanceAmount; // Convert paisa to INR
  studentFee.amountPaid += amountPaid;
  studentFee.balanceAmount = studentFee.amount - studentFee.discount - studentFee.amountPaid;

  if (responseCode === "PAYMENT_SUCCESS") {
    studentFee.paymentDetails.push({
      paymentId: `PAY${uuidv4()}`,
      modeOfPayment: paymentData.paymentInstrument?.type || "Unknown",
      collectionDate: new Date(),
      amountPaid,
      transactionNo: paymentData.transactionId || null,
      transactionDate: paymentData.transactionDate || null,
    });

    if (studentFee.balanceAmount <= 0) {
      studentFee.status = "paid";
      studentFee.merchantTransactionId = undefined; // Clear transaction ID
    } else {
      studentFee.status = "partially_paid";
    }
    studentFee.updatedAt = new Date();
  } else if (responseCode === "PAYMENT_PENDING") {
    studentFee.status = studentFee.amountPaid > 0 ? "partially_paid" : "pending";
  } else {
    studentFee.status = ["PAYMENT_EXPIRED", "PAYMENT_TIMEOUT", "PAYMENT_ERROR"].includes(responseCode)
      ? "overdue"
      : studentFee.amountPaid > 0 ? "partially_paid" : "pending";
    studentFee.merchantTransactionId = undefined; // Clean up on failure
  }
  await studentFee.save({ session });
};

// Initiate payment
export const initiatePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { feeId, mobileNumber } = req.body;
    const { email, role } = req.user;

    if (role !== "parent") {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "Only parents can initiate payments" });
    }

    if (!feeId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Missing required field: feeId" });
    }

    // Find student(s) linked to parent
    const students = await Student.find({
      $or: [
        { "fatherInfo.email": email },
        { "motherInfo.email": email },
      ],
      status: "active",
    }).select("_id").session(session);

    const studentIds = students.map((student) => student._id);
    if (!studentIds.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "No active students found for this parent" });
    }

    // Find the StudentFee record
    const studentFee = await StudentFee.findOne({
      _id: feeId,
      studentId: { $in: studentIds },
    })
      .populate([
        { path: "fees.feesGroup", select: "name periodicity" },
        { path: "studentId", select: "name admissionNumber" },
      ])
      .session(session);

    if (!studentFee) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Fee record not found or not associated with this parent" });
    }

    if (studentFee.status === "paid") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Fee already fully paid" });
    }

    // Determine payment amount based on status
    const amount = studentFee.status === "partially_paid" ? studentFee.balanceAmount : studentFee.amount;
    if (amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "No remaining balance to pay" });
    }

    const merchantTransactionId = `MT${uuidv4()}`;
    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: `MUID${email}`,
      amount: Math.round(amount * 100), // INR to paisa
      redirectUrl: `http://localhost:5000/api/parent/fees/payment/status`,
      redirectMode: "POST",
      callbackUrl: `http://localhost:5000/api/parent/fees/payment/callback`,
      mobileNumber: mobileNumber || "9999999999",
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payloadStr = JSON.stringify(payload);
    const payloadBase64 = Buffer.from(payloadStr).toString("base64");
    const string = payloadBase64 + "/pg/v1/pay" + PHONEPE_SALT_KEY;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + PHONEPE_SALT_INDEX;

    const response = await axios.post(
      `${PHONEPE_SANDBOX_URL}/pg/v1/pay`,
      { request: payloadBase64 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          accept: "application/json",
        },
      }
    );

    studentFee.merchantTransactionId = merchantTransactionId;
    studentFee.status = studentFee.amountPaid > 0 ? "partially_paid" : "pending";
    await studentFee.save({ session });
    await session.commitTransaction();
    res.json({
      paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
      merchantTransactionId,
    });
  } catch (error) {
    console.error("Payment initiation error:", error.message);
    await session.abortTransaction();
    res.status(500).json({ message: "Payment initiation failed", error: error.message });
  } finally {
    session.endSession();
  }
};

// Handle callback
export const handleCallback = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { merchantTransactionId, responseCode } = req.body;
    const studentFee = await StudentFee.findOne({ merchantTransactionId })
      .populate([
        { path: "fees.feesGroup", select: "name periodicity" },
        { path: "studentId", select: "name admissionNumber" },
      ])
      .session(session);

    if (!studentFee) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Fee record not found" });
    }

    await updatePaymentStatus(studentFee, responseCode, req.body, session);
    await session.commitTransaction();
    res.status(200).json({ message: "Callback processed" });
  } catch (error) {
    console.error("Callback processing error:", error.message);
    await session.abortTransaction();
    res.status(500).json({ message: "Callback processing failed", error: error.message });
  } finally {
    session.endSession();
  }
};

// Check payment status
export const checkStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { merchantTransactionId } = req.params;
    const { email, role } = req.user;

    if (role !== "parent") {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "Only parents can check payment status" });
    }

    const students = await Student.find({
      $or: [
        { "fatherInfo.email": email },
        { "motherInfo.email": email },
      ],
      status: "active",
    }).select("_id").session(session);

    const studentIds = students.map((student) => student._id);
    if (!studentIds.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "No active students found for this parent" });
    }

    const studentFee = await StudentFee.findOne({
      merchantTransactionId,
      studentId: { $in: studentIds },
    })
      .populate([
        { path: "fees.feesGroup", select: "name periodicity" },
        { path: "studentId", select: "name admissionNumber" },
      ])
      .session(session);

    if (!studentFee) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Fee record not found" });
    }

    const string = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}${PHONEPE_SALT_KEY}`;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + PHONEPE_SALT_INDEX;

    let response;
    try {
      response = await axios.get(
        `${PHONEPE_SANDBOX_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
            "X-MERCHANT-ID": PHONEPE_MERCHANT_ID,
            accept: "application/json",
          },
        }
      );
    } catch (apiError) {
      console.error("PhonePe API error:", {
        message: apiError.message,
        status: apiError.response?.status,
        data: apiError.response?.data,
      });
      await updatePaymentStatus(studentFee, "PAYMENT_ERROR", {}, session);
      await session.commitTransaction();
      return res.status(500).json({ message: "Failed to check payment status with PhonePe", error: apiError.message });
    }

    console.log("PhonePe status response:", {
      status: response.status,
      data: response.data,
    });

    if (!response.data || typeof response.data !== "object") {
      console.error("Invalid PhonePe response: No data received");
      await updatePaymentStatus(studentFee, "PAYMENT_ERROR", {}, session);
      await session.commitTransaction();
      return res.status(500).json({ message: "Invalid response from PhonePe" });
    }

    const { code, data } = response.data;

    if (!data || typeof data.state !== "string") {
      console.error("Invalid PhonePe response data:", { code, data });
      await updatePaymentStatus(studentFee, code || "PAYMENT_ERROR", data || {}, session);
      await session.commitTransaction();
      return res.status(500).json({ message: "Invalid or missing state in PhonePe response", code });
    }

    if (data.state === "COMPLETED") {
      await updatePaymentStatus(studentFee, "PAYMENT_SUCCESS", data, session);
    } else if (data.state === "PENDING") {
      await updatePaymentStatus(studentFee, "PAYMENT_PENDING", data, session);
    } else {
      await updatePaymentStatus(studentFee, "PAYMENT_FAILED", data, session);
    }

    await session.commitTransaction();
    res.json({ status: studentFee.status, fee: formatFeeForResponse(studentFee) });
  } catch (error) {
    console.error("Status check error:", {
      message: error.message,
      stack: error.stack,
    });
    await session.abortTransaction();
    res.status(500).json({ message: "Status check failed", error: error.message });
  } finally {
    session.endSession();
  }
};


// Generate PDF receipt
const generateReceipt = async (studentFee) => {
  const doc = new PDFDocument();
  const fileName = `receipt_${studentFee.merchantTransactionId || studentFee._id}.pdf`;
  const filePath = path.join("receipts", fileName);
  fs.mkdirSync("receipts", { recursive: true });
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);
  doc.fontSize(20).text("Payment Receipt", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Student: ${studentFee.studentId.name}`);
  doc.text(`Fee Components:`);
  studentFee.fees.forEach(feeComponent => {
    doc.text(`  - ${feeComponent.feesGroup.name}: ₹${(feeComponent.amount - (feeComponent.discount || 0))}`);
  });
  doc.text(`Total Amount Paid: ₹${studentFee.amountPaid}`);
  doc.text(`Payment Date: ${studentFee.updatedAt.toLocaleDateString()}`);
  doc.text(`Transaction ID: ${studentFee.merchantTransactionId || studentFee._id}`);
  doc.text(`Month: ${studentFee.month}`);
  doc.end();

  return `/receipts/${fileName}`;
};

// Helper function to format fee response
function formatFeeForResponse(fee) {
  return {
    _id: fee._id,
    student: {
      _id: fee.studentId._id || fee.studentId,
      name: fee.studentId?.name || fee.student?.name || "",
      admissionNumber: fee.studentId?.admissionNumber || fee.student?.admissionNumber || "",
    },
    fees: fee.fees.map(feeComponent => ({
      feesGroup: {
        _id: feeComponent.feesGroup._id,
        name: feeComponent.feesGroup.name,
        periodicity: feeComponent.feesGroup.periodicity,
      },
      amount: feeComponent.amount || 0,
      originalAmount: feeComponent.originalAmount || 0,
      discount: feeComponent.discount || 0,
    })),
    amount: fee.amount || 0,
    amountPaid: fee.amountPaid || 0,
    balanceAmount: fee.balanceAmount || 0,
    dueDate: fee.dueDate,
    month: fee.month,
    status: fee.status,
    generatedAt: fee.generatedAt,
    merchantTransactionId: fee.merchantTransactionId || "",
  };
}