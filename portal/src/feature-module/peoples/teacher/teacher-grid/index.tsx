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
import { Spin } from 'antd';
import { useAuth } from '../../../../context/AuthContext';
const API_URL = process.env.REACT_APP_URL;

interface Teacher {
  _id: string;
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  role: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  joiningDate: string;
  qualifications: any[];
  experienceYears: number;
  subjects: string[];
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
  const {token} = useAuth();

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get<Teacher[]>(`${API_URL}/api/teacher`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeachers(response.data);
        setFilteredTeachers(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch teachers");
        setLoading(false);
        console.error("Error fetching teachers:", err);
      }
    };

    fetchTeachers();
  }, []);

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
      console.log("Teacher deleted successfully");
    } catch (err) {
      setError("Failed to delete teacher");
      console.error("Error deleting teacher:", err);
    }
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

          <div className="bg-white p-3 border rounded-1 d-flex align-items-center justify-content-between flex-wrap mb-4 pb-0">
            <h4 className="mb-3">Staffs Grid</h4>
            <div className="d-flex align-items-center flex-wrap">
              <div className="input-icon-start mb-3 me-2 position-relative">
                <PredefinedDateRanges />
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
                    <div className="p-3 pb-0 border-bottom">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Role</label>
                            <CommonSelect
                              className="select"
                              options={roleOptions}
                              defaultValue={roleOptions.find((option) => option.value === selectedRole) || roleOptions[0]}
                              onChange={(option) => setSelectedRole(option?.value || "")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 d-flex align-items-center justify-content-end">
                      <Link to="#" className="btn btn-light me-3" onClick={handleResetFilters}>
                        Reset
                      </Link>
                      <Link to={routes.teacherGrid} onClick={handleApplyClick} className="btn btn-primary">
                        Apply
                      </Link>
                    </div>
                  </form>
                </div>
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
                          className={`badge badge-soft-${
                            teacher.status === "Inactive" ? "danger" : "success"
                          } d-inline-flex align-items-center me-1`}
                        >
                          <i className="ti ti-circle-filled fs-5 me-1" />
                          {teacher.status || "Active"}
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
                              <button
                                className="dropdown-item rounded-1"
                                type="button"
                                data-bs-toggle="modal"
                                data-bs-target="#delete-modal"
                                onClick={() => setTeacherToDelete(teacher._id)}
                              >
                                <i className="ti ti-trash-x me-2" />
                                Delete
                              </button>
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
                            <ImageWithBasePath
                              src={`assets/img/teachers/teacher-01.jpg`}
                              className="img-fluid rounded-circle"
                              alt="img"
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
                          <p className="text-dark">{teacher.userId.email}</p>
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

      <TeacherModal />
    </>
  );
};

export default TeacherGrid;