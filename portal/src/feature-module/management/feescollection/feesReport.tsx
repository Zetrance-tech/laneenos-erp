import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import { Modal, Spin, Select, message, Table, Button } from "antd";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import moment from "moment";

const { Option } = Select;
const API_URL = process.env.REACT_APP_URL;

interface Session {
  _id: string;
  name: string;
  sessionId: string;
}

interface Class {
  _id: string;
  name: string;
}

interface FeeStatus {
  month: string;
  status: string;
  amount: number;
  amountPaid: number;
  balanceAmount: number;
  netPayable: number;
}

interface StudentFeeReport {
  id: string;
  admissionNo: string;
  name: string;
  fees: { [key: string]: FeeStatus | null };
  isQuarterly: boolean;
}

const FeeReport = () => {
  const routes = all_routes;
  const { token } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(moment().format("YYYY"));
  const [studentFeeReport, setStudentFeeReport] = useState<StudentFeeReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quarterlyStudentIds, setQuarterlyStudentIds] = useState<Set<string>>(new Set());

  const quarters = [
    { value: "Q1", label: "Quarter 1", months: ["Apr", "May", "Jun"] },
    { value: "Q2", label: "Quarter 2", months: ["Jul", "Aug", "Sep"] },
    { value: "Q3", label: "Quarter 3", months: ["Oct", "Nov", "Dec"] },
    { value: "Q4", label: "Quarter 4", months: ["Jan", "Feb", "Mar"] },
  ];

  const months = [
    "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
  ];

  const monthFullNames: { [key: string]: string } = {
    "Apr": "April",
    "May": "May", 
    "Jun": "June",
    "Jul": "July",
    "Aug": "August",
    "Sep": "September",
    "Oct": "October",
    "Nov": "November",
    "Dec": "December",
    "Jan": "January",
    "Feb": "February",
    "Mar": "March"
  };

  const quarterDisplayNames: { [key: string]: string } = {
    "Q1": "Quarter 1 (April, May, June)",
    "Q2": "Quarter 2 (July, August, September)", 
    "Q3": "Quarter 3 (October, November, December)",
    "Q4": "Quarter 4 (January, February, March)"
  };

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/session/get`, config);
      setSessions(response.data || []);
      if (response.data && response.data.length > 0 && !selectedSession) {
        setSelectedSession(response.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      message.error("Failed to fetch sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllClasses = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/class`, config);
      setClasses(response.data || []);
    } catch (error) {
      console.error("Error fetching all classes:", error);
      message.error("Failed to fetch classes");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/class/session/${sessionId}`, config);
      setClasses(response.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      message.error("Failed to fetch classes");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeeReport = async (classId: string, sessionId: string) => {
    try {
      setIsLoading(true);
      
      const studentsResponse = await axios.get(
        `${API_URL}/api/studentFees/students-by-class-session/${classId}/${sessionId}`, 
        config
      );
      const students = studentsResponse.data?.data || [];

      if (!students.length) {
        setStudentFeeReport([]);
        message.info("No students found for this class and session");
        return;
      }

      const studentsMap: { [key: string]: StudentFeeReport } = {};
      const newQuarterlyStudentIds = new Set<string>();

      students.forEach((student: any) => {
        studentsMap[student._id] = {
          id: student._id,
          admissionNo: student.admissionNumber || "N/A",
          name: student.name || "Unknown",
          fees: {},
          isQuarterly: student.hasQuarterlyFees || false,
        };

        if (student.hasQuarterlyFees) {
          newQuarterlyStudentIds.add(student._id);
        }
      });

      setQuarterlyStudentIds(newQuarterlyStudentIds);

      const feePromises = students.map(async (student: any) => {
        try {
          const feesResponse = await axios.get(
            `${API_URL}/api/studentFees/${student._id}/fees-by-session/${sessionId}`,
            config
          );
          return { studentId: student._id, fees: feesResponse.data || [] };
        } catch (error) {
          console.error(`Error fetching fees for student ${student._id}:`, error);
          return { studentId: student._id, fees: [] };
        }
      });

      const allStudentFees = await Promise.all(feePromises);

      allStudentFees.forEach(({ studentId, fees }) => {
        const student = studentsMap[studentId];
        if (!student) return;

        const isQuarterly = newQuarterlyStudentIds.has(studentId);

        if (isQuarterly) {
          const quarterlyGroups = new Map();
          fees.forEach((fee: any) => {
            if (fee.quarterlyGroupId) {
              if (!quarterlyGroups.has(fee.quarterlyGroupId)) {
                quarterlyGroups.set(fee.quarterlyGroupId, []);
              }
              quarterlyGroups.get(fee.quarterlyGroupId).push(fee);
            }
          });

          quarterlyGroups.forEach((groupFees: any[]) => {
            const representativeFee = groupFees[0];
            const quarter = quarters.find(q =>
              q.months.some(month => month === representativeFee.month)
            );

            if (quarter) {
              const totalAmount = groupFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
              const totalAmountPaid = groupFees.reduce((sum, fee) => sum + (fee.amountPaid || 0), 0);
              const totalBalance = groupFees.reduce((sum, fee) => sum + (fee.balanceAmount || 0), 0);
              const totalNetPayable = groupFees.reduce((sum, fee) => sum + (fee.netPayable || fee.amount - (fee.discount || 0)), 0);

              student.fees[quarter.value] = {
                month: quarter.value,
                status: representativeFee.status || "pending",
                amount: totalAmount,
                amountPaid: totalAmountPaid,
                balanceAmount: totalBalance,
                netPayable: totalNetPayable,
              };
            }
          });
        } else {
          fees.forEach((fee: any) => {
            if (fee.month && months.includes(fee.month)) {
              student.fees[fee.month] = {
                month: fee.month,
                status: fee.status || "pending",
                amount: fee.amount || 0,
                amountPaid: fee.amountPaid || 0,
                balanceAmount: fee.balanceAmount || 0,
                netPayable: fee.netPayable || fee.amount - (fee.discount || 0),
              };
            }
          });
        }
      });

      setStudentFeeReport(Object.values(studentsMap));
    } catch (error) {
      console.error("Error fetching fee report:", error);
      message.error("Failed to fetch fee report data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchAllClasses();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchClasses(selectedSession);
    } else {
      fetchAllClasses();
    }
  }, [selectedSession]);

  const showFeeModal = (classData: Class) => {
    setSelectedClass(classData);
    setSelectedYear(moment().format("YYYY"));
    setStudentFeeReport([]);
    setIsModalVisible(true);
    
    if (selectedSession) {
      fetchFeeReport(classData._id, selectedSession);
    } else if (sessions.length > 0) {
      const defaultSession = sessions[0]._id;
      setSelectedSession(defaultSession);
      fetchFeeReport(classData._id, defaultSession);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedClass(null);
    setSelectedYear(null);
    setStudentFeeReport([]);
    setQuarterlyStudentIds(new Set());
  };

  const getStatusBadge = (feeStatus: FeeStatus | null) => {
    if (!feeStatus) {
      return <span className="badge badge-soft-secondary">Not Generated</span>;
    }

    const { status, amount, amountPaid } = feeStatus;
    const displayText = `${status === "paid" ? "Paid" : 
                         status === "partially_paid" ? "Partial" : 
                         status === "pending" ? "Pending" : "Not Generated"}`;
    
    const amountText = `(₹${amountPaid}/${amount})`;

    let badgeClass = "badge badge-soft-secondary";
    if (status === "paid") {
      badgeClass = "badge badge-soft-success";
    } else if (status === "partially_paid") {
      badgeClass = "badge badge-soft-warning";
    } else if (status === "pending") {
      badgeClass = "badge badge-soft-danger";
    }

    return (
      <span className={badgeClass} style={{ fontSize: "10px" }}>
        {displayText}<br/>{amountText}
      </span>
    );
  };

  const exportToCSV = (data: StudentFeeReport[], filename: string) => {
    const quarterlyStudents = data.filter(student => student.isQuarterly);
    const monthlyStudents = data.filter(student => !student.isQuarterly);
    
    const escapeCSVField = (field: any) => {
      if (field === null || field === undefined) return "";
      let str = String(field).trim();
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvLines: string[] = [];

    if (quarterlyStudents.length > 0) {
      csvLines.push("QUARTERLY FEE STUDENTS");
      csvLines.push("");
      
      const quarterHeaders = [
        "Admission Number",
        "Name",
        "Quarter 1 (April-June)",
        "Quarter 2 (July-September)", 
        "Quarter 3 (October-December)",
        "Quarter 4 (January-March)"
      ];
      csvLines.push(quarterHeaders.join(","));

      quarterlyStudents.forEach(student => {
        const row = [
          escapeCSVField(student.admissionNo),
          escapeCSVField(student.name),
          ...quarters.map(quarter => {
            const feeStatus = student.fees[quarter.value];
            if (!feeStatus) return escapeCSVField("Not Generated");
            return escapeCSVField(`${feeStatus.status} (Rs.${feeStatus.amountPaid}/Rs.${feeStatus.amount})`);
          })
        ];
        csvLines.push(row.join(","));
      });

      if (monthlyStudents.length > 0) {
        csvLines.push("");
        csvLines.push("");
      }
    }

    if (monthlyStudents.length > 0) {
      csvLines.push("MONTHLY FEE STUDENTS");
      csvLines.push("");
      
      const monthHeaders = [
        "Admission Number",
        "Name",
        ...months.map(month => monthFullNames[month])
      ];
      csvLines.push(monthHeaders.join(","));

      monthlyStudents.forEach(student => {
        const row = [
          escapeCSVField(student.admissionNo),
          escapeCSVField(student.name),
          ...months.map(month => {
            const feeStatus = student.fees[month];
            if (!feeStatus) return escapeCSVField("Not Generated");
            return escapeCSVField(`${feeStatus.status} (Rs.${feeStatus.amountPaid}/Rs.${feeStatus.amount})`);
          })
        ];
        csvLines.push(row.join(","));
      });
    }

    const csvContent = csvLines.join("\n");

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { 
      type: "text/csv;charset=utf-8;" 
    });
    
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success("Fee report exported to CSV successfully");
  };

  const handleExport = () => {
    if (!selectedClass || !selectedSession) return;
    const sessionName = sessions.find(s => s._id === selectedSession)?.name || "Unknown";
    const filename = `fee_report_${selectedClass.name}_${sessionName}_${selectedYear}.csv`;
    exportToCSV(studentFeeReport, filename);
  };

  const getColumns = () => {
    const hasQuarterlyStudents = quarterlyStudentIds.size > 0;
    
    const columns: any[] = [
      {
        title: "Admission Number",
        dataIndex: "admissionNo",
        fixed: 'left',
        width: 120,
      },
      {
        title: "Name",
        dataIndex: "name",
        fixed: 'left',
        width: 150,
      },
    ];

    if (hasQuarterlyStudents) {
      quarters.forEach(quarter => {
        columns.push({
          title: (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>
                {quarter.label}
              </div>
              <div style={{ fontSize: '10px' }}>
                ({quarter.months.map(m => monthFullNames[m]).join(", ")})
              </div>
            </div>
          ),
          dataIndex: "fees",
          key: quarter.value,
          width: 110,
          render: (fees: { [key: string]: FeeStatus | null }, record: StudentFeeReport) => {
            if (record.isQuarterly) {
              return getStatusBadge(fees[quarter.value]);
            }
            return <span className="badge badge-soft-secondary">N/A</span>;
          },
        });
      });
    }

    months.forEach(month => {
      columns.push({
        title: monthFullNames[month],
        dataIndex: "fees",
        key: month,
        width: 100,
        render: (fees: { [key: string]: FeeStatus | null }, record: StudentFeeReport) => {
          if (!record.isQuarterly) {
            return getStatusBadge(fees[month]);
          }
          return <span className="badge badge-soft-secondary">N/A</span>;
        },
      });
    });

    return columns;
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Fee Report</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">Fees</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Fee Report
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Fee Report</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="me-3 mb-3">
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select Session"
                    onChange={(value) => setSelectedSession(value)}
                    allowClear
                    onClear={() => setSelectedSession(null)}
                    value={selectedSession}
                  >
                    {sessions.map((session) => (
                      <Option key={session._id} value={session._id}>
                        {session.name} ({session.sessionId})
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Table
                  dataSource={classes}
                  columns={[
                    {
                      title: "Class Name",
                      dataIndex: "name",
                    },
                    {
                      title: "Action",
                      render: (_: any, record: Class) => (
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => showFeeModal(record)}
                        >
                          View Fee Report
                        </Button>
                      ),
                    },
                  ]}
                  rowKey="_id"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={selectedClass ? `Fee Report for ${selectedClass.name}` : "Fee Report"}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={[
          <Button
            key="export"
            type="default"
            icon={<i className="ti ti-file-download" />}
            onClick={handleExport}
            disabled={!studentFeeReport.length || !selectedSession}
            style={{ marginRight: "16px" }}
          >
            Export to CSV
          </Button>,
          <Button key="cancel" type="default" onClick={handleModalCancel}>
            Close
          </Button>,
        ]}
        width={1400}
        zIndex={100001}
        style={{ top: "10px" }}
      >
        <div className="mb-3">
          <div className="alert alert-info d-flex align-items-center flex-wrap">
            <strong className="me-3">Legend:</strong>
            <div className="d-flex flex-wrap gap-3">
              <div><span className="badge badge-soft-success me-1">Paid</span> - Fee fully paid</div>
              <div><span className="badge badge-soft-warning me-1">Partial</span> - Fee partially paid</div>
              <div><span className="badge badge-soft-danger me-1">Pending</span> - Fee not paid</div>
              <div><span className="badge badge-soft-secondary me-1">Not Generated</span> - Fee not generated</div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={studentFeeReport}
            columns={getColumns()}
            rowKey="id"
            scroll={{ x: "max-content" }}
            pagination={{
              pageSize: 20,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} students`,
            }}
          />
        )}
      </Modal>
    </>
  );
};

export default FeeReport;