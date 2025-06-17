import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import Table from "../../../core/common/dataTable/index";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import TooltipOption from "../../../core/common/tooltipOption";
import { Spin } from "antd";
import { useAuth } from "../../../context/AuthContext";
// Interfaces
interface Staff {
  _id: string;
  id: string;
  name: string;
  role: string;
  inTime?: string | null;
  outTime?: string | null;
}

interface AttendanceRecord {
  inTime: string | null;
  outTime: string | null;
}

const API_URL = process.env.REACT_APP_URL;

const StaffAttendance = () => {
  const routes = all_routes;
  const { token, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendanceData, setAttendanceData] = useState<
    Record<string, AttendanceRecord>
  >({});
  const [timeInputs, setTimeInputs] = useState<
    Record<string, { inTime: string; outTime: string }>
  >({});
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const decodedToken = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const role = decodedToken?.role;

  // Fetch roles and staff
  useEffect(() => {
    if (token) {
      fetchRoles();
    }
  }, [token]);

  useEffect(() => {
    if (selectedDate && selectedRole) {
      fetchStaff(selectedDate, selectedRole);
    }
  }, [selectedDate, selectedRole]);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/attendance/staff/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(["all", ...response.data]);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async (date: string, role: string) => {
    try {
      setIsLoading(true);
      const url =
        role === "all"
          ? `${API_URL}/api/attendance/staff-attendance/${date}`
          : `${API_URL}/api/attendance/staff-attendance/${date}?role=${role}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedStaff: Staff[] = response.data.map((staff: any) => ({
        _id: staff._id,
        id: staff.id,
        name: staff.name,
        role: staff.role,
        inTime: staff.inTime,
        outTime: staff.outTime,
      }));
      setStaff(fetchedStaff);

      const initialAttendance = fetchedStaff.reduce(
        (acc: Record<string, AttendanceRecord>, staff) => {
          acc[staff._id] = {
            inTime: staff.inTime || null,
            outTime: staff.outTime || null,
          };
          return acc;
        },
        {}
      );
      setAttendanceData(initialAttendance);

      const initialTimeInputs = fetchedStaff.reduce(
        (acc: Record<string, { inTime: string; outTime: string }>, staff) => {
          acc[staff._id] = {
            inTime: staff.inTime
              ? new Date(staff.inTime).toISOString().slice(11, 16)
              : "",
            outTime: staff.outTime
              ? new Date(staff.outTime).toISOString().slice(11, 16)
              : "",
          };
          return acc;
        },
        {}
      );
      setTimeInputs(initialTimeInputs);
    } catch (error) {
      console.error("Error fetching staff and attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value);
  };

  const handleTimeInputChange = (
    staffId: string,
    field: "inTime" | "outTime",
    value: string
  ) => {
    setTimeInputs((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [field]: value,
      },
    }));
  };

  const handleSaveAttendance = async (staffId: string) => {
    const inputs = timeInputs[staffId];
    if (!inputs) return;

    const inTime = inputs.inTime
      ? new Date(`${selectedDate}T${inputs.inTime}:00.000Z`).toISOString()
      : null;
    const outTime = inputs.outTime
      ? new Date(`${selectedDate}T${inputs.outTime}:00.000Z`).toISOString()
      : null;

    const updatedRecord = {
      inTime,
      outTime,
    };

    try {
      await axios.post(
        `${API_URL}/api/attendance/staff-attendance`,
        {
          staffId,
          date: selectedDate,
          name: staff.find((s) => s._id === staffId)?.name,
          role: staff.find((s) => s._id === staffId)?.role,
          inTime: updatedRecord.inTime,
          outTime: updatedRecord.outTime,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAttendanceData((prev) => ({
        ...prev,
        [staffId]: updatedRecord,
      }));
      setStaff((prev) =>
        prev.map((s) =>
          s._id === staffId ? { ...s, ...updatedRecord } : s
        )
      );
      console.log(`Saved attendance for staffId ${staffId}:`, updatedRecord);
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toISOString().slice(11, 16); // Returns HH:mm
  };

  const columns = [
    {
      title: "Staff ID",
      dataIndex: "id",
      render: (text: string) => (
        <Link to="#" className="link-primary">
          {text}
        </Link>
      ),
      sorter: (a: Staff, b: Staff) => a.id.localeCompare(b.id),
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text: string) => (
        <div className="d-flex align-items-center">
          <div className="ms-2">
            <p className="text-dark mb-0">
              <Link to="#">{text}</Link>
            </p>
          </div>
        </div>
      ),
      sorter: (a: Staff, b: Staff) => a.name.localeCompare(b.name),
    },
    {
      title: "Role",
      dataIndex: "role",
      sorter: (a: Staff, b: Staff) => a.role.localeCompare(b.role),
    },
    {
      title: "Attendance",
      dataIndex: "attendance",
      render: (text: string, record: Staff) => (
        <div className="d-flex align-items-center">
          <div className="me-2">
            <label className="form-label">In Time</label>
            <input
              type="time"
              className="form-control form-control-sm"
              value={timeInputs[record._id]?.inTime || ""}
              onChange={(e) =>
                handleTimeInputChange(record._id, "inTime", e.target.value)
              }
              placeholder="HH:mm"
            />
          </div>
          <div className="me-2">
            <label className="form-label">Out Time</label>
            <input
              type="time"
              className="form-control form-control-sm"
              value={timeInputs[record._id]?.outTime || ""}
              onChange={(e) =>
                handleTimeInputChange(record._id, "outTime", e.target.value)
              }
              placeholder="HH:mm"
            />
          </div>
          <button
            className="btn btn-sm btn-primary mt-4"
            onClick={() => handleSaveAttendance(record._id)}
            disabled={
              !timeInputs[record._id]?.inTime &&
              !timeInputs[record._id]?.outTime
            }
          >
            Save
          </button>
          <span className="ms-2 mt-4">
            {record.inTime ? `In: ${formatTime(record.inTime)}` : "Not In"}
            {record.outTime ? ` | Out: ${formatTime(record.outTime)}` : ""}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Staff Attendance</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="#">Report</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Staff Attendance
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
              <h4 className="mb-3">Staff Attendance List</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="mb-3 me-2">
                  <input
                    type="date"
                    className="form-control"
                    value={selectedDate}
                    onChange={handleDateChange}
                  />
                </div>
                <div className="mb-3 me-2">
                  <select
                    className="form-control"
                    value={selectedRole}
                    onChange={handleRoleChange}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role === "all" ? "All Roles" : role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              {staff.length > 0 ? (
                isLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <Table dataSource={staff} columns={columns} Selection={true} />
                )
              ) : (
                <p className="alert alert-danger mx-3" role="alert">
                  {selectedRole
                    ? "No staff found for this role."
                    : "Please select a role."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffAttendance;