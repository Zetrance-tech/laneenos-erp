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
}

interface Class {
  _id: string;
  name: string;
}

interface StudentAttendance {
  id: string;
  admissionNo: string;
  name: string;
  attendance: { [key: string]: string | null }; // Date (YYYY-MM-DD) -> Status
}

const AttendanceReport = () => {
  const routes = all_routes;
  const { token } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(moment().format("YYYY"));
  const [selectedMonth, setSelectedMonth] = useState<string | null>(moment().format("MM"));
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all sessions
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/session/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      message.error("Failed to fetch sessions");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all classes (default)
  const fetchAllClasses = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/class`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(response.data);
    } catch (error) {
      console.error("Error fetching all classes:", error);
      message.error("Failed to fetch classes");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch classes for the selected session
  const fetchClasses = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/class/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(response.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      message.error("Failed to fetch classes");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch attendance data for the selected class and year-month
  const fetchAttendance = async (classId: string, year: string, month: string) => {
    try {
      setIsLoading(true);
      const startDate = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf("month").format("YYYY-MM-DD");
      const endDate = moment(startDate).endOf("month").format("YYYY-MM-DD");

      const daysInMonth = moment(startDate).daysInMonth();
      const attendancePromises = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = moment(startDate).date(day).format("YYYY-MM-DD");
        attendancePromises.push(
          axios.get(`${API_URL}/api/attendance/class/${classId}/${date}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
      }

      const attendanceResponses = await Promise.all(attendancePromises);
      const studentsMap: { [key: string]: StudentAttendance } = {};

      const firstResponse = attendanceResponses[0].data;
      firstResponse.forEach((student: any) => {
        studentsMap[student.id] = {
          id: student.id,
          admissionNo: student.admissionNo,
          name: student.name,
          attendance: {},
        };
      });

      attendanceResponses.forEach((response, index) => {
        const date = moment(startDate).date(index + 1).format("YYYY-MM-DD");
        response.data.forEach((student: any) => {
          if (studentsMap[student.id]) {
            studentsMap[student.id].attendance[date] = student.status;
          }
        });
      });

      setStudentAttendance(Object.values(studentsMap));
    } catch (error) {
      console.error("Error fetching attendance:", error);
      message.error("Failed to fetch attendance data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchAllClasses(); // Fetch all classes by default on component mount
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchClasses(selectedSession);
    } else {
      fetchAllClasses(); // Fetch all classes when session is cleared
    }
  }, [selectedSession]);

  const showAttendanceModal = (classData: Class) => {
    setSelectedClass(classData);
    setSelectedYear(moment().format("YYYY"));
    setSelectedMonth(moment().format("MM"));
    setStudentAttendance([]); // Clear previous attendance data
    setIsModalVisible(true);
    fetchAttendance(classData._id, moment().format("YYYY"), moment().format("MM")); // Fetch attendance immediately
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedClass(null);
    setSelectedYear(null);
    setSelectedMonth(null);
    setStudentAttendance([]);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    if (selectedClass && value && selectedMonth) {
      fetchAttendance(selectedClass._id, value, selectedMonth);
    }
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    if (selectedClass && selectedYear && value) {
      fetchAttendance(selectedClass._id, selectedYear, value);
    }
  };

  const exportToCSV = (data: StudentAttendance[], filename: string) => {
    if (!selectedYear || !selectedMonth) return;

    const startDate = moment(`${selectedYear}-${selectedMonth}-01`, "YYYY-MM-DD");
    const daysInMonth = startDate.daysInMonth();
    const headers = [
      "Admission Number",
      "Name",
      ...Array.from({ length: daysInMonth }, (_, i) => startDate.clone().add(i, "days").format("D MMM")),
    ];

    const escapeCSVField = (field: any) => {
      if (field === null || field === undefined) return "";
      let str = String(field).trim();
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = data.map((student) => [
      escapeCSVField(student.admissionNo),
      escapeCSVField(student.name),
      ...Array.from({ length: daysInMonth }, (_, i) => {
        const date = startDate.clone().add(i, "days").format("YYYY-MM-DD");
        return escapeCSVField(student.attendance[date] || "Not Marked");
      }),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success("Attendance exported to CSV successfully");
  };

  const handleExport = () => {
    if (!selectedClass || !selectedYear || !selectedMonth) return;
    const filename = `attendance_${selectedClass.name}_${selectedYear}-${selectedMonth}.csv`;
    exportToCSV(studentAttendance, filename);
  };

  const getColumns = () => {
    if (!selectedYear || !selectedMonth) return [];

    const startDate = moment(`${selectedYear}-${selectedMonth}-01`, "YYYY-MM-DD");
    const daysInMonth = startDate.daysInMonth();
    const columns: {
      title: string;
      dataIndex?: string;
      key?: string;
      render?: (value: any, record: StudentAttendance) => JSX.Element;
    }[] = [
      {
        title: "Admission Number",
        dataIndex: "admissionNo",
      },
      {
        title: "Name",
        dataIndex: "name",
      },
    ];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = startDate.clone().date(day).format("YYYY-MM-DD");
      columns.push({
        title: startDate.clone().date(day).format("D MMM"),
        dataIndex: "attendance",
        key: date,
        render: (attendance: { [key: string]: string | null }) => {
          const status = attendance[date];
          if (!status) return <span>-</span>;
          return (
            <span
              className={
                status === "Present"
                  ? "badge badge-soft-success"
                  : status === "Absent"
                  ? "badge badge-soft-danger"
                  : "badge badge-soft-warning"
              }
            >
              {status}
            </span>
          );
        },
      });
    }
    return columns;
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Attendance Report</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">Attendance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Attendance Report
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Attendance Report</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="me-3 mb-3">
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select Session"
                    onChange={(value) => setSelectedSession(value)}
                    allowClear
                    onClear={() => setSelectedSession(null)}
                  >
                    {sessions.map((session) => (
                      <Option key={session._id} value={session._id}>
                        {session.name}
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
                          onClick={() => showAttendanceModal(record)}
                        >
                          View Attendance
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
        title={selectedClass ? `Attendance for ${selectedClass.name}` : "Attendance"}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={[
          <Button
            key="export"
            type="default"
            icon={<i className="ti ti-file-download" />}
            onClick={handleExport}
            disabled={!studentAttendance.length || !selectedYear || !selectedMonth}
            style={{ marginRight: "16px" }}
          >
            Export to CSV
          </Button>,
          <Button key="cancel" type="default" onClick={handleModalCancel}>
            Close
          </Button>,
        ]}
        width={1200}
        zIndex={100001}
        style={{ top: "10px" }}
      >
        <div className="mb-3 d-flex align-items-center gap-2">
          <Select
            style={{ width: 100 }}
            placeholder="Year"
            value={selectedYear}
            onChange={handleYearChange}
          >
            {Array.from({ length: 5 }, (_, i) => moment().year() - i).map((year) => (
              <Option key={year} value={year.toString()}>
                {year}
              </Option>
            ))}
          </Select>
          <Select
            style={{ width: 120 }}
            placeholder="Month"
            value={selectedMonth}
            onChange={handleMonthChange}
          >
            {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")).map((month) => (
              <Option key={month} value={month}>
                {moment(`${selectedYear || moment().year()}-${month}-01`).format("MMMM")}
              </Option>
            ))}
          </Select>
        </div>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={studentAttendance}
            columns={getColumns()}
            rowKey="id"
            scroll={{ x: "max-content" }}
          />
        )}
      </Modal>
    </>
  );
};

export default AttendanceReport;