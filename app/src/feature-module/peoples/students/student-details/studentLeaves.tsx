import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import StudentSidebar from "./studentSidebar";
import StudentBreadcrumb from "./studentBreadcrumb";
import Table from "../../../../core/common/dataTable/index";
import { useAuth } from "../../../../context/AuthContext";

// Interfaces
interface Leave {
  _id: string;
  studentId: { _id: string; name: string };
  reason: { title: string; message: string };
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected" | string;
  appliedAt?: string;
  approvedBy?: { name: string } | null;
}

interface Attendance {
  _id: string;
  date: string;
  inTime?: string;
  outTime?: string;
  notes?: string;
}

interface LeaveStats {
  total: number;
  used: number;
  available: number;
}

const API_URL = process.env.REACT_APP_URL;

const StudentLeaves: React.FC = () => {
  const routes = all_routes;
  const { admissionNumber } = useParams<{ admissionNumber: string }>();
  const { token } = useAuth();

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<Attendance[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [studentId, setStudentId] = useState<string | null>(null);
  const [leaveStats, setLeaveStats] = useState<LeaveStats>({
    total: 10,
    used: 0,
    available: 10,
  });
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleDateString());
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all");

  // Format date helper function
  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return "-";
    const d = new Date(date);
    return isNaN(d.getTime()) 
      ? "-" 
      : d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit"
        });
  };

  const formatTime = (time: string | undefined): string => {
    if (!time || isNaN(new Date(time).getTime())) return "-";
    return new Date(time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // Calculate attendance stats
  const getAttendanceStats = () => {
    const presentDays = attendance.filter(
      (record) => record.inTime && !isNaN(new Date(record.inTime).getTime()) && 
                 record.outTime && !isNaN(new Date(record.outTime).getTime())
    ).length;
    const absentDays = attendance.filter(
      (record) => !record.inTime || isNaN(new Date(record.inTime).getTime())
    ).length;
    return { presentDays, absentDays };
  };

  // Filter attendance based on selection
  useEffect(() => {
    if (filter === "all") {
      setFilteredAttendance(attendance);
    } else if (filter === "present") {
      setFilteredAttendance(
        attendance.filter(
          (record) => record.inTime && !isNaN(new Date(record.inTime).getTime()) && 
                     record.outTime && !isNaN(new Date(record.outTime).getTime())
        )
      );
    } else if (filter === "absent") {
      setFilteredAttendance(
        attendance.filter(
          (record) => !record.inTime || isNaN(new Date(record.inTime).getTime())
        )
      );
    }
  }, [attendance, filter]);

  // Fetch student ID and data on mount
  useEffect(() => {
    if (token && admissionNumber) {
      fetchStudentId();
    }
  }, [token, admissionNumber]);

  // Fetch leaves and attendance when studentId, startDate, or endDate changes
  useEffect(() => {
    if (studentId && startDate && endDate) {
      fetchLeaves();
      fetchAttendance();
    }
  }, [studentId, startDate, endDate]);

  const fetchStudentId = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/student/admission/${admissionNumber}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStudentId(response.data._id);
    } catch (error) {
      console.error("Error fetching student ID:", error);
    }
  };

  const fetchLeaves = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/leaves`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const studentLeaves: Leave[] = response.data.filter(
        (leave: Leave) => leave.studentId?._id === studentId
      );
      setLeaves(studentLeaves);

      const usedLeaves = studentLeaves.reduce((sum: number, leave: Leave) => {
        if (leave.status === "approved") {
          const days =
            (new Date(leave.endDate).getTime() -
              new Date(leave.startDate).getTime()) /
              (1000 * 60 * 60 * 24) +
            1;
          return sum + days;
        }
        return sum;
      }, 0);
      setLeaveStats({
        total: 10,
        used: usedLeaves,
        available: 10 - usedLeaves,
      });
    } catch (error) {
      console.error("Error fetching leaves:", error);
    }
  };

  const fetchAttendance = async () => {
    if (!startDate || !endDate) return;
    try {
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];
      const response = await axios.get(
        `${API_URL}/api/attendance/student/${studentId}/period?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAttendance(response.data);
      if (response.data.length > 0) {
        const latestDate = new Date(
          Math.max(...response.data.map((a: Attendance) => new Date(a.date).getTime()))
        );
        setLastUpdated(formatDate(latestDate));
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const handleUpdateLeaveStatus = async (leaveId: string, status: "approved" | "rejected") => {
    try {
      const response = await axios.put(
        `${API_URL}/api/leaves/update`,
        { leaveId, status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLeaves(
        leaves.map((leave) =>
          leave._id === leaveId
            ? { ...leave, status, approvedBy: response.data.leave.approvedBy }
            : leave
        )
      );
      fetchLeaves();
    } catch (error) {
      console.error("Error updating leave status:", error);
    }
  };

  const columns = [
    {
      title: "Leave Type",
      dataIndex: "reason",
      render: (reason: Leave["reason"]) => reason?.title || "-",
      sorter: (a: Leave, b: Leave) =>
        (a.reason?.title || "").localeCompare(b.reason?.title || ""),
    },
    {
      title: "Leave Date",
      dataIndex: "startDate",
      render: (startDate: string, record: Leave) =>
        startDate && record.endDate
          ? `${formatDate(startDate)} - ${formatDate(record.endDate)}`
          : "-",
      sorter: (a: Leave, b: Leave) =>
        (new Date(a.startDate || 0).getTime() || 0) - (new Date(b.startDate || 0).getTime() || 0),
    },
    {
      title: "No of Days",
      dataIndex: "startDate",
      render: (startDate: string, record: Leave) =>
        startDate && record.endDate
          ? Math.ceil(
              (new Date(record.endDate).getTime() - new Date(startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1
          : "-",
      sorter: (a: Leave, b: Leave) =>
        ((a.endDate && a.startDate
          ? new Date(a.endDate).getTime() - new Date(a.startDate).getTime()
          : 0) -
          (b.endDate && b.startDate
            ? new Date(b.endDate).getTime() - new Date(b.startDate).getTime()
            : 0)) ||
        0,
    },
    {
      title: "Applied On",
      dataIndex: "appliedAt",
      render: (appliedAt?: string) => formatDate(appliedAt),
      sorter: (a: Leave, b: Leave) =>
        (new Date(a.appliedAt || 0).getTime() || 0) -
        (new Date(b.appliedAt || 0).getTime() || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string, record: Leave) => {
        const displayStatus = typeof status === "string" ? status : "unknown";
        const badgeClass =
          displayStatus === "approved"
            ? "success"
            : displayStatus === "rejected"
            ? "danger"
            : displayStatus === "pending"
            ? "warning"
            : "secondary";
        return (
          <div className="d-flex align-items-center">
            <span
              className={`badge badge-soft-${badgeClass} d-inline-flex align-items-center`}
            >
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
            </span>
            {displayStatus === "pending" && (
              <div className="ms-2">
                <button
                  className="btn btn-sm btn-success me-1"
                  onClick={() => handleUpdateLeaveStatus(record._id, "approved")}
                >
                  Approve
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleUpdateLeaveStatus(record._id, "rejected")}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        );
      },
      sorter: (a: Leave, b: Leave) =>
        (typeof a.status === "string" ? a.status : "").localeCompare(
          typeof b.status === "string" ? b.status : ""
        ),
    },
  ];

  const columns2 = [
    {
      title: "Date",
      dataIndex: "date",
      render: (date: string) => formatDate(date),
      sorter: (a: Attendance, b: Attendance) =>
        (new Date(a.date || 0).getTime() || 0) - (new Date(b.date || 0).getTime() || 0),
    },
    {
      title: "In Time",
      dataIndex: "inTime",
      render: (inTime?: string) => formatTime(inTime),
      sorter: (a: Attendance, b: Attendance) =>
        (a.inTime ? new Date(a.inTime).getTime() : 0) - (b.inTime ? new Date(b.inTime).getTime() : 0),
    },
    {
      title: "Out Time",
      dataIndex: "outTime",
      render: (outTime?: string) => formatTime(outTime),
      sorter: (a: Attendance, b: Attendance) =>
        (a.outTime ? new Date(a.outTime).getTime() : 0) -
        (b.outTime ? new Date(b.outTime).getTime() : 0),
    },
    {
      title: "Status",
      dataIndex: "inTime",
      render: (inTime?: string, record?: Attendance) => {
        if (!inTime || isNaN(new Date(inTime).getTime())) {
          return (
            <span className="badge badge-soft-danger d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>Absent
            </span>
          );
        }
        if (new Date(inTime).getHours() > 9) {
          return (
            <span className="badge badge-soft-warning d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>Late
            </span>
          );
        }
        if (!record?.outTime || isNaN(new Date(record.outTime).getTime())) {
          return (
            <span className="badge badge-soft-info d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>Half-day
            </span>
          );
        }
        return (
          <span className="badge badge-soft-success d-inline-flex align-items-center">
            <i className="ti ti-circle-filled fs-5 me-1"></i>Present
          </span>
        );
      },
      sorter: (a: Attendance, b: Attendance) =>
        (a.inTime ? 1 : -1) - (b.inTime ? 1 : -1),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      render: (notes?: string) => notes || "-",
    },
  ];

  const { presentDays, absentDays } = getAttendanceStats();

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row">
          <StudentBreadcrumb admissionNumber={admissionNumber!} />
        </div>
        <div className="row">
          <StudentSidebar admissionNumber={admissionNumber!} />
          <div className="col-xxl-9 col-xl-8">
            <div className="row">
              <div className="col-md-12">
                <ul className="nav nav-tabs nav-tabs-bottom mb-4">
                  <li>
                    <Link
                      to={routes.studentDetail.replace(':admissionNumber', admissionNumber!)}
                      className="nav-link"
                    >
                      <i className="ti ti-school me-2" />
                      Student Details
                    </Link>
                  </li>
                  <li>
                    <Link to={routes.studentTimeTable.replace(':admissionNumber', admissionNumber!)} className="nav-link">
                      <i className="ti ti-report-money me-2" />
                      Planner
                    </Link>
                  </li>
                  <li>
                    <Link to={routes.studentLeaves.replace(':admissionNumber', admissionNumber!)} className="nav-link active">
                      <i className="ti ti-calendar-due me-2" />
                      Leave & Attendance
                    </Link>
                  </li>
                </ul>
                <div className="card">
                  <div className="card-body pb-1">
                    <ul className="nav nav-tabs nav-tabs-solid nav-tabs-rounded-fill">
                      <li className="me-3 mb-3">
                        <Link
                          to="#"
                          className="nav-link active rounded fs-12 fw-semibold"
                          data-bs-toggle="tab"
                          data-bs-target="#leave"
                        >
                          Leaves
                        </Link>
                      </li>
                      <li className="mb-3">
                        <Link
                          to="#"
                          className="nav-link rounded fs-12 fw-semibold"
                          data-bs-toggle="tab"
                          data-bs-target="#attendance"
                        >
                          Attendance
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="tab-content">
                  <div className="tab-pane fade show active" id="leave">
                    <div className="row gx-3">
                      <div className="col-lg-6 col-xxl-3 d-flex">
                        <div className="card flex-fill">
                          <div className="card-body">
                            <h5 className="mb-2">Medical Leave ({leaveStats.total})</h5>
                            <div className="d-flex align-items-center flex-wrap">
                              <p className="border-end pe-2 me-2 mb-0">
                                Used: {leaveStats.used}
                              </p>
                              <p className="mb-0">Available: {leaveStats.available}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                        <h4 className="mb-3">Leaves</h4>
                      </div>
                      <div className="card-body p-0 py-3">
                        <Table dataSource={leaves} columns={columns} Selection={false} />
                      </div>
                    </div>
                  </div>
                  <div className="tab-pane fade" id="attendance">
                    <div className="card">
                      <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-1">
                        <h4 className="mb-3">Attendance</h4>
                        <div className="d-flex align-items-center flex-wrap">d
                          <div className="d-flex align-items-center flex-wrap mb-3">
                            <div className="me-2">
                              <label className="form-label me-2">Filter:</label>
                              <select
                                className="form-select"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as "all" | "present" | "absent")}
                              >
                                <option value="all">All</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                              </select>
                            </div>
                            <div className="me-2">
                              <label className="form-label me-2">Start Date:</label>
                              <DatePicker
                                selected={startDate}
                                onChange={(date: Date | null) => {
                                  if (date) {
                                    setStartDate(date);
                                    if (endDate && date > endDate) {
                                      setEndDate(date);
                                    }
                                  }
                                }}
                                dateFormat="yyyy-MM-dd"
                                className="form-control"
                                placeholderText="Select start date"
                                showYearDropdown
                                showMonthDropdown
                                dropdownMode="select"
                                maxDate={new Date()}
                              />
                            </div>
                            <div>
                              <label className="form-label me-2">End Date:</label>
                              <DatePicker
                                selected={endDate}
                                onChange={(date: Date | null) => date && setEndDate(date)}
                                dateFormat="yyyy-MM-dd"
                                className="form-control"
                                placeholderText="Select end date"
                                minDate={startDate}
                                maxDate={new Date()}
                                showYearDropdown
                                showMonthDropdown
                                dropdownMode="select"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <p className="mb-2">Attendance Summary:</p>
                          <div className="d-flex align-items-center flex-wrap">
                            <p className="border-end pe-2 me-2 mb-0">
                              Present: {presentDays} days
                            </p>
                            <p className="mb-0">Absent: {absentDays} days</p>
                          </div>
                        </div>
                        <Table dataSource={filteredAttendance} columns={columns2} Selection={false} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLeaves;