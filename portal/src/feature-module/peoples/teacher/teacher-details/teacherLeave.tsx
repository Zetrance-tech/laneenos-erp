import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { all_routes } from "../../../router/all_routes";
import Table from "../../../../core/common/dataTable/index";
import TeacherSidebar from "./teacherSidebar";
import TeacherBreadcrumb from "./teacherBreadcrumb";
import TeacherModal from "../teacherModal";
import { useAuth } from "../../../../context/AuthContext";
import { Toaster, toast } from "react-hot-toast";

const API_URL = process.env.REACT_APP_URL || "";

const TeacherLeave = () => {
  const routes = all_routes;
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const getStartOfMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  };

  const [startDate, setStartDate] = useState<string>(getStartOfMonth());
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const { token } = useAuth() || {};

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/teacher/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeacher(response.data || null);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch teacher details");
        setLoading(false);
      }
    };

    const fetchAttendance = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/attendance/staff/${id}/period?startDate=${startDate}&endDate=${endDate}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAttendanceData(response.data || []);
      } catch (err: any) {
        console.error("Error fetching attendance:", err);
        toast.error("Failed to fetch attendance data.");
        setAttendanceData([]);
      }
    };

    if (id && token) {
      fetchTeacher();
      fetchAttendance();
    }
  }, [id, startDate, endDate, token]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: "start" | "end") => {
    const value = e.target.value;
    if (type === "start") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  const attendanceColumns = [
    {
      title: "Date",
      dataIndex: "date",
      sorter: (a: any, b: any) => (a.date || "").localeCompare(b.date || ""),
      render: (text: string | null) => text || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string | null) => (
        <span
          className={`badge badge-soft-${text === "Present" ? "success" : text === "Absent" ? "danger" : "warning"} d-inline-flex align-items-center`}
        >
          <i className="ti ti-circle-filled fs-5 me-1"></i>
          {text || "Not Marked"}
        </span>
      ),
      sorter: (a: any, b: any) => (a.status || "").localeCompare(b.status || ""),
    },
  ];

  const presentCount = attendanceData.filter((entry) => entry.status === "Present").length;

  if (loading) return <div className="page-wrapper"><div className="content">Loading...</div></div>;
  if (error) return <div className="page-wrapper"><div className="content"><div className="alert alert-danger">{error}</div></div></div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <TeacherBreadcrumb id={id} />
          </div>
          <div className="row">
            <TeacherSidebar teacher={teacher} />
            <div className="col-xxl-9 col-xl-8">
              <div className="row">
                <div className="col-md-12">
                  <ul className="nav nav-tabs nav-tabs-bottom mb-4">
                    <li>
                      <Link to={routes.teacherDetails.replace(":id", id || "")} className="nav-link">
                        <i className="ti ti-school me-2" />
                        Staff Details
                      </Link>
                    </li>
                    <li>
                      <Link to={routes.teachersRoutine.replace(":id", id || "")} className="nav-link">
                        <i className="ti ti-table-options me-2" />
                        Routine
                      </Link>
                    </li>
                    <li>
                      <Link to={routes.teacherLeaves.replace(":id", id || "")} className="nav-link active">
                        <i className="ti ti-calendar-due me-2" />
                        Attendance
                      </Link>
                    </li>
                    <li>
                      <Link to={routes.teacherSalary.replace(":id", id || "")} className="nav-link">
                        <i className="ti ti-report-money me-2" />
                        Salary
                      </Link>
                    </li>
                    <li>
                      <Link to={routes.teacherLibrary.replace(":id", id || "")} className="nav-link">
                        <i className="ti ti-bookmark-edit me-2" />
                        Library
                      </Link>
                    </li>
                  </ul>
                  <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-1">
                      <h4 className="mb-3">Attendance</h4>
                      <div className="d-flex align-items-center flex-wrap">
                        <div className="me-3 mb-3">
                          <label className="form-label">Start Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={startDate}
                            onChange={(e) => handleDateChange(e, "start")}
                          />
                        </div>
                        <div className="me-3 mb-3">
                          <label className="form-label">End Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={endDate}
                            onChange={(e) => handleDateChange(e, "end")}
                          />
                        </div>
                        <div className="me-3 mb-3">
                          <label className="form-label">Present Days</label>
                          <div className="form-control bg-light fw-bold text-success">
                            {presentCount}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card-body p-0 py-3">
                      <Table
                        dataSource={attendanceData}
                        columns={attendanceColumns}
                        Selection={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TeacherModal />
    </>
  );
};

export default TeacherLeave;