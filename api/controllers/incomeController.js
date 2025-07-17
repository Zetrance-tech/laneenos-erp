import Income from "../models/income.js";
import Counter from "../models/counter.js";

// Create Income
export const createIncome = async (req, res) => {
  try {
    const incomeData = req.body;
    const branchId = req.user.branchId;

    // Validate required fields
    // if (
    //   !incomeData.income_title ||
    //   !incomeData.income_type ||
    //   !incomeData.amount ||
    //   !incomeData.receipt_date ||
    //   !incomeData.received_from ||
    //   !incomeData.received_by ||
    //   !incomeData.status
    // ) {
    //   return res.status(400).json({ message: "All required fields must be provided" });
    // }

    // Validate payment fields when Paid
    if (incomeData.paymentStatus === 'Paid') {
      if (!incomeData.paymentDate || !incomeData.payment_method) {
        return res.status(400).json({ message: "Payment date and method are required when payment status is Paid" });
      }
      if (incomeData.payment_method === 'Cheque') {
        if (!incomeData.bankName || !incomeData.chequeNumber || !incomeData.chequeDate) {
          return res.status(400).json({ message: "Bank name, cheque number, and cheque date are required for Cheque payment" });
        }
      }
      if (incomeData.payment_method === 'Bank Transfer' || incomeData.payment_method === 'UPI' || incomeData.payment_method === 'Card') {
        if (!incomeData.transactionId) {
          return res.status(400).json({ message: "Transaction ID is required for Bank Transfer, UPI, or Card payment" });
        }
      }
    }

    const income = new Income({ ...incomeData, branchId });
    await income.save();
    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Incomes
export const getAllIncomes = async (req, res) => {
  try {
    const { branchId } = req.user;
    const incomes = await Income.find({ branchId }).sort({ createdAt: -1 });
    res.status(200).json(incomes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Income
export const updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const incomeData = req.body;
    const { branchId } = req.user;

    // Validate payment fields when Paid
    if (incomeData.paymentStatus === 'Paid') {
      if (!incomeData.paymentDate || !incomeData.payment_method) {
        return res.status(400).json({ message: "Payment date and method are required when payment status is Paid" });
      }
      if (incomeData.payment_method === 'Cheque') {
        if (!incomeData.bankName || !incomeData.chequeNumber || !incomeData.chequeDate) {
          return res.status(400).json({ message: "Bank name, cheque number, and cheque date are required for Cheque payment" });
        }
      }
      if (incomeData.payment_method === 'Bank Transfer' || incomeData.payment_method === 'UPI' || incomeData.payment_method === 'Card') {
        if (!incomeData.transactionId) {
          return res.status(400).json({ message: "Transaction ID is required for Bank Transfer, UPI, or Card payment" });
        }
      }
    }

    const income = await Income.findOneAndUpdate(
      { _id: id, branchId },
      incomeData,
      { new: true }
    );

    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }

    res.status(200).json(income);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Income
export const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId } = req.user;

    const income = await Income.findOneAndDelete({ _id: id, branchId });
    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }

    res.status(200).json({ message: "Income deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Preview Next Income ID
export const previewNextIncomeId = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const counter = await Counter.findOne({ type: "income_id", branchId });

    if (!counter) {
      return res.status(200).json({ income_id: "INC-000001" });
    }

    const nextId = `INC-${String(counter.sequence + 1).padStart(6, '0')}`;
    res.status(200).json({ income_id: nextId });
  } catch (error) {
    res.status(500).json({ message: "Failed to preview next ID" });
  }
};