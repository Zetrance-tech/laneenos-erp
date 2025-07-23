import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import StudentModals from "../../peoples/students/studentModals";
import Table from "../../../core/common/dataTable/index";
import TooltipOption from "../../../core/common/tooltipOption";
import axios from "axios";
import { Spin, Select } from "antd";
import { useAuth } from "../../../context/AuthContext";

const { Option } = Select;
const API_URL = process.env.REACT_APP_URL;

interface FetchParams {
  branchId?: string;
  sessionId?: string;
  class?: string;
}

interface Student {
  _id: string;
  admissionNumber: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  admissionDate: string;
  class: string | null;
  classId?: { id: string; name: string };
}

interface Branch {
  _id: string;  // Changed from branchId to _id
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

const StudentListForSuperadmin = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
  }
};

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
  }
};

  // Fetch students with filters
  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const params: FetchParams = {};
      if (selectedBranch) params.branchId = selectedBranch;
      if (selectedSession) params.sessionId = selectedSession;
      if (selectedClass) params.class = selectedClass;

      const res = await axios.get(`${API_URL}/api/student/branch`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const mappedStudents = (res.data?.data || []).map((student: any) => ({
        ...student,
        class: student.classId?.name || "N/A",
      }));
      setStudents(mappedStudents);
      setFilteredStudents(mappedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch branches, sessions, and classes on mount
  useEffect(() => {
    fetchBranches();
    fetchSessions(); // Fetch all sessions initially
    fetchClasses(); // Fetch all classes initially
  }, []);

  // Effect to refetch sessions and classes when branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetchSessions(selectedBranch);
      fetchClasses(selectedBranch, selectedSession ?? undefined);
    } else {
      fetchSessions(); // Fetch all sessions when no branch is selected
      fetchClasses(); // Fetch all classes when no branch is selected
    }
    setSelectedSession(null); // Reset session when branch changes
    setSelectedClass(null); // Reset class when branch changes
  }, [selectedBranch]);

  // Effect to refetch classes when session changes
  useEffect(() => {
    if (selectedSession && selectedBranch) {
      fetchClasses(selectedBranch, selectedSession);
    } else if (selectedBranch) {
      fetchClasses(selectedBranch);
    } else {
      fetchClasses(); // Fetch all classes when no branch or session is selected
    }
    setSelectedClass(null); // Reset class when session changes
  }, [selectedSession]);

  // Effect to fetch students when any filter changes
  useEffect(() => {
    fetchStudents();
  }, [selectedBranch, selectedSession, selectedClass]);

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
      title: "Admission Number",
      dataIndex: "admissionNumber",
      render: (text: string) => (
        // <Link to={routes.studentDetail.replace(":admissionNumber", text)} className="link-primary">
        <p>{text}</p>  
        // </Link>
      ),
      sorter: (a: Student, b: Student) => a.admissionNumber.localeCompare(b.admissionNumber),
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text: string) => (
        <div className="d-flex align-items-center">
          {/* <Link to="#" className="avatar avatar-md">
            <ImageWithBasePath
              src="assets/img/students/student-01.jpg"
              className="img-fluid rounded-circle"
              alt="img"
            />
          </Link> */}
          <div className="ms-2">
            <p className="text-dark mb-0">
              <Link to="#">{text}</Link>
            </p>
          </div>
        </div>
      ),
      sorter: (a: Student, b: Student) => a.name.localeCompare(b.name),
    },
    {
      title: "Class",
      dataIndex: "class",
      render: (text: string) => text,
      sorter: (a: Student, b: Student) => (a.class || "").localeCompare(b.class || ""),
    },
    {
      title: "Gender",
      dataIndex: "gender",
      sorter: (a: Student, b: Student) => a.gender.localeCompare(b.gender),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <>
          {text === "active" ? (
            <span className="badge badge-soft-success d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              Active
            </span>
          ) : (
            <span className="badge badge-soft-danger d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              Inactive
            </span>
          )}
        </>
      ),
      sorter: (a: Student, b: Student) => a.status.localeCompare(b.status),
    },
    {
      title: "Date of Join",
      dataIndex: "admissionDate",
      render: (text: string) =>
        new Date(text).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      sorter: (a: Student, b: Student) =>
        new Date(a.admissionDate).getTime() - new Date(b.admissionDate).getTime(),
    },
    {
      title: "Date of Birth",
      dataIndex: "dateOfBirth",
      render: (text: string) =>
        new Date(text).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      sorter: (a: Student, b: Student) =>
        new Date(a.dateOfBirth).getTime() - new Date(b.dateOfBirth).getTime(),
    },
    // {
    //   title: "Action",
    //   dataIndex: "action",
    //   render: (_: any, record: Student) => (
    //     <div className="d-flex align-items-center">
    //       <div className="dropdown">
    //         <Link
    //           to="#"
    //           className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
    //           data-bs-toggle="dropdown"
    //           aria-expanded="false"
    //         >
    //           <i className="ti ti-dots-vertical fs-14" />
    //         </Link>
    //         <ul className="dropdown-menu dropdown-menu-right p-3">
    //           <li>
    //             <Link
    //               className="dropdown-item rounded-1"
    //               to={routes.studentDetail.replace(":admissionNumber", record.admissionNumber)}
    //             >
    //               <i className="ti ti-menu me-2" />
    //               View Student
    //             </Link>
    //           </li>
    //           <li>
    //             <Link
    //               className="dropdown-item rounded-1"
    //               to={routes.editStudent.replace(":regNo", record.admissionNumber)}
    //             >
    //               <i className="ti ti-edit-circle me-2" />
    //               Edit
    //             </Link>
    //           </li>
    //           <li>
    //             <Link
    //               className="dropdown-item rounded-1"
    //               to="#"
    //               data-bs-toggle="modal"
    //               data-bs-target="#delete-modal"
    //             >
    //               <i className="ti ti-trash-x me-2" />
    //               Delete
    //             </Link>
    //           </li>
    //         </ul>
    //       </div>
    //     </div>
    //   ),
    // },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Students List</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">Students</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    All Students
                  </li>
                </ol>
              </nav>
            </div>
            {/* <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
              <div className="mb-2">
                <Link to={routes.addStudent} className="btn btn-primary d-flex align-items-center">
                  <i className="ti ti-square-rounded-plus me-2" />
                  Add Student
                </Link>
              </div>
            </div> */}
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Students List</h4>
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
                      <Option key={branch._id} value={branch._id}>  {/* Changed from branchId to _id */}
      {branch.name}
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
                    disabled={!selectedBranch} // Disable if no branch is selected
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
                    disabled={!selectedBranch} // Disable if no branch is selected
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
                <Table dataSource={filteredStudents} columns={columns} />
              )}
            </div>
          </div>
        </div>
      </div>
      <StudentModals />
    </>
  );
};

export default StudentListForSuperadmin;