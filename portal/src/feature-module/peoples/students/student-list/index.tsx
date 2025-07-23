import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import Table from "../../../../core/common/dataTable/index";
import TooltipOption from "../../../../core/common/tooltipOption";
import axios from "axios";
import { Modal, Spin, Select, message } from "antd";
import { useAuth } from "../../../../context/AuthContext";

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

const StudentList = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
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
      setClasses(uniqueClasses);
    } catch (error) {
      console.error("Error fetching students:", error);
      message.error("Failed to fetch students");
    } finally {
      setIsLoading(false);
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

  const columns = [
    // ... (unchanged, as per your original code)
    {
      title: "Admission Number",
      dataIndex: "admissionNumber",
      render: (text: string) => (
        <Link to={routes.studentDetail.replace(":admissionNumber", text)} className="link-primary">
          {text}
        </Link>
      ),
      sorter: (a: Student, b: Student) => a.admissionNumber.localeCompare(b.admissionNumber),
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text: string, record: Student) => (
        <div className="d-flex align-items-center">
          <Link to={routes.studentDetail.replace(":admissionNumber", record.admissionNumber)} className="avatar avatar-md">
            <img
              src={record.profileImage}
              className="img-fluid rounded-circle"
              alt="Student"
            />
          </Link>
          <div className="ms-2">
            <p className="text-dark mb-0">
              <Link to={routes.studentDetail.replace(":admissionNumber", record.admissionNumber)}>{text}</Link>
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
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Student) => (
        <div className="d-flex align-items-center">
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
                  to={routes.studentDetail.replace(":admissionNumber", record.admissionNumber)}
                >
                  <i className="ti ti-menu me-2" />
                  View Student
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to={routes.editStudent.replace(":regNo", record.admissionNumber)}
                >
                  <i className="ti ti-edit-circle me-2" />
                  Edit
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  onClick={() => showDeleteModal(record.admissionNumber)}
                >
                  <i className="ti ti-trash-x me-2" />
                  Delete
                </Link>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
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
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Students List</h4>
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
                      <Option key={cls} value={cls}>
                        {cls}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div className="d-flex align-items-center bg-white border rounded-2 p-1 mb-3 me-2">
                  <Link
                    to={routes.studentList}
                    className="active btn btn-icon btn-sm me-1 primary-hover"
                  >
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link
                    to={routes.studentGrid}
                    className="btn btn-icon btn-sm bg-light primary-hover"
                  >
                    <i className="ti ti-grid-dots" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Table dataSource={filteredStudents} columns={columns} Selection={true} />
              )}
            </div>
          </div>
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
    </>
  );
};

export default StudentList;
