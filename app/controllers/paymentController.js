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
    const { email, role , branchId} = req.user;

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
      branchId,
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
      branchId,
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
    const { branchId } = req.user;
    const { merchantTransactionId, responseCode } = req.body;
    const studentFee = await StudentFee.findOne({ merchantTransactionId,branchId })
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
    const { email, role, branchId } = req.user;

    if (role !== "parent") {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "Only parents can check payment status" });
    }

    const students = await Student.find({
      branchId,
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
      branchId,
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