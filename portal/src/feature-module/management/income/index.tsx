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

// Income types array
const INCOME_TYPES = [
  "Tuition Fee",
  "Admission Fee",
  "Donation",
  "Government Grant",
  "Other",
];

// Payment methods array
const PAYMENT_METHODS = [
  "Cash",
  "Cheque",
  "Bank Transfer",
  "UPI",
  "Card",
  "Other",
];

// Interfaces
interface Income {
  _id: string;
  key: string;
  income_id: string;
  income_title: string;
  income_type: string;
  amount: number;
  payment_method: string;
  receipt_date: string;
  received_from: string;
  received_by: string;
  description: string;
  status: "Confirmed" | "Pending" | "Cancelled";
  paymentStatus: "Paid" | "Unpaid";
  paymentDate?: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: string;
  transactionId?: string;
}

interface FormData {
  income_id?: string;
  income_title: string;
  income_type: string;
  amount: number | null;
  payment_method: string;
  receipt_date: Moment | null;
  received_from: string;
  received_by: string;
  description: string;
  status: "Confirmed" | "Pending" | "Cancelled";
  paymentStatus: "Paid" | "Unpaid";
  paymentDate: Moment | null;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: Moment | null;
  transactionId?: string;
}

interface Route {
  adminDashboard: string;
}

const IncomeManager: React.FC = () => {
  const route: Route = all_routes;
  const { token } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nextIncomeId, setNextIncomeId] = useState<string>("");
  const [editIncomeId, setEditIncomeId] = useState<string | null>(null);
  const [viewIncome, setViewIncome] = useState<Income | null>(null);
  const [formData, setFormData] = useState<FormData>({
    income_title: "",
    income_type: "",
    amount: null,
    payment_method: "",
    receipt_date: null,
    received_from: "",
    received_by: "",
    description: "",
    status: "Pending",
    paymentStatus: "Unpaid",
    paymentDate: null,
    bankName: "",
    chequeNumber: "",
    chequeDate: null,
    transactionId: "",
  });
  const [searchText, setSearchText] = useState<string>("");

  const columns = [
    {
      title: "Income ID",
      dataIndex: "income_id",
      render: (text: string) => <span>{text}</span>,
      sorter: (a: Income, b: Income) => a.income_id.localeCompare(b.income_id),
    },
    {
      title: "Income Title",
      dataIndex: "income_title",
      sorter: (a: Income, b: Income) => a.income_title.localeCompare(b.income_title),
    },
    {
      title: "Date",
      dataIndex: "receipt_date",
      render: (date: string) => (date ? moment(date).format("DD/MM/YYYY") : "N/A"),
      sorter: (a: Income, b: Income) => moment(a.receipt_date).unix() - moment(b.receipt_date).unix(),
    },
    {
      title: "Source",
      dataIndex: "received_from",
      sorter: (a: Income, b: Income) => a.received_from.localeCompare(b.received_from),
    },
    {
      title: "Type",
      dataIndex: "income_type",
      sorter: (a: Income, b: Income) => a.income_type.localeCompare(b.income_type),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (amount: number) => `₹${(amount || 0).toFixed(2)}`,
      sorter: (a: Income, b: Income) => (a.amount || 0) - (b.amount || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      sorter: (a: Income, b: Income) => a.status.localeCompare(b.status),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Income) => (
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

  const fetchIncomes = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/api/income`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formattedData: Income[] = res.data.map((item: any) => ({
        ...item,
        key: item._id,
      }));
      setIncomes(formattedData);
      setFilteredIncomes(formattedData);
    } catch (error) {
      console.error("Error fetching incomes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNextIncomeId = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/income/next-id`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNextIncomeId(res.data.income_id);
      setFormData((prev) => ({ ...prev, income_id: res.data.income_id }));
    } catch (error) {
      console.error("Error fetching next income id:", error);
    }
  };

  const handleAddIncome = async () => {
    // if (
    //   !formData.income_title ||
    //   !formData.income_type ||
    //   !formData.amount ||
    //   !formData.receipt_date ||
    //   !formData.received_from ||
    //   !formData.received_by ||
    //   !formData.status ||
    //   (formData.paymentStatus === "Paid" && (
    //     !formData.paymentDate ||
    //     (formData.payment_method === "Cheque" && (!formData.bankName || !formData.chequeNumber || !formData.chequeDate)) ||
    //     ((formData.payment_method === "Bank Transfer" || formData.payment_method === "UPI" || formData.payment_method === "Card") && !formData.transactionId)
    //   ))
    // ) {
    //   toast.error("All required fields must be filled");
    //   return;
    // }

    try {
      const payload = {
        ...formData,
        receipt_date: formData.receipt_date ? formData.receipt_date.toISOString() : null,
        paymentDate: formData.paymentDate ? formData.paymentDate.toISOString() : null,
        chequeDate: formData.chequeDate ? formData.chequeDate.toISOString() : null,
      };
      const res = await axios.post(`${API_URL}/api/income`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncomes((prev) => [
        ...prev,
        { ...res.data, key: res.data._id },
      ]);
      setFilteredIncomes((prev) => [
        ...prev,
        { ...res.data, key: res.data._id },
      ]);
      setFormData({
        income_title: "",
        income_type: "",
        amount: null,
        payment_method: "",
        receipt_date: null,
        received_from: "",
        received_by: "",
        description: "",
        status: "Pending",
        paymentStatus: "Unpaid",
        paymentDate: null,
        bankName: "",
        chequeNumber: "",
        chequeDate: null,
        transactionId: "",
      });
      setIsAddModalOpen(false);
      toast.success("Income added successfully");
    } catch (error: any) {
      console.error("Error adding income:", error);
      toast.error(error.response?.data?.message || "Error adding income");
    }
  };

  const handleEdit = (record: Income) => {
    setFormData({
      income_id: record.income_id,
      income_title: record.income_title,
      income_type: record.income_type,
      amount: record.amount,
      payment_method: record.payment_method,
      receipt_date: record.receipt_date ? moment(record.receipt_date) : null,
      received_from: record.received_from,
      received_by: record.received_by,
      description: record.description || "",
      status: record.status,
      paymentStatus: record.paymentStatus,
      paymentDate: record.paymentDate ? moment(record.paymentDate) : null,
      bankName: record.bankName || "",
      chequeNumber: record.chequeNumber || "",
      chequeDate: record.chequeDate ? moment(record.chequeDate) : null,
      transactionId: record.transactionId || "",
    });
    setEditIncomeId(record._id);
    setIsEditModalOpen(true);
  };

  const handleView = (record: Income) => {
    setViewIncome(record);
    setIsViewModalOpen(true);
  };

  const handleUpdateIncome = async () => {
    if (
      !formData.income_title ||
      !formData.income_type ||
      !formData.amount ||
      !formData.payment_method ||
      !formData.receipt_date ||
      !formData.received_from ||
      !formData.received_by ||
      !formData.status ||
      (formData.paymentStatus === "Paid" && (
        !formData.paymentDate ||
        (formData.payment_method === "Cheque" && (!formData.bankName || !formData.chequeNumber || !formData.chequeDate)) ||
        ((formData.payment_method === "Bank Transfer" || formData.payment_method === "UPI" || formData.payment_method === "Card") && !formData.transactionId)
      ))
    ) {
      toast.error("All required fields must be filled");
      return;
    }

    try {
      const payload = {
        ...formData,
        receipt_date: formData.receipt_date ? formData.receipt_date.toISOString() : null,
        paymentDate: formData.paymentDate ? formData.paymentDate.toISOString() : null,
        chequeDate: formData.chequeDate ? formData.chequeDate.toISOString() : null,
      };
      const res = await axios.put(`${API_URL}/api/income/${editIncomeId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncomes((prev) =>
        prev.map((income) =>
          income._id === editIncomeId ? { ...res.data, key: res.data._id } : income
        )
      );
      setFilteredIncomes((prev) =>
        prev.map((income) =>
          income._id === editIncomeId ? { ...res.data, key: res.data._id } : income
        )
      );
      setFormData({
        income_title: "",
        income_type: "",
        amount: null,
        payment_method: "",
        receipt_date: null,
        received_from: "",
        received_by: "",
        description: "",
        status: "Pending",
        paymentStatus: "Unpaid",
        paymentDate: null,
        bankName: "",
        chequeNumber: "",
        chequeDate: null,
        transactionId: "",
      });
      setIsEditModalOpen(false);
      setEditIncomeId(null);
      toast.success("Income updated successfully");
    } catch (error: any) {
      console.error("Error updating income:", error);
      toast.error(error.response?.data?.message || "Error updating income");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/income/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncomes((prev) => prev.filter((income) => income._id !== id));
      setFilteredIncomes((prev) => prev.filter((income) => income._id !== id));
      toast.success("Income deleted successfully");
    } catch (error: any) {
      console.error("Error deleting income:", error);
      toast.error(error.response?.data?.message || "Error deleting income");
    }
  };

  const handleInputChange = (name: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      income_title: "",
      income_type: "",
      amount: null,
      payment_method: "",
      receipt_date: null,
      received_from: "",
      received_by: "",
      description: "",
      status: "Pending",
      paymentStatus: "Unpaid",
      paymentDate: null,
      bankName: "",
      chequeNumber: "",
      chequeDate: null,
      transactionId: "",
    });
    setNextIncomeId("");
    setEditIncomeId(null);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value) {
      setFilteredIncomes(incomes);
      return;
    }
    const lowerValue = value.toLowerCase();
    const filtered = incomes.filter((income) =>
      income.income_id.toLowerCase().includes(lowerValue) ||
      income.income_title.toLowerCase().includes(lowerValue) ||
      (income.receipt_date && moment(income.receipt_date).format("DD/MM/YYYY").includes(lowerValue)) ||
      income.received_from.toLowerCase().includes(lowerValue) ||
      income.income_type.toLowerCase().includes(lowerValue) ||
      `₹${income.amount.toFixed(2)}`.toLowerCase().includes(lowerValue) ||
      income.status.toLowerCase().includes(lowerValue)
    );
    setFilteredIncomes(filtered);
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div>
        <div className="page-wrapper">
          <div className="content">
            <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
              <div className="my-auto mb-2">
                <h3 className="page-title mb-1">Incomes List</h3>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={route.adminDashboard}>Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="#">Incomes</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      All Incomes
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
                      fetchNextIncomeId();
                      setIsAddModalOpen(true);
                    }}
                  >
                    <i className="ti ti-square-rounded-plus-filled me-2" />
                    Add Income
                  </Button>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                <h4 className="mb-3">Incomes List</h4>
                <Search
                  placeholder="Search by any field"
                  allowClear
                  onSearch={handleSearch}
                  style={{ width: 200 }}
                />
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
                  <Table columns={columns} dataSource={filteredIncomes} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Income Modal */}
        <Modal
          title="Add Income"
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
            <Button key="submit" type="primary" onClick={handleAddIncome}>
              Add Income
            </Button>,
          ]}
        >
          <div className="row">
            {/* Row 1: Income ID, Income Title, Receipt Date */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Income ID *</label>
              <Input
                value={nextIncomeId || "Fetching ID..."}
                readOnly
                disabled
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Income Title *</label>
              <Input
                value={formData.income_title}
                onChange={(e) => handleInputChange("income_title", e.target.value)}
                placeholder="Enter Income Title"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Receipt Date *</label>
              <DatePicker
                value={formData.receipt_date}
                onChange={(date) => handleInputChange("receipt_date", date)}
                format="DD/MM/YYYY"
                className="w-100"
                style={{ width: "100%", zIndex: 10001 }}
                getPopupContainer={(trigger) => trigger.parentElement || document.body}
              />
            </div>

            {/* Row 2: Received From, Income Type, Amount */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Received From *</label>
              <Input
                value={formData.received_from}
                onChange={(e) => handleInputChange("received_from", e.target.value)}
                placeholder="Enter Received From"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Income Type *</label>
              <Select
                value={formData.income_type}
                onChange={(value) => handleInputChange("income_type", value)}
                className="w-100"
              >
                <Option value="">Select Type</Option>
                {INCOME_TYPES.map((type) => (
                  <Option key={type} value={type}>
                    {type}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Amount *</label>
              <InputNumber
                value={formData.amount}
                onChange={(value) => handleInputChange("amount", value)}
                min={0}
                className="w-100"
              />
            </div>

            {/* Row 3: Received By, Status, Payment Status */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Received By *</label>
              <Input
                value={formData.received_by}
                onChange={(e) => handleInputChange("received_by", e.target.value)}
                placeholder="Enter Received By"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Status *</label>
              <Select
                value={formData.status}
                onChange={(value) => handleInputChange("status", value)}
                className="w-100"
              >
                <Option value="Pending">Pending</Option>
                <Option value="Confirmed">Confirmed</Option>
                <Option value="Cancelled">Cancelled</Option>
              </Select>
            </div>
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

            {/* Row 4: Payment Date (conditional), Payment Method */}
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
                  <label className="form-label">Payment Method *</label>
                  <Select
                    value={formData.payment_method}
                    onChange={(value) => handleInputChange("payment_method", value)}
                    className="w-100"
                  >
                    <Option value="">Select Payment Method</Option>
                    {PAYMENT_METHODS.map((method) => (
                      <Option key={method} value={method}>
                        {method}
                      </Option>
                    ))}
                  </Select>
                </div>
              </>
            )}

            {/* Conditional Fields for Cheque */}
            {formData.paymentStatus === "Paid" && formData.payment_method === "Cheque" && (
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

            {/* Conditional Fields for Bank Transfer, UPI, Card */}
            {formData.paymentStatus === "Paid" && (formData.payment_method === "Bank Transfer" || formData.payment_method === "UPI" || formData.payment_method === "Card") && (
              <div className="col-md-4 mb-3">
                <label className="form-label">Transaction ID *</label>
                <Input
                  value={formData.transactionId}
                  onChange={(e) => handleInputChange("transactionId", e.target.value)}
                  placeholder="Enter Transaction ID"
                />
              </div>
            )}

            {/* Row 5: Description (full width) */}
            <div className="col-md-12 mb-3">
              <label className="form-label">Description</label>
              <Input.TextArea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter Description"
                rows={4}
              />
            </div>
          </div>
        </Modal>

        {/* Edit Income Modal */}
        <Modal
          title="Edit Income"
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
            <Button key="submit" type="primary" onClick={handleUpdateIncome}>
              Update Income
            </Button>,
          ]}
        >
          <div className="row">
            {/* Row 1: Income ID, Income Title, Receipt Date */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Income ID *</label>
              <Input
                value={formData.income_id || ""}
                readOnly
                disabled
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Income Title *</label>
              <Input
                value={formData.income_title}
                onChange={(e) => handleInputChange("income_title", e.target.value)}
                placeholder="Enter Income Title"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Receipt Date *</label>
              <DatePicker
                value={formData.receipt_date}
                onChange={(date) => handleInputChange("receipt_date", date)}
                format="DD/MM/YYYY"
                className="w-100"
                style={{ width: "100%", zIndex: 10001 }}
                getPopupContainer={(trigger) => trigger.parentElement || document.body}
              />
            </div>

            {/* Row 2: Received From, Income Type, Amount */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Received From *</label>
              <Input
                value={formData.received_from}
                onChange={(e) => handleInputChange("received_from", e.target.value)}
                placeholder="Enter Received From"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Income Type *</label>
              <Select
                value={formData.income_type}
                onChange={(value) => handleInputChange("income_type", value)}
                className="w-100"
              >
                <Option value="">Select Type</Option>
                {INCOME_TYPES.map((type) => (
                  <Option key={type} value={type}>
                    {type}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Amount *</label>
              <InputNumber
                value={formData.amount}
                onChange={(value) => handleInputChange("amount", value)}
                min={0}
                className="w-100"
              />
            </div>

            {/* Row 3: Received By, Status, Payment Status */}
            <div className="col-md-4 mb-3">
              <label className="form-label">Received By *</label>
              <Input
                value={formData.received_by}
                onChange={(e) => handleInputChange("received_by", e.target.value)}
                placeholder="Enter Received By"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Status *</label>
              <Select
                value={formData.status}
                onChange={(value) => handleInputChange("status", value)}
                className="w-100"
              >
                <Option value="Pending">Pending</Option>
                <Option value="Confirmed">Confirmed</Option>
                <Option value="Cancelled">Cancelled</Option>
              </Select>
            </div>
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

            {/* Row 4: Payment Date (conditional), Payment Method */}
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
                  <label className="form-label">Payment Method *</label>
                  <Select
                    value={formData.payment_method}
                    onChange={(value) => handleInputChange("payment_method", value)}
                    className="w-100"
                  >
                    <Option value="">Select Payment Method</Option>
                    {PAYMENT_METHODS.map((method) => (
                      <Option key={method} value={method}>
                        {method}
                      </Option>
                    ))}
                  </Select>
                </div>
              </>
            )}

            {/* Conditional Fields for Cheque */}
            {formData.paymentStatus === "Paid" && formData.payment_method === "Cheque" && (
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

            {/* Conditional Fields for Bank Transfer, UPI, Card */}
            {formData.paymentStatus === "Paid" && (formData.payment_method === "Bank Transfer" || formData.payment_method === "UPI" || formData.payment_method === "Card") && (
              <div className="col-md-4 mb-3">
                <label className="form-label">Transaction ID *</label>
                <Input
                  value={formData.transactionId}
                  onChange={(e) => handleInputChange("transactionId", e.target.value)}
                  placeholder="Enter Transaction ID"
                />
              </div>
            )}

            {/* Row 5: Description (full width) */}
            <div className="col-md-12 mb-3">
              <label className="form-label">Description</label>
              <Input.TextArea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter Description"
                rows={4}
              />
            </div>
          </div>
        </Modal>

        {/* View Income Modal */}
        <Modal
          title="Income Details"
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
          {viewIncome && (
            <div className="row">
              {/* Row 1: Income ID, Income Title, Receipt Date */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Income ID</label>
                <Input value={viewIncome.income_id} readOnly />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Income Title</label>
                <Input value={viewIncome.income_title} readOnly />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Receipt Date</label>
                <Input
                  value={viewIncome.receipt_date ? moment(viewIncome.receipt_date).format("DD/MM/YYYY") : "N/A"}
                  readOnly
                />
              </div>

              {/* Row 2: Received From, Income Type, Amount */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Received From</label>
                <Input value={viewIncome.received_from} readOnly />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Income Type</label>
                <Input value={viewIncome.income_type} readOnly />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Amount</label>
                <Input value={`₹${viewIncome.amount.toFixed(2)}`} readOnly />
              </div>

              {/* Row 3: Received By, Status, Payment Status */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Received By</label>
                <Input value={viewIncome.received_by} readOnly />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Status</label>
                <Input value={viewIncome.status} readOnly />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Payment Status</label>
                <Input value={viewIncome.paymentStatus} readOnly />
              </div>

              {/* Row 4: Payment Date, Payment Method */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Payment Date</label>
                <Input
                  value={viewIncome.paymentDate ? moment(viewIncome.paymentDate).format("DD/MM/YYYY") : "N/A"}
                  readOnly
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Payment Method</label>
                <Input value={viewIncome.payment_method || "N/A"} readOnly />
              </div>

              {/* Conditional Fields for Cheque */}
              {viewIncome.payment_method === "Cheque" && (
                <>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Bank Name</label>
                    <Input value={viewIncome.bankName || "N/A"} readOnly />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Cheque Number</label>
                    <Input value={viewIncome.chequeNumber || "N/A"} readOnly />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Cheque Date</label>
                    <Input
                      value={viewIncome.chequeDate ? moment(viewIncome.chequeDate).format("DD/MM/YYYY") : "N/A"}
                      readOnly
                    />
                  </div>
                </>
              )}

              {/* Conditional Fields for Bank Transfer, UPI, Card */}
              {(viewIncome.payment_method === "Bank Transfer" || viewIncome.payment_method === "UPI" || viewIncome.payment_method === "Card") && (
                <div className="col-md-4 mb-3">
                  <label className="form-label">Transaction ID</label>
                  <Input value={viewIncome.transactionId || "N/A"} readOnly />
                </div>
              )}

              {/* Row 5: Description (full width) */}
              <div className="col-md-12 mb-3">
                <label className="form-label">Description</label>
                <Input.TextArea value={viewIncome.description || "N/A"} readOnly rows={4} />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default IncomeManager;