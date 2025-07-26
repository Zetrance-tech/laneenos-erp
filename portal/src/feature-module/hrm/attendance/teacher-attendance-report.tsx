import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import { Modal, Spin, Select, message, Table, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import moment from "moment";

const { Option } = Select;
const API_URL = process.env.REACT_APP_URL;

interface Role {
  value: string;
  label: string;
}

interface StaffAttendance {
  _id: string;
  id: string;
  name: string;
  role: string;
  attendance: { [key: string]: { status: string | null; inTime: string | null; outTime: string | null } };
}

const StaffAttendanceReport = () => {
  const routes = all_routes;
  const { token } = useAuth();
  const [roles, setRoles] = useState<Role[]>([{ value: "all", label: "All Roles" }]);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [staff, setStaff] = useState<StaffAttendance[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRoleForModal, setSelectedRoleForModal] = useState<Role | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(moment().format("YYYY"));
  const [selectedMonth, setSelectedMonth] = useState<string | null>(moment().format("MM"));
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all roles except admin, parent, superadmin
  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/attendance/staff/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedRoles = response.data
        .filter((role: string) => !["admin", "parent", "superadmin"].includes(role))
        .map((role: string) => ({
          value: role,
          label: role.charAt(0).toUpperCase() + role.slice(1),
        }));
      setRoles([{ value: "all", label: "All Roles" }, ...fetchedRoles]);
    } catch (error) {
      console.error("Error fetching roles:", error);
      message.error("Failed to fetch roles");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all staff or filtered by role
  const fetchStaff = async (role: string) => {
    try {
      setIsLoading(true);
      const date = moment().format("YYYY-MM-DD"); // Temporary date to fetch staff list
      const response = await axios.get(`${API_URL}/api/attendance/staff-attendance/${date}${role !== "all" ? `?role=${role}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaff(response.data);
    } catch (error) {
      console.error("Error fetching staff:", error);
      message.error("Failed to fetch staff");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch attendance data for the selected role and year-month
  const fetchAttendance = async (role: string, year: string, month: string) => {
    try {
      setIsLoading(true);
      const startDate = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf("month").format("YYYY-MM-DD");
      const endDate = moment(startDate).endOf("month").format("YYYY-MM-DD");

      const daysInMonth = moment(startDate).daysInMonth();
      const attendancePromises = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = moment(startDate).date(day).format("YYYY-MM-DD");
        attendancePromises.push(
          axios.get(`${API_URL}/api/attendance/staff-attendance/${date}${role !== "all" ? `?role=${role}` : ""}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
      }

      const attendanceResponses = await Promise.all(attendancePromises);
      const staffMap: { [key: string]: StaffAttendance } = {};

      const firstResponse = attendanceResponses[0].data;
      firstResponse.forEach((staffMember: any) => {
        staffMap[staffMember._id] = {
          _id: staffMember._id,
          id: staffMember.id,
          name: staffMember.name,
          role: staffMember.role,
          attendance: {},
        };
      });

      attendanceResponses.forEach((response, index) => {
        const date = moment(startDate).date(index + 1).format("YYYY-MM-DD");
        response.data.forEach((staffMember: any) => {
          if (staffMap[staffMember._id]) {
            staffMap[staffMember._id].attendance[date] = {
              status: staffMember.status,
              inTime: staffMember.inTime,
              outTime: staffMember.outTime,
            };
          }
        });
      });

      setStaffAttendance(Object.values(staffMap));
    } catch (error) {
      console.error("Error fetching attendance:", error);
      message.error("Failed to fetch attendance data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchStaff(selectedRole);
  }, []);

  useEffect(() => {
    fetchStaff(selectedRole);
  }, [selectedRole]);

  const showAttendanceModal = () => {
    if (selectedRole === "all") {
      setSelectedRoleForModal({ value: "all", label: "All Roles" });
    } else {
      const role = roles.find(r => r.value === selectedRole);
      setSelectedRoleForModal(role || null);
    }
    setSelectedYear(moment().format("YYYY"));
    setSelectedMonth(moment().format("MM"));
    setStaffAttendance([]); // Clear previous attendance data
    setIsModalVisible(true);
    fetchAttendance(selectedRole, moment().format("YYYY"), moment().format("MM")); // Fetch attendance immediately
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedRoleForModal(null);
    setSelectedYear(null);
    setSelectedMonth(null);
    setStaffAttendance([]);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    if (selectedRoleForModal && value && selectedMonth) {
      fetchAttendance(selectedRoleForModal.value, value, selectedMonth);
    }
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    if (selectedRoleForModal && selectedYear && value) {
      fetchAttendance(selectedRoleForModal.value, selectedYear, value);
    }
  };

  const exportToCSV = (data: StaffAttendance[], filename: string) => {
    if (!selectedYear || !selectedMonth) return;

    const startDate = moment(`${selectedYear}-${selectedMonth}-01`, "YYYY-MM-DD");
    const daysInMonth = startDate.daysInMonth();
    const headers = [
      "Staff ID",
      "Name",
      "Role",
      ...Array.from({ length: daysInMonth }, (_, i) => startDate.clone().add(i, "days").format("D MMM")),
    ];

    const escapeCSVField = (field: any) => {
      if (field === null || field === undefined) return "";
      let str = String(field).trim();
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = data.map((staffMember) => [
      escapeCSVField(staffMember.id),
      escapeCSVField(staffMember.name),
      escapeCSVField(staffMember.role),
      ...Array.from({ length: daysInMonth }, (_, i) => {
        const date = startDate.clone().add(i, "days").format("YYYY-MM-DD");
        const attendance = staffMember.attendance[date];
        return escapeCSVField(
          attendance?.status
            ? `${attendance.status}${attendance.inTime ? ` (${attendance.inTime}-${attendance.outTime})` : ""}`
            : ""
        );
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
    if (!selectedRoleForModal || !selectedYear || !selectedMonth) return;
    const filename = `staff_attendance_${selectedRoleForModal.value}_${selectedYear}-${selectedMonth}.csv`;
    exportToCSV(staffAttendance, filename);
  };

  const getColumns = () => {
    if (!selectedYear || !selectedMonth) return [];

    const startDate = moment(`${selectedYear}-${selectedMonth}-01`, "YYYY-MM-DD");
    const daysInMonth = startDate.daysInMonth();
    const columns: {
      title: string;
      dataIndex?: string;
      key?: string;
      sorter?: (a: StaffAttendance, b: StaffAttendance) => number;
      render?: (value: any, record: StaffAttendance) => JSX.Element;
    }[] = [
      {
        title: "Staff ID",
        dataIndex: "id",
        sorter: (a: StaffAttendance, b: StaffAttendance) => a.id.localeCompare(b.id),
      },
      {
        title: "Name",
        dataIndex: "name",
        sorter: (a: StaffAttendance, b: StaffAttendance) => a.name.localeCompare(b.name),
      },
      {
        title: "Role",
        dataIndex: "role",
        sorter: (a: StaffAttendance, b: StaffAttendance) => a.role.localeCompare(b.role),
      },
    ];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = startDate.clone().date(day).format("YYYY-MM-DD");
      columns.push({
        title: startDate.clone().date(day).format("D MMM"),
        dataIndex: "attendance",
        key: date,
        render: (attendance: { [key: string]: { status: string | null; inTime: string | null; outTime: string | null } }) => {
          const record = attendance[date];
          if (!record || !record.status) return <span>-</span>;
          return (
            <span
              className={
                record.status === "Present"
                  ? "badge badge-soft-success"
                  : record.status === "Absent"
                  ? "badge badge-soft-danger"
                  : "badge badge-soft-warning"
              }
            >
              {record.status}
              {record.status === "Present" && record.inTime && record.outTime ? (
                <>
                  <br />
                  <span>{`${record.inTime} - ${record.outTime}`}</span>
                </>
              ) : (
                ""
              )}
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
              <h3 className="page-title mb-1">Staff Attendance Report</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">Attendance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Staff Attendance Report
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Staff Attendance Report</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="me-3 mb-3 d-flex align-items-center gap-2">
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select Role"
                    value={selectedRole}
                    onChange={(value) => setSelectedRole(value)}
                    allowClear
                    onClear={() => setSelectedRole("all")}
                  >
                    {roles.map((role) => (
                      <Option key={role.value} value={role.value}>
                        {role.label}
                      </Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    size="small"
                    onClick={showAttendanceModal}
                  >
                    View Attendance
                  </Button>
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
                  dataSource={staff}
                  columns={[
                    {
                      title: "Staff ID",
                      dataIndex: "id",
                      sorter: (a: StaffAttendance, b: StaffAttendance) => a.id.localeCompare(b.id),
                    },
                    {
                      title: "Name",
                      dataIndex: "name",
                      sorter: (a: StaffAttendance, b: StaffAttendance) => a.name.localeCompare(b.name),
                    },
                    {
                      title: "Role",
                      dataIndex: "role",
                      sorter: (a: StaffAttendance, b: StaffAttendance) => a.role.localeCompare(b.role),
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
        title={selectedRoleForModal ? `Attendance for ${selectedRoleForModal.label}` : "Attendance"}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={[
          <Button
            key="export"
            type="default"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={!staffAttendance.length || !selectedYear || !selectedMonth}
            style={{ marginRight: "16px" }}
          >
            Export to CSV
          </Button>,
          <Button key="cancel" type="default" onClick={handleModalCancel}>
            Close
          </Button>,
        ]}
        width={1200}
        zIndex={10000}
        style={{ top: "50px" }}
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
            dataSource={staffAttendance}
            columns={getColumns()}
            rowKey="_id"
            scroll={{ x: "max-content" }}
          />
        )}
      </Modal>
    </>
  );
};

export default StaffAttendanceReport;