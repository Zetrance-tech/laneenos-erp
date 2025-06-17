import React, { useState, useEffect, useRef } from "react";
import DataTable from "../../../../core/common/dataTable/index";
import CommonSelect from "../../../../core/common/commonSelect";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import TooltipOption from "../../../../core/common/tooltipOption";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { leaveType, Role, MonthDate, activeList } from "../../../../core/common/selectoption/selectoption";

// Interfaces defined inline
interface Reason {
  title: string;
  message: string;
}

interface Student {
  _id: string;
  name: string;
}

interface ApprovedBy {
  _id: string;
  name: string;
}

interface Leave {
  _id: string;
  studentId: Student;
  reason: Reason;
  parentId: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: ApprovedBy;
  appliedAt: string;
  updatedAt: string;
  __v: number;
}

interface SelectOption {
  value: string;
  label: string;
}

interface CustomDateRangePickerProps {
  onChange: (range: [Date, Date] | null) => void;
}

const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({ onChange }) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    onChange(start && end ? [start, end] : null);
  };

  return (
    <div className="date-range-picker">
      <DatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={handleChange}
        dateFormat="MM/dd/yyyy"
        placeholderText="Select date range"
        className="form-control"
      />
    </div>
  );
};

interface CommonSelectProps {
  className?: string;
  options: SelectOption[];
  defaultValue?: SelectOption;
  onChange?: (option: SelectOption | null) => void;
}

const TeacherStudentLeaves: React.FC = () => {
  const routes = all_routes;
  const apiBaseUrl = process.env.REACT_APP_URL;
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<Leave[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  const statusOptions: SelectOption[] = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  // Fetch leave requests for teacher's classes
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No JWT token found in localStorage");
          alert("Please log in to view leave requests.");
          return;
        }

        const response = await axios.get(`${apiBaseUrl}/api/leaves/teacher`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("API Response:", response.data);
        if (Array.isArray(response.data)) {
          setLeaves(response.data);
          setFilteredLeaves(response.data);
        } else {
          console.error("Unexpected API response format:", response.data);
          setLeaves([]);
          setFilteredLeaves([]);
        }
      } catch (error: any) {
        console.error("Error fetching leaves:", error);
        if (error.response) {
          console.error("Error Response:", error.response.data);
          alert(`Failed to fetch leaves: ${error.response.data.message || "Please try again."}`);
        } else {
          alert("Failed to connect to the server. Please check your network or server status.");
        }
        setLeaves([]);
        setFilteredLeaves([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  // Handle status filter and date range changes
  useEffect(() => {
    let filtered = leaves;
    if (statusFilter) {
      filtered = filtered.filter((leave) => leave.status === statusFilter);
    }
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = new Date(dateRange[0]).setHours(0, 0, 0, 0);
      const end = new Date(dateRange[1]).setHours(23, 59, 59, 999);
      filtered = filtered.filter((leave) => {
        const leaveStart = new Date(leave.startDate).getTime();
        return leaveStart >= start && leaveStart <= end;
      });
    }
    setFilteredLeaves(filtered);
    console.log("Filtered Leaves:", filtered);
  }, [statusFilter, dateRange, leaves]);

  // Handle approve/reject actions
  const handleStatusUpdate = async (leaveId: string, status: "approved" | "rejected") => {
    try {
      const response = await axios.put(
        `${apiBaseUrl}/api/leaves/update`,
        { leaveId, status },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setLeaves((prev) =>
        prev.map((leave) =>
          leave._id === leaveId
            ? { ...leave, status, approvedBy: response.data.leave.approvedBy }
            : leave
        )
      );
      setFilteredLeaves((prev) =>
        prev.map((leave) =>
          leave._id === leaveId
            ? { ...leave, status, approvedBy: response.data.leave.approvedBy }
            : leave
        )
      );
      alert(`Leave ${status} successfully.`);
    } catch (error: any) {
      console.error("Error updating leave status:", error);
      alert(
        `Failed to update leave status: ${
          error.response?.data?.message || "Please try again."
        }`
      );
    }
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const columns = [
    {
      title: "Submitted By",
      dataIndex: "studentId",
      render: (student: Leave["studentId"]) => student?.name || "N/A",
      sorter: (a: Leave, b: Leave) =>
        (a.studentId?.name || "").localeCompare(b.studentId?.name || ""),
    },
    {
      title: "Leave Type",
      dataIndex: "reason",
      render: (reason: Leave["reason"]) => reason?.title || "N/A",
      sorter: (a: Leave, b: Leave) =>
        (a.reason?.title || "").localeCompare(b.reason?.title || ""),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      render: (reason: Leave["reason"]) => reason?.message || "N/A",
    },
    {
      title: "Leave Date",
      dataIndex: "startDate",
      render: (startDate: string, record: Leave) =>
        `${new Date(startDate).toLocaleDateString()} - ${new Date(record.endDate).toLocaleDateString()}`,
      sorter: (a: Leave, b: Leave) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    },
    {
      title: "No of Days",
      dataIndex: "noofDays",
      render: (_: any, record: Leave) =>
        Math.ceil(
          (new Date(record.endDate).getTime() - new Date(record.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ).toString(),
      sorter: (a: Leave, b: Leave) =>
        (new Date(a.endDate).getTime() - new Date(a.startDate).getTime()) -
        (new Date(b.endDate).getTime() - new Date(b.startDate).getTime()),
    },
    {
      title: "Applied On",
      dataIndex: "appliedAt",
      render: (appliedAt: string) => new Date(appliedAt).toLocaleDateString(),
      sorter: (a: Leave, b: Leave) =>
        new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime(),
    },
    {
      title: "Authority",
      dataIndex: "approvedBy",
      render: (approvedBy: Leave["approvedBy"]) => approvedBy?.name || "N/A",
      sorter: (a: Leave, b: Leave) =>
        (a.approvedBy?.name || "").localeCompare(b.approvedBy?.name || ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: Leave["status"]) => {
        const statusClass =
          status === "approved"
            ? "badge-soft-success"
            : status === "rejected"
            ? "badge-soft-danger"
            : "badge-soft-pending";
        return (
          <span className={`badge ${statusClass} d-inline-flex align-items-center`}>
            <i className="ti ti-circle-filled fs-5 me-1"></i>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
      sorter: (a: Leave, b: Leave) => a.status.localeCompare(b.status),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Leave) => (
        <div className="dropdown">
          <Link
            to="#"
            className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="ti ti-dots-vertical fs-14" />
          </Link>
          <ul className="dropdown-menu dropdown-menu-right p-3">
            <li>
              <Link
                className="dropdown-item rounded-1"
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#leave_request"
                onClick={() => setSelectedLeave(record)}
              >
                <i className="ti ti-menu me-2" />
                Leave Request
              </Link>
            </li>
            <li>
              <Link
                className="dropdown-item rounded-1"
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#delete-modal"
                onClick={() => setSelectedLeave(record)}
              >
                <i className="ti ti-trash-x me-2" />
                Delete
              </Link>
            </li>
            {record.status === "pending" && (
              <>
                <li>
                  <Link
                    className="dropdown-item rounded-1"
                    to="#"
                    onClick={() => handleStatusUpdate(record._id, "approved")}
                  >
                    <i className="ti ti-check-circle me-2" />
                    Approve
                  </Link>
                </li>
                <li>
                  <Link
                    className="dropdown-item rounded-1"
                    to="#"
                    onClick={() => handleStatusUpdate(record._id, "rejected")}
                  >
                    <i className="ti ti-x-circle me-2" />
                    Reject
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Student Leaves</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item">HRM</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Student Leaves
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
            <h4 className="mb-3">Student Leave Requests</h4>
            <div className="d-flex align-items-center flex-wrap">
              <div className="input-icon-start mb-3 me-2 position-relative">
                <CustomDateRangePicker
                  onChange={(range) => setDateRange(range)}
                />
              </div>
              <div className="dropdown mb-3 me-2">
                <Link
                  to="#"
                  className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                >
                  <i className="ti ti-filter me-2" />
                  Filter
                </Link>
                <div className="dropdown-menu drop-width" ref={dropdownMenuRef}>
                  <form>
                    <div className="d-flex align-items-center border-bottom p-3">
                      <h4>Filter</h4>
                    </div>
                    <div className="p-3 border-bottom">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Leave Type</label>
                            <CommonSelect className="select" options={leaveType} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Role</label>
                            <CommonSelect className="select" options={Role} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-0">
                            <label className="form-label">From - To Date</label>
                            <CommonSelect className="select" options={MonthDate} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-0">
                            <label className="form-label">Status</label>
                            <CommonSelect
                              className="select"
                              options={statusOptions}
                              defaultValue={statusOptions[0]}
                              onChange={(option) => setStatusFilter(option?.value || "")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 d-flex align-items-center justify-content-end">
                      <Link
                        to="#"
                        className="btn btn-light me-3"
                        onClick={() => setStatusFilter("")}
                      >
                        Reset
                      </Link>
                      <Link to="#" className="btn btn-primary" onClick={handleApplyClick}>
                        Apply
                      </Link>
                    </div>
                  </form>
                </div>
              </div>
              <div className="dropdown mb-3">
                <Link
                  to="#"
                  className="btn btn-outline-light bg-white dropdown-toggle"
                  data-bs-toggle="dropdown"
                >
                  <i className="ti ti-sort-ascending-2 me-2" />
                  Sort by A-Z
                </Link>
                <ul className="dropdown-menu p-3">
                  <li>
                    <Link to="#" className="dropdown-item rounded-1 active">
                      Ascending
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Descending
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Recently Viewed
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Recently Added
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="card-body p-0 py-3">
            {isLoading ? (
              <div className="text-center py-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="text-center py-3">
                <p>No leave requests found for your classes.</p>
              </div>
            ) : (
              <DataTable columns={columns} dataSource={filteredLeaves} Selection={true} />
            )}
          </div>
        </div>
      </div>
      {/* Leave Request Modal */}
      <div className="modal fade" id="leave_request">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Leave Request</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="student-leave-info">
                  <ul>
                    <li>
                      <span>Submitted By</span>
                      <h6>{selectedLeave?.studentId.name || "N/A"}</h6>
                    </li>
                    <li>
                      <span>Leave Type</span>
                      <h6>{selectedLeave?.reason.title || "N/A"}</h6>
                    </li>
                    <li>
                      <span>No of Days</span>
                      <h6>
                        {selectedLeave
                          ? Math.ceil(
                              (new Date(selectedLeave.endDate).getTime() -
                                new Date(selectedLeave.startDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          : "N/A"}
                      </h6>
                    </li>
                    <li>
                      <span>Applied On</span>
                      <h6>
                        {selectedLeave
                          ? new Date(selectedLeave.appliedAt).toLocaleDateString()
                          : "N/A"}
                      </h6>
                    </li>
                    <li>
                      <span>Authority</span>
                      <h6>{selectedLeave?.approvedBy?.name || "N/A"}</h6>
                    </li>
                    <li>
                      <span>Leave</span>
                      <h6>
                        {selectedLeave
                          ? `${new Date(selectedLeave.startDate).toLocaleDateString()} - ${new Date(
                              selectedLeave.endDate
                            ).toLocaleDateString()}`
                          : "N/A"}
                      </h6>
                    </li>
                  </ul>
                </div>
                <div className="mb-3 leave-reason">
                  <h6 className="mb-1">Reason</h6>
                  <span>{selectedLeave?.reason.message || "Not provided"}</span>
                </div>
                <div className="mb-3">
                  <label className="form-label">Approval Status</label>
                  <div className="d-flex align-items-center check-radio-group">
                    <label className="custom-radio">
                      <input
                        type="radio"
                        name="radio"
                        defaultChecked={selectedLeave?.status === "pending"}
                      />
                      <span className="checkmark" />
                      Pending
                    </label>
                    <label className="custom-radio">
                      <input
                        type="radio"
                        name="radio"
                        defaultChecked={selectedLeave?.status === "approved"}
                      />
                      <span className="checkmark" />
                      Approved
                    </label>
                    <label className="custom-radio">
                      <input
                        type="radio"
                        name="radio"
                        defaultChecked={selectedLeave?.status === "rejected"}
                      />
                      <span className="checkmark" />
                      Disapproved
                    </label>
                  </div>
                </div>
                <div className="mb-0">
                  <label className="form-label">Note</label>
                  <textarea
                    className="form-control"
                    placeholder="Add Comment"
                    rows={4}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <Link
                  to="#"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </Link>
                <Link to="#" className="btn btn-primary" data-bs-dismiss="modal">
                  Submit
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Delete Modal */}
      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form>
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x" />
                </span>
                <h4>Confirm Deletion</h4>
                <p>
                  You want to delete the leave request for {selectedLeave?.studentId.name || "this student"}?
                  This can't be undone once you delete.
                </p>
                <div className="d-flex justify-content-center">
                  <Link
                    to="#"
                    className="btn btn-light me-3"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link to="#" className="btn btn-danger" data-bs-dismiss="modal">
                    Yes, Delete
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherStudentLeaves;