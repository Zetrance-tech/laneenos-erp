import Expense from "../models/expense.js";
import Counter from "../models/counter.js";

export const createExpense = async (req, res) => {
  try {
    const expenseData = req.body;

    // Validate required fields
    if (
      !expenseData.invoiceNumber ||
      !expenseData.dateOfExpense ||
      !expenseData.vendorName ||
      !expenseData.expenseCategory ||
      !expenseData.amountSpent
    ) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate payment-related fields when paymentStatus is 'Paid'
    if (expenseData.paymentStatus === 'Paid') {
      if (!expenseData.paymentDate || !expenseData.paymentMode) {
        return res.status(400).json({ message: "Payment date and mode are required when payment status is Paid" });
      }
      if (expenseData.paymentMode === 'Cheque') {
        if (!expenseData.bankName || !expenseData.chequeNumber || !expenseData.chequeDate) {
          return res.status(400).json({ message: "Bank name, cheque number, and cheque date are required for Cheque payment" });
        }
      }
      if (expenseData.paymentMode === 'Online Payment') {
        if (!expenseData.transactionId) {
          return res.status(400).json({ message: "Transaction ID is required for Online Payment" });
        }
      }
    }

    const expense = new Expense(expenseData);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all expenses
export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expenseData = req.body;

    // Validate payment-related fields when paymentStatus is 'Paid'
    if (expenseData.paymentStatus === 'Paid') {
      if (!expenseData.paymentDate || !expenseData.paymentMode) {
        return res.status(400).json({ message: "Payment date and mode are required when payment status is Paid" });
      }
      if (expenseData.paymentMode === 'Cheque') {
        if (!expenseData.bankName || !expenseData.chequeNumber || !expenseData.chequeDate) {
          return res.status(400).json({ message: "Bank name, cheque number, and cheque date are required for Cheque payment" });
        }
      }
      if (expenseData.paymentMode === 'Online Payment') {
        if (!expenseData.transactionId) {
          return res.status(400).json({ message: "Transaction ID is required for Online Payment" });
        }
      }
    }

    const expense = await Expense.findByIdAndUpdate(id, expenseData, { new: true });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const previewNextPaymentId = async (req, res) => {
  try {
    const counter = await Counter.findOne({ _id: "expense_number" });
    if (!counter) {
      return res.status(200).json({ expense_number: "EXP-000001" });
    }
    const nextId = `EXP-${String(counter.sequence + 1).padStart(6, '0')}`;
    res.status(200).json({ expense_number: nextId });
  } catch (error) {
    res.status(500).json({ message: "Failed to preview next ID" });
  }
};