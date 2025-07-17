import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { Spin } from "antd";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Table from "../../../core/common/dataTable/index";
import { all_routes } from "../../router/all_routes";
import TooltipOption from "../../../core/common/tooltipOption";
import { Toaster, toast } from "react-hot-toast";

// Attendance options array
const ATTENDANCE_OPTIONS = ["Present", "Absent", "Holiday", "Closed"];

// Interfaces
interface Staff {
  _id?: string | null;
  id?: string | null;
  name?: string | null;
  role?: string | null;
  status?: string | null;
  inTime?: string | null | undefined;
  outTime?: string | null | undefined;
}

const API_URL = process.env.REACT_APP_URL || "";

const StaffAttendance: React.FC = () => {
  const { token, user } = useAuth() || {};
  const routes = all_routes;
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("Present");
  const [inTime, setInTime] = useState<string>("");
  const [outTime, setOutTime] = useState<string>("");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editInTime, setEditInTime] = useState<string>("");
  const [editOutTime, setEditOutTime] = useState<string>("");
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const decodedToken = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const role = decodedToken?.role || "";
  const userId = decodedToken?.userId || "";

  useEffect(() => {
    if (token) {
      fetchRoles();
    }
  }, [token]);

  useEffect(() => {
    if (selectedRole && selectedDate) {
      fetchStaff(selectedRole, selectedDate);
    }
  }, [selectedRole, selectedDate]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/attendance/staff/roles`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const filteredRoles = (response.data || []).filter(
        (role: string) => role !== "admin" && role !== "parent"
      );

      setRoles(["all", ...filteredRoles]);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async (role: string, date: string) => {
    setLoading(true);
    try {
      const url =
        role === "all"
          ? `${API_URL}/api/attendance/staff-attendance/${date}`
          : `${API_URL}/api/attendance/staff-attendance/${date}?role=${role}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedStaff: Staff[] = (response.data || []).map((staff: any) => ({
        _id: staff?._id || null,
        id: staff?.id || null,
        name: staff?.name || null,
        role: staff?.role || null,
        status: staff?.status || null,
        inTime: staff?.inTime || null,
        outTime: staff?.outTime || null,
      }));
      setStaff(fetchedStaff);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setSelectedStaff([]);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value);
    setSelectedStaff([]);
  };

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaff((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStaff.length === staff.length) {
      setSelectedStaff([]);
    } else {
      setSelectedStaff(staff.map((s) => s._id || "").filter(Boolean));
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedStaff.length) {
      toast.error("Please select at least one staff member.");
      return;
    }
    if (status === "Present" && (!inTime || !outTime)) {
      toast.error(
        "Please provide both In Time and Out Time for Present status."
      );
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedStaff.map(async (staffId) => {
          const staffMember = staff.find((s) => s._id === staffId);
          return axios.post(
            `${API_URL}/api/attendance/staff-attendance`,
            {
              staffId,
              date: selectedDate,
              name: staffMember?.name || "Unknown",
              role: staffMember?.role || "Unknown",
              status,
              inTime: status === "Present" ? inTime : null,
              outTime: status === "Present" ? outTime : null,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        })
      );

      const failed = results.filter((res) => res.status === "rejected");
      if (failed.length > 0) {
        toast.error(`Failed to mark attendance for ${failed.length} staff.`);
      } else {
        toast.success("Attendance marked successfully.");
      }

      setStaff((prev) =>
        prev.map((s) =>
          selectedStaff.includes(s._id || "")
            ? {
                ...s,
                status,
                inTime: status === "Present" ? inTime : null,
                outTime: status === "Present" ? outTime : null,
              }
            : s
        )
      );
      setSelectedStaff([]);
      setInTime("");
      setOutTime("");
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (
    staffId: string,
    currentStatus: string | null,
    currentInTime: string | null | undefined,
    currentOutTime: string | null | undefined
  ) => {
    setIsEditing(staffId);
    setEditStatus(currentStatus || "Present");
    setEditInTime(currentInTime || "");
    setEditOutTime(currentOutTime || "");
  };

  const handleSaveEdit = async (staffId: string) => {
    if (editStatus === "Present" && (!editInTime || !editOutTime)) {
      toast.error(
        "Please provide both In Time and Out Time for Present status."
      );
      return;
    }
    setLoading(true);
    try {
      const staffMember = staff.find((s) => s._id === staffId);
      await axios.post(
        `${API_URL}/api/attendance/staff-attendance`,
        {
          staffId,
          date: selectedDate,
          name: staffMember?.name || "Unknown",
          role: staffMember?.role || "Unknown",
          status: editStatus,
          inTime: editStatus === "Present" ? editInTime : null,
          outTime: editStatus === "Present" ? editOutTime : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStaff((prev) =>
        prev.map((s) =>
          s._id === staffId
            ? {
                ...s,
                status: editStatus,
                inTime: editStatus === "Present" ? editInTime : null,
                outTime: editStatus === "Present" ? editOutTime : null,
              }
            : s
        )
      );
      setIsEditing(null);
      toast.success("Attendance updated successfully.");
    } catch (error) {
      console.error("Error editing attendance:", error);
      toast.error("Failed to edit attendance.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const columns = [
    {
      title: (
        <input
          type="checkbox"
          checked={selectedStaff.length === staff.length && staff.length > 0}
          onChange={handleSelectAll}
        />
      ),
      dataIndex: "_id",
      render: (_id: string | null) => (
        <input
          type="checkbox"
          checked={selectedStaff.includes(_id || "")}
          onChange={() => handleSelectStaff(_id || "")}
        />
      ),
    },
    {
      title: "Staff ID",
      dataIndex: "id",
      render: (text: string | null) => (
        <Link to="#" className="link-primary">
          {text || "N/A"}
        </Link>
      ),
      sorter: (a: Staff, b: Staff) => (a.id || "").localeCompare(b.id || ""),
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text: string | null) => (
        <div className="d-flex align-items-center">
          <div className="ms-2">
            <p className="text-dark mb-0">
              <Link to="#">{text || "N/A"}</Link>
            </p>
          </div>
        </div>
      ),
      sorter: (a: Staff, b: Staff) =>
        (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (text: string | null) => text || "N/A",
      sorter: (a: Staff, b: Staff) =>
        (a.role || "").localeCompare(b.role || ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string | null, record: Staff) => (
        <div className="d-flex align-items-center">
          {isEditing === record._id ? (
            <>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="form-control me-2"
                style={{ width: "120px" }}
              >
                {ATTENDANCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-sm btn-success me-2"
                onClick={() => handleSaveEdit(record._id || "")}
              >
                Save
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setIsEditing(null)}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span style={{ minWidth: "80px" }}>{text || "Not Marked"}</span>
              <button
                className="btn btn-sm btn-outline-primary ms-2"
                onClick={() =>
                  handleEditClick(
                    record._id || "",
                    text,
                    record.inTime,
                    record.outTime
                  )
                }
              >
                Edit
              </button>
            </>
          )}
        </div>
      ),
      sorter: (a: Staff, b: Staff) =>
        (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "In Time",
      dataIndex: "inTime",
      render: (text: string | null, record: Staff) => (
        <div className="d-flex align-items-center">
          {isEditing === record._id && editStatus === "Present" ? (
            <input
              type="time"
              value={editInTime}
              onChange={(e) => setEditInTime(e.target.value)}
              className="form-control"
              style={{ width: "120px" }}
              placeholder="In Time"
            />
          ) : (
            <span>{record.status === "Present" ? text || "N/A" : "-"}</span>
          )}
        </div>
      ),
    },
    {
      title: "Out Time",
      dataIndex: "outTime",
      render: (text: string | null, record: Staff) => (
        <div className="d-flex align-items-center">
          {isEditing === record._id && editStatus === "Present" ? (
            <input
              type="time"
              value={editOutTime}
              onChange={(e) => setEditOutTime(e.target.value)}
              className="form-control"
              style={{ width: "120px" }}
              placeholder="Out Time"
            />
          ) : (
            <span>{record.status === "Present" ? text || "N/A" : "-"}</span>
          )}
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
                <div className="mb-3 me-2 w-40">
                  <select
                    className="form-control"
                    value={selectedRole}
                    onChange={handleRoleChange}
                    disabled={roles.length === 1 && role === "teacher"}
                  >
                    <option value="all">All Roles</option>
                    {roles
                      .filter((r) => r !== "all")
                      .map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-3 me-2 w-50">
                  <select
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {ATTENDANCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                {status === "Present" && (
                  <>
                    <div className="mb-3 me-2">
                      <input
                        type="time"
                        className="form-control"
                        value={inTime}
                        onChange={(e) => setInTime(e.target.value)}
                        placeholder="In Time"
                      />
                    </div>
                    <div className="mb-3 me-2">
                      <input
                        type="time"
                        className="form-control"
                        value={outTime}
                        onChange={(e) => setOutTime(e.target.value)}
                        placeholder="Out Time"
                      />
                    </div>
                  </>
                )}
                <div className="mb-3">
                  <button
                    className="btn btn-primary"
                    onClick={handleMarkAttendance}
                    disabled={loading || !selectedStaff.length}
                  >
                    Mark Attendance
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              <Spin spinning={loading} size="large">
                {selectedRole && staff.length > 0 ? (
                  <Table dataSource={staff} columns={columns} />
                ) : (
                  <p className="px-3">
                    {selectedRole
                      ? "No staff found for this role."
                      : "Please select a role."}
                  </p>
                )}
              </Spin>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffAttendance;
