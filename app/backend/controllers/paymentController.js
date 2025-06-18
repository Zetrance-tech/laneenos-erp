import axios from "axios";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import FeePayments from "../models/feePayments.js";
import FeeReminderNotification from "../models/feeReminderNotification.js";
import mongoose from "mongoose";
// Environment variables
const {
  PHONEPE_MERCHANT_ID,
  PHONEPE_SALT_KEY,
  PHONEPE_SALT_INDEX,
  PHONEPE_SANDBOX_URL
} = process.env;

export const updatePaymentStatus = async (feePayment, responseCode, paymentData, session) => {
  feePayment.rawResponseCode = responseCode;
  feePayment.rawPaymentInstrument = paymentData?.paymentInstrument || {};

  // Explicitly handle known response codes
  if (responseCode === "PAYMENT_SUCCESS") {
    feePayment.amountPaid = feePayment.amountDue;
    feePayment.status = "Paid";
    feePayment.paymentDate = new Date();
    feePayment.transactionStatus = "SUCCESS";
    // Override payment method for UPI_QR
    feePayment.paymentMethod = feePayment.paymentType === "UPI_QR" ? "UPI" : (paymentData?.paymentInstrument?.type || "UNKNOWN");
    feePayment.receiptUrl = await generateReceipt(feePayment);
  } else if (responseCode === "PAYMENT_PENDING") {
    feePayment.transactionStatus = "PENDING";
  } else {
    // Handle timeout and error codes explicitly
    feePayment.transactionStatus = ["PAYMENT_EXPIRED", "PAYMENT_TIMEOUT", "PAYMENT_ERROR"].includes(responseCode) ? "FAILED" : "FAILED";
  }
  await feePayment.save({ session });
};

// Initiate payment
export const initiatePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { feePaymentId, mobileNumber, parentId } = req.body;
    if (!feePaymentId || !parentId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const feePayment = await FeePayments.findById(feePaymentId).populate(
      "feesGroupId feesTypeId studentId"
    );
    if (!feePayment) {
      return res.status(404).json({ message: "Fee payment not found" });
    }
    if (feePayment.status === "Paid") {
      return res.status(400).json({ message: "Fee already paid" });
    }

    const amount = feePayment.amountDue - feePayment.amountPaid;
    const merchantTransactionId = `MT${uuidv4()}`;
    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: `MUID${parentId}`,
      amount: Math.round(amount * 100), // INR to paisa
      redirectUrl: `http://localhost:5000/api/feesPayment/payment/status`,
      redirectMode: "POST",
      callbackUrl: `http://localhost:5000/api/feesPayment/payment/callback`,
      mobileNumber: mobileNumber || "9999999999",
      paymentInstrument: { type: "PAY_PAGE" }
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
          accept: "application/json"
        }
      }
    );

    feePayment.merchantTransactionId = merchantTransactionId;
    feePayment.transactionStatus = "PENDING";
    await feePayment.save({ session });
    await session.commitTransaction();
    res.json({
      paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
      merchantTransactionId
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Payment initiation failed" });
  } finally {
    session.endSession();
  }
};

// Handle callback
export const handleCallback = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction()
  try {
    const { merchantTransactionId, responseCode } = req.body;
    const feePayment = await FeePayments.findOne({ merchantTransactionId })
      .populate("feesGroupId feesTypeId studentId")
      .session(session);
    if (!feePayment) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await updatePaymentStatus(feePayment, responseCode, req.body, session)
    await session.commitTransaction();
    res.status(200).json({ message: "Callback processed" });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Callback processing failed" });
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
    const feePayment = await FeePayments.findOne({ merchantTransactionId }).populate(
      "feesGroupId feesTypeId studentId"
    ).session(session);
    if (!feePayment) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const string = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}${PHONEPE_SALT_KEY}`;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + PHONEPE_SALT_INDEX;

    const response = await axios.get(
      `${PHONEPE_SANDBOX_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          "X-MERCHANT-ID": PHONEPE_MERCHANT_ID,
          accept: "application/json"
        }
      }
    );

    const { code, data } = response.data;
    if (data.state === "COMPLETED") {
      await updatePaymentStatus(feePayment, "PAYMENT_SUCCESS", data, session);
    } else if (data.state === "PENDING") {
      await updatePaymentStatus(feePayment, "PAYMENT_PENDING", data, session);
    } else {
      await updatePaymentStatus(feePayment, "PAYMENT_FAILED", data, session);
    }
    // await updatePaymentStatus(feePayment, code, data, session);

    await session.commitTransaction();
    res.json({ status: feePayment.transactionStatus, feePayment });
  } catch (error) {
    console.error("Status check error:", error.message);
    await session.abortTransaction();
    res.status(500).json({ message: "Status check failed" });
  }finally {
    session.endSession();
  }
};

// Generate PDF receipt
const generateReceipt = async (feePayment) => {
  const doc = new PDFDocument();
  const fileName = `receipt_${feePayment.merchantTransactionId}.pdf`;
  const filePath = path.join("receipts", fileName);
  fs.mkdirSync("receipts", { recursive: true });
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);
  doc.fontSize(20).text("Payment Receipt", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Student: ${feePayment.studentId.name}`);
  doc.text(`Fee Type: ${feePayment.feesTypeId.name}`);
  doc.text(`Fee Group: ${feePayment.feesGroupId.name}`);
  doc.text(`Amount Paid: ₹${feePayment.amountPaid / 100}`);
  doc.text(`Payment Date: ${feePayment.paymentDate.toLocaleDateString()}`);
  doc.text(`Transaction ID: ${feePayment.merchantTransactionId}`);
  doc.end();

  return `/receipts/${fileName}`;
};
// Serve receipt
export const getReceipt = async (req, res) => {
  try {
    const { merchantTransactionId } = req.params;
    const feePayment = await FeePayments.findOne({ merchantTransactionId });
    if (!feePayment || !feePayment.receiptUrl) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const filePath = path.join(process.cwd(), feePayment.receiptUrl);
    res.download(filePath);
  } catch (error) {
    console.error("Receipt download error:", error.message);
    res.status(500).json({ message: "Failed to download receipt" });
  }
};