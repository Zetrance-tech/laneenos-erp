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
import TooltipOption from "../../../../core/common/tooltipOption";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Spin } from "antd";
import { useAuth } from "../../../../context/AuthContext";

const API_URL = process.env.REACT_APP_URL;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

interface Teacher {
  _id: string; // MongoDB ID
  id: string; // Custom ID for display (e.g., "T001")
  name: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phoneNumber: string;
  address: string; // Updated to match TeacherForm (flat string)
  joiningDate: string;
  qualifications: any[];
  experienceYears: number;
  subjects: string[];
  role: string;
  contractType: string;
  workShift: string;
  workLocation: string;
  languagesSpoken: string[];
  emergencyContact: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
  status?: string;
  class?: string;
  profileImage?: string; // Add this field
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

const TeacherList = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const {token} = useAuth();

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
        ? `${BACKEND_URL}/${photoData.path.replace(/\\/g, "/")}`
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
        setFilteredTeachers(teachersWithImages); // Initialize filteredTeachers
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
      setTeacherToDelete(null);
      toast.success("Teacher deleted successfully");
    } catch (err) {
      setError("Failed to delete teacher");
      console.error("Error deleting teacher:", err);
      toast.error("Failed to delete teacher");
    }
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
      dataIndex: ["userId", "email"],
      sorter: (a: Teacher, b: Teacher) => a.userId.email.localeCompare(b.userId.email),
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
              <button
                className="dropdown-item rounded-1"
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#delete-modal"
                onClick={() => setTeacherToDelete(mongoId)}
              >
                <i className="ti ti-trash-x me-2" />
                Delete
              </button>
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
              <h3 className="page-title mb-1">Staffs List</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="#">Peoples</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Staff List
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
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

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Staff List</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="d-flex align-items-center bg-white border rounded-2 p-1 mb-3 me-2">
                  <Link to="#" className="active btn btn-icon btn-sm me-1 primary-hover">
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link
                    to={routes.teacherGrid}
                    className="btn btn-icon btn-sm bg-light primary-hover"
                  >
                    <i className="ti ti-grid-dots" />
                  </Link>
                </div>
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
                Are you sure you want to delete this teacher? This action cannot be undone.
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
                  onClick={handleDeleteTeacher}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <TeacherModal selectedTeacherId={selectedTeacherId} />
      </div>
    </>
  );
};

export default TeacherList;
