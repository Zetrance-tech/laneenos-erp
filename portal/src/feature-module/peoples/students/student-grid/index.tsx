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
  name: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  admissionDate: string;
  class: string | null;
  classId?: { id: string; name: string };
  profileImage: string;
  profilePhoto?: {
    filename: string;
    path: string;
    mimetype: string;
    size: number;
  };
  bloodGroup: string;
  religion: string;
  category: string;
  fatherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
  };
  motherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
  };
  guardianInfo: {
    name: string;
    relation: string;
    phoneNumber: string;
    email: string;
    occupation: string;
  };
  currentAddress: string;
  permanentAddress: string;
  transportInfo: {
    route: string;
    vehicleNumber: string;
    pickupPoint: string;
  };
  documents: { name: string; path: string }[];
  medicalHistory: {
    condition: string;
    allergies: string[];
    medications: string[];
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
      const mappedStudents = res.data.map((student: any) => ({
        ...student,
        class: student.classId?.name || "N/A",
        profileImage: student.profilePhoto?.path
          ? `${API_URL}/${student.profilePhoto.path.replace(/\\/g, "/")}`
          : "/assets/img/students/student-01.jpg",
      }));
      setStudents(mappedStudents);
      setFilteredStudents(mappedStudents);

      const uniqueClasses = Array.from(
        new Set(mappedStudents.map((student: Student) => student.class).filter((cls: string) => cls !== "N/A"))
      ) as string[];
      setClasses(uniqueClasses.map(cls => ({ value: cls, label: cls })));
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      setFilteredStudents(students.filter((student) => student.class === selectedClass));
    } else {
      setFilteredStudents(students);
    }
  }, [selectedClass, students]);

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

  const exportToCSV = () => {
    const headers = [
      "Admission Number",
      "Name",
      "Class",
      "Gender",
      "Status",
      "Admission Date",
      "Date of Birth",
      "Blood Group",
      "Religion",
      "Category",
      "Father Name",
      "Father Email",
      "Father Phone",
      "Father Occupation",
      "Mother Name",
      "Mother Email",
      "Mother Phone",
      "Mother Occupation",
      "Guardian Name",
      "Guardian Relation",
      "Guardian Email",
      "Guardian Phone",
      "Guardian Occupation",
      "Current Address",
      "Permanent Address",
      "Transport Route",
      "Vehicle Number",
      "Pickup Point",
      "Medical Condition",
      "Allergies",
      "Medications",
      "Documents"
    ];

    const escapeCSVField = (field: any) => {
      if (field === null || field === undefined) return "";
      let str = String(field).trim(); // Trim leading/trailing spaces and convert to string
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredStudents.map((student) => [
      escapeCSVField(student.admissionNumber),
      escapeCSVField(student.name),
      escapeCSVField(student.class || "N/A"),
      escapeCSVField(student.gender),
      escapeCSVField(student.status),
      escapeCSVField(new Date(student.admissionDate).toLocaleDateString("en-US")),
      escapeCSVField(new Date(student.dateOfBirth).toLocaleDateString("en-US")),
      escapeCSVField(student.bloodGroup || ""),
      escapeCSVField(student.religion || ""),
      escapeCSVField(student.category || ""),
      escapeCSVField(student.fatherInfo?.name || ""),
      escapeCSVField(student.fatherInfo?.email || ""),
      escapeCSVField(String(student.fatherInfo?.phoneNumber || '').trim()), // Explicit string + trim for phone
      escapeCSVField(student.fatherInfo?.occupation || ""),
      escapeCSVField(student.motherInfo?.name || ""),
      escapeCSVField(student.motherInfo?.email || ""),
      escapeCSVField(String(student.motherInfo?.phoneNumber || '').trim()), // Explicit string + trim for phone
      escapeCSVField(student.motherInfo?.occupation || ""),
      escapeCSVField(student.guardianInfo?.name || ""),
      escapeCSVField(student.guardianInfo?.relation || ""),
      escapeCSVField(student.guardianInfo?.email || ""),
      escapeCSVField(String(student.guardianInfo?.phoneNumber || '').trim()), // Explicit string + trim for phone
      escapeCSVField(student.guardianInfo?.occupation || ""),
      escapeCSVField(student.currentAddress || ""),
      escapeCSVField(student.permanentAddress || ""),
      escapeCSVField(student.transportInfo?.route || ""),
      escapeCSVField(student.transportInfo?.vehicleNumber || ""),
      escapeCSVField(student.transportInfo?.pickupPoint || ""),
      escapeCSVField(student.medicalHistory?.condition || ""),
      escapeCSVField(student.medicalHistory?.allergies?.join(";") || ""),
      escapeCSVField(student.medicalHistory?.medications?.join(";") || ""),
      escapeCSVField(student.documents?.map((doc) => doc.name).join(";") || "")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "students_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success("Students exported to CSV successfully");
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
              <Link to={routes.addStudent} className="btn btn-primary d-flex align-items-center">
                <i className="ti ti-square-rounded-plus me-2" />
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
                            {item.class || 'N/A'}
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
