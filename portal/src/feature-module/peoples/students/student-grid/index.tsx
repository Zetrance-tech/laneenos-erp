import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../../router/all_routes';
import ImageWithBasePath from '../../../../core/common/imageWithBasePath';
import TooltipOption from '../../../../core/common/tooltipOption';
import axios from 'axios';
import { Modal, Spin, Select, message } from 'antd';
import { useAuth } from '../../../../context/AuthContext';

const { Option } = Select;
const API_URL = process.env.REACT_APP_URL;

interface Student {
  _id: string;
  admissionNumber: string;
  admissionDate: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  academicYear: string;
  classId?: { _id: string; name: string } | string;
  rollNumber?: string;
  status: 'active' | 'inactive';
  profileImage: string;
  profilePhoto?: {
    filename: string;
    path: string;
    mimetype: string;
    size: number;
  };
}

const StudentGrid = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<{ value: string; label: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const { token } = useAuth();

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove('show');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/student`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const processedStudents = res.data.map((student: any) => ({
        ...student,
        profileImage: student.profilePhoto?.path
          ? `${API_URL}/${student.profilePhoto.path.replace(/\\/g, "/")}`
          : "/assets/img/students/student-01.jpg"
      }));
      setStudents(processedStudents);
      setFilteredStudents(processedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/class`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(res.data.map((c: any) => ({ value: c._id, label: c.name })));
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      setFilteredStudents(
        students.filter((student) =>
          typeof student.classId === 'object' && student.classId?.name
            ? student.classId.name === classes.find((c) => c.value === selectedClass)?.label
            : false
        )
      );
    } else {
      setFilteredStudents(students);
    }
  }, [selectedClass, students, classes]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    try {
      await axios.delete(`${API_URL}/api/student/${studentToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(students.filter((student) => student.admissionNumber !== studentToDelete));
      setFilteredStudents(filteredStudents.filter((student) => student.admissionNumber !== studentToDelete));
      message.success("Student deleted successfully");
      setIsModalVisible(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      message.error("Failed to delete student");
    }
  };

  const showDeleteModal = (admissionNumber: string) => {
    setStudentToDelete(admissionNumber);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setStudentToDelete(null);
  };

  return (
    <div className="page-wrapper">
      <div className="content content-two">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Students</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item">Peoples</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Students Grid
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <TooltipOption />
            <div className="mb-2">
              <Link to={routes.addStudent} className="btn btn-primary d-flex align-items-center">
                <i className="ti ti

-square-rounded-plus me-2" />
                Add Student
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 border rounded-1 d-flex align-items-center justify-content-between flex-wrap mb-4 pb-0">
          <h4 className="mb-3">Students Grid</h4>
          <div className="d-flex align-items-center flex-wrap">
            <div className="me-3 mb-3">
              <Select
                style={{ width: 200 }}
                placeholder="Select Class"
                onChange={(value) => setSelectedClass(value)}
                allowClear
                onClear={() => setSelectedClass(null)}
              >
                {classes.map((cls) => (
                  <Option key={cls.value} value={cls.value}>
                    {cls.label}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="d-flex align-items-center bg-white border rounded-2 p-1 mb-3 me-2">
              <Link to={routes.studentList} className="btn btn-icon btn-sm me-1 bg-light primary-hover">
                <i className="ti ti-list-tree" />
              </Link>
              <Link to={routes.studentGrid} className="active btn btn-icon btn-sm primary-hover">
                <i className="ti ti-grid-dots" />
              </Link>
            </div>
          </div>
        </div>

        <div className="row">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
              <Spin size="large" />
            </div>
          ) : error ? (
            <p className="alert alert-danger mx-3" role="alert">{error}</p>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((item) => (
              <div className="col-xxl-3 col-xl-4 col-md-6 d-flex" key={item._id}>
                <div className="card flex-fill">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <Link to={routes.studentDetail.replace(":admissionNumber", item.admissionNumber)} className="link-primary">
                      {item.admissionNumber}
                    </Link>
                    <div className="d-flex align-items-center">
                      <span
                        className={`badge badge-soft-${item.status === 'active' ? 'success' : 'danger'} d-inline-flex align-items-center me-1`}
                      >
                        <i className="ti ti-circle-filled fs-5 me-1" />
                        {item.status}
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
                              to={routes.studentDetail.replace(":admissionNumber", item.admissionNumber)}
                            >
                              <i className="ti ti-menu me-2" />
                              View Student
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item rounded-1"
                              to={routes.editStudent.replace(":regNo", item.admissionNumber)}
                            >
                              <i className="ti ti-edit-circle me-2" />
                              Edit
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item rounded-1"
                              to={routes.studentPromotion}
                            >
                              <i className="ti ti-arrow-ramp-right-2 me-2" />
                              Promote Student
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item rounded-1"
                              to="#"
                              onClick={() => showDeleteModal(item.admissionNumber)}
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
                          to={routes.studentDetail.replace(":admissionNumber", item.admissionNumber)}
                          className="avatar avatar-lg flex-shrink-0"
                        >
                          <img
                            src={item.profileImage}
                            className="img-fluid rounded-circle"
                            alt="Student"
                          />
                        </Link>
                        <div className="ms-2">
                          <h5 className="mb-0">
                            {item.name}
                          </h5>
                          <p>
                            {typeof item.classId === 'object' && item.classId?.name
                              ? item.classId.name
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between gx-2">
                      <div>
                        <p className="mb-0">Gender</p>
                        <p className="text-dark">{item.gender}</p>
                      </div>
                      <div>
                        <p className="mb-0">DOB</p>
                        <p className="text-dark">{formatDate(item.dateOfBirth)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer d-flex align-items-center justify-content-between">
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No Students Found</p>
          )}
        </div>
      </div>
      <Modal
        title="Confirm Deletion"
        open={isModalVisible}
        onOk={handleDelete}
        onCancel={handleCancel}
        okText="Delete"
        cancelText="Cancel"
        zIndex={10000}
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this student?</p>
      </Modal>
    </div>
  );
};

export default StudentGrid;