import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Descriptions } from "antd";
import {
  Spin,
  Select,
  Table,
  Button,
  Form,
  Modal,
  Radio,
  Input,
  DatePicker,
  Row,
  Col,
  Checkbox,
} from "antd";
import { all_routes } from "../../router/all_routes";
import moment from "moment";
import TooltipOption from "../../../core/common/tooltipOption";
import { useAuth } from "../../../context/AuthContext";

interface Session {
  _id: string;
  name: string;
  sessionId: string;
  status: "active" | "inactive" | "completed";
}

interface Class {
  _id: string;
  id: string;
  name: string;
  sessionId: string;
}

interface Student {
  _id: string;
  admissionNumber: string;
  name: string;
  classId: string;
  fatherInfo?: { name: string };
  motherInfo?: { name: string };
}

interface PaymentDetail {
  _id?: string;
  paymentId: string;
  modeOfPayment:
    | "Cash"
    | "BankTransfer"
    | "Cheque"
    | "CardPayment"
    | "Wallet"
    | "IMPS";
  collectionDate: string;
  amountPaid: number;
  transactionNo?: string;
  transactionDate?: string;
  chequeNo?: string;
  chequeDate?: string;
  bankName?: string;
  remarks?: string;
  internalNotes?: string;
  excessAmount?: number;
}

interface FeeDetail {
  feesGroup: {
    id: string;
    _id: string;
    name: string;
    amount: number;
    periodicity: string;
    originalAmount: number;
    discount: number;
  };
}

interface GeneratedFee {
  _id: string;
  student: {
    _id: string;
    name: string;
    admissionNumber: string;
  };
  fees: FeeDetail[];
  amount: number;
  amountPaid: number;
  netPayable: number;
  balanceAmount: number;
  discount?: number;
  dueDate?: string;
  status?: string;
  month?: string;
  paymentDetails: PaymentDetail[];
  excessAmount: number;
}

interface FeeTableRow {
  key: string;
  student: {
    _id?: string;
    name: string;
    admissionNumber: string;
  };
  month: string;
  totalAmount: number | null;
  totalNetPayable: number | null;
  amountPaid: number;
  balanceAmount: number;
  dueDate?: string;
  status?: string;
  feeDetails: GeneratedFee[];
}

interface CollectFeesResponse {
  success: boolean;
  message: string;
  fees: GeneratedFee[];
  excessAmount: number;
  paymentId?: string;
}

const API_URL = process.env.REACT_APP_URL;

const CollectStudentFees: React.FC = () => {
  const routes = all_routes;
  const { token } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [monthlyFees, setMonthlyFees] = useState<FeeTableRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] =
    useState<boolean>(false);
  const [selectedFeeDetails, setSelectedFeeDetails] =
    useState<GeneratedFee | null>(null);
  const [isCollectModalVisible, setIsCollectModalVisible] =
    useState<boolean>(false);
  const [selectedFeeRow, setSelectedFeeRow] = useState<FeeTableRow | null>(
    null
  );
  const [paymentMode, setPaymentMode] = useState<
    "Cash" | "BankTransfer" | "Cheque" | "CardPayment" | "Wallet" | "IMPS"
  >("Cash");
  const [collectionDate, setCollectionDate] = useState<moment.Moment | null>(
    moment("2025-06-23")
  );
  const [transactionNo, setTransactionNo] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<moment.Moment | null>(
    null
  );
  const [chequeNo, setChequeNo] = useState<string>("");
  const [chequeDate, setChequeDate] = useState<moment.Moment | null>(null);
  const [bankName, setBankName] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [includeExcessFee, setIncludeExcessFee] = useState<boolean>(false);
  const [excessAmount, setExcessAmount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isEditingPayment, setIsEditingPayment] = useState<boolean>(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | undefined>(
    undefined
  );
  const [nextPaymentId, setNextPaymentId] = useState("");
  const [includeDiscount, setIncludeDiscount] = useState<boolean>(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Session[]>(
        `${API_URL}/api/session/get`,
        config
      );
      setSessions(response.data || []);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to fetch sessions";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesForSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Class[]>(
        `${API_URL}/api/class/session/${selectedSession}`,
        config
      );
      setClasses(response.data || []);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to fetch classes";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForClass = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<{ data: Student[] }>(
        `${API_URL}/api/studentFees/students-by-class-session/${selectedClass}/${selectedSession}`,
        config
      );
      setStudents(response.data?.data || []);
      console.log(students);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to fetch students";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const fetchPreviewPaymentId = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/studentFees/preview-next-id`,
        config
      );
      setNextPaymentId(response.data.paymentId);
    } catch (err) {
      setNextPaymentId("Generating...");
    }
  };
  const fetchFeesForMonth = async (studentId: string, month?: string) => {
    if (!studentId || !selectedSession) return [];
    setLoading(true);
    setError(null);
    try {
      const url = month
        ? `${API_URL}/api/studentFees/${studentId}/fees-by-month/${month}`
        : `${API_URL}/api/studentFees/${studentId}/fees-by-session/${selectedSession}`;
      const response = await axios.get<GeneratedFee[]>(url, config);
      console.log(response.data);
      return response.data || [];
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : `Failed to fetch fees for ${month ? `month ${month}` : "session"}`;
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudentFees = async () => {
    if (!selectedClass || !selectedSession || !selectedStudent) return;
    setLoading(true);
    setError(null);
    try {
      const studentFees: FeeTableRow[] = [];
      const student = students.find((s) => s._id === selectedStudent);
      if (student) {
        const fees = await fetchFeesForMonth(student._id, selectedMonth);
        fees.forEach((fee) => {
          if (fee.month) {
            const row: FeeTableRow = {
              key: `${student._id}-${fee.month}`,
              student: {
                _id: student._id,
                name: student.name,
                admissionNumber: student.admissionNumber,
              },
              month: fee.month,
              totalAmount: fee.amount || 0,
              totalNetPayable:
                fee.netPayable || fee.amount - (fee.discount || 0),
              amountPaid: fee.amountPaid || 0,
              balanceAmount: fee.balanceAmount || 0,
              dueDate: fee.dueDate,
              status: fee.status || "pending",
              feeDetails: [fee],
            };
            studentFees.push(row);
          }
        });
        if (fees.length > 0) {
          setExcessAmount(fees[0].excessAmount || 0);
        }
      }
      setMonthlyFees(studentFees);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to fetch fees for students";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectFees = async () => {
    if (!selectedFeeRow || !collectionDate || !amountPaid) {
      toast.error(
        "Please fill in all required fields: collection date, amount paid"
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const totalAmount = amountPaid + (includeExcessFee ? excessAmount : 0);
      const paymentDetails: PaymentDetail = {
        paymentId: editingPaymentId || "", // Will be generated by backend if new payment
        modeOfPayment: paymentMode,
        collectionDate: collectionDate.toISOString(),
        amountPaid,
        ...(paymentMode !== "Cash" &&
          paymentMode !== "Cheque" &&
          transactionNo && { transactionNo }),
        ...(paymentMode !== "Cash" &&
          paymentMode !== "Cheque" &&
          transactionDate && {
            transactionDate: transactionDate.toISOString(),
          }),
        ...(paymentMode === "Cheque" && chequeNo && { chequeNo }),
        ...(paymentMode === "Cheque" &&
          chequeDate && { chequeDate: chequeDate.toISOString() }),
        ...(["BankTransfer", "IMPS", "Cheque"].includes(paymentMode) &&
          bankName && { bankName }),
        ...(remarks && { remarks }),
        ...(internalNotes && { internalNotes }),
        ...(includeExcessFee && excessAmount > 0 && { excessAmount }), // Include excessAmount in paymentDetails
      };

      const payload = {
        studentId: selectedFeeRow.student._id,
        sessionId: selectedSession,
        month: selectedFeeRow.month,
        paymentDetails,
        excessAmount: includeExcessFee ? excessAmount : 0,
        discount: discountAmount,
      };

      let response: any;
      if (isEditingPayment && editingPaymentId) {
        payload.paymentDetails._id = editingPaymentId;
        response = await axios.put<CollectFeesResponse>(
          `${API_URL}/api/studentFees/edit-payment`,
          payload,
          config
        );
      } else {
        response = await axios.post<CollectFeesResponse>(
          `${API_URL}/api/studentFees/collect`,
          payload,
          config
        );
      }

      toast.success(
        response.data.message ||
          (isEditingPayment
            ? "Payment details updated successfully"
            : "Fees collected successfully")
      );
      if (response.data.paymentId) {
        setEditingPaymentId(response.data.paymentId);
      }
      setMonthlyFees((prevFees) =>
        prevFees.map((fee) => {
          if (fee.key === selectedFeeRow?.key) {
            const updatedFee = response.data.fees[0];
            return {
              ...fee,
              amountPaid: updatedFee.amountPaid,
              balanceAmount: updatedFee.balanceAmount,
              feeDetails: [updatedFee],
              status: updatedFee.status,
            };
          }
          return fee;
        })
      );

      setIsCollectModalVisible(false);
      fetchAllStudentFees();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : isEditingPayment
        ? "Failed to update payment details"
        : "Failed to collect fees";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const resetCollectForm = () => {
    setPaymentMode("Cash");
    setCollectionDate(moment("2025-06-23"));
    setTransactionNo("");
    setTransactionDate(null);
    setChequeNo("");
    setChequeDate(null);
    setBankName("");
    setRemarks("");
    setInternalNotes("");
    setIncludeExcessFee(false);
    setExcessAmount(0);
    setAmountPaid(0);
    setIsEditingPayment(false);
    setNextPaymentId("");
    setEditingPaymentId(undefined);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchClassesForSession();
    } else {
      setClasses([]);
      setSelectedClass("");
      setStudents([]);
      setSelectedStudent("");
      setSelectedMonth("");
      setMonthlyFees([]);
      setError(null);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedClass && selectedSession) {
      fetchStudentsForClass();
    } else {
      setStudents([]);
      setSelectedStudent("");
      setSelectedMonth("");
      setMonthlyFees([]);
      setError(null);
    }
  }, [selectedClass, selectedSession]);

  useEffect(() => {
    if (selectedStudent && selectedSession) {
      fetchAllStudentFees();
    } else {
      setMonthlyFees([]);
    }
  }, [selectedStudent, selectedSession, selectedMonth]);

  const handleViewDetails = (record: FeeTableRow) => {
    if (!record.feeDetails || record.feeDetails.length === 0) {
      toast.error("No fee details available for this month");
      return;
    }
    const selectedStudentDetail = students.find(
      (s) => s._id === record.student._id
    );
    setSelectedFeeDetails(record.feeDetails[0] || null);
    setIsDetailsModalVisible(true);
  };

  const handleCollectClick = (record: FeeTableRow) => {
    setSelectedFeeRow(record);
    fetchPreviewPaymentId();
    setCollectionDate(moment("2025-06-23"));
    setExcessAmount(record.feeDetails[0]?.excessAmount || 0);
    setAmountPaid(record.balanceAmount || 0); // Pre-fill with balance amount
    setIsCollectModalVisible(true);
    setIsEditingPayment(false);
  };

  const handleEditPayment = (record: FeeTableRow) => {
    const feeDetail = record.feeDetails[0];
    if (!feeDetail.paymentDetails || feeDetail.paymentDetails.length === 0) {
      toast.error("No payment details available to edit");
      return;
    }
    const payment = feeDetail.paymentDetails[0]; // Assuming single payment per fee for simplicity
    setSelectedFeeRow(record);
    setPaymentMode(payment.modeOfPayment);
    setCollectionDate(moment(payment.collectionDate));
    setTransactionNo(payment.transactionNo || "");
    setTransactionDate(
      payment.transactionDate ? moment(payment.transactionDate) : null
    );
    setChequeNo(payment.chequeNo || "");
    setChequeDate(payment.chequeDate ? moment(payment.chequeDate) : null);
    setBankName(payment.bankName || "");
    setRemarks(payment.remarks || "");
    setInternalNotes(payment.internalNotes || "");
    setExcessAmount(feeDetail.excessAmount || 0);
    setIncludeExcessFee(feeDetail.excessAmount > 0);
    setIncludeDiscount((feeDetail.discount || 0) > 0);
    setDiscountAmount(feeDetail.discount || 0);
    setAmountPaid(payment.amountPaid || 0);
    setIsEditingPayment(true);
    setEditingPaymentId(payment._id);
    setNextPaymentId(payment.paymentId);
    setIsCollectModalVisible(true);
  };

  const summaryColumns = [
    {
      title: "Student Name",
      dataIndex: "student",
      render: (student: { name: string; admissionNumber: string }) => (
        <div>
          <div>{student?.name || "N/A"}</div>
          <small className="text-muted">
            ({student?.admissionNumber || "N/A"})
          </small>
        </div>
      ),
      sorter: (a: FeeTableRow, b: FeeTableRow) =>
        a.student.name.localeCompare(b.student.name),
    },
    {
      title: "Month",
      dataIndex: "month",
      render: (month: string) => (
        <span style={{ color: "black" }}>{month || "N/A"}</span>
      ),
      sorter: (a: FeeTableRow, b: FeeTableRow) =>
        a.month.localeCompare(b.month),
    },
    {
      title: "Total Fees",
      dataIndex: "totalAmount",
      render: (totalAmount: number | null) => (
        <span>{totalAmount !== null ? `₹${totalAmount.toFixed(2)}` : "-"}</span>
      ),
      sorter: (a: FeeTableRow, b: FeeTableRow) =>
        (a.totalAmount || 0) - (b.totalAmount || 0),
    },
    {
      title: "Amount Paid",
      dataIndex: "amountPaid",
      render: (amountPaid: number, record: FeeTableRow) => (
        <div>
          <span>{amountPaid ? `₹${amountPaid.toFixed(2)}` : "-"}</span>
          {(record.feeDetails[0]?.discount || 0) > 0 && (
            <div>
              <small className="text-muted">
                (Discount: ₹{(record.feeDetails[0]?.discount || 0).toFixed(2)})
              </small>
            </div>
          )}
        </div>
      ),
      sorter: (a: FeeTableRow, b: FeeTableRow) =>
        (a.amountPaid || 0) - (b.amountPaid || 0),
    },
    {
      title: "Balance",
      dataIndex: "balanceAmount",
      render: (balanceAmount: number) => (
        <span>{balanceAmount ? `₹${balanceAmount.toFixed(2)}` : "-"}</span>
      ),
      sorter: (a: FeeTableRow, b: FeeTableRow) =>
        (b.balanceAmount || 0) - (a.balanceAmount || 0),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      render: (dueDate?: string) => (
        <span>{dueDate ? moment(dueDate).format("MMM DD, YYYY") : "-"}</span>
      ),
      sorter: (a: FeeTableRow, b: FeeTableRow) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status?: string) => (
        <span
          className={`badge ${
            status === "paid"
              ? "bg-success"
              : status === "partially_paid"
              ? "bg-info"
              : status === "pending"
              ? "bg-warning"
              : status
              ? "bg-danger"
              : "bg-secondary"
          }`}
          aria-label={`Status: ${status || "Not Generated"}`}
        >
          {status
            ? status
                .replace("_", " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
            : "Not Generated"}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: FeeTableRow) => (
        <div className="d-flex gap-2">
          <Button
            type="default"
            size="small"
            onClick={() => handleViewDetails(record)}
            disabled={!record.feeDetails || record.feeDetails.length === 0}
            icon={<i className="ti ti-eye me-1" />}
          >
            View Details
          </Button>
          {record.dueDate && record.status !== "paid" && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleCollectClick(record)}
              icon={<i className="ti ti-wallet me-1" />}
            >
              Collect Fees
            </Button>
          )}
          {(record.status === "paid" || record.status === "partially_paid") &&
            record.feeDetails[0]?.paymentDetails?.length > 0 && (
              <Button
                type="default"
                size="small"
                onClick={() => handleEditPayment(record)}
                icon={<i className="ti ti-pencil me-1" />}
              >
                Edit Payment
              </Button>
            )}
        </div>
      ),
    },
  ];

  const feeColumns = [
    {
      title: "Fee Group",
      dataIndex: "feesGroup",
      render: (feesGroup: { name: string }) => (
        <span>{feesGroup?.name || "N/A"}</span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (amount: number) => <span>₹{amount?.toFixed(2) || "0.00"}</span>,
    },
  ];

  const renderPaymentDetails = (
  paymentDetails: PaymentDetail[],
  excessAmount: number
) => {
  if (!paymentDetails || paymentDetails.length === 0) return null;

  return paymentDetails.map((detail, index) => {
    const relevantFields: { label: string; value: string | undefined }[] = [
      { label: "Payment ID", value: detail.paymentId },
      { label: "Mode of Payment", value: detail.modeOfPayment },
      {
        label: "Collection Date",
        value: detail.collectionDate
          ? moment(detail.collectionDate).format("MMM DD, YYYY")
          : undefined,
      },
      {
        label: "Amount Paid",
        value: detail.amountPaid
          ? `₹${detail.amountPaid.toFixed(2)}`
          : undefined,
      },
    ];

    if (
      detail.modeOfPayment !== "Cash" &&
      detail.modeOfPayment !== "Cheque"
    ) {
      if (detail.transactionNo)
        relevantFields.push({
          label: "Transaction No",
          value: detail.transactionNo,
        });
      if (detail.transactionDate)
        relevantFields.push({
          label: "Transaction Date",
          value: moment(detail.transactionDate).format("MMM DD, YYYY"),
        });
    }

    if (detail.modeOfPayment === "Cheque") {
      if (detail.chequeNo)
        relevantFields.push({ label: "Cheque No", value: detail.chequeNo });
      if (detail.chequeDate)
        relevantFields.push({
          label: "Cheque Date",
          value: moment(detail.chequeDate).format("MMM DD, YYYY"),
        });
    }

    if (["BankTransfer", "IMPS", "Cheque"].includes(detail.modeOfPayment)) {
      if (detail.bankName)
        relevantFields.push({ label: "Bank Name", value: detail.bankName });
    }

    if (detail.remarks)
      relevantFields.push({ label: "Remarks", value: detail.remarks });

    if (detail.internalNotes)
      relevantFields.push({
        label: "Internal Notes",
        value: detail.internalNotes,
      });

    return (
      <div
        key={index}
        style={{
          
          borderRadius: "8px",
          padding: "10px",
          marginBottom: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h6 style={{ marginBottom: "12px", color: "#333", fontSize: "16px" }}>
          Payment {index + 1}
        </h6>

        <Descriptions
          bordered
          size="small"
          column={1}
          labelStyle={{ fontWeight: 500, width: 160 }}
        >
          {relevantFields.map(
            (field, idx) =>
              field.value && (
                <Descriptions.Item key={idx} label={field.label}>
                  {field.value}
                </Descriptions.Item>
              )
          )}
        </Descriptions>
      </div>
    );
  });
};

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Collect Student Fees</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="#">Fees Collection</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Collect Fees
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <TooltipOption />
          </div>
        </div>
        <div className="card">
          <div className="card-header pb-0">
            <h4 className="mb-3">Collect Fees</h4>
            <div className="d-flex flex-wrap gap-3">
              <Form.Item label="Session">
                <Select
                  placeholder="Select a session"
                  value={selectedSession || undefined}
                  onChange={(value: string) => setSelectedSession(value)}
                  style={{ width: 200 }}
                  options={sessions.map((session) => ({
                    value: session._id,
                    label: `${session.name} (${session.sessionId})`,
                  }))}
                  disabled={loading}
                  allowClear
                />
              </Form.Item>
              <Form.Item label="Class">
                <Select
                  placeholder="Select a class"
                  value={selectedClass || undefined}
                  onChange={(value: string) => setSelectedClass(value)}
                  style={{ width: 200 }}
                  options={classes.map((cls) => ({
                    value: cls._id,
                    label: cls.name,
                  }))}
                  disabled={!selectedSession || loading}
                  allowClear
                />
              </Form.Item>
              <Form.Item label="Student">
                <Select
                  placeholder="Select a student"
                  value={selectedStudent || undefined}
                  onChange={(value: string) => setSelectedStudent(value)}
                  style={{ width: 200 }}
                  options={students.map((student) => ({
                    value: student._id,
                    label: `${student.name} (${student.admissionNumber})`,
                  }))}
                  disabled={!selectedClass || loading}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    option?.label
                      ?.toLowerCase()
                      .includes(input.toLowerCase()) || false
                  }
                />
              </Form.Item>
              <Form.Item label="Month">
                <Select
                  placeholder="Filter by month"
                  value={selectedMonth || undefined}
                  onChange={(value: string) => setSelectedMonth(value)}
                  style={{ width: 200 }}
                  options={[
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                    "Jan",
                    "Feb",
                    "Mar",
                  ].map((month) => ({
                    value: month,
                    label: month,
                  }))}
                  disabled={!selectedStudent || loading}
                  allowClear
                />
              </Form.Item>
            </div>
          </div>
          <div className="card-body p-0 py-3">
            <Spin spinning={loading} size="large">
              {error ? (
                <div className="text-center py-4">
                  <p className="alert alert-danger mx-3" role="alert">
                    {error}
                  </p>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      setError(null);
                      if (selectedClass && selectedSession && selectedStudent) {
                        fetchAllStudentFees();
                      } else if (selectedClass && selectedSession) {
                        fetchStudentsForClass();
                      } else if (selectedSession) {
                        fetchClassesForSession();
                      } else {
                        fetchSessions();
                      }
                    }}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              ) : loading ? (
                <div className="text-center py-4">
                  <p>Loading fees data...</p>
                </div>
              ) : monthlyFees.length > 0 ? (
                <div className="p-3">
                  <h5>
                    Fees for{" "}
                    {selectedStudent
                      ? students.find((s) => s._id === selectedStudent)?.name
                      : "Student"}
                    {selectedMonth ? ` - ${selectedMonth}` : " - All Months"}
                  </h5>
                  <Table
                    dataSource={monthlyFees}
                    columns={summaryColumns}
                    rowKey="key"
                    pagination={false}
                  />
                  <Modal
                    open={isDetailsModalVisible}
                    onCancel={() => {
                      setIsDetailsModalVisible(false);
                      setSelectedFeeDetails(null);
                    }}
                    footer={null}
                    width={
                      selectedFeeDetails?.status === "paid" ||
                      (selectedFeeDetails?.status === "partially_paid" &&
                        selectedFeeDetails?.paymentDetails?.length > 0)
                        ? 1000
                        : 600
                    }
                    style={{ top: 50 }}
                    zIndex={10000}
                  >
                    {selectedFeeDetails && (
                      <>
                        <div
                          style={{
                            textAlign: "center",
                            marginBottom: "20px",
                            borderBottom: "1px solid #e8e8e8",
                            paddingBottom: "15px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "10px",
                              marginBottom: "20px",
                            }}
                          >
                            <img
                              src="/assets/img/favicon.png"
                              alt="Logo"
                              style={{ width: "80px", height: "80px" }}
                            />
                            <div>
                              <h3
                                style={{
                                  margin: "0",
                                  fontSize: "20px",
                                  fontWeight: "bold",
                                }}
                              >
                                La Neeno's Kindergarten and Daycare
                              </h3>
                              <p
                                style={{
                                  margin: "5px 0",
                                  fontSize: "14px",
                                  color: "#555",
                                }}
                              >
                                SG 03, Sector 144, Near Gulshan Botnia, 201304
                              </p>
                            </div>
                          </div>

                          <Row gutter={16}>
  <Col span={12}>
    <Descriptions
      column={1}
      size="small"
      labelStyle={{ fontWeight: 500 }}
      bordered
    >
      <Descriptions.Item label="Student Name">
        {selectedFeeDetails.student.name}
      </Descriptions.Item>
      <Descriptions.Item label="Admission Number">
        {selectedFeeDetails.student.admissionNumber}
      </Descriptions.Item>
      <Descriptions.Item label="Class">
        {classes.find(
          (c) =>
            c._id ===
            students.find((s) => s._id === selectedFeeDetails.student._id)
              ?.classId
        )?.name || "N/A"}
      </Descriptions.Item>
    </Descriptions>
  </Col>

  <Col span={12}>
    <Descriptions
      column={1}
      size="small"
      labelStyle={{ fontWeight: 500 }}
      bordered
    >
      <Descriptions.Item label="Father's Name">
        {students.find((s) => s._id === selectedFeeDetails.student._id)
          ?.fatherInfo?.name || "N/A"}
      </Descriptions.Item>
      <Descriptions.Item label="Mother's Name">
        {students.find((s) => s._id === selectedFeeDetails.student._id)
          ?.motherInfo?.name || "N/A"}
      </Descriptions.Item>
    </Descriptions>
  </Col>
</Row>

                        </div>

                        <Row gutter={24}>
                          <Col
                            span={
                              (selectedFeeDetails.status === "paid" ||
                                selectedFeeDetails.status ===
                                  "partially_paid") &&
                              selectedFeeDetails.paymentDetails?.length > 0
                                ? 12
                                : 24
                            }
                          >
                            <Table
                              dataSource={selectedFeeDetails.fees}
                              columns={feeColumns}
                              rowKey={(record, index) =>
                                `${selectedFeeDetails._id}-${index}`
                              }
                              pagination={false}
                              footer={() => {
                                const totalAmount =
                                  selectedFeeDetails.amount || 0;
                                const excessAmount =
                                  selectedFeeDetails.excessAmount || 0;
                                const amountPaid =
                                  selectedFeeDetails.amountPaid || 0;
                                const balanceAmount =
                                  selectedFeeDetails.balanceAmount || 0;
                                const month = selectedFeeDetails.month || "N/A";
                                const gstRate = 0.18;

                                const gstAmountTotal = totalAmount * gstRate;
                                const baseAmountTotal =
                                  totalAmount - gstAmountTotal;

                                const gstAmountPaid = amountPaid * gstRate;
                                const baseAmountPaid =
                                  amountPaid - gstAmountPaid;

                                return (
                                  <div className="text-right">
                                    <div className="mt-2">
                                      <strong >Month: {month}</strong>
                                    </div>

                                    <div className="mt-2">
                                      <strong>
                                        Total Fees: ₹{totalAmount.toFixed(2)}{" "}
                                        {/* <span
                                          style={{
                                            fontWeight: "normal",
                                            fontSize: "13px",
                                          }}
                                        >
                                          (₹{baseAmountTotal.toFixed(2)} + ₹
                                          {gstAmountTotal.toFixed(2)} GST @18%)
                                        </span> */}
                                      </strong>
                                    </div>

                                    {amountPaid > 0 && (
                                      <div className="mt-2">
                                        <strong>
                                          Amount Paid: ₹{amountPaid.toFixed(2)}{" "}
                                          <span
                                            style={{
                                              fontWeight: "normal",
                                              fontSize: "13px",
                                            }}
                                          >
                                            {/* (₹{baseAmountPaid.toFixed(2)} + ₹
                                            {gstAmountPaid.toFixed(2)} GST @18%) */}
                                          </span>
                                        </strong>
                                      </div>
                                    )}
                                    {(selectedFeeDetails.discount || 0) > 0 && (
                                      <div  className="mt-2">
                                        <strong>
                                          Discount Amount: ₹
                                          {(
                                            selectedFeeDetails.discount || 0
                                          ).toFixed(2)}
                                        </strong>
                                      </div>
                                    )}
                                    {balanceAmount > 0 && (
                                      <div className="mt-2">
                                        <strong>
                                          Balance Amount: ₹
                                          {balanceAmount.toFixed(2)}
                                        </strong>
                                      </div>
                                    )}

                                    {excessAmount > 0 && (
                                      <div className="mt-2">
                                        <strong>
                                          Late Fee: ₹{excessAmount.toFixed(2)}
                                        </strong>
                                      </div>
                                    )}

                                    <div className="mt-2">
                                      <strong>
                                        Status:{" "}
                                        <span
                                          className={`badge ${
                                            selectedFeeDetails.status === "paid"
                                              ? "bg-success"
                                              : selectedFeeDetails.status ===
                                                "partially_paid"
                                              ? "bg-info"
                                              : selectedFeeDetails.status ===
                                                "pending"
                                              ? "bg-warning"
                                              : selectedFeeDetails.status
                                              ? "bg-danger"
                                              : "bg-secondary"
                                          }`}
                                          aria-label={`Status: ${
                                            selectedFeeDetails.status ||
                                            "Not Generated"
                                          }`}
                                        >
                                          {selectedFeeDetails.status
                                            ? selectedFeeDetails.status
                                                .replace("_", " ")
                                                .split(" ")
                                                .map(
                                                  (word) =>
                                                    word
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                    word.slice(1)
                                                )
                                                .join(" ")
                                            : "Not Generated"}
                                        </span>
                                      </strong>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                          </Col>
                          {(selectedFeeDetails.status === "paid" ||
                            selectedFeeDetails.status === "partially_paid") &&
                            selectedFeeDetails.paymentDetails?.length > 0 && (
                              <Col span={12}>
                                {/* <h5
                                  style={{
                                    marginBottom: "16px",
                                    color: "#333",
                                    fontSize: "18px",
                                  }}
                                >
                                  Payment Details
                                </h5> */}
                                {renderPaymentDetails(
                                  selectedFeeDetails.paymentDetails,
                                  selectedFeeDetails.excessAmount
                                )}
                              </Col>
                            )}
                        </Row>
                      </>
                    )}
                  </Modal>
                  <Modal
                    title={
                      isEditingPayment
                        ? `Edit Payment - ${
                            selectedFeeRow?.student.name || "Unknown"
                          } (${selectedFeeRow?.month || "N/A"})`
                        : `Collect Fees - ${
                            selectedFeeRow?.student.name || "Unknown"
                          } (${selectedFeeRow?.month || "N/A"})`
                    }
                    open={isCollectModalVisible}
                    onOk={handleCollectFees}
                    onCancel={() => {
                      setIsCollectModalVisible(false);
                      resetCollectForm();
                    }}
                    okText={isEditingPayment ? "Update Payment" : "Collect"}
                    cancelText="Cancel"
                    okButtonProps={{ loading }}
                    width={800}
                    zIndex={10000}
                    style={{ top: 50 }}
                  >
                    <Form layout="vertical">
                      {/* Collection Date and Payment ID */}
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="Collection Date" required>
                            <DatePicker
                              value={collectionDate}
                              onChange={(date) => setCollectionDate(date)}
                              format="YYYY-MM-DD"
                              style={{ width: "100%", zIndex: 10001 }}
                              getPopupContainer={(trigger) =>
                                trigger.parentElement || document.body
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Payment ID">
                            <Input
                              value={nextPaymentId}
                              disabled
                              style={{ fontWeight: "bold" }}
                              placeholder="Loading payment ID..."
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* Payment Mode */}
                      <Form.Item label="Mode of Payment" required>
                        <Radio.Group
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                        >
                          <Radio value="Cash">Cash</Radio>
                          <Radio value="BankTransfer">Bank Transfer</Radio>
                          <Radio value="Cheque">Cheque</Radio>
                          <Radio value="CardPayment">Card Payment</Radio>
                          <Radio value="Wallet">Wallet</Radio>
                          <Radio value="IMPS">IMPS</Radio>
                        </Radio.Group>
                      </Form.Item>

                      {/* Conditional Fields Based on Mode */}
                      {paymentMode !== "Cash" && paymentMode !== "Cheque" && (
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="Transaction No">
                              <Input
                                value={transactionNo}
                                onChange={(e) =>
                                  setTransactionNo(e.target.value)
                                }
                                placeholder="Enter transaction number"
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Transaction Date">
                              <DatePicker
                                value={transactionDate}
                                onChange={(date) => setTransactionDate(date)}
                                format="YYYY-MM-DD"
                                style={{ width: "100%", zIndex: 10001 }}
                                getPopupContainer={(trigger) =>
                                  trigger.parentElement || document.body
                                }
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      )}

                      {["BankTransfer", "IMPS", "Cheque"].includes(
                        paymentMode
                      ) && (
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="Bank Name">
                              <Input
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="Enter bank name"
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      )}

                      {paymentMode === "Cheque" && (
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="Cheque No">
                              <Input
                                value={chequeNo}
                                onChange={(e) => setChequeNo(e.target.value)}
                                placeholder="Enter cheque number"
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Cheque Date">
                              <DatePicker
                                value={chequeDate}
                                onChange={(date) => setChequeDate(date)}
                                format="YYYY-MM-DD"
                                style={{ width: "100%", zIndex: 10001 }}
                                getPopupContainer={(trigger) =>
                                  trigger.parentElement || document.body
                                }
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      )}

                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item label="Original Fee Amount">
                            <Input
                              type="number"
                              value={selectedFeeRow?.totalAmount || 0}
                              disabled
                              style={{ backgroundColor: "#f5f5f5" }}
                              addonBefore="₹"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label={
                              <span>
                                Discount&nbsp;
                                <Checkbox
                                  checked={includeDiscount}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setIncludeDiscount(checked);
                                    setDiscountAmount(0);
                                  }}
                                />
                              </span>
                            }
                          >
                            <Input
                              type="number"
                              value={discountAmount}
                              onChange={(e) =>
                                setDiscountAmount(Number(e.target.value))
                              }
                              placeholder="Enter discount"
                              min={0}
                              disabled={!includeDiscount}
                              style={{
                                backgroundColor: !includeDiscount
                                  ? "#f5f5f5"
                                  : "#fff",
                              }}
                              addonBefore="₹"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={
                              <span>
                                Late Fee&nbsp;
                                <Checkbox
                                  checked={includeExcessFee}
                                  onChange={(e) =>{
                                    const checked = e.target.checked;
                                    setIncludeExcessFee(e.target.checked)
                                    setExcessAmount(0)
                                  }}
                                />
                              </span>
                            }
                          >
                            <Input
                              type="number"
                              value={excessAmount}
                              onChange={(e) =>
                                setExcessAmount(Number(e.target.value))
                              }
                              placeholder="Enter late fee"
                              min={0}
                              disabled={!includeExcessFee}
                              style={{
                                backgroundColor: !includeExcessFee
                                  ? "#f5f5f5"
                                  : "#fff",
                              }}
                              addonBefore="₹"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="Amount Paid" required>
                            <Input
                              type="number"
                              value={amountPaid}
                              onChange={(e) =>
                                setAmountPaid(Number(e.target.value))
                              }
                              placeholder="Enter amount paid"
                              min={0}
                              addonBefore="₹"
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item label="Total Amount">
                            <Input
                              type="number"
                              value={
                                amountPaid +
                                (includeExcessFee ? excessAmount : 0) +
                                (includeDiscount ? discountAmount : 0)
                              }
                              disabled
                              style={{ backgroundColor: "#f5f5f5" }}
                              addonBefore="₹"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* Optional: Partially Paid Info */}
                      {selectedFeeRow?.status === "partially_paid" && (
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="Amount Already Paid">
                              <Input
                                type="number"
                                value={
                                  (selectedFeeRow?.totalAmount || 0) -
                                  (selectedFeeRow?.balanceAmount || 0)
                                }
                                disabled
                                style={{ backgroundColor: "#f5f5f5" }}
                                addonBefore="₹"
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Balance Amount">
                              <Input
                                type="number"
                                value={selectedFeeRow?.balanceAmount || 0}
                                disabled
                                style={{ backgroundColor: "#f5f5f5" }}
                                addonBefore="₹"
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      )}

                      {/* Notes */}
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="Remarks">
                            <Input.TextArea
                              value={remarks}
                              onChange={(e) => setRemarks(e.target.value)}
                              placeholder="This will be visible on fee receipt"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Internal Notes">
                            <Input.TextArea
                              value={internalNotes}
                              onChange={(e) => setInternalNotes(e.target.value)}
                              placeholder="Enter notes"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form>
                  </Modal>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="alert alert-info mx-3">
                    {selectedClass && selectedStudent
                      ? `No fees data available for the selected student${
                          selectedMonth ? ` in ${selectedMonth}` : ""
                        }.`
                      : selectedClass
                      ? "Please select a student to view fees."
                      : "Please select a class and session to view fees."}
                  </p>
                </div>
              )}
            </Spin>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectStudentFees;
