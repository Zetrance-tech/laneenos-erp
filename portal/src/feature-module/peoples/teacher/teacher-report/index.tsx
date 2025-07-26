import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CommonSelect from "../../../../core/common/commonSelect";
import {
  allClass,
  names,
  status,
} from "../../../../core/common/selectoption/selectoption";
import TeacherModal from "../teacherModal";
import PredefinedDateRanges from "../../../../core/common/datePicker";
import Table from "../../../../core/common/dataTable/index";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import { Modal, Spin, Select, message } from "antd";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";

const { Option } = Select;
const API_URL = process.env.REACT_APP_URL;

interface Teacher {
  _id: string;
  userId: string;
  role: string;
  branchId: string;
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  joiningDate: string;
  experienceYears: number;
  documents: { name: string; path: string }[];
  payroll: {
    epfNo: string;
    basicSalary: number;
  };
  contractType: string;
  workShift: string;
  workLocation: string;
  dateOfLeaving?: string | null;
  createdAt: string;
  updatedAt: string;
  profilePhoto?: {
    filename: string;
    path: string;
    mimetype: string;
    size: number;
  };
  profileImage?: string;
}

interface Option {
  value: string;
  label: string;
}

const roleOptions: Option[] = [
  { value: "", label: "All Roles" },
  { value: "teacher", label: "Teacher" },
  { value: "maid", label: "Maid" },
  { value: "accountant", label: "Accountant" },
  { value: "librarian", label: "Librarian" },
  { value: "admin", label: "Admin" },
];

const TeacherReport = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { token } = useAuth();

  const fetchTeacherProfilePhoto = async (teacherId: string): Promise<string> => {
    try {
      const response = await axios.get(`${API_URL}/api/teacher/${teacherId}/profile-photo`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const photoData = response.data;
      return photoData.path
        ? `${API_URL}/${photoData.path.replace(/\\/g, "/")}`
        : "/assets/img/teachers/teacher-01.jpg";
    } catch (error) {
      console.error(`Error fetching profile photo for teacher ${teacherId}:`, error);
      return "/assets/img/teachers/teacher-01.jpg";
    }
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get<Teacher[]>(`${API_URL}/api/teacher`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const teachersWithImages = await Promise.all(
          response.data.map(async (teacher) => {
            const profileImage = await fetchTeacherProfilePhoto(teacher.id);
            return { ...teacher, profileImage };
          })
        );
        
        setTeachers(teachersWithImages);
        setFilteredTeachers(teachersWithImages);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch teachers");
        setLoading(false);
        console.error("Error fetching teachers:", err);
      }
    };

    fetchTeachers();
  }, [token]);

  useEffect(() => {
    if (selectedRole) {
      setFilteredTeachers(teachers.filter((teacher) => teacher.role === selectedRole));
    } else {
      setFilteredTeachers(teachers);
    }
  }, [selectedRole, teachers]);

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    try {
      await axios.delete(`${API_URL}/api/teacher/${teacherToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeachers(teachers.filter((teacher) => teacher._id !== teacherToDelete));
      setFilteredTeachers(filteredTeachers.filter((teacher) => teacher._id !== teacherToDelete));
      message.success("Teacher deleted successfully");
      setTeacherToDelete(null);
      setIsModalVisible(false);
    } catch (err) {
      console.error("Error deleting teacher:", err);
      message.error("Failed to delete teacher");
    }
  };

  const showDeleteModal = (teacherId: string) => {
    setTeacherToDelete(teacherId);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setTeacherToDelete(null);
  };

  const handleResetFilters = () => {
    setSelectedRole("");
    setFilteredTeachers(teachers);
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const exportToCSV = (data: Teacher[], filename: string) => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone Number",
      "Date of Birth",
      "Gender",
      "Role",
      "Address",
      "Emergency Contact",
      "Joining Date",
      "Experience Years",
      "Contract Type",
      "Work Shift",
      "Work Location",
      "Date of Leaving",
      "EPF No",
      "Basic Salary",
      "Documents",
    ];

    const escapeCSVField = (field: any) => {
      if (field === null || field === undefined) return "";
      let str = String(field).trim();
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = data.map((teacher) => [
      escapeCSVField(teacher.id),
      escapeCSVField(teacher.name),
      escapeCSVField(teacher.email),
      escapeCSVField(String(teacher.phoneNumber || '').trim()),
      escapeCSVField(new Date(teacher.dateOfBirth).toLocaleDateString("en-US")),
      escapeCSVField(teacher.gender),
      escapeCSVField(teacher.role),
      escapeCSVField(teacher.address || ""),
      escapeCSVField(String(teacher.emergencyContact || '').trim()),
      escapeCSVField(new Date(teacher.joiningDate).toLocaleDateString("en-US")),
      escapeCSVField(teacher.experienceYears),
      escapeCSVField(teacher.contractType),
      escapeCSVField(teacher.workShift),
      escapeCSVField(teacher.workLocation),
      escapeCSVField(teacher.dateOfLeaving ? new Date(teacher.dateOfLeaving).toLocaleDateString("en-US") : ""),
      escapeCSVField(teacher.payroll?.epfNo || ""),
      escapeCSVField(teacher.payroll?.basicSalary || ""),
      escapeCSVField(teacher.documents?.map((doc) => doc.name).join(";") || ""),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(","))
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
    message.success("Teachers exported to CSV successfully");
  };

  const handleExport = () => {
    const filename = selectedRole ? `teachers_${selectedRole}_report.csv` : "teachers_report.csv";
    exportToCSV(filteredTeachers, filename);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      render: (text: string) => (
        <Link to={routes.teacherDetails.replace(":id", text)} className="link-primary">
          {text}
        </Link>
      ),
      sorter: (a: Teacher, b: Teacher) => a.id.localeCompare(b.id),
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text: string, record: Teacher) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md">
            <img
              src={record.profileImage || "/assets/img/teachers/teacher-01.jpg"}
              className="img-fluid rounded-circle"
              alt="Teacher Profile"
              onError={(e) => {
                e.currentTarget.src = "/assets/img/teachers/teacher-01.jpg";
              }}
            />
          </Link>
          <div className="ms-2">
            <p className="text-dark mb-0">
              <Link to={routes.teacherDetails.replace(":id", record.id)}>{text}</Link>
            </p>
          </div>
        </div>
      ),
      sorter: (a: Teacher, b: Teacher) => a.name.localeCompare(b.name),
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (role: string) => (
        <span className="text-capitalize">{role || "N/A"}</span>
      ),
      sorter: (a: Teacher, b: Teacher) => a.role.localeCompare(b.role),
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: (a: Teacher, b: Teacher) => a.email.localeCompare(b.email),
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      sorter: (a: Teacher, b: Teacher) => a.phoneNumber.localeCompare(b.phoneNumber),
    },
    {
      title: "Date Of Join",
      dataIndex: "joiningDate",
      render: (date: string) => new Date(date).toLocaleDateString("en-GB"),
      sorter: (a: Teacher, b: Teacher) =>
        new Date(a.joiningDate).getTime() - new Date(b.joiningDate).getTime(),
    },
    {
      title: "Action",
      dataIndex: "_id",
      render: (mongoId: string, record: Teacher) => (
        <div className="dropdown">
          <button
            className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="ti ti-dots-vertical fs-14" />
          </button>
          <ul className="dropdown-menu dropdown-menu-right p-3">
            <li>
              <Link
                className="dropdown-item rounded-1"
                to={routes.teacherDetails.replace(":id", record.id)}
              >
                <i className="ti ti-eye me-2" />
                View Details
              </Link>
            </li>
            <li>
              <Link
                className="dropdown-item rounded-1"
                to={routes.editTeacher.replace(":id", record.id)}
              >
                <i className="ti ti-edit-circle me-2" />
                Edit
              </Link>
            </li>
            <li>
              <button
                className="dropdown-item rounded-1"
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#login_detail"
                onClick={() => setSelectedTeacherId(record.id)}
              >
                <i className="ti ti-lock me-2" />
                Login Details
              </button>
            </li>
            <li>
              <Link
                className="dropdown-item rounded-1"
                to="#"
                onClick={() => showDeleteModal(mongoId)}
              >
                <i className="ti ti-trash-x me-2" />
                Delete
              </Link>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Staff Report</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="#">Peoples</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Staff Report
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2 me-2">
                <button
                  onClick={handleExport}
                  className="btn btn-light fw-medium d-inline-flex align-items-center"
                >
                  <i className="ti ti-file-download me-2" />
                  Export to CSV
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Staff Report</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="me-3 mb-3">
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select Role"
                    value={selectedRole}
                    onChange={(value) => setSelectedRole(value)}
                    allowClear
                    onClear={() => setSelectedRole("")}
                  >
                    {roleOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </div>
                {/* <div className="d-flex align-items-center bg-white border rounded-2 p-1 mb-3 me-2">
                  <Link to={routes.teacherList} className="btn btn-icon btn-sm me-1 primary-hover">
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link
                    to={routes.teacherGrid}
                    className="btn btn-icon btn-sm bg-light primary-hover"
                  >
                    <i className="ti ti-grid-dots" />
                  </Link>
                </div> */}
              </div>
            </div>
            <div className="card-body p-0 py-3">
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                  <Spin size="large" />
                </div>
              ) : error ? (
                <p className="alert alert-danger mx-3" role="alert">{error}</p>
              ) : (
                <Table dataSource={filteredTeachers} columns={columns} Selection={true} />
              )}
            </div>
          </div>
        </div>

        <Modal
          title="Confirm Deletion"
          open={isModalVisible}
          onOk={handleDeleteTeacher}
          onCancel={handleCancel}
          okText="Delete"
          cancelText="Cancel"
          zIndex={10000}
          okButtonProps={{ danger: true }}
        >
          <p>Are you sure you want to delete this teacher? This action cannot be undone.</p>
        </Modal>

        <TeacherModal selectedTeacherId={selectedTeacherId} />
      </div>
    </>
  );
};

export default TeacherReport;