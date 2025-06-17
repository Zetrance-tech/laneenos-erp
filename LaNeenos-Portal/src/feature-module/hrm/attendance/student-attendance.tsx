import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import CommonSelect from "../../../core/common/commonSelect";
import {
  AdmissionNumber,
  classSection,
  RollNumber,
  studentclass,
  studentName,
} from "../../../core/common/selectoption/selectoption";
import Table from "../../../core/common/dataTable/index";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import TooltipOption from "../../../core/common/tooltipOption";
import { Spin } from 'antd';
import { useAuth } from "../../../context/AuthContext";
// Interfaces
interface Class {
  _id: string;
  name: string;
  teacherId: { _id: string }[];
}

interface Student {
  id: string; // Added MongoDB _id
  admissionNo: string;
  name: string;
  rollNo?: string;
  class?: string;
  section?: string;
  inTime?: string | null;
  outTime?: string | null;
}

interface AttendanceRecord {
  inTime: string | null;
  outTime: string | null;
}
const API_URL = process.env.REACT_APP_URL;

const StudentAttendance = () => {
  const { token, user } = useAuth();
  const routes = all_routes;
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [markingAttendance, setMarkingAttendance] = useState<Record<string, boolean>>({});
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<
    Record<string, AttendanceRecord>
  >({});
  const [mode, setMode] = useState<"in" | "out">("in");
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const decodedToken = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const role = decodedToken?.role
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
      const fetchedClasses = response.data;
      setClasses(fetchedClasses);
      if (fetchedClasses.length > 0) {
        setSelectedClassId(fetchedClasses[0]._id);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
    finally {
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
      const fetchedStudents: Student[] = response.data.map((student: any) => ({
        id: student.id, // Use MongoDB _id
        admissionNo: student.admissionNo,
        name: student.name,
        rollNo: student.rollNo,
        inTime: student.inTime,
        outTime: student.outTime,
      }));
      setStudents(fetchedStudents);
      console.log("Fetched students:", fetchedStudents);

      const initialAttendance = fetchedStudents.reduce(
        (acc: Record<string, AttendanceRecord>, student) => {
          acc[student.id] = { // Use id as key
            inTime: student.inTime || null,
            outTime: student.outTime || null,
          };
          return acc;
        },
        {}
      );
      setAttendanceData(initialAttendance);
    } catch (error) {
      console.error("Error fetching students and attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClassId(e.target.value);
  };

  const handleMarkAttendance = async (studentId: string) => {
    setMarkingAttendance(prev => ({ ...prev, [studentId]: true }));
    const currentTime = new Date().toISOString();
    const currentRecord = attendanceData[studentId] || { inTime: null, outTime: null };

    const updatedRecord = {
      ...currentRecord,
      [mode === "in" ? "inTime" : "outTime"]: currentTime,
    };

    try {
      await axios.post(
        `${API_URL}/api/attendance`,
        {
          classId: selectedClassId,
          date: selectedDate,
          attendanceRecords: [
            {
              studentId: studentId, // Use MongoDB _id
              inTime: updatedRecord.inTime,
              outTime: updatedRecord.outTime,
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAttendanceData((prev) => ({
        ...prev,
        [studentId]: updatedRecord,
      }));
      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId // Match by id
            ? { ...student, ...updatedRecord }
            : student
        )
      );
      console.log(`Marked ${mode} time for studentId ${studentId}:`, updatedRecord);
    } catch (error) {
      console.error(`Error marking ${mode} time:`, error);
    } finally {
      setMarkingAttendance(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const isStudentIn = (student: Student) => {
    const now = new Date();
    return (
      student.inTime &&
      (!student.outTime || new Date(student.outTime) > now)
    );
  };

  const columns = [
    {
      title: "Admission No",
      dataIndex: "admissionNo",
      render: (text: string) => (
        <Link to="#" className="link-primary">
          {text}
        </Link>
      ),
      sorter: (a: Student, b: Student) => a.admissionNo.localeCompare(b.admissionNo),
    },
    // {
    //   title: "Roll No",
    //   dataIndex: "rollNo",
    //   render: (text: string) => text || "N/A",
    //   sorter: (a: Student, b: Student) =>
    //     (a.rollNo || "").localeCompare(b.rollNo || ""),
    // },
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
      render: () =>
        classes.find((c) => c._id === selectedClassId)?.name || "N/A",
      sorter: (a: Student, b: Student) =>
        (a.class || "").localeCompare(b.class || ""),
    },
    {
  title: "Attendance",
  dataIndex: "attendance",
  render: (text: string, record: Student) => (
    <div className="d-flex align-items-center">
      <button
        className="btn btn-sm btn-primary"
        onClick={() => handleMarkAttendance(record.id)}
        disabled={
          markingAttendance[record.id] ||
          (mode === "in" && record.inTime !== null && record.inTime !== undefined) ||
          (mode === "out" && (record.inTime === null || record.inTime === undefined)) ||
          (mode === "out" && record.outTime !== null && record.outTime !== undefined)
        }
      >
        {markingAttendance[record.id] ? (
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ) : (
          `Mark ${mode === "in" ? "In" : "Out"}`
        )}
      </button>
      <span className="ms-2">
        {record.inTime ? `In: ${new Date(record.inTime).toLocaleTimeString()}` : "Not In"}
        {record.outTime ? ` | Out: ${new Date(record.outTime).toLocaleTimeString()}` : ""}
      </span>
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
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
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
                  >
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              {/* Toggle Button */}
              <div className="d-flex justify-content-start mb-3 px-3">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${mode === "in" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setMode("in")}
                  >
                    Mark In
                  </button>
                  <button
                    type="button"
                    className={`btn ${mode === "out" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setMode("out")}
                  >
                    Mark Out
                  </button>
                </div>
              </div>
              <Spin spinning={loading} size="large">
                {selectedClassId && students.length > 0 ? (
                  <Table dataSource={students} columns={columns} Selection={true} />
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