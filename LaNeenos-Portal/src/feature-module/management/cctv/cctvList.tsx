import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import Table from "../../../core/common/dataTable/index";
import TooltipOption from "../../../core/common/tooltipOption";
import toast, { Toaster } from "react-hot-toast";
import { Spin } from "antd";
import { useAuth } from "../../../context/AuthContext";
const API_URL = process.env.REACT_APP_URL || "";
// Define interfaces for type safety
interface Session {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt?: string;
}

interface Class {
  _id: string;
  name: string;
}

interface Parent {
  email: string;
  name: string;
  phoneNumber: string;
  type: string; // "father" or "mother"
  studentId: string;
  studentName: string;
  showCCTV: boolean;
  cctvStartTime: string;
  cctvEndTime: string;
}

interface ParentData {
  session: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  class: {
    id: string;
    name: string;
  };
  parents: Parent[];
}

const ParentCCTVList: React.FC = () => {
  const { token, user } = useAuth();
  const routes = all_routes;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [parentData, setParentData] = useState<ParentData>({
    session: { id: "", name: "", startDate: "", endDate: "" },
    class: { id: "", name: "" },
    parents: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTimeModal, setShowTimeModal] = useState<boolean>(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedParentType, setSelectedParentType] = useState<string>(""); // Track parent type
  const [tempStartTime, setTempStartTime] = useState<string>("");
  const [tempEndTime, setTempEndTime] = useState<string>("");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Session[]>(`${API_URL}/api/session/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sortedSessions = response.data.sort((a: any, b: any) =>
        (a.createdAt ? new Date(b.createdAt).getTime() : new Date(b.endDate).getTime()) -
        (a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.endDate).getTime())
      );
      setSessions(sortedSessions);
      if (sortedSessions.length > 0) {
        setSelectedSessionId(sortedSessions[0]._id);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSessionId) {
      fetchClasses();
    } else {
      setClasses([]);
      setSelectedClassId("");
      setParentData({ session: { id: "", name: "", startDate: "", endDate: "" }, class: { id: "", name: "" }, parents: [] });
      setError(null);
    }
  }, [selectedSessionId]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Class[]>(`${API_URL}/api/class/session/${selectedSessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sortedClasses = response.data.sort((a: any, b: any) =>
        (a.createdAt ? new Date(b.createdAt).getTime() : 0) -
        (b.createdAt ? new Date(a.createdAt).getTime() : 0)
      );
      if (response.data.length === 0) {
        setError("No classes available for this session");
        toast.error("No classes available for this session");
        setClasses([]);
        setSelectedClassId("");
        setParentData({ session: { id: "", name: "", startDate: "", endDate: "" }, class: { id: "", name: "" }, parents: [] });
      } else {
        setClasses(response.data);
        setSelectedClassId("");
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch classes");
      setClasses([]);
      setSelectedClassId("");
      setParentData({ session: { id: "", name: "", startDate: "", endDate: "" }, class: { id: "", name: "" }, parents: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSessionId && selectedClassId) {
      fetchParents();
    } else {
      setParentData({ session: { id: "", name: "", startDate: "", endDate: "" }, class: { id: "", name: "" }, parents: [] });
      if (selectedSessionId && !selectedClassId && !error) {
        setError("Please select a class");
      }
    }
  }, [selectedSessionId, selectedClassId]);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const response = await axios.get<ParentData>(
        `${API_URL}/api/student/cctv-access?sessionId=${selectedSessionId}&classId=${selectedClassId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setParentData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch parent data");
      setParentData({ session: { id: "", name: "", startDate: "", endDate: "" }, class: { id: "", name: "" }, parents: [] });
    } finally {
      setLoading(false);
    }
  };

  const toggleCCTVAccess = async (studentId: string, parentType: string, currentStatus: boolean) => {
    try {
      const response = await axios.put<{ studentId: string; parentType: string; showCCTV: boolean }>(
        `${API_URL}/api/student/cctv-access/${studentId}`,
        { parentType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setParentData((prev) => ({
        ...prev,
        parents: prev.parents.map((parent) =>
          parent.studentId === studentId && parent.type === parentType
            ? { ...parent, showCCTV: response.data.showCCTV }
            : parent
        ),
      }));
      setError(null);
      toast.success(`CCTV access ${response.data.showCCTV ? "enabled" : "disabled"} for ${parentType}`);
    } catch (err: any) {
      console.error("Error toggling CCTV access:", err);
      setError(err.response?.data?.message || "Failed to toggle CCTV access");
      toast.error(err.response?.data?.message || "Failed to toggle CCTV access");
    }
  };

  const openTimeModal = (studentId: string, parentType: string, startTime: string, endTime: string) => {
    setSelectedStudentId(studentId);
    setSelectedParentType(parentType);
    setTempStartTime(startTime ? startTime.split(" ")[0] : "");
    setTempEndTime(endTime ? endTime.split(" ")[0] : "");
    setShowTimeModal(true);
  };

  const closeTimeModal = () => {
    setShowTimeModal(false);
    setSelectedStudentId("");
    setSelectedParentType("");
    setTempStartTime("");
    setTempEndTime("");
  };

  const updateCCTVTimes = async () => {
    try {
      if (!tempStartTime && !tempEndTime) {
        const response = await axios.put<{ studentId: string; parentType: string; cctvStartTime: string; cctvEndTime: string }>(
          `${API_URL}/api/student/cctv-times/${selectedStudentId}`,
          { cctvStartTime: "", cctvEndTime: "", parentType: selectedParentType },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setParentData((prev) => ({
          ...prev,
          parents: prev.parents.map((parent) =>
            parent.studentId === selectedStudentId && parent.type === selectedParentType
              ? {
                  ...parent,
                  cctvStartTime: response.data.cctvStartTime,
                  cctvEndTime: response.data.cctvEndTime,
                }
              : parent
          ),
        }));
        setError(null);
        toast.success("CCTV times cleared successfully");
        closeTimeModal();
        return;
      }

      if (!tempStartTime || !tempEndTime) {
        setError("Both start and end times are required");
        toast.error("Both time and endTime are required");
        return;
      }

      const formatTime = (time: string): string => {
        if (!time) return "";
        const [hours, minutes] = time.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const formattedHours = hours % 12 || 12;
        return `${formattedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
      };

      const formattedStartTime = formatTime(tempStartTime);
      const formattedEndTime = formatTime(tempEndTime);

      const parseTime = (timeStr: string): number => {
        if (!timeStr) return 0;
        const [time, period] = timeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
        if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      if (parseTime(formattedStartTime) >= parseTime(formattedEndTime)) {
        setError("Start time must be before end time");
        toast.error("Start time must be before end time");
        return;
      }

      const response = await axios.put<{ studentId: string; parentType: string; cctvStartTime: string; cctvEndTime: string }>(
        `${API_URL}/api/student/cctv-times/${selectedStudentId}`,
        { cctvStartTime: formattedStartTime, cctvEndTime: formattedEndTime, parentType: selectedParentType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setParentData((prev) => ({
        ...prev,
        parents: prev.parents.map((parent) =>
          parent.studentId === selectedStudentId && parent.type === selectedParentType
            ? {
                ...parent,
                cctvStartTime: response.data.cctvStartTime,
                cctvEndTime: response.data.cctvEndTime,
              }
            : parent
        ),
      }));
      setError(null);
      toast.success("CCTV times updated successfully");
      closeTimeModal();
    } catch (err: any) {
      console.error("Error updating CCTV times:", err);
      setError(err.response?.data?.message || "Failed to update CCTV times");
      toast.error(err.response?.data?.message || "Failed to update CCTV times");
    }
  };

  const columns = [
    {
      title: "Parent Name",
      dataIndex: "name" as keyof Parent,
      sorter: (a: Parent, b: Parent) => a.name.localeCompare(b.name),
    },
    {
      title: "Student Name",
      dataIndex: "studentName" as keyof Parent,
      sorter: (a: Parent, b: Parent) => a.studentName.localeCompare(b.studentName),
    },
    {
      title: "Type",
      dataIndex: "type" as keyof Parent,
      render: (text: string) => text.charAt(0).toUpperCase() + text.slice(1),
    },
    {
      title: "Email",
      dataIndex: "email" as keyof Parent,
      sorter: (a: Parent, b: Parent) => a.email.localeCompare(b.email),
    },
    {
      title: "CCTV Access",
      dataIndex: "showCCTV" as keyof Parent,
      render: (text: boolean, record: Parent) => (
        <div className="form-check form-switch">
          <input
            type="checkbox"
            className="form-check-input"
            checked={text}
            onChange={() => toggleCCTVAccess(record.studentId, record.type, text)}
          />
          <label className="form-check-label">{text ? "Yes" : "No"}</label>
        </div>
      ),
    },
    {
      title: "CCTV Start Time",
      dataIndex: "cctvStartTime" as keyof Parent,
      render: (text: string) => <span>{text || ""}</span>,
    },
    {
      title: "CCTV End Time",
      dataIndex: "cctvEndTime" as keyof Parent,
      render: (text: string) => <span>{text || ""}</span>,
    },
    {
      title: "Set Times",
      dataIndex: "studentId" as keyof Parent,
      render: (_: string, record: Parent) => (
        <button
          className="btn btn-sm btn-primary"
          onClick={() => openTimeModal(record.studentId, record.type, record.cctvStartTime, record.cctvEndTime)}
          disabled={!record.showCCTV}
        >
          Set Times
        </button>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Parent CCTV Access</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Parent CCTV Access
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <TooltipOption />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-1">
                <h4 className="mb-3">Select Session and Class</h4>
                <div className="d-flex align-items-center flex-wrap">
                  <div className="me-3 mb-3">
                    <label className="form-label">Session</label>
                    <select
                      className="form-select"
                      value={selectedSessionId}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setSelectedSessionId(e.target.value);
                        setSelectedClassId("");
                        setError(null);
                      }}
                    >
                      <option value="">Select Session</option>
                      {sessions.length > 0 ? (
                        sessions.map((session) => (
                          <option key={session._id} value={session._id}>
                            {session.name} (
                            {new Date(session.startDate).toLocaleDateString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              year: "numeric",
                            })}
                            -
                            {new Date(session.endDate).toLocaleDateString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              year: "numeric",
                            })}
                            )
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No sessions available
                        </option>
                      )}
                    </select>
                  </div>
                  <div className="me-3 mb-3">
                    <label className="form-label">Class</label>
                    <select
                      className="form-select"
                      value={selectedClassId}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setSelectedClassId(e.target.value);
                        setError(null);
                      }}
                      disabled={!selectedSessionId}
                    >
                      <option value="">Select Class</option>
                      {classes.length > 0 ? (
                        classes.map((cls) => (
                          <option key={cls._id} value={cls._id}>
                            {cls.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No classes available
                        </option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-body p-0 py-3">
                {loading ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="alert alert-danger mx-3" role="alert">
                        {error}
                      </div>
                    )}
                    {selectedSessionId && selectedClassId ? (
                      parentData.parents.length > 0 ? (
                        <>
                          <h5 className="px-3 mb-3">
                            Session: {parentData.session.name} | Class: {parentData.class.name}
                          </h5>
                          <Table dataSource={parentData.parents} columns={columns} Selection={false} />
                        </>
                      ) : (
                        <p className="px-3">No parents found for this class.</p>
                      )
                    ) : (
                      <p className="px-3">
                        {selectedSessionId ? "Please select a class." : "Please select a session and class."}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTimeModal && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex={-1} aria-labelledby="timeModalLabel" aria-hidden="false">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="timeModalLabel">
                  Set CCTV Times for {selectedParentType.charAt(0).toUpperCase() + selectedParentType.slice(1)}
                </h5>
                <button type="button" className="btn-close" onClick={closeTimeModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={tempStartTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempStartTime(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={tempEndTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeTimeModal}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={updateCCTVTimes}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showTimeModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default ParentCCTVList;