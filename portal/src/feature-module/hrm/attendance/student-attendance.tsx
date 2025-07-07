import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { Spin } from "antd";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Table from "../../../core/common/dataTable/index";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import { toast } from "react-hot-toast";

// Attendance options array
const ATTENDANCE_OPTIONS = ["Present", "Absent", "Holiday", "Closed"];

// Interfaces
interface Class {
  _id?: string;
  name?: string;
  teacherId?: { _id: string }[];
}

interface Student {
  id?: string;
  admissionNo?: string;
  name?: string;
  status?: string | null;
}

interface AttendanceRecord {
  status?: string | null;
}

const API_URL = process.env.REACT_APP_URL || "";

const StudentAttendance = () => {
  const { token, user } = useAuth() || {};
  const routes = all_routes;
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("Present");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const decodedToken = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const role = decodedToken?.role || "";
  const userId = decodedToken?.userId || "";

  // Fetch classes and students
  useEffect(() => {
    if (token) {
      fetchClasses();
    }
  }, [token]);

  useEffect(() => {
    if (selectedClassId && selectedDate) {
      fetchClassStudents(selectedClassId, selectedDate);
    }
  }, [selectedClassId, selectedDate]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/class`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let fetchedClasses = response.data || [];
      
      // Filter classes for teachers to only show their assigned classes
      if (role === "teacher") {
        fetchedClasses = fetchedClasses.filter((cls: Class) =>
          cls?.teacherId?.some((tid) => tid?._id === userId) || false
        );
      }

      setClasses(fetchedClasses);
      if (fetchedClasses.length > 0) {
        setSelectedClassId(fetchedClasses[0]?._id || null);
      } else {
        setSelectedClassId(null);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (classId: string, date: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/attendance/class/${classId}/${date}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const fetchedStudents: Student[] = (response.data || []).map((student: any) => ({
        id: student?.id || "",
        admissionNo: student?.admissionNo || "",
        name: student?.name || "",
        status: student?.status || null,
      }));
      setStudents(fetchedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setSelectedStudents([]);
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClassId(e.target.value);
    setSelectedStudents([]);
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((student) => student.id || "").filter(Boolean));
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedStudents.length) {
      toast.error("Please select at least one student.");
      return;
    }
    setLoading(true);
    try {
      const attendanceRecords = selectedStudents.map((studentId) => ({
        studentId,
        status,
      }));
      await axios.post(
        `${API_URL}/api/attendance`,
        {
          classId: selectedClassId,
          date: selectedDate,
          attendanceRecords,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStudents((prev) =>
        prev.map((student) =>
          selectedStudents.includes(student.id || "")
            ? { ...student, status }
            : student
        )
      );
      setSelectedStudents([]);
      toast.success("Attendance marked successfully!");
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (studentId: string, currentStatus: string | null) => {
    setIsEditing(studentId);
    setEditStatus(currentStatus || "Present");
  };

  const handleSaveEdit = async (studentId: string) => {
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/attendance`,
        {
          classId: selectedClassId,
          date: selectedDate,
          attendanceRecords: [{ studentId, status: editStatus }],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId ? { ...student, status: editStatus } : student
        )
      );
      setIsEditing(null);
      toast.success("Attendance updated successfully!");
    } catch (error) {
      console.error("Error editing attendance:", error);
      toast.error("Failed to edit attendance.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const columns = [
    {
      title: (
        <input
          type="checkbox"
          checked={selectedStudents.length === students.length && students.length > 0}
          onChange={handleSelectAll}
        />
      ),
      dataIndex: "id",
      render: (id: string) => (
        <input
          type="checkbox"
          checked={selectedStudents.includes(id)}
          onChange={() => handleSelectStudent(id)}
        />
      ),
    },
    {
      title: "Admission No",
      dataIndex: "admissionNo",
      render: (text: string) => (
        <Link to="#" className="link-primary">
          {text || "N/A"}
        </Link>
      ),
      sorter: (a: Student, b: Student) => (a.admissionNo || "").localeCompare(b.admissionNo || ""),
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text: string) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md">
            <ImageWithBasePath
              src="assets/img/students/student-01.jpg"
              className="img-fluid rounded-circle"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <p className="text-dark mb-0">
              <Link to="#">{text || "N/A"}</Link>
            </p>
          </div>
        </div>
      ),
      sorter: (a: Student, b: Student) => (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Class",
      dataIndex: "class",
      render: () =>
        classes.find((c) => c._id === selectedClassId)?.name || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string | null, record: Student) => (
        <div className="d-flex align-items-center" style={{ minWidth: "200px" }}>
          {isEditing === record.id ? (
            <>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="form-control me-2"
                style={{ width: "120px" }}
              >
                {ATTENDANCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-sm btn-success me-2"
                onClick={() => handleSaveEdit(record.id || "")}
              >
                Save
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setIsEditing(null)}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span style={{ minWidth: "80px" }}>{text || "Not Marked"}</span>
              <button
                className="btn btn-sm btn-outline-primary ms-2"
                onClick={() => handleEditClick(record.id || "", text)}
              >
                Edit
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Student Attendance</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="#">Report</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Student Attendance
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Student Attendance List</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="mb-3 me-2">
                  <input
                    type="date"
                    className="form-control"
                    value={selectedDate}
                    onChange={handleDateChange}
                  />
                </div>
                <div className="mb-3 me-2">
                  <select
                    className="form-control"
                    value={selectedClassId || ""}
                    onChange={handleClassChange}
                    disabled={classes.length === 1 && role === "teacher"}
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls._id || ""} value={cls._id || ""}>
                        {cls.name || "N/A"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3 me-2 w-50">
                  <select
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {ATTENDANCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <button
                    className="btn btn-primary"
                    onClick={handleMarkAttendance}
                    disabled={loading || !selectedStudents.length}
                  >
                    Mark Attendance
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              <Spin spinning={loading} size="large">
                {selectedClassId && students.length > 0 ? (
                  <Table dataSource={students} columns={columns} />
                ) : (
                  <p className="px-3">
                    {selectedClassId
                      ? "No students found for this class."
                      : "Please select a class."}
                  </p>
                )}
              </Spin>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;