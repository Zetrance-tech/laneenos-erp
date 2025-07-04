import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Spin, Select, Table, Modal, Input, Button, Form } from "antd";
import { all_routes } from "../../router/all_routes";
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
  gender: string;
  category: string;
  profileImage?: string;
  classId: string;
}

interface FeesGroup {
  _id: string;
  name: string;
  periodicity: "Monthly" | "Quarterly" | "Yearly" | "One Time";
}

interface FeeDetail {
  feesGroup: FeesGroup;
  amount: number;
  originalAmount: number;
  discount: number;
  isCustom: boolean;
  status: string;
  month?: string;
  discountPercent?: number;
  netPayable?: number;
}

interface MonthlyFee {
  month: string;
  fees: FeeDetail[];
  amount: number;
  originalAmount: number;
  discount: number;
  isCustom: boolean;
  status: string;
}

interface StudentFee {
  student: {
    _id: string;
    name: string;
    admissionNumber: string;
    session: { _id: string; name: string; sessionId: string };
    class: { _id: string; name: string; id: string };
  };
  fees: MonthlyFee[];
}

interface AdvancedFeeDetail {
  feesGroup: FeesGroup;
  amounts: { [month: string]: number };
  discounts: { [month: string]: number };
  netPayables: { [month: string]: number };
  total: number;
}

interface EditFeeDetail {
  feesGroup: FeesGroup;
  originalAmount: number;
  discountPercent: number;
  netPayable: number;
  isCustom: boolean;
  month: string;
}

const API_URL = process.env.REACT_APP_URL || "http://localhost:5000";

const StudentFeeManager: React.FC = () => {
  const routes = all_routes;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [studentFees, setStudentFees] = useState<StudentFee | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState<boolean>(false);
  const [editFees, setEditFees] = useState<EditFeeDetail[]>([]);
  const [advancedFees, setAdvancedFees] = useState<AdvancedFeeDetail[]>([]);
  const [selectedEditMonth, setSelectedEditMonth] = useState<string>("");
  const { token } = useAuth();

  const config = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  const months = [
    "Apr", "May", "Jun", "Jul", "Aug", "Sep",
    "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
  ];

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Session[]>(`${API_URL}/api/session/get`, config);
      const fetchedSessions = response.data.map((session) => ({
        _id: session._id,
        name: session.name || "Unknown Session",
        sessionId: session.sessionId || "",
        status: session.status || "inactive",
      }));
      setSessions(fetchedSessions);
      const activeSession = fetchedSessions.find((s) => s.status === "active");
      if (activeSession && !selectedSession) {
        setSelectedSession(activeSession._id);
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.status === 401
          ? "Unauthorized access. Please check your credentials."
          : err.response?.data?.message || "Failed to fetch sessions"
        : "An unexpected error occurred while fetching sessions";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [config, selectedSession]);

  const fetchClassesForSession = useCallback(async () => {
    if (!selectedSession) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Class[]>(`${API_URL}/api/class/session/${selectedSession}`, config);
      setClasses(
        response.data.map((cls) => ({
          _id: cls._id,
          id: cls.id || "",
          name: cls.name || "Unknown Class",
          sessionId: cls.sessionId || "",
        }))
      );
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.status === 404
          ? "No classes found for the selected session."
          : err.response?.data?.message || "Failed to fetch classes"
        : "An unexpected error occurred while fetching classes";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedSession, config]);

  const fetchStudentsForClass = useCallback(async () => {
    if (!selectedClass || !selectedSession) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<{ data: Student[] }>(
        `${API_URL}/api/student/by-class-session/${selectedClass}/${selectedSession}`,
        config
      );
      setStudents(
        response.data.data.map((student) => ({
          _id: student._id,
          admissionNumber: student.admissionNumber || "",
          name: student.name || "Unknown Student",
          gender: student.gender || "",
          category: student.category || "",
          profileImage: student.profileImage || "",
          classId: student.classId || "",
        }))
      );
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.status === 404
          ? "No students found for the selected class and session."
          : err.response?.data?.message || "Failed to fetch students"
        : "An unexpected error occurred while fetching students";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSession, config]);

  const fetchStudentFees = useCallback(async () => {
    if (!selectedStudentId) {
      console.log("No student ID selected, skipping fetchStudentFees");
      return;
    }
    setLoading(true);
    setError(null);
    console.log("Fetching student fees for ID:", selectedStudentId);
    console.log("Request URL:", `${API_URL}/api/studentFees/${selectedStudentId}/fees`);
    console.log("Request config:", config);

    try {
      const response = await axios.get<StudentFee>(
        `${API_URL}/api/studentFees/${selectedStudentId}/fees`,
        { ...config, timeout: 5000 }
      );
      console.log("Response received:", response.data);

      if (!response.data || !Array.isArray(response.data.fees)) {
        throw new Error("Invalid response format: fees array is missing or not an array");
      }

      // Map fees to include month and ensure valid status
      const updatedFees = response.data.fees.map((monthlyFee) => {
        if (!monthlyFee.month || !Array.isArray(monthlyFee.fees)) {
          console.warn("Invalid monthly fee structure:", monthlyFee);
          return {
            ...monthlyFee,
            fees: [],
            month: monthlyFee.month || "Unknown",
            status: monthlyFee.status || "pending",
          };
        }
        return {
          ...monthlyFee,
          fees: monthlyFee.fees.map((fee) => ({
            ...fee,
            month: monthlyFee.month,
            status: fee.status || "pending",
            originalAmount: fee.originalAmount || fee.amount,
          })),
        };
      });

      if (updatedFees.length === 0 || updatedFees.every((mf) => mf.fees.length === 0)) {
        console.warn("No valid fees found after processing");
        setError("No valid fee details found for the selected student.");
        toast.error("No valid fee details found for the selected student.");
        setStudentFees({ student: response.data.student, fees: [] });
        return;
      }

      setStudentFees({
        student: response.data.student,
        fees: updatedFees,
      });

      // Set default edit month to the first month with fees
      const firstMonthWithFees = updatedFees.find((mf) => mf.fees.length > 0)?.month;
      if (firstMonthWithFees) {
        setSelectedEditMonth(firstMonthWithFees);
      }
    } catch (err) {
      let errorMessage = "An unexpected error occurred while fetching student fees";
      if (axios.isAxiosError(err)) {
        console.error("Axios error:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
        });
        if (err.response?.status === 404) {
          errorMessage = "No fee details found for the selected student.";
        } else if (err.response?.status === 401) {
          errorMessage = "Unauthorized access. Please check your credentials.";
        } else {
          errorMessage = err.response?.data?.message || err.message || errorMessage;
        }
      } else {
        console.error("Non-Axios error:", err);
        errorMessage = (err as Error).message || errorMessage;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log("Finished fetching student fees");
    }
  }, [selectedStudentId, config]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (selectedSession) {
      fetchClassesForSession();
    } else {
      setClasses([]);
      setSelectedClass("");
      setStudents([]);
      setSelectedStudentId("");
      setStudentFees(null);
    }
  }, [selectedSession, fetchClassesForSession]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsForClass();
    } else {
      setStudents([]);
      setSelectedStudentId("");
      setStudentFees(null);
    }
  }, [selectedClass, fetchStudentsForClass]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentFees();
    } else {
      setStudentFees(null);
      setSelectedEditMonth("");
    }
  }, [selectedStudentId, fetchStudentFees]);

  const handleSessionChange = (value: string) => {
    setSelectedSession(value);
    setSelectedClass("");
    setStudents([]);
    setSelectedStudentId("");
    setStudentFees(null);
    setSelectedEditMonth("");
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setStudents([]);
    setSelectedStudentId("");
    setStudentFees(null);
    setSelectedEditMonth("");
  };

  const handleStudentSelect = (value: string) => {
    setSelectedStudentId(value);
    setStudentFees(null);
    setSelectedEditMonth("");
  };

  const handleEditFees = () => {
    if (studentFees && selectedEditMonth) {
      const selectedMonthFees = studentFees.fees.find((mf) => mf.month === selectedEditMonth)?.fees || [];
      const editFeesData = selectedMonthFees.map((fee) => ({
        feesGroup: fee.feesGroup,
        originalAmount: fee.originalAmount,
        discountPercent: (fee.discount / fee.originalAmount) * 100 || 0,
        netPayable: fee.originalAmount - fee.discount,
        isCustom: fee.isCustom,
        month: fee.month || selectedEditMonth,
      }));
      setEditFees(editFeesData);
      setShowEditModal(true);
    }
  };

  const handleAdvancedFees = () => {
    if (studentFees) {
      const feeGroupsMap = new Map<string, AdvancedFeeDetail>();

      studentFees.fees.forEach((monthlyFee) => {
        const month = monthlyFee.month;
        if (!month || !Array.isArray(monthlyFee.fees)) return;

        monthlyFee.fees.forEach((fee) => {
          if (!fee.feesGroup?._id) return;

          const amount = fee.originalAmount || 0;
          const discount = fee.discount || 0;
          const netPayable = amount - discount;

          const existing = feeGroupsMap.get(fee.feesGroup._id);
          if (existing) {
            existing.amounts[month] = amount;
            existing.discounts[month] = discount;
            existing.netPayables[month] = netPayable;
            existing.total += netPayable;
          } else {
            const newEntry: AdvancedFeeDetail = {
              feesGroup: fee.feesGroup,
              amounts: { [month]: amount },
              discounts: { [month]: discount },
              netPayables: { [month]: netPayable },
              total: netPayable,
            };
            feeGroupsMap.set(fee.feesGroup._id, newEntry);
          }
        });
      });

      const advancedData = Array.from(feeGroupsMap.values());

      advancedData.forEach((feeDetail) => {
        months.forEach((month) => {
          if (!(month in feeDetail.amounts)) {
            feeDetail.amounts[month] = 0;
            feeDetail.discounts[month] = 0;
            feeDetail.netPayables[month] = 0;
          }
        });
      });

      setAdvancedFees(advancedData);
      setShowAdvancedModal(true);
    }
  };

  const handleFeeChange = (index: number, field: string, value: number) => {
    const newFees = [...editFees];
    newFees[index] = { ...newFees[index], [field]: value };

    if (field === "originalAmount" || field === "discountPercent") {
      const originalAmount = newFees[index].originalAmount;
      const discountPercent = newFees[index].discountPercent || 0;
      newFees[index].netPayable = originalAmount * (1 - discountPercent / 100);
      newFees[index].isCustom = true;
    }

    setEditFees(newFees);
  };

  const handleSaveFees = async () => {
    if (!studentFees || !selectedEditMonth) return;
    setLoading(true);
    try {
      const payload = {
        fees: editFees.map((fee) => ({
          feesGroup: fee.feesGroup._id,
          amount: fee.netPayable,
          originalAmount: fee.originalAmount,
          discount: fee.originalAmount * (fee.discountPercent / 100),
          isCustom: fee.isCustom,
          month: selectedEditMonth,
        })),
      };
      await axios.put(
        `${API_URL}/api/studentFees/${studentFees.student._id}/fees`,
        payload,
        config
      );
      toast.success("Fees updated successfully");
      setShowEditModal(false);
      fetchStudentFees();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Failed to update fees"
        : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (value: string) => {
    setSelectedEditMonth(value);
    if (studentFees) {
      const selectedMonthFees = studentFees.fees.find((mf) => mf.month === value)?.fees || [];
      const editFeesData = selectedMonthFees.map((fee) => ({
        feesGroup: fee.feesGroup,
        originalAmount: fee.originalAmount,
        discountPercent: (fee.discount / fee.originalAmount) * 100 || 0,
        netPayable: fee.originalAmount - fee.discount,
        isCustom: fee.isCustom,
        month: fee.month || value,
      }));
      setEditFees(editFeesData);
    }
  };

  const studentColumns = [
    {
      title: "Admission Number",
      dataIndex: "admissionNumber",
      render: (admissionNumber: string) => <span>{admissionNumber || "N/A"}</span>,
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (name: string) => <span>{name || "N/A"}</span>,
    },
    {
      title: "Gender",
      dataIndex: "gender",
      render: (gender: string) => <span>{gender || "N/A"}</span>,
    },
    {
      title: "Actions",
      render: (_: any, record: Student) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleStudentSelect(record._id)}
        >
          View Fees
        </Button>
      ),
    },
  ];

  // Filter fees to show only April
  const aprilFees = studentFees
    ? studentFees.fees
        .filter((monthlyFee) => monthlyFee.month === "Apr")
        .flatMap((monthlyFee) => monthlyFee.fees)
    : [];

  const feeColumns = [
    // {
    //   title: "Month",
    //   dataIndex: "month",
    //   render: (month: string) => <span>{month || "N/A"}</span>,
    // },
    {
      title: "Fee Group",
      dataIndex: "feesGroup",
      render: (feesGroup: FeesGroup) => <span>{feesGroup.name || "N/A"}</span>,
    },
    {
      title: "Periodicity",
      dataIndex: "feesGroup",
      render: (feesGroup: FeesGroup) => <span>{feesGroup.periodicity || "N/A"}</span>,
    },
    {
      title: "Amount",
      dataIndex: "originalAmount",
      render: (originalAmount: number, record: FeeDetail) => (
        <span className={record.isCustom ? "text-blue-600 font-semibold" : ""}>
          ₹{originalAmount.toFixed(2)}
        </span>
      ),
    },
  ];

  const editFeeColumns = [
    {
      title: "Fee Group",
      dataIndex: "feesGroup",
      render: (feesGroup: FeesGroup) => <span>{feesGroup.name || "N/A"}</span>,
    },
    {
      title: "Periodicity",
      dataIndex: "feesGroup",
      render: (feesGroup: FeesGroup) => <span>{feesGroup.periodicity || "N/A"}</span>,
    },
    {
      title: "Original Amount",
      dataIndex: "originalAmount",
      render: (_: number, record: EditFeeDetail, index: number) => (
        <Input
          type="number"
          value={editFees[index]?.originalAmount || 0}
          onChange={(e) => handleFeeChange(index, "originalAmount", Number(e.target.value))}
          min={0}
          prefix="₹"
          style={{ width: "120px" }}
        />
      ),
    },
    {
      title: "Discount %",
      dataIndex: "discountPercent",
      render: (_: number, record: EditFeeDetail, index: number) => (
        <Input
          type="number"
          value={editFees[index]?.discountPercent || 0}
          onChange={(e) => handleFeeChange(index, "discountPercent", Number(e.target.value))}
          min={0}
          max={100}
          suffix="%"
          style={{ width: "100px" }}
        />
      ),
    },
    {
      title: "Net Payable",
      dataIndex: "netPayable",
      render: (_: number, record: EditFeeDetail, index: number) => (
        <Input
          type="number"
          value={editFees[index]?.netPayable || 0}
          disabled
          prefix="₹"
          style={{ width: "120px" }}
        />
      ),
    },
  ];

  const advancedFeeColumns = [
    {
      title: "Fee Group",
      dataIndex: "feesGroup",
      render: (feesGroup: FeesGroup, record: AdvancedFeeDetail) => (
        <div>
          <span>{feesGroup.name || "N/A"}</span>
          <br />
          <span style={{ fontSize: "12px", color: "#888" }}>{feesGroup.periodicity || "N/A"}</span>
        </div>
      ),
      fixed: "left" as const,
      width: 150,
    },
    ...months.map((month) => ({
      title: month,
      render: (_: any, record: AdvancedFeeDetail) => {
        const hasData = record.amounts[month] !== undefined && record.amounts[month] > 0;
        const showField =
          hasData ||
          (record.feesGroup.periodicity === "Yearly" || record.feesGroup.periodicity === "One Time"
            ? month === "Apr"
            : record.feesGroup.periodicity === "Quarterly"
            ? ["Apr", "Jul", "Oct", "Jan"].includes(month)
            : record.feesGroup.periodicity === "Monthly");
        return showField ? (
          <div style={record.feesGroup._id === "total" ? { fontWeight: "bold", color: "blue" } : {}}>
            <div>₹{(record.amounts[month] || 0).toFixed(2)}</div>
            {/* <div>Disc: ₹{(record.discounts[month] || 0).toFixed(2)}</div> */}
            {/* <div>Net: ₹{(record.netPayables[month] || 0).toFixed(2)}</div> */}
          </div>
        ) : (
          <div>-</div>
        );
      },
      width: 100,
    })),
    {
      title: "Total",
      dataIndex: "total",
      render: (total: number, record: AdvancedFeeDetail) => (
        <span style={record.feesGroup._id === "total" ? { fontWeight: "bold", color: "blue" } : {}}>
          ₹{total.toFixed(2)}
        </span>
      ),
      fixed: "right" as const,
      width: 100,
    },
  ];

  const monthTotals = months.reduce((acc, month) => {
    acc[month] = advancedFees.reduce((sum, fee) => {
      const hasData = fee.amounts[month] !== undefined && fee.amounts[month] > 0;
      const showField =
        hasData ||
        (fee.feesGroup.periodicity === "Yearly" || fee.feesGroup.periodicity === "One Time"
          ? month === "Apr"
          : fee.feesGroup.periodicity === "Quarterly"
          ? ["Apr", "Jul", "Oct", "Jan"].includes(month)
          : fee.feesGroup.periodicity === "Monthly");
      return showField ? sum + (fee.netPayables[month] || 0) : sum;
    }, 0);
    return acc;
  }, {} as { [month: string]: number });

  const advancedFeesWithTotal: AdvancedFeeDetail[] = [
    ...advancedFees,
    {
      feesGroup: {
        _id: "total",
        name: "Total",
        periodicity: "Monthly" as "Monthly",
      },
      amounts: monthTotals,
      discounts: {},
      netPayables: monthTotals,
      total: Object.values(monthTotals).reduce((sum, val) => sum + val, 0),
    },
  ];

  // Get available months for edit modal
  const availableMonths = studentFees
    ? studentFees.fees
        .filter((mf) => mf.fees.length > 0)
        .map((mf) => mf.month)
    : [];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Student Fee Details</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="#">Fees Collection</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Student Fee Details
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <TooltipOption />
          </div>
        </div>
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Student Fees</h4>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <Form.Item label="Session">
                <Select
                  placeholder="Select a session"
                  value={selectedSession || undefined}
                  onChange={handleSessionChange}
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
                  onChange={handleClassChange}
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
                  showSearch
                  placeholder="Search student"
                  value={selectedStudentId || undefined}
                  onChange={handleStudentSelect}
                  style={{ width: 200 }}
                  options={students.map((student) => ({
                    value: student._id,
                    label: `${student.name} (${student.admissionNumber})`,
                  }))}
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  disabled={!selectedClass || loading}
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
                  <div>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => {
                        setError(null);
                        if (selectedStudentId) fetchStudentFees();
                        else if (selectedClass && selectedSession) fetchStudentsForClass();
                        else if (selectedSession) fetchClassesForSession();
                        else fetchSessions();
                      }}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : selectedStudentId && studentFees ? (
                <div className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>
                      Fee Details for {studentFees.student.name} (
                      {studentFees.student.admissionNumber})
                    </h5>
                    <div>
                      <Button type="primary" onClick={handleEditFees} className="me-2" disabled={!selectedEditMonth}>
                        Edit Fees
                      </Button>
                      <Button type="primary" onClick={handleAdvancedFees}>
                        Advanced Fee Structure
                      </Button>
                    </div>
                  </div>
                  {aprilFees.length > 0 ? (
                    <Table
                      dataSource={aprilFees}
                      columns={feeColumns}
                      rowKey={(record) => `${record.feesGroup?._id}-${record.month}` || Math.random().toString()}
                      pagination={false}
                    />
                  ) : (
                    <div className="text-center py-4">
                      <p className="alert alert-info mx-3" role="alert">
                        No fee details found for April.
                      </p>
                    </div>
                  )}
                </div>
              ) : students.length > 0 ? (
                <Table
                  dataSource={students}
                  columns={studentColumns}
                  rowKey="_id"
                  pagination={{ pageSize: 10 }}
                />
              ) : (
                <div className="text-center py-4">
                  <p className="alert alert-info mx-3" role="alert">
                    {selectedClass
                      ? "No students found for this class"
                      : "Please select a session and class"}
                  </p>
                </div>
              )}
            </Spin>
          </div>
        </div>
      </div>

      <Modal
        title="Edit Student Fees"
        open={showEditModal}
        onCancel={() => setShowEditModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSaveFees} loading={loading}>
            Save
          </Button>,
        ]}
        zIndex={10000}
        width={900}
        style={{ top: 50 }}
      >
        {/* <Form.Item label="Select Month">
          <Select
            value={selectedEditMonth || undefined}
            onChange={handleMonthChange}
            style={{ width: 200 }}
            options={availableMonths.map((month) => ({
              value: month,
              label: month,
            }))}
            disabled={loading}
          />
        </Form.Item> */}
        <Table
          dataSource={editFees}
          columns={editFeeColumns}
          rowKey={(record) => `${record.feesGroup?._id}-${record.month}` || Math.random().toString()}
          pagination={false}
        />
      </Modal>

      <Modal
        title="Advanced Fee Structure"
        open={showAdvancedModal}
        onCancel={() => setShowAdvancedModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowAdvancedModal(false)}>
            Close
          </Button>,
        ]}
        width={1200}
        zIndex={10000}
        style={{ top: 10 }}
      >
        <Table
          dataSource={advancedFeesWithTotal}
          columns={advancedFeeColumns}
          rowKey={(record) => record.feesGroup._id || Math.random().toString()}
          pagination={false}
          scroll={{ x: 1500 }}
          rowClassName={(record: AdvancedFeeDetail) =>
            record.feesGroup._id === "total" ? "total-row" : ""
          }
        />
      </Modal>
    </div>
  );
};

export default StudentFeeManager;