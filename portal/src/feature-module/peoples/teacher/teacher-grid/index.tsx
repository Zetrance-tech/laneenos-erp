import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../../router/all_routes';
import ImageWithBasePath from '../../../../core/common/imageWithBasePath';
import PredefinedDateRanges from '../../../../core/common/datePicker';
import { allClass, names } from '../../../../core/common/selectoption/selectoption';
import TeacherModal from '../teacherModal';
import CommonSelect from '../../../../core/common/commonSelect';
import TooltipOption from '../../../../core/common/tooltipOption';
import axios from 'axios';
import { Spin, Select, message, Modal } from 'antd';
import { useAuth } from '../../../../context/AuthContext';

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
  profileImage?: string; // Derived field for UI
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

const TeacherGrid = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { token } = useAuth();

  // Function to fetch profile photo for a specific teacher
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
        
        // Fetch profile images for all teachers
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
    // Apply role filter
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

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove('show');
    }
  };

  const handleResetFilters = () => {
    setSelectedRole("");
    setFilteredTeachers(teachers);
  };

  const exportToCSV = () => {
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
      let str = String(field).trim(); // Trim leading/trailing spaces and convert to string
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredTeachers.map((teacher) => [
      escapeCSVField(teacher.id),
      escapeCSVField(teacher.name),
      escapeCSVField(teacher.email),
      escapeCSVField(String(teacher.phoneNumber || '').trim()), // Explicit string + trim for phone
      escapeCSVField(new Date(teacher.dateOfBirth).toLocaleDateString("en-US")),
      escapeCSVField(teacher.gender),
      escapeCSVField(teacher.role),
      escapeCSVField(teacher.address || ""),
      escapeCSVField(String(teacher.emergencyContact || '').trim()), // Explicit string + trim for emergency contact
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
    link.setAttribute("download", "teachers_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success("Teachers exported to CSV successfully");
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content content-two">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Staffs</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">Peoples</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Staffs
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              {/* <TooltipOption /> */}
              <div className="mb-2 me-2">
                <button
                  onClick={exportToCSV}
                  className="btn btn-light fw-medium d-inline-flex align-items-center"
                >
                  <i className="ti ti-file-download me-2" />
                  Export to CSV
                </button>
              </div>
              <div className="mb-2">
                <Link
                  to={routes.addTeacher}
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-square-rounded-plus me-2" />
                  Add Staff
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 border rounded-1 d-flex align-items-center justify-content-between flex-wrap mb-4 pb-0">
            <h4 className="mb-3">Staffs Grid</h4>
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
              <div className="d-flex align-items-center bg-white border rounded-2 p-1 mb-3 me-2">
                <Link
                  to={routes.teacherList}
                  className="btn btn-icon btn-sm me-1 bg-light primary-hover"
                >
                  <i className="ti ti-list-tree" />
                </Link>
                <Link
                  to={routes.teacherGrid}
                  className="active btn btn-icon btn-sm primary-hover"
                >
                  <i className="ti ti-grid-dots" />
                </Link>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
              <Spin size="large" />
            </div>
          ) : error ? (
            <p className="alert alert-danger mx-3" role="alert">{error}</p>
          ) : (
            <div className="row">
              {filteredTeachers.map((teacher) => (
                <div key={teacher.id} className="col-xxl-3 col-xl-4 col-md-6 d-flex">
                  <div className="card flex-fill">
                    <div className="card-header d-flex align-items-center justify-content-between">
                      <Link to={routes.teacherDetails.replace(":id", teacher.id)} className="link-primary">
                        {teacher.id}
                      </Link>
                      <div className="d-flex align-items-center">
                        <span
                          className={`badge badge-soft-${teacher.dateOfLeaving ? "danger" : "success"} d-inline-flex align-items-center me-1`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1" />
                          {teacher.dateOfLeaving ? "Inactive" : "Active"}
                        </span>
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
                                to={routes.editTeacher.replace(":id", teacher.id)}
                              >
                                <i className="ti ti-edit-circle me-2" />
                                Edit
                              </Link>
                            </li>
                            <li>
                              <Link
                                className="dropdown-item rounded-1"
                                to="#"
                                onClick={() => showDeleteModal(teacher._id)}
                              >
                                <i className="ti ti-trash-x me-2" />
                                Delete
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="bg-light-300 rounded-2 p-3 mb-3">
                        <div className="d-flex align-items-center">
                          <Link
                            to={routes.teacherDetails.replace(":id", teacher.id || "")}
                            className="avatar avatar-lg flex-shrink-0"
                          >
                            <img
                              src={teacher.profileImage || "/assets/img/teachers/teacher-01.jpg"}
                              className="img-fluid rounded-circle"
                              alt="Teacher Profile"
                              onError={(e) => {
                                e.currentTarget.src = "/assets/img/teachers/teacher-01.jpg";
                              }}
                            />
                          </Link>
                          <div className="ms-2 d-flex flex-column gap-1">
                            <Link
                              to={routes.teacherDetails.replace(":id", teacher.id || "")}
                              className="text-primary text-decoration-none fw-semibold"
                              title={`View details for ${teacher.name}`}
                              style={{ maxWidth: "200px" }}
                            >
                              <span className="text-truncate d-block">{teacher.name}</span>
                            </Link>
                            <span className="text-muted text-capitalize" style={{ maxWidth: "200px" }}>
                              {teacher.role}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="mb-2">
                          <p className="mb-0">Email</p>
                          <p className="text-dark">{teacher.email}</p>
                        </div>
                        <div>
                          <p className="mb-0">Phone</p>
                          <p className="text-dark">{teacher.phoneNumber}</p>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer d-flex align-items-center justify-content-between">
                      <Link to={routes.teacherDetails.replace(":id", teacher.id || "")} className="btn btn-light btn-sm">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center">
                <Link
                  to="#"
                  className="btn btn-primary d-inline-flex align-items-center"
                >
                  <i className="ti ti-loader-3 me-2" />
                  Load More
                </Link>
              </div>
            </div>
          )}
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

      <TeacherModal />
    </>
  );
};

export default TeacherGrid;
