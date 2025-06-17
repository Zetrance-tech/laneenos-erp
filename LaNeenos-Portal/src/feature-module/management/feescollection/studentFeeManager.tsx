import React, { useState, useEffect } from "react";
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
  discountPercent?: number;
  netPayable?: number;
  isCustom: boolean;
  status: string;
}

interface AdvancedFeeDetail {
  feesGroup: FeesGroup;
  amounts: { [month: string]: number };
  discounts: { [month: string]: number };
  netPayables: { [month: string]: number };
  total: number;
}

interface StudentFee {
  student: {
    _id: string;
    name: string;
    admissionNumber: string;
    session: { _id: string; name: string; sessionId: string };
    class: { _id: string; name: string; id: string };
  };
  fees: FeeDetail[];
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
  const [editFees, setEditFees] = useState<FeeDetail[]>([]);
  const [advancedFees, setAdvancedFees] = useState<AdvancedFeeDetail[]>([]);
  const {token} = useAuth();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const months = [
    "Apr", "May", "Jun", "Jul", "Aug", "Sep",
    "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
  ];

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Session[]>(`${API_URL}/api/session/get`, config);
      setSessions(
        response.data.map((session) => ({
          _id: session._id,
          name: session.name || "Unknown Session",
          sessionId: session.sessionId || "",
          status: session.status || "inactive",
        }))
      );
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
        ? err.response?.data?.message || err.message
        : "Failed to fetch students";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const fetchStudentFees = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await axios.get<StudentFee>(`${API_URL}/api/studentFees/${selectedStudentId}/fees`, config);
    
    // Group fees by fee group ID
    const feeGroupsMap = new Map<string, FeeDetail>();
    response.data.fees.forEach(fee => {
      const existing = feeGroupsMap.get(fee.feesGroup._id);
      if (!existing || fee.isCustom) {
        feeGroupsMap.set(fee.feesGroup._id, fee);
      }
    });
    
    setStudentFees({
      ...response.data,
      fees: Array.from(feeGroupsMap.values())
    });
  } catch (err) {
    const errorMessage = axios.isAxiosError(err)
      ? err.response?.data?.message || err.message
      : "Failed to fetch student fees";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
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
      setSelectedStudentId("");
      setStudentFees(null);
      setError(null);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedClass && selectedSession) {
      fetchStudentsForClass();
    } else {
      setStudents([]);
      setSelectedStudentId("");
      setStudentFees(null);
      setError(null);
    }
  }, [selectedClass, selectedSession]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentFees();
    } else {
      setStudentFees(null);
      setError(null);
    }
  }, [selectedStudentId]);

  const handleSessionChange = (value: string) => {
    setSelectedSession(value);
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
  };

  const handleStudentSelect = (value: string) => {
    setSelectedStudentId(value);
  };

  const handleEditFees = () => {
    if (studentFees) {
      setEditFees(studentFees.fees.map(fee => ({
        ...fee,
        discountPercent: fee.discountPercent || 0,
        netPayable: fee.netPayable || fee.amount
      })));
      setShowEditModal(true);
    }
  };

  const handleAdvancedFees = () => {
    if (studentFees) {
      const advancedData = studentFees.fees.map(fee => {
        const amounts: { [month: string]: number } = {};
        const discounts: { [month: string]: number } = {};
        const netPayables: { [month: string]: number } = {};
        let total = 0;

        const amount = fee.amount || 0;
        const discountPercent = fee.discountPercent || 0;
        const netPayable = fee.netPayable || amount * (1 - discountPercent / 100);

        if (fee.feesGroup.periodicity === "Yearly" || fee.feesGroup.periodicity === "One Time") {
          amounts["Apr"] = amount;
          discounts["Apr"] = discountPercent;
          netPayables["Apr"] = netPayable;
          total = netPayable;
        } else if (fee.feesGroup.periodicity === "Quarterly") {
          ["Apr", "Jul", "Oct", "Jan"].forEach(month => {
            amounts[month] = amount;
            discounts[month] = discountPercent;
            netPayables[month] = netPayable;
            total += netPayable;
          });
        } else if (fee.feesGroup.periodicity === "Monthly") {
          months.forEach(month => {
            amounts[month] = amount;
            discounts[month] = discountPercent;
            netPayables[month] = netPayable;
            total += netPayable;
          });
        }

        return {
          feesGroup: fee.feesGroup,
          amounts,
          discounts,
          netPayables,
          total
        };
      });
      console.log("Advanced Fees Data:", advancedData);
      setAdvancedFees(advancedData);
      setShowAdvancedModal(true);
    }
  };

  const handleFeeChange = (index: number, field: string, value: number) => {
    const newFees = [...editFees];
    newFees[index] = { ...newFees[index], [field]: value };

    if (field === "amount" || field === "discountPercent") {
      const amount = newFees[index].amount;
      const discountPercent = newFees[index].discountPercent || 0;
      newFees[index].netPayable = amount * (1 - discountPercent / 100);
      newFees[index].isCustom = true;
    }

    setEditFees(newFees);
  };

  const handleAdvancedFeeChange = (feeIndex: number, month: string, field: string, value: number) => {
    const newFees = [...advancedFees];
    newFees[feeIndex] = { ...newFees[feeIndex] };

    if (field === "amount") {
      newFees[feeIndex].amounts[month] = value;
      newFees[feeIndex].netPayables[month] = value * (1 - (newFees[feeIndex].discounts[month] || 0) / 100);
    } else {
      newFees[feeIndex].discounts[month] = value;
      newFees[feeIndex].netPayables[month] = newFees[feeIndex].amounts[month] * (1 - value / 100);
    }

    newFees[feeIndex].total = Object.values(newFees[feeIndex].netPayables).reduce((sum, val) => sum + (val || 0), 0);
    setAdvancedFees(newFees);
  };

  const handleSaveFees = async () => {
  if (!studentFees) return;
  setLoading(true);
  try {
    const payload = {
      fees: editFees.map((fee) => ({
        feesGroup: fee.feesGroup._id,
        amount: fee.netPayable, // Sending netPayable to backend
        isCustom: fee.isCustom,
        applyToAll: true // Add this flag to backend
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
      ? err.response?.data?.message || err.message
      : "Failed to update fees";
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
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
          onClick={() => setSelectedStudentId(record._id)}
        >
          View Fees
        </Button>
      ),
    },
  ];

  const feeColumns = [
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
      dataIndex: "amount",
      render: (amount: number, record: FeeDetail) => (
        <span className={record.isCustom ? "text-blue-600 font-semibold" : ""}>
          ₹{amount.toFixed(2)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => (
        <span
          className={`badge ${
            status === "paid" ? "bg-success" : status === "pending" ? "bg-warning" : "bg-danger"
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
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
      dataIndex: "amount",
      render: (_: number, record: FeeDetail, index: number) => (
        <Input
          type="number"
          value={editFees[index]?.amount || 0}
          onChange={(e) => handleFeeChange(index, "amount", Number(e.target.value))}
          min={0}
          prefix="₹"
          style={{ width: "120px" }}
        />
      ),
    },
    {
      title: "Discount %",
      dataIndex: "discountPercent",
      render: (_: number, record: FeeDetail, index: number) => (
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
      render: (_: number, record: FeeDetail, index: number) => (
        <Input
          type="number"
          value={editFees[index]?.netPayable || 0}
          onChange={(e) => handleFeeChange(index, "netPayable", Number(e.target.value))}
          min={0}
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
    fixed: 'left' as const,
    width: 150,
  },
  ...months.map(month => ({
    title: month,
    render: (_: any, record: AdvancedFeeDetail, index: number) => {
      const showField = 
        record.feesGroup.periodicity === "Yearly" || record.feesGroup.periodicity === "One Time"
          ? month === "Apr"
          : record.feesGroup.periodicity === "Quarterly"
          ? ["Apr", "Jul", "Oct", "Jan"].includes(month)
          : record.feesGroup.periodicity === "Monthly";
      
      return showField ? (
        <div style={record.feesGroup._id === 'total' ? { fontWeight: 'bold', color: 'blue' } : {}}>
          ₹{record.netPayables[month]?.toFixed(2) || "0.00"}
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
      <span style={record.feesGroup._id === 'total' ? { fontWeight: 'bold', color: 'blue' } : {}}>
        ₹{total.toFixed(2)}
      </span>
    ),
    fixed: 'right' as const,
    width: 100,
  },
];

// Add this to calculate monthly totals
const monthTotals = months.reduce((acc, month) => {
  acc[month] = advancedFees.reduce((sum, fee) => {
    const showField = 
      fee.feesGroup.periodicity === "Yearly" || fee.feesGroup.periodicity === "One Time"
        ? month === "Apr"
        : fee.feesGroup.periodicity === "Quarterly"
        ? ["Apr", "Jul", "Oct", "Jan"].includes(month)
        : fee.feesGroup.periodicity === "Monthly";
    return showField ? sum + (fee.netPayables[month] || 0) : sum;
  }, 0);
  return acc;
}, {} as { [month: string]: number });

const advancedFeesWithTotal = [
  ...advancedFees,
  {
    feesGroup: { _id: 'total', name: 'Total', periodicity: 'Monthly' },
    amounts: monthTotals,
    discounts: {},
    netPayables: monthTotals,
    total: Object.values(monthTotals).reduce((sum, val) => sum + val, 0)
  }
];

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
                  value={selectedStudentId}
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
                      <Button type="primary" onClick={handleEditFees} className="me-2">
                        Edit Fees
                      </Button>
                      <Button type="primary" onClick={handleAdvancedFees}>
                        Advanced Fee Structure
                      </Button>
                    </div>
                  </div>
                  <Table
                    dataSource={studentFees.fees}
                    columns={feeColumns}
                    rowKey={(record) => record.feesGroup._id}
                    pagination={false}
                  />
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
                  <p className="alert alert-danger mx-3" role="alert">
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
          <Button
            key="submit"
            type="primary"
            onClick={handleSaveFees}
            loading={loading}
          >
            Save
          </Button>,
        ]}
        zIndex={10000}
        width={900}
        style={{ top: 50 }}
      >
        <Table
          dataSource={editFees}
          columns={editFeeColumns}
          rowKey={(record) => record.feesGroup._id}
          pagination={false}
        />
      </Modal>

      <Modal
  title="Advanced Fee Structure"
  open={showAdvancedModal}
  onCancel={() => setShowAdvancedModal(false)}
  footer={[
    <Button key="cancel" onClick={() => setShowAdvancedModal(false)}>
      Cancel
    </Button>
  ]}
  width={1200}
  zIndex={10000}
  style={{ top: 10 }}
>
  <Table
    dataSource={advancedFeesWithTotal as AdvancedFeeDetail[]}
    columns={advancedFeeColumns}
    rowKey={(record) => record.feesGroup._id}
    pagination={false}
    scroll={{ x: 1500 }}
    rowClassName={(record: AdvancedFeeDetail) => (record.feesGroup._id === 'total' ? 'total-row' : '')}
  />
</Modal>
    </div>
  );
};

export default StudentFeeManager;