import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Modal, Spin, Input, DatePicker, Select, InputNumber, Button } from "antd";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import Table from "../../../core/common/dataTable/index";
import TooltipOption from "../../../core/common/tooltipOption";
import { all_routes } from "../../router/all_routes";
import moment, { Moment } from "moment";

const { Option } = Select;
const { Search } = Input;

const API_URL = process.env.REACT_APP_URL || "";

// Expense categories array
const EXPENSE_CATEGORIES = [
  "Petty",
  "Meal",
  "House Keeping",
  "Conveyance",
  "Maintainance",
];

// Payment modes array
const PAYMENT_MODES = [
  "Cash",
  "UPI",
  "Cheque",
  "Online Payment",
  "Other",
];

// Interfaces
interface Expense {
  _id: string;
  key: string;
  expenseNumber: string;
  invoiceNumber: string;
  dateOfExpense: string;
  vendorName: string;
  expenseCategory: string;
  amountSpent: number;
  paymentStatus: "Paid" | "Unpaid";
  paymentDate?: string;
  paymentMode?: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: string;
  transactionId?: string;
  remarks?: string;
}

interface FormData {
  expenseNumber?: string;
  invoiceNumber: string;
  dateOfExpense: Moment | null;
  vendorName: string;
  expenseCategory: string;
  amountSpent: number | null;
  paymentStatus: "Paid" | "Unpaid";
  paymentDate: Moment | null;
  paymentMode: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: Moment | null;
  transactionId?: string;
  remarks: string;
}

interface Route {
  adminDashboard: string;
}

const ExpenseManager: React.FC = () => {
  const route: Route = all_routes;
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nextExpenseNumber, setNextExpenseNumber] = useState<string>("");
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<FormData>({
    invoiceNumber: "",
    dateOfExpense: null,
    vendorName: "",
    expenseCategory: "",
    amountSpent: null,
    paymentStatus: "Unpaid",
    paymentDate: null,
    paymentMode: "",
    bankName: "",
    chequeNumber: "",
    chequeDate: null,
    transactionId: "",
    remarks: "",
  });
  const [searchText, setSearchText] = useState<string>("");

  const columns = [
    {
      title: "Expense #",
      dataIndex: "expenseNumber",
      render: (text: string) => <span>{text}</span>,
      sorter: (a: Expense, b: Expense) => a.expenseNumber.localeCompare(b.expenseNumber),
    },
    {
      title: "Invoice #",
      dataIndex: "invoiceNumber",
      sorter: (a: Expense, b: Expense) => a.invoiceNumber.localeCompare(b.invoiceNumber),
    },
    {
      title: "Date",
      dataIndex: "dateOfExpense",
      render: (date: string) => (date ? moment(date).format("DD/MM/YYYY") : "N/A"),
      sorter: (a: Expense, b: Expense) => moment(a.dateOfExpense).unix() - moment(b.dateOfExpense).unix(),
    },
    {
      title: "Vendor",
      dataIndex: "vendorName",
      sorter: (a: Expense, b: Expense) => a.vendorName.localeCompare(b.vendorName),
    },
    {
      title: "Category",
      dataIndex: "expenseCategory",
      sorter: (a: Expense, b: Expense) => a.expenseCategory.localeCompare(b.expenseCategory),
    },
    {
      title: "Amount",
      dataIndex: "amountSpent",
      render: (amount: number) => `₹${amount.toFixed(2)}`,
      sorter: (a: Expense, b: Expense) => a.amountSpent - b.amountSpent,
    },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      sorter: (a: Expense, b: Expense) => a.paymentStatus.localeCompare(b.paymentStatus),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Expense) => (
        <div className="d-flex align-items-center">
          <div className="dropdown">
            <Link
              to="#"
              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="ti ti-dots-vertical fs-14" />
            </Link>
            <ul className="dropdown-menu dropdown-menu-right p-3">
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  onClick={() => handleView(record)}
                >
                  <i className="ti ti-eye me-2" />
                  View Details
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  onClick={() => handleEdit(record)}
                >
                  <i className="ti ti-edit-circle me-2" />
                  Edit
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  onClick={() => handleDelete(record._id)}
                >
                  <i className="ti ti-trash-x me-2" />
                  Delete
                </Link>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/api/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formattedData: Expense[] = res.data.map((item: any) => ({
        ...item,
        key: item._id,
      }));
      setExpenses(formattedData);
      setFilteredExpenses(formattedData);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to fetch expenses");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNextExpenseNumber = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/expenses/next-id`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNextExpenseNumber(res.data.expense_number);
      setFormData((prev) => ({ ...prev, expenseNumber: res.data.expense_number }));
    } catch (error) {
      console.error("Error fetching next expense number:", error);
      toast.error("Failed to fetch expense number");
    }
  };

  const handleAddExpense = async () => {
    if (
      !formData.invoiceNumber ||
      !formData.dateOfExpense ||
      !formData.vendorName ||
      !formData.expenseCategory ||
      !formData.amountSpent ||
      (formData.paymentStatus === "Paid" && (
        !formData.paymentDate ||
        !formData.paymentMode ||
        (formData.paymentMode === "Cheque" && (!formData.bankName || !formData.chequeNumber || !formData.chequeDate)) ||
        (formData.paymentMode === "Online Payment" && !formData.transactionId)
      ))
    ) {
      toast.error("All required fields must be filled");
      return;
    }

    try {
      const payload = {
        ...formData,
        dateOfExpense: formData.dateOfExpense ? formData.dateOfExpense.toISOString() : null,
        paymentDate: formData.paymentDate ? formData.paymentDate.toISOString() : null,
        chequeDate: formData.chequeDate ? formData.chequeDate.toISOString() : null,
      };
      const res = await axios.post(`${API_URL}/api/expenses`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses((prev) => [
        ...prev,
        { ...res.data, key: res.data._id },
      ]);
      setFilteredExpenses((prev) => [
        ...prev,
        { ...res.data, key: res.data._id },
      ]);
      setFormData({
        invoiceNumber: "",
        dateOfExpense: null,
        vendorName: "",
        expenseCategory: "",
        amountSpent: null,
        paymentStatus: "Unpaid",
        paymentDate: null,
        paymentMode: "",
        bankName: "",
        chequeNumber: "",
        chequeDate: null,
        transactionId: "",
        remarks: "",
      });
      setIsAddModalOpen(false);
      toast.success("Expense added successfully");
    } catch (error: any) {
      console.error("Error adding expense:", error);
      toast.error(error.response?.data?.message || "Error adding expense");
    }
  };

  const handleEdit = (record: Expense) => {
    setFormData({
      expenseNumber: record.expenseNumber,
      invoiceNumber: record.invoiceNumber,
      dateOfExpense: record.dateOfExpense ? moment(record.dateOfExpense) : null,
      vendorName: record.vendorName,
      expenseCategory: record.expenseCategory,
      amountSpent: record.amountSpent,
      paymentStatus: record.paymentStatus,
      paymentDate: record.paymentDate ? moment(record.paymentDate) : null,
      paymentMode: record.paymentMode || "",
      bankName: record.bankName || "",
      chequeNumber: record.chequeNumber || "",
      chequeDate: record.chequeDate ? moment(record.chequeDate) : null,
      transactionId: record.transactionId || "",
      remarks: record.remarks || "",
    });
    setEditExpenseId(record._id);
    setIsEditModalOpen(true);
  };

  const handleView = (record: Expense) => {
    setViewExpense(record);
    setIsViewModalOpen(true);
  };

  const handleUpdateExpense = async () => {
    if (
      !formData.invoiceNumber ||
      !formData.dateOfExpense ||
      !formData.vendorName ||
      !formData.expenseCategory ||
      !formData.amountSpent ||
      (formData.paymentStatus === "Paid" && (
        !formData.paymentDate ||
        !formData.paymentMode ||
        (formData.paymentMode === "Cheque" && (!formData.bankName || !formData.chequeNumber || !formData.chequeDate)) ||
        (formData.paymentMode === "Online Payment" && !formData.transactionId)
      ))
    ) {
      toast.error("All required fields must be filled");
      return;
    }

    try {
      const payload = {
        ...formData,
        dateOfExpense: formData.dateOfExpense ? formData.dateOfExpense.toISOString() : null,
        paymentDate: formData.paymentDate ? formData.paymentDate.toISOString() : null,
        chequeDate: formData.chequeDate ? formData.chequeDate.toISOString() : null,
      };
      const res = await axios.put(`${API_URL}/api/expenses/${editExpenseId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses((prev) =>
        prev.map((expense) =>
          expense._id === editExpenseId ? { ...res.data, key: res.data._id } : expense
        )
      );
      setFilteredExpenses((prev) =>
        prev.map((expense) =>
          expense._id === editExpenseId ? { ...res.data, key: res.data._id } : expense
        )
      );
      setFormData({
        invoiceNumber: "",
        dateOfExpense: null,
        vendorName: "",
        expenseCategory: "",
        amountSpent: null,
        paymentStatus: "Unpaid",
        paymentDate: null,
        paymentMode: "",
        bankName: "",
        chequeNumber: "",
        chequeDate: null,
        transactionId: "",
        remarks: "",
      });
      setIsEditModalOpen(false);
      setEditExpenseId(null);
      toast.success("Expense updated successfully");
    } catch (error: any) {
      console.error("Error updating expense:", error);
      toast.error(error.response?.data?.message || "Error updating expense");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses((prev) => prev.filter((expense) => expense._id !== id));
      setFilteredExpenses((prev) => prev.filter((expense) => expense._id !== id));
      toast.success("Expense deleted successfully");
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast.error(error.response?.data?.message || "Error deleting expense");
    }
  };

  const handleInputChange = (name: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      invoiceNumber: "",
      dateOfExpense: null,
      vendorName: "",
      expenseCategory: "",
      amountSpent: null,
      paymentStatus: "Unpaid",
      paymentDate: null,
      paymentMode: "",
      bankName: "",
      chequeNumber: "",
      chequeDate: null,
      transactionId: "",
      remarks: "",
    });
    setNextExpenseNumber("");
    setEditExpenseId(null);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value) {
      setFilteredExpenses(expenses);
      return;
    }
    const lowerValue = value.toLowerCase();
    const filtered = expenses.filter((expense) =>
      expense.expenseNumber.toLowerCase().includes(lowerValue) ||
      expense.invoiceNumber.toLowerCase().includes(lowerValue) ||
      (expense.dateOfExpense && moment(expense.dateOfExpense).format("DD/MM/YYYY").includes(lowerValue)) ||
      expense.vendorName.toLowerCase().includes(lowerValue) ||
      expense.expenseCategory.toLowerCase().includes(lowerValue) ||
      `₹${expense.amountSpent.toFixed(2)}`.toLowerCase().includes(lowerValue) ||
      expense.paymentStatus.toLowerCase().includes(lowerValue)
    );
    setFilteredExpenses(filtered);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div>
        <div className="page-wrapper">
          <div className="content">
            <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
              <div className="my-auto mb-2">
                <h3 className="page-title mb-1">Expenses List</h3>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={route.adminDashboard}>Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="#">Expenses</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      All Expenses
                    </li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                <TooltipOption />
                <div className="mb-2">
                  <Button
                    type="primary"
                    onClick={() => {
                      fetchNextExpenseNumber();
                      setIsAddModalOpen(true);
                    }}
                  >
                    <i className="ti ti-square-rounded-plus-filled me-2" />
                    Add Expense
                  </Button>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                <h4 className="mb-3">Expenses List</h4>
                {/* <Search
                  placeholder="Search by any field"
                  allowClear
                  onSearch={handleSearch}
                  style={{ width: 200 }}
                /> */}
              </div>
              <div className="card-body p-0 py-3">
                {isLoading ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: "200px",
                    }}
                  >
                    <Spin size="large" />
                  </div>
                ) : (
                  <Table columns={columns} dataSource={filteredExpenses} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Expense Modal */}
        <Modal
          title="Add Expense"
          open={isAddModalOpen}
          onCancel={() => {
            resetForm();
            setIsAddModalOpen(false);
          }}
          zIndex={10001}
          width={1000}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(false);
              }}
            >
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleAddExpense}>
              Add Expense
            </Button>,
          ]}
        >
          <div className="row">
            {/* Row 1: Expense Number, Invoice Number, Date of Expense */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Expense Number *</label>
              <Input
                value={nextExpenseNumber || "Fetching ID..."}
                readOnly
                disabled
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Invoice Number *</label>
              <Input
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                placeholder="Enter Invoice Number"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Date of Expense *</label>
              <DatePicker
                value={formData.dateOfExpense}
                onChange={(date) => handleInputChange("dateOfExpense", date)}
                format="DD/MM/YYYY"
                className="w-100"
                style={{ width: "100%", zIndex: 10001 }}
                getPopupContainer={(trigger) => trigger.parentElement || document.body}
              />
            </div>

            {/* Row 2: Vendor Name, Expense Category, Amount Spent */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Vendor Name *</label>
              <Input
                value={formData.vendorName}
                onChange={(e) => handleInputChange("vendorName", e.target.value)}
                placeholder="Enter Vendor Name"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Expense Category *</label>
              <Select
                value={formData.expenseCategory}
                onChange={(value) => handleInputChange("expenseCategory", value)}
                className="w-100"
              >
                <Option value="">Select Category</Option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Amount Spent *</label>
              <InputNumber
                value={formData.amountSpent}
                onChange={(value) => handleInputChange("amountSpent", value)}
                min={0}
                className="w-100"
              />
            </div>

            {/* Row 3: Payment Status, Payment Date (conditional), Payment Mode */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Payment Status *</label>
              <Select
                value={formData.paymentStatus}
                onChange={(value) => handleInputChange("paymentStatus", value)}
                className="w-100"
              >
                <Option value="Unpaid">Unpaid</Option>
                <Option value="Paid">Paid</Option>
              </Select>
            </div>
            {formData.paymentStatus === "Paid" && (
              <>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Payment Date *</label>
                  <DatePicker
                    value={formData.paymentDate}
                    onChange={(date) => handleInputChange("paymentDate", date)}
                    format="DD/MM/YYYY"
                    className="w-100"
                    style={{ width: "100%", zIndex: 10001 }}
                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Payment Mode *</label>
                  <Select
                    value={formData.paymentMode}
                    onChange={(value) => handleInputChange("paymentMode", value)}
                    className="w-100"
                  >
                    <Option value="">Select Payment Mode</Option>
                    {PAYMENT_MODES.map((mode) => (
                      <Option key={mode} value={mode}>
                        {mode}
                      </Option>
                    ))}
                  </Select>
                </div>
              </>
            )}

            {/* Conditional Fields for Cheque */}
            {formData.paymentStatus === "Paid" && formData.paymentMode === "Cheque" && (
              <>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Bank Name *</label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => handleInputChange("bankName", e.target.value)}
                    placeholder="Enter Bank Name"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Cheque Number *</label>
                  <Input
                    value={formData.chequeNumber}
                    onChange={(e) => handleInputChange("chequeNumber", e.target.value)}
                    placeholder="Enter Cheque Number"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Cheque Date *</label>
                  <DatePicker
                    value={formData.chequeDate}
                    onChange={(date) => handleInputChange("chequeDate", date)}
                    format="DD/MM/YYYY"
                    className="w-100"
                    style={{ width: "100%", zIndex: 10001 }}
                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                  />
                </div>
              </>
            )}

            {/* Conditional Field for Online Payment */}
            {formData.paymentStatus === "Paid" && formData.paymentMode === "Online Payment" && (
              <div className="col-md-4 mb-3">
                <label className="form-label">Transaction ID *</label>
                <Input
                  value={formData.transactionId}
                  onChange={(e) => handleInputChange("transactionId", e.target.value)}
                  placeholder="Enter Transaction ID"
                />
              </div>
            )}

            {/* Row 4: Remarks (full width) */}
            <div className="col-md-12 mb-3">
              <label className="form-label">Remarks</label>
              <Input.TextArea
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                placeholder="Enter Remarks"
                rows={4}
              />
            </div>
          </div>
        </Modal>

        {/* Edit Expense Modal */}
        <Modal
          title="Edit Expense"
          open={isEditModalOpen}
          onCancel={() => {
            resetForm();
            setIsEditModalOpen(false);
          }}
          zIndex={10001}
          width={1000}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                resetForm();
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleUpdateExpense}>
              Update Expense
            </Button>,
          ]}
        >
          <div className="row">
            {/* Row 1: Expense Number, Invoice Number, Date of Expense */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Expense Number *</label>
              <Input
                value={formData.expenseNumber || ""}
                readOnly
                disabled
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Invoice Number *</label>
              <Input
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                placeholder="Enter Invoice Number"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Date of Expense *</label>
              <DatePicker
                value={formData.dateOfExpense}
                onChange={(date) => handleInputChange("dateOfExpense", date)}
                format="DD/MM/YYYY"
                className="w-100"
                style={{ width: "100%", zIndex: 10001 }}
                getPopupContainer={(trigger) => trigger.parentElement || document.body}
              />
            </div>

            {/* Row 2: Vendor Name, Expense Category, Amount Spent */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Vendor Name *</label>
              <Input
                value={formData.vendorName}
                onChange={(e) => handleInputChange("vendorName", e.target.value)}
                placeholder="Enter Vendor Name"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Expense Category *</label>
              <Select
                value={formData.expenseCategory}
                onChange={(value) => handleInputChange("expenseCategory", value)}
                className="w-100"
              >
                <Option value="">Select Category</Option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Amount Spent *</label>
              <InputNumber
                value={formData.amountSpent}
                onChange={(value) => handleInputChange("amountSpent", value)}
                min={0}
                className="w-100"
              />
            </div>

            {/* Row 3: Payment Status, Payment Date (conditional), Payment Mode */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Payment Status *</label>
              <Select
                value={formData.paymentStatus}
                onChange={(value) => handleInputChange("paymentStatus", value)}
                className="w-100"
              >
                <Option value="Unpaid">Unpaid</Option>
                <Option value="Paid">Paid</Option>
              </Select>
            </div>
            {formData.paymentStatus === "Paid" && (
              <>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Payment Date *</label>
                  <DatePicker
                    value={formData.paymentDate}
                    onChange={(date) => handleInputChange("paymentDate", date)}
                    format="DD/MM/YYYY"
                    className="w-100"
                    style={{ width: "100%", zIndex: 10001 }}
                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Payment Mode *</label>
                  <Select
                    value={formData.paymentMode}
                    onChange={(value) => handleInputChange("paymentMode", value)}
                    className="w-100"
                  >
                    <Option value="">Select Payment Mode</Option>
                    {PAYMENT_MODES.map((mode) => (
                      <Option key={mode} value={mode}>
                        {mode}
                      </Option>
                    ))}
                  </Select>
                </div>
              </>
            )}

            {/* Conditional Fields for Cheque */}
            {formData.paymentStatus === "Paid" && formData.paymentMode === "Cheque" && (
              <>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Bank Name *</label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => handleInputChange("bankName", e.target.value)}
                    placeholder="Enter Bank Name"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Cheque Number *</label>
                  <Input
                    value={formData.chequeNumber}
                    onChange={(e) => handleInputChange("chequeNumber", e.target.value)}
                    placeholder="Enter Cheque Number"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Cheque Date *</label>
                  <DatePicker
                    value={formData.chequeDate}
                    onChange={(date) => handleInputChange("chequeDate", date)}
                    format="DD/MM/YYYY"
                    className="w-100"
                    style={{ width: "100%", zIndex: 10001 }}
                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                  />
                </div>
              </>
            )}

            {/* Conditional Field for Online Payment */}
            {formData.paymentStatus === "Paid" && formData.paymentMode === "Online Payment" && (
              <div className="col-md-4 mb-3">
                <label className="form-label">Transaction ID *</label>
                <Input
                  value={formData.transactionId}
                  onChange={(e) => handleInputChange("transactionId", e.target.value)}
                  placeholder="Enter Transaction ID"
                />
              </div>
            )}

            {/* Row 4: Remarks (full width) */}
            <div className="col-md-12 mb-3">
              <label className="form-label">Remarks</label>
              <Input.TextArea
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                placeholder="Enter Remarks"
                rows={4}
              />
            </div>
          </div>
        </Modal>

        {/* View Expense Modal */}
        <Modal
          title="Expense Details"
          open={isViewModalOpen}
          onCancel={() => setIsViewModalOpen(false)}
          zIndex={10001}
          width={1000}
          footer={[
            <Button key="close" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>,
          ]}
        >
          {viewExpense && (
            <div className="row">
              {/* Row 1: Expense Number, Invoice Number, Date of Expense */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Expense Number</label>
                <Input value={viewExpense.expenseNumber} readOnly />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Invoice Number</label>
                <Input value={viewExpense.invoiceNumber} readOnly />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Date of Expense</label>
                <Input
                  value={viewExpense.dateOfExpense ? moment(viewExpense.dateOfExpense).format("DD/MM/YYYY") : "N/A"}
                  readOnly
                />
              </div>

              {/* Row 2: Vendor Name, Expense Category, Amount Spent */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Vendor Name</label>
                <Input value={viewExpense.vendorName} readOnly />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Expense Category</label>
                <Input value={viewExpense.expenseCategory} readOnly />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Amount Spent</label>
                <Input value={`₹${viewExpense.amountSpent.toFixed(2)}`} readOnly />
              </div>

              {/* Row 3: Payment Status, Payment Date, Payment Mode */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Payment Status</label>
                <Input value={viewExpense.paymentStatus} readOnly />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Payment Date</label>
                <Input
                  value={viewExpense.paymentDate ? moment(viewExpense.paymentDate).format("DD/MM/YYYY") : "N/A"}
                  readOnly
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Payment Mode</label>
                <Input value={viewExpense.paymentMode || "N/A"} readOnly />
              </div>

              {/* Conditional Fields for Cheque */}
              {viewExpense.paymentMode === "Cheque" && (
                <>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Bank Name</label>
                    <Input value={viewExpense.bankName || "N/A"} readOnly />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Cheque Number</label>
                    <Input value={viewExpense.chequeNumber || "N/A"} readOnly />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Cheque Date</label>
                    <Input
                      value={viewExpense.chequeDate ? moment(viewExpense.chequeDate).format("DD/MM/YYYY") : "N/A"}
                      readOnly
                    />
                  </div>
                </>
              )}

              {/* Conditional Field for Online Payment */}
              {viewExpense.paymentMode === "Online Payment" && (
                <div className="col-md-4 mb-3">
                  <label className="form-label">Transaction ID</label>
                  <Input value={viewExpense.transactionId || "N/A"} readOnly />
                </div>
              )}

              {/* Row 4: Remarks (full width) */}
              <div className="col-md-12 mb-3">
                <label className="form-label">Remarks</label>
                <Input.TextArea value={viewExpense.remarks || "N/A"} readOnly rows={4} />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default ExpenseManager;