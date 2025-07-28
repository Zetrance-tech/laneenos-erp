import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Spin,
  Select,
  Table,
  Button,
  Form,
  Modal,
  Row,
  Col,
  Input,
  Descriptions,
} from "antd";
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
  fatherName?: string;
  motherName?: string;
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
    fatherName?: string;
    motherName?: string;
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
  periodicity?: string;
  quarterlyGroupId?: string;
  quarterMonths?: string[];
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

// Month mapping for converting abbreviated to full month names
const monthMap: { [key: string]: string } = {
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
  Jan: "January",
  Feb: "February",
  Mar: "March",
};

const StudentFeeData: React.FC = () => {
  const routes = all_routes;
  const { token } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [monthlyFees, setMonthlyFees] = useState<FeeTableRow[]>([]);
  const [filteredFees, setFilteredFees] = useState<FeeTableRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState<boolean>(false);
  const [selectedFeeDetails, setSelectedFeeDetails] = useState<GeneratedFee | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [quarterlyStudentIds, setQuarterlyStudentIds] = useState<Set<string>>(new Set());
  const [selectedMonth, setSelectedMonth] = useState("");
  const [allFees, setAllFees] = useState<FeeTableRow[]>([]);

  const quarters = [
    {
      value: "Q1",
      label: "Quarter 1 (April, May, June)",
      months: ["April", "May", "June"],
    },
    {
      value: "Q2",
      label: "Quarter 2 (July, August, September)",
      months: ["July", "August", "September"],
    },
    {
      value: "Q3",
      label: "Quarter 3 (October, November, December)",
      months: ["October", "November", "December"],
    },
    {
      value: "Q4",
      label: "Quarter 4 (January, February, March)",
      months: ["January", "February", "March"],
    },
  ];

  const months = [
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    "January",
    "February",
    "March",
  ];

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch sessions
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

  // Fetch classes for the selected session
  const fetchClasses = async () => {
    if (!selectedSession) return;
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

  // Fetch students for the selected session
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
            const classResponse = await axios.get(
              `${API_URL}/api/class/${student.classId}`,
              config
            );
            return {
              ...student,
              className: classResponse.data.name || "Unknown",
            };
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
      const newQuarterlyStudentIds = new Set<string>();

      for (const student of students) {
        const fees = await fetchFeesForStudent(student._id);

        // Check if student has quarterly fees
        const hasQuarterlyFees = fees.some(
          (fee) => fee.periodicity === "Quarterly" && fee.quarterlyGroupId
        );

        if (hasQuarterlyFees) {
          newQuarterlyStudentIds.add(student._id);
        }

        // Group quarterly fees by quarterlyGroupId
        if (hasQuarterlyFees) {
          const quarterlyGroups = new Map();
          fees.forEach((fee) => {
            if (fee.quarterlyGroupId) {
              if (!quarterlyGroups.has(fee.quarterlyGroupId)) {
                quarterlyGroups.set(fee.quarterlyGroupId, []);
              }
              quarterlyGroups.get(fee.quarterlyGroupId)!.push(fee);
            }
          });

          // Create rows for each quarterly group
          quarterlyGroups.forEach((groupFees, quarterlyGroupId) => {
            const representativeFee = groupFees[0];
            const quarter = quarters.find((q) =>
              q.months.some((month) => month === monthMap[representativeFee.month!])
            );

            const row: FeeTableRow = {
              key: `${student._id}-${quarterlyGroupId}`,
              student: {
                _id: student._id,
                name: student.name,
                admissionNumber: student.admissionNumber,
              },
              className: student.className || "Unknown",
              month: quarter?.value || monthMap[representativeFee.month!] || "N/A",
              totalAmount: groupFees.reduce((sum: any, fee: any) => sum + (fee.amount || 0), 0),
              totalNetPayable: groupFees.reduce(
                (sum: any, fee: any) => sum + (fee.netPayable || fee.amount - (fee.discount || 0)),
                0
              ),
              amountPaid: groupFees.reduce(
                (sum: any, fee: any) => sum + (fee.amountPaid || 0),
                0
              ),
              balanceAmount: groupFees.reduce(
                (sum: any, fee: any) => sum + (fee.balanceAmount || 0),
                0
              ),
              dueDate: representativeFee.dueDate,
              status: representativeFee.status || "pending",
              feeDetails: groupFees,
            };
            allFees.push(row);
          });
        } else {
          // Handle monthly fees
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
                month: monthMap[fee.month] || fee.month,
                totalAmount: fee.amount || 0,
                totalNetPayable: fee.netPayable || fee.amount - (fee.discount || 0),
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
      }

      setQuarterlyStudentIds(newQuarterlyStudentIds);
      setAllFees(allFees);
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

    // Apply month/quarter filter first
    let feesToFilter = allFees;
    if (selectedMonth) {
      feesToFilter = allFees.filter((fee) => {
        const isQuarterlyStudent = quarterlyStudentIds.has(fee.student._id!);

        if (isQuarterlyStudent) {
          return fee.month === selectedMonth;
        } else {
          return fee.month === selectedMonth;
        }
      });
    }

    if (!value) {
      setFilteredFees(feesToFilter);
      return;
    }

    const lowerValue = value.toLowerCase();
    const filtered = feesToFilter.filter(
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
    handleSearch(searchQuery);
  }, [selectedMonth, allFees, searchQuery]);

  useEffect(() => {
    if (selectedSession) {
      fetchClasses();
      fetchStudentsForSession();
    } else {
      setClasses([]);
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
          {student?.name || "N/A"}
          <br />
          <small>({student?.admissionNumber || "N/A"})</small>
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
      title: "Month/Quarter",
      dataIndex: "month",
      render: (month: string, record: FeeTableRow) => {
        const isQuarterlyStudent = quarterlyStudentIds.has(record.student._id!);

        if (isQuarterlyStudent) {
          const quarter = quarters.find((q) => q.value === month);
          return (
            <span style={{ color: "#1890ff", fontWeight: "bold" }}>
              📅 {quarter ? quarter.label : month || "N/A"}
            </span>
          );
        }

        return <span>📆 {month || "N/A"}</span>;
      },
      sorter: (a: FeeTableRow, b: FeeTableRow) => a.month.localeCompare(b.month),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      render: (duedate: string) => (
        <span>{duedate ? dayjs(duedate).format("DD MMM YYYY") : "N/A"}</span>
      ),
      sorter: (a: FeeTableRow, b: FeeTableRow) => a.month.localeCompare(b.month),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status?: string) => (
        <span>
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
          onClick={() => handleViewDetails(record)}
          disabled={!record.feeDetails || record.feeDetails.length === 0}
          size="small"
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
        relevantFields.push({ label: "Internal Notes", value: detail.internalNotes });

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
            {/* <TooltipOption /> */}
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
                  <p className="alert alert-danger mx-3" role="alert">
                    {error}
                  </p>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      setError(null);
                      if (selectedSession) {
                        fetchClasses();
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
                  <h5>
                    Fee Data for{" "}
                    {selectedSession
                      ? sessions.find((s) => s._id === selectedSession)?.name
                      : "Session"}
                  </h5>
                  <Table
                    dataSource={filteredFees}
                    columns={summaryColumns}
                    rowKey="key"
                    pagination={{ pageSize: 10, showSizeChanger: false }}
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
                        <Descriptions
                          bordered
                          size="small"
                          column={2}
                          style={{ marginBottom: "20px" }}
                          labelStyle={{ fontWeight: 500, width: "160px" }}
                          contentStyle={{ textAlign: "left" }}
                        >
                          <Descriptions.Item label="Student Name">
                            {selectedFeeDetails.student.name || "N/A"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Father's Name">
                            {selectedFeeDetails?.student?.fatherName || "N/A"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Admission Number">
                            {selectedFeeDetails.student.admissionNumber || "N/A"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Mother's Name">
                            {selectedFeeDetails?.student?.motherName || "N/A"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Class" span={2}>
                            {classes.find(
                              (c: Class) =>
                                c._id ===
                                students.find(
                                  (s) => s._id === selectedFeeDetails.student._id
                                )?.classId
                            )?.name || "N/A"}
                          </Descriptions.Item>
                        </Descriptions>
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
                                const month = monthMap[selectedFeeDetails.month!] || selectedFeeDetails.month || "N/A";
                                return (
                                  <div className="text-right">
                                    <div>
                                      <strong>Month: {month}</strong>
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
                                          Due Date: {moment(selectedFeeDetails.dueDate).format("MMM DD, YYYY")}
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
                                          aria-label={`Status: ${
                                            selectedFeeDetails.status || "Not Generated"
                                          }`}
                                        >
                                          {selectedFeeDetails.status
                                            ? selectedFeeDetails.status
                                                .replace("_", " ")
                                                .split(" ")
                                                .map(
                                                  (word) => word.charAt(0).toUpperCase() + word.slice(1)
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
                                <h5
                                  style={{
                                    marginBottom: "16px",
                                    color: "#333",
                                    fontSize: "18px",
                                  }}
                                >
                                  Payment Details
                                </h5>
                                {renderPaymentDetails(selectedFeeDetails.paymentDetails)}
                              </Col>
                            )}
                        </Row>
                      </>
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