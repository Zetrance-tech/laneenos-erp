import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import Table from "../../../core/common/dataTable/index";
import TooltipOption from "../../../core/common/tooltipOption";
import axios from "axios";
import { Spin, Select } from "antd";
import { useAuth } from "../../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import TeacherModal from "../../peoples/teacher/teacherModal";
const { Option } = Select;
const API_URL = process.env.REACT_APP_URL;

interface Staff {
  _id: string;
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  gender: string;
  role: string;
  joiningDate: string;
  dateOfBirth: string;
  branchId: string;
  branch?: { name: string };
  userId: {
    _id: string;
    email: string;
  };
  status?: string;
}

interface Branch {
  _id: string;
  name: string;
}

interface Session {
  _id: string;
  name: string;
}

interface Class {
  _id: string;
  name: string;
  sessionId: string;
}

const roleOptions = [
  { value: "", label: "All Roles" },
  { value: "teacher", label: "Teacher" },
  { value: "maid", label: "Maid" },
  { value: "accountant", label: "Accountant" },
  { value: "librarian", label: "Librarian" },
  { value: "admin", label: "Admin" },
];

const StaffListForSuperadmin = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const { token } = useAuth();

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/branch`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(res.data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to fetch branches");
    }
  };

  // Fetch sessions (filtered by branchId if provided)
  const fetchSessions = async (branchId?: string) => {
    try {
      const params = branchId ? { branchId } : {};
      const res = await axios.get(`${API_URL}/api/session/get/superadmin`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setSessions(res.data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to fetch sessions");
    }
  };

  // Fetch classes (filtered by branchId and/or sessionId)
  const fetchClasses = async (branchId?: string, sessionId?: string) => {
    try {
      const params: { branchId?: string; sessionId?: string } = {};
      if (branchId) params.branchId = branchId;
      if (sessionId) params.sessionId = sessionId;
      
      const res = await axios.get(`${API_URL}/api/class/superadmin`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setClasses(res.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to fetch classes");
    }
  };

  // Fetch staff with filters
  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (selectedBranch) params.branchId = selectedBranch;
      if (selectedSession) params.sessionId = selectedSession;
      if (selectedClass) params.class = selectedClass;
      if (selectedRole) params.role = selectedRole;

      const res = await axios.get(`${API_URL}/api/teacher/superadmin`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const mappedStaff = (res.data?.data || []).map((staff: any) => ({
        ...staff,
        branch: staff.branchId?.name || "N/A",
      }));
      setStaff(mappedStaff);
      setFilteredStaff(mappedStaff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to fetch staff");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle staff deletion
  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;

    try {
      await axios.delete(`${API_URL}/api/staff/${staffToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaff(staff.filter((s) => s._id !== staffToDelete));
      setFilteredStaff(filteredStaff.filter((s) => s._id !== staffToDelete));
      setStaffToDelete(null);
      toast.success("Staff deleted successfully");
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Failed to delete staff");
    }
  };

  // Effect to fetch initial data
  useEffect(() => {
    fetchBranches();
    fetchSessions();
    fetchClasses();
    fetchStaff();
  }, []);

  // Effect to handle branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetchSessions(selectedBranch);
      fetchClasses(selectedBranch, selectedSession ?? undefined);
    } else {
      fetchSessions();
      fetchClasses();
    }
    setSelectedSession(null);
    setSelectedClass(null);
  }, [selectedBranch]);

  // Effect to handle session changes
  useEffect(() => {
    if (selectedSession && selectedBranch) {
      fetchClasses(selectedBranch, selectedSession);
    } else if (selectedBranch) {
      fetchClasses(selectedBranch);
    } else {
      fetchClasses();
    }
    setSelectedClass(null);
  }, [selectedSession]);

  // Effect to refetch staff when filters change
  useEffect(() => {
    fetchStaff();
  }, [selectedBranch, selectedSession, selectedClass, selectedRole]);

  const columns = [
    {
      title: "",
      key: "status-dot",
      width: 20,
      render: (record: any) => (
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "ffff",
            marginLeft: 15,
          }}
        />
      ),
    },
    {
      title: "Staff ID",
      dataIndex: "id",
      render: (text: string, record: Staff) => (
        // <Link to={routes.teacherDetails.replace(":id", record._id)} className="link-primary">
          <p>{text}</p>
        // </Link>
      ),
      sorter: (a: Staff, b: Staff) => a.id.localeCompare(b.id),
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text: string, record: Staff) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md">
            <ImageWithBasePath
              src="assets/img/teachers/teacher-01.jpg"
              className="img-fluid rounded-circle"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <p className="text-dark mb-0">
              {/* <Link to={routes.teacherDetails.replace(":id", record._id)}> */}
              <p>{text}</p>
              {/* </Link> */}
            </p>
          </div>
        </div>
      ),
      sorter: (a: Staff, b: Staff) => a.name.localeCompare(b.name),
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (role: string) => (
        <span className="text-capitalize">{role || "N/A"}</span>
      ),
      sorter: (a: Staff, b: Staff) => (a.role || "").localeCompare(b.role || ""),
    },
    {
      title: "Branch",
      dataIndex: "branch",
      render: (text: string) => text,
      // sorter: (a: Staff, b: Staff) => (a.branch || "").localeCompare(b.branch || ""),
    },
    {
      title: "Email",
      dataIndex: ["userId", "email"],
      sorter: (a: Staff, b: Staff) => a.userId.email.localeCompare(b.userId.email),
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      sorter: (a: Staff, b: Staff) => a.phoneNumber.localeCompare(b.phoneNumber),
    },
    {
      title: "Date of Join",
      dataIndex: "joiningDate",
      render: (text: string) =>
        new Date(text).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      sorter: (a: Staff, b: Staff) =>
        new Date(a.joiningDate).getTime() - new Date(b.joiningDate).getTime(),
    },
    // {
    //   title: "Action",
    //   dataIndex: "_id",
    //   render: (id: string, record: Staff) => (
    //     <div className="dropdown">
    //       <button
    //         className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
    //         type="button"
    //         data-bs-toggle="dropdown"
    //         aria-expanded="false"
    //       >
    //         <i className="ti ti-dots-vertical fs-14" />
    //       </button>
    //       <ul className="dropdown-menu dropdown-menu-right p-3">
    //         <li>
    //           <Link
    //             className="dropdown-item rounded-1"
    //             to={routes.teacherDetails.replace(":id", record._id)}
    //           >
    //             <i className="ti ti-eye me-2" />
    //             View Details
    //           </Link>
    //         </li>
    //         <li>
    //           <Link
    //             className="dropdown-item rounded-1"
    //             to={routes.editTeacher.replace(":id", record._id)}
    //           >
    //             <i className="ti ti-edit-circle me-2" />
    //             Edit
    //           </Link>
    //         </li>
    //         <li>
    //           <button
    //             className="dropdown-item rounded-1"
    //             type="button"
    //             data-bs-toggle="modal"
    //             data-bs-target="#login_detail"
    //             onClick={() => setSelectedStaffId(record._id)}
    //           >
    //             <i className="ti ti-lock me-2" />
    //             Login Details
    //           </button>
    //         </li>
    //         <li>
    //           <button
    //             className="dropdown-item rounded-1"
    //             type="button"
    //             data-bs-toggle="modal"
    //             data-bs-target="#delete-modal"
    //             onClick={() => setStaffToDelete(record._id)}
    //           >
    //             <i className="ti ti-trash-x me-2" />
    //             Delete
    //           </button>
    //         </li>
    //       </ul>
    //     </div>
    //   ),
    // },
  ];

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Staff List</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">Staff</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    All Staff
                  </li>
                </ol>
              </nav>
            </div>
            {/* <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
              <div className="mb-2">
                <Link to={routes.addTeacher} className="btn btn-primary d-flex align-items-center">
                  <i className="ti ti-square-rounded-plus me-2" />
                  Add Staff
                </Link>
              </div>
            </div> */}
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Staff List</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="me-3 mb-3">
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select Branch"
                    onChange={(value) => setSelectedBranch(value)}
                    allowClear
                    onClear={() => setSelectedBranch(null)}
                  >
                    {branches.map((branch) => (
                      <Option key={branch._id} value={branch._id}>
                        {branch.name}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div className="me-3 mb-3">
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select Role"
                    onChange={(value) => setSelectedRole(value)}
                    allowClear
                    onClear={() => setSelectedRole("")}
                  >
                    {roleOptions.map((role) => (
                      <Option key={role.value} value={role.value}>
                        {role.label}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div className="me-3 mb-3">
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select Session"
                    onChange={(value) => setSelectedSession(value)}
                    value={selectedSession}
                    allowClear
                    onClear={() => setSelectedSession(null)}
                    disabled={!selectedBranch}
                  >
                    {sessions.map((session) => (
                      <Option key={session._id} value={session._id}>
                        {session.name}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div className="me-3 mb-3">
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select Class"
                    onChange={(value) => setSelectedClass(value)}
                    value={selectedClass}
                    allowClear
                    onClear={() => setSelectedClass(null)}
                    disabled={!selectedBranch}
                  >
                    {classes.map((cls) => (
                      <Option key={cls._id} value={cls.name}>
                        {cls.name}
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
                <Table dataSource={filteredStaff} columns={columns}/>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <div
          className="modal fade"
          id="delete-modal"
          tabIndex={-1}
          aria-labelledby="deleteModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="deleteModalLabel">
                  Confirm Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                Are you sure you want to delete this staff member? This action cannot be undone.
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  data-bs-dismiss="modal"
                  onClick={handleDeleteStaff}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <TeacherModal selectedTeacherId={selectedStaffId} />
      </div>
    </>
  );
};

export default StaffListForSuperadmin;