import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Spin, Select, Table, Button, Form, Modal, Row, Col, Input } from "antd";
import { all_routes } from "../../router/all_routes";
import moment from "moment";
import TooltipOption from "../../../core/common/tooltipOption";
import { useAuth } from "../../../context/AuthContext";
import dayjs from "dayjs";
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
  className?: string;
}

interface PaymentDetail {
  _id?: string;
  paymentId: string;
  modeOfPayment: "Cash" | "BankTransfer" | "Cheque" | "CardPayment" | "Wallet" | "IMPS";
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
  className: string;
  month: string;
  totalAmount: number | null;
  totalNetPayable: number | null;
  amountPaid: number;
  balanceAmount: number;
  dueDate?: string;
  status?: string;
  feeDetails: GeneratedFee[];
}

const API_URL = process.env.REACT_APP_URL;

const StudentFeeData: React.FC = () => {
  const routes = all_routes;
  const { token } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [monthlyFees, setMonthlyFees] = useState<FeeTableRow[]>([]);
  const [filteredFees, setFilteredFees] = useState<FeeTableRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState<boolean>(false);
  const [selectedFeeDetails, setSelectedFeeDetails] = useState<GeneratedFee | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Session[]>(`${API_URL}/api/session/get`, config);
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

  const fetchStudentsForSession = async () => {
    if (!selectedSession) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<{ data: Student[] }>(
        `${API_URL}/api/studentFees/students-by-session/${selectedSession}`,
        config
      );
      const studentsData = response.data?.data || [];
      // Fetch class names for each student
      const studentsWithClassNames = await Promise.all(
        studentsData.map(async (student) => {
          try {
            const classResponse = await axios.get<Class>(
              `${API_URL}/api/class/${student.classId}`,
              config
            );
            return { ...student, className: classResponse.data.name || "Unknown" };
          } catch {
            return { ...student, className: "Unknown" };
          }
        })
      );
      setStudents(studentsWithClassNames);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to fetch students";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeesForStudent = async (studentId: string) => {
    if (!studentId || !selectedSession) return [];
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}/api/studentFees/${studentId}/fees-by-session/${selectedSession}`;
      const response = await axios.get<GeneratedFee[]>(url, config);
      console.log(response.data)
      return response.data || [];
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to fetch fees for student";
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudentFees = async () => {
    if (!selectedSession || !students.length) return;
    setLoading(true);
    setError(null);
    try {
      const allFees: FeeTableRow[] = [];
      for (const student of students) {
        const fees = await fetchFeesForStudent(student._id);
        fees.forEach((fee) => {
          if (fee.month) {
            const row: FeeTableRow = {
              key: `${student._id}-${fee.month}`,
              student: {
                _id: student._id,
                name: student.name,
                admissionNumber: student.admissionNumber,
              },
              className: student.className || "Unknown",
              month: fee.month,
              totalAmount: fee.amount || 0,
              totalNetPayable: fee.netPayable || (fee.amount - (fee.discount || 0)),
              amountPaid: fee.amountPaid || 0,
              balanceAmount: fee.balanceAmount || 0,
              dueDate: fee.dueDate,
              status: fee.status || "pending",
              feeDetails: [fee],
            };
            allFees.push(row);
          }
        });
      }
      setMonthlyFees(allFees);
      setFilteredFees(allFees);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to fetch fees for students";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (!value) {
      setFilteredFees(monthlyFees);
      return;
    }
    const lowerValue = value.toLowerCase();
    const filtered = monthlyFees.filter(
      (fee) =>
        fee.student.name.toLowerCase().includes(lowerValue) ||
        fee.className.toLowerCase().includes(lowerValue) ||
        fee.month.toLowerCase().includes(lowerValue)
    );
    setFilteredFees(filtered);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchStudentsForSession();
    } else {
      setStudents([]);
      setMonthlyFees([]);
      setFilteredFees([]);
      setError(null);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (students.length > 0 && selectedSession) {
      fetchAllStudentFees();
    } else {
      setMonthlyFees([]);
      setFilteredFees([]);
    }
  }, [students, selectedSession]);

  const handleViewDetails = (record: FeeTableRow) => {
    if (!record.feeDetails || record.feeDetails.length === 0) {
      toast.error("No fee details available for this month");
      return;
    }
    const feeDetail = record.feeDetails[0];
    if (!feeDetail.student?.name || !feeDetail.student?.admissionNumber) {
      console.warn("Student data incomplete:", feeDetail.student);
      toast.error("Student details unavailable for this fee record.");
      return;
    }
    setSelectedFeeDetails(feeDetail);
    setIsDetailsModalVisible(true);
  };

  const summaryColumns = [
    {
      title: "Student Name",
      dataIndex: "student",
      render: (student: { name: string; admissionNumber: string }) => (
        <div>
          <div>{student?.name || "N/A"}</div>
          <small className="text-muted">({student?.admissionNumber || "N/A"})</small>
        </div>
      ),
      sorter: (a: FeeTableRow, b: FeeTableRow) => a.student.name.localeCompare(b.student.name),
    },
    {
      title: "Class",
      dataIndex: "className",
      render: (className: string) => <span>{className || "N/A"}</span>,
      sorter: (a: FeeTableRow, b: FeeTableRow) => a.className.localeCompare(b.className),
    },
    {
      title: "Month",
      dataIndex: "month",
      render: (month: string) => <span style={{ color: "black" }}>{month || "N/A"}</span>,
      sorter: (a: FeeTableRow, b: FeeTableRow) => a.month.localeCompare(b.month),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
       render: (duedate: string) => (
    <span style={{ color: "black" }}>
      {duedate ? dayjs(duedate).format("DD MMM YYYY") : "N/A"}
    </span>
  ),
      sorter: (a: FeeTableRow, b: FeeTableRow) => a.month.localeCompare(b.month),
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
      sorter: (a: FeeTableRow, b: FeeTableRow) =>
        (a.status || "pending").localeCompare(b.status || "pending"),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: FeeTableRow) => (
        <Button
          type="default"
          size="small"
          onClick={() => handleViewDetails(record)}
          disabled={!record.feeDetails || record.feeDetails.length === 0}
          icon={<i className="ti ti-eye me-1" />}
        >
          View Details
        </Button>
      ),
    },
  ];

  const feeColumns = [
    {
      title: "Fee Group",
      dataIndex: "feesGroup",
      render: (feesGroup: { name: string }) => <span>{feesGroup?.name || "N/A"}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (amount: number) => <span>₹{amount?.toFixed(2) || "0.00"}</span>,
    },
  ];

  const renderPaymentDetails = (paymentDetails: PaymentDetail[]) => {
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
          value: detail.amountPaid ? `₹${detail.amountPaid.toFixed(2)}` : undefined,
        },
      ];
      if (detail.excessAmount && detail.excessAmount > 0) {
        relevantFields.push({ label: "Late Fee", value: `₹${detail.excessAmount.toFixed(2)}` });
      }
      if (detail.modeOfPayment !== "Cash" && detail.modeOfPayment !== "Cheque") {
        if (detail.transactionNo)
          relevantFields.push({ label: "Transaction No", value: detail.transactionNo });
        if (detail.transactionDate)
          relevantFields.push({
            label: "Transaction Date",
            value: moment(detail.transactionDate).format("MMM DD, YYYY"),
          });
      }
      if (detail.modeOfPayment === "Cheque") {
        if (detail.chequeNo) relevantFields.push({ label: "Cheque No", value: detail.chequeNo });
        if (detail.chequeDate)
          relevantFields.push({
            label: "Cheque Date",
            value: moment(detail.chequeDate).format("MMM DD, YYYY"),
          });
      }
      if (["BankTransfer", "IMPS", "Cheque"].includes(detail.modeOfPayment)) {
        if (detail.bankName) relevantFields.push({ label: "Bank Name", value: detail.bankName });
      }
      if (detail.remarks) relevantFields.push({ label: "Remarks", value: detail.remarks });
      if (detail.internalNotes)
        relevantFields.push({ label: "Internal Notes", value: detail.internalNotes });

      return (
        <div
          key={index}
          style={{
            background: "#f9f9f9",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h6 style={{ marginBottom: "12px", color: "#333", fontSize: "16px" }}>
            Payment {index + 1}
          </h6>
          {relevantFields.map(
            (field, idx) =>
              field.value && (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ fontWeight: 500, color: "#555" }}>{field.label}:</span>
                  <span style={{ color: "#333" }}>{field.value}</span>
                </div>
              )
          )}
        </div>
      );
    });
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Student Fee Data</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="#">Fees Collection</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Student Fee Data
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
            <h4 className="mb-3">Student Fee Data</h4>
            <div className="d-flex flex-wrap gap-3 align-items-center">
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
              <Form.Item label="Search">
                <Input
                  placeholder="Search by student name, class, or month"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 250 }}
                />
              </Form.Item>
            </div>
          </div>
          <div className="card-body p-0 py-3">
            <Spin spinning={loading} size="large">
              {error ? (
                <div className="text-center py-4">
                  <p className="alert alert-danger mx-3" role="alert">{error}</p>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      setError(null);
                      if (selectedSession) {
                        fetchStudentsForSession();
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
                  <p>Loading fee data...</p>
                </div>
              ) : filteredFees.length > 0 ? (
                <div className="p-3">
                  <h5>Fee Data for {selectedSession ? sessions.find(s => s._id === selectedSession)?.name : "Session"}</h5>
                  <Table
                    dataSource={filteredFees}
                    columns={summaryColumns}
                    rowKey="key"
                    pagination={{ pageSize: 10 ,showSizeChanger: false}}
                  />
                  <Modal
                  title={
    selectedFeeDetails
      ? `Fee Collection Details - ${selectedFeeDetails.student.name} (${selectedFeeDetails.student.admissionNumber})`
      : "Fee Collection Details"
  }
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
                      <Row gutter={24}>
                        <Col
                          span={
                            (selectedFeeDetails.status === "paid" ||
                              selectedFeeDetails.status === "partially_paid") &&
                            selectedFeeDetails.paymentDetails?.length > 0
                              ? 12
                              : 24
                          }
                        >
                          <Table
                            dataSource={selectedFeeDetails.fees}
                            columns={feeColumns}
                            rowKey={(record, index) => `${selectedFeeDetails._id}-${index}`}
                            pagination={false}
                            footer={() => {
                              const totalAmount = selectedFeeDetails.amount || 0;
                              const amountPaid = selectedFeeDetails.amountPaid || 0;
                              const balanceAmount = selectedFeeDetails.balanceAmount || 0;
                              const discount = selectedFeeDetails.discount || 0;
                              const netPayable = selectedFeeDetails.netPayable || 0;
                              const excessAmount = selectedFeeDetails.excessAmount || 0;
                              const month = selectedFeeDetails.month || "N/A";
                              return (
                                <div className="text-right">
                                  <div>
                  <strong>Month: {month}</strong> {/* Display month in footer */}
                </div>
                                  <div>
                                    <strong>Total Fees: ₹{totalAmount.toFixed(2)}</strong>
                                  </div>

                                  {discount > 0 && (
                                    <div>
                                      <strong>Discount: ₹{discount.toFixed(2)}</strong>
                                    </div>
                                  )}
                                  
                                  {amountPaid > 0 && (
                                    <div>
                                      <strong>Amount Paid: ₹{amountPaid.toFixed(2)}</strong>
                                    </div>
                                  )}
                                  {balanceAmount > 0 && (
                                    <div>
                                      <strong>Balance Amount: ₹{balanceAmount.toFixed(2)}</strong>
                                    </div>
                                  )}
                                  {excessAmount > 0 && (
                                    <div>
                                      <strong>Late Fee: ₹{excessAmount.toFixed(2)}</strong>
                                    </div>
                                  )}
                                  {selectedFeeDetails.dueDate && (
                                    <div>
                                      <strong>
                                        Due Date:{" "}
                                        {moment(selectedFeeDetails.dueDate).format("MMM DD, YYYY")}
                                      </strong>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <strong>
                                      Status:
                                      <span
                                        className={`badge ${
                                          selectedFeeDetails.status === "paid"
                                            ? "bg-success"
                                            : selectedFeeDetails.status === "partially_paid"
                                            ? "bg-info"
                                            : selectedFeeDetails.status === "pending"
                                            ? "bg-warning"
                                            : selectedFeeDetails.status
                                            ? "bg-danger"
                                            : "bg-secondary"
                                        }`}
                                        aria-label={`Status: ${selectedFeeDetails.status || "Not Generated"}`}
                                      >
                                        {selectedFeeDetails.status
                                          ? selectedFeeDetails.status
                                              .replace("_", " ")
                                              .split(" ")
                                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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
                              <h5 style={{ marginBottom: "16px", color: "#333", fontSize: "18px" }}>
                                Payment Details
                              </h5>
                              {renderPaymentDetails(selectedFeeDetails.paymentDetails)}
                            </Col>
                          )}
                      </Row>
                    )}
                  </Modal>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="alert alert-info mx-3">
                    {selectedSession
                      ? "No fee data available for the selected session."
                      : "Please select a session to view fee data."}
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

export default StudentFeeData;