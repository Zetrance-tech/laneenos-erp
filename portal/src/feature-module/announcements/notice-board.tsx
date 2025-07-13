import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";
import TooltipOption from "../../core/common/tooltipOption";
import CommonSelect from "../../core/common/commonSelect";
import axios from "axios";
import Table from "../../core/common/dataTable/index";
import { Modal } from "bootstrap";
import toast, { Toaster } from "react-hot-toast";
import { Spin, Descriptions } from "antd";
import { useAuth } from "../../context/AuthContext";

const API_URL = process.env.REACT_APP_URL;

interface Notice {
  _id: string;
  title: string;
  noticeDate: string;
  publishOn: string;
  message: string;
  messageTo: string[];
  sessionId?: { _id: string; name: string } | string; // Updated to handle populated session
  classIds?: Array<{ _id: string; name: string }> | string[]; // Updated to handle populated classes
  createdAt: string;
  attachment: string | null;
}

interface Session {
  _id: string;
  name: string;
}

interface Class {
  _id: string;
  name: string;
}

interface FormData {
  title: string;
  noticeDate: string;
  publishOn: string;
  message: string;
  messageTo: string;
  sessionId: string;
  classId: string;
}

interface Option {
  value: string;
  label: string;
}

const messageToOptions: Option[] = [
  { label: "Parent", value: "Parent" },
  { label: "Teacher", value: "Teacher" },
  { label: "Both", value: "Both" },
];

const roleOptions: Option[] = [
  { label: "All Roles", value: "all" },
  { label: "Parent", value: "Parent" },
  { label: "Teacher", value: "Teacher" },
];

const NoticeBoard: React.FC = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    noticeDate: "",
    publishOn: "",
    message: "",
    messageTo: "Parent",
    sessionId: "",
    classId: "",
  });
  const [editNotice, setEditNotice] = useState<Notice | null>(null);
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFormLoading, setIsFormLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const { token, user } = useAuth();
  const userRole = user?.role || "student";

  // Fetch notices based on role
  const fetchNoticesByRole = async () => {
    try {
      setIsLoading(true);
      const endpoint =
        userRole === "admin" || userRole === "superadmin"
          ? `${API_URL}/api/notices`
          : `${API_URL}/api/notices/role/${userRole}`;
      const response = await axios.get<Notice[]>(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Log the response to debug
      console.log("Fetched notices:", response.data);
      setNotices(response.data);
    } catch (error) {
      console.error(`Error fetching notices for role ${userRole}:`, error);
      toast.error("Failed to fetch notices");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      const response = await axios.get<Session[]>(`${API_URL}/api/session/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Log sessions to debug
      console.log("Fetched sessions:", response.data);
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to fetch sessions");
    }
  };

  // Fetch classes for a session
  const fetchClasses = async (sessionId: string) => {
    if (!sessionId || typeof sessionId !== "string") return;
    try {
      setIsFormLoading(true);
      const response = await axios.get<Class[]>(`${API_URL}/api/class/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Log classes to debug
      console.log("Fetched classes:", response.data);
      setClasses(response.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to fetch classes");
    } finally {
      setIsFormLoading(false);
    }
  };

  useEffect(() => {
    fetchNoticesByRole();
    fetchSessions();
  }, [userRole]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "sessionId" && value) {
      setFormData({ ...formData, [name]: value, classId: "" });
      setClasses([]);
      fetchClasses(value);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle CommonSelect changes
  const handleSelectChange = (option: Option | null, name: string) => {
    if (option) {
      if (name === "filterRole") {
        setFilterRole(option.value);
      } else {
        setFormData({ ...formData, [name]: option.value });
        if (name === "sessionId") {
          setClasses([]);
          fetchClasses(option.value);
        }
      }
    }
  };

  // Handle add notice
  // Handle add notice
const handleAddNotice = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.title || !formData.noticeDate || !formData.publishOn || !formData.message || !formData.sessionId || !formData.classId) {
    toast.error("All fields are required");
    return;
  }
  try {
    setIsFormLoading(true);
    const payload = {
      title: formData.title,
      noticeDate: new Date(formData.noticeDate).toISOString(),
      publishOn: new Date(formData.publishOn).toISOString(),
      message: formData.message,
      messageTo: formData.messageTo === "Both" ? ["Parent", "Teacher"] : [formData.messageTo],
      sessionId: formData.sessionId,
      classIds: formData.classId === "all" ? classes.map(cls => cls._id) : [formData.classId],
    };
    await axios.post(`${API_URL}/api/notices`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Notice added successfully");
    setFormData({
      title: "",
      noticeDate: "",
      publishOn: "",
      message: "",
      messageTo: "Parent",
      sessionId: "",
      classId: "",
    });
    setClasses([]);
    fetchNoticesByRole();
    const modal = document.getElementById("add_notice");
    if (modal) {
      const modalInstance = Modal.getInstance(modal) || new Modal(modal);
      modalInstance.hide();
    }
  } catch (error) {
    console.error("Error adding notice:", error);
    toast.error("Failed to add notice");
  } finally {
    setIsFormLoading(false);
  }
};

// Handle edit notice
const handleEditNotice = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editNotice) return;
  if (!formData.title || !formData.noticeDate || !formData.publishOn || !formData.message || !formData.sessionId || !formData.classId) {
    toast.error("All fields are required");
    return;
  }
  try {
    setIsFormLoading(true);
    const payload = {
      title: formData.title,
      noticeDate: new Date(formData.noticeDate).toISOString(),
      publishOn: new Date(formData.publishOn).toISOString(),
      message: formData.message,
      messageTo: formData.messageTo === "Both" ? ["Parent", "Teacher"] : [formData.messageTo],
      sessionId: formData.sessionId,
      classIds: formData.classId === "all" ? classes.map(cls => cls._id) : [formData.classId],
    };
    await axios.put(`${API_URL}/api/notices/${editNotice._id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Notice updated successfully");
    setFormData({
      title: "",
      noticeDate: "",
      publishOn: "",
      message: "",
      messageTo: "Parent",
      sessionId: "",
      classId: "",
    });
    setClasses([]);
    setEditNotice(null);
    fetchNoticesByRole();
    const modal = document.getElementById("edit_notice");
    if (modal) {
      const modalInstance = Modal.getInstance(modal) || new Modal(modal);
      modalInstance.hide();
    }
  } catch (error) {
    console.error("Error updating notice:", error);
    toast.error("Failed to update notice");
  } finally {
    setIsFormLoading(false);
  }
};

  // Handle edit click
  const handleEditClick = (notice: Notice) => {
  setEditNotice(notice);
  const sessionId = typeof notice.sessionId === "string" ? notice.sessionId : notice.sessionId?._id || "";
  setFormData({
    title: notice.title,
    noticeDate: new Date(notice.noticeDate).toISOString().split("T")[0],
    publishOn: new Date(notice.publishOn).toISOString().split("T")[0],
    message: notice.message,
    messageTo: notice.messageTo.includes("Parent") && notice.messageTo.includes("Teacher") ? "Both" : notice.messageTo[0] || "Parent",
    sessionId,
    classId: Array.isArray(notice.classIds) && notice.classIds.length > 0 
      ? (typeof notice.classIds[0] === "string" ? notice.classIds[0] : notice.classIds[0]._id) 
      : "all",
  });
  if (sessionId) {
    fetchClasses(sessionId);
  }
};

  // Handle edit notice
  // const handleEditNotice = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!editNotice) return;
  //   if (!formData.title || !formData.noticeDate || !formData.publishOn || !formData.message || !formData.sessionId || !formData.classId) {
  //     toast.error("All fields are required");
  //     return;
  //   }
  //   try {
  //     setIsFormLoading(true);
  //     const payload = {
  //       title: formData.title,
  //       noticeDate: new Date(formData.noticeDate).toISOString(),
  //       publishOn: new Date(formData.publishOn).toISOString(),
  //       message: formData.message,
  //       messageTo: formData.messageTo === "Both" ? ["Parent", "Teacher"] : [formData.messageTo],
  //       sessionId: formData.sessionId,
  //       classIds: formData.classId === "all" ? [] : [formData.classId],
  //     };
  //     await axios.put(`${API_URL}/api/notices/${editNotice._id}`, payload, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     toast.success("Notice updated successfully");
  //     setFormData({
  //       title: "",
  //       noticeDate: "",
  //       publishOn: "",
  //       message: "",
  //       messageTo: "Parent",
  //       sessionId: "",
  //       classId: "",
  //     });
  //     setClasses([]);
  //     setEditNotice(null);
  //     fetchNoticesByRole();
  //     const modal = document.getElementById("edit_notice");
  //     if (modal) {
  //       const modalInstance = Modal.getInstance(modal) || new Modal(modal);
  //       modalInstance.hide();
  //     }
  //   } catch (error) {
  //     console.error("Error updating notice:", error);
  //     toast.error("Failed to update notice");
  //   } finally {
  //     setIsFormLoading(false);
  //   }
  // };

  // Handle delete click
  const handleDeleteClick = async (notice: Notice) => {
    setNoticeToDelete(notice);
    try {
      setIsFormLoading(true);
      await axios.delete(`${API_URL}/api/notices/${notice._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Notice deleted successfully");
      setNotices((prev) => prev.filter((n) => n._id !== notice._id));
      setNoticeToDelete(null);
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast.error("Failed to delete notice");
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter apply
  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const filteredNotices = notices
    .filter((notice) => {
      if (filterRole !== "all") {
        return notice.messageTo.includes(filterRole);
      }
      return true;
    })
    .filter((notice) =>
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const columns = [
    {
      title: "",
      key: "status-dot",
      width: 20,
      render: () => (
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#ffff",
            marginLeft: 15,
          }}
        />
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      sorter: (a: Notice, b: Notice) => a.title.localeCompare(b.title),
    },
    {
      title: "Added On",
      dataIndex: "createdAt",
      render: (text: string) => new Date(text).toLocaleDateString(),
      sorter: (a: Notice, b: Notice) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Notice) => (
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
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#view_notice"
                onClick={() => setEditNotice(record)}
              >
                <i className="ti ti-eye me-2" />
                View Details
              </Link>
            </li>
            {["admin", "superadmin", "teacher"].includes(userRole.toLowerCase()) && (
              <>
                <li>
                  <Link
                    className="dropdown-item rounded-1"
                    to="#"
                    data-bs-toggle="modal"
                    data-bs-target="#edit_notice"
                    onClick={() => handleEditClick(record)}
                  >
                    <i className="ti ti-edit-circle me-2" />
                    Edit
                  </Link>
                </li>
                <li>
                  <Link
                    className="dropdown-item rounded-1"
                    to="#"
                    onClick={() => handleDeleteClick(record)}
                  >
                    <i className="ti ti-trash-x me-2" />
                    Delete
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />

      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Communication Board</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">Announcement</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Communication Board
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
              {["admin", "superadmin", "teacher"].includes(userRole.toLowerCase()) && (
                <div className="mb-2">
                  <Link
                    to="#"
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#add_notice"
                  >
                    <i className="ti ti-square-rounded-plus-filled me-2" />
                    Add Message
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Notices</h4>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                <div className="mb-3">
                  <CommonSelect
                    className="select"
                    options={roleOptions}
                    defaultValue={roleOptions.find((option) => option.value === filterRole)}
                    onChange={(option) => handleSelectChange(option, "filterRole")}
                  />
                </div>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                  <Spin size="large" />
                </div>
              ) : notices.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <p>No notices found for your role.</p>
                </div>
              ) : (
                <Table columns={columns} dataSource={filteredNotices} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Notice Modal */}
      {["admin", "superadmin", "teacher"].includes(userRole.toLowerCase()) && (
        <div className="modal fade" id="add_notice">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Message</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => {
                    setFormData({
                      title: "",
                      noticeDate: "",
                      publishOn: "",
                      message: "",
                      messageTo: "Parent",
                      sessionId: "",
                      classId: "",
                    });
                    setClasses([]);
                    setIsFormLoading(false);
                  }}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form onSubmit={handleAddNotice}>
                <div className="modal-body">
                  {isFormLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                      <Spin size="large" />
                    </div>
                  ) : (
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Session</label>
                          <CommonSelect
                            className="select"
                            options={sessions.map((session) => ({
                              label: session.name,
                              value: session._id,
                            }))}
                            defaultValue={
                              formData.sessionId
                                ? {
                                    label: sessions.find((s) => s._id === formData.sessionId)?.name || "",
                                    value: formData.sessionId,
                                  }
                                : undefined
                            }
                            onChange={(option) => handleSelectChange(option, "sessionId")}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Class</label>
                          <CommonSelect
                            className="select"
                            options={[
                              { label: "All Classes", value: "all" },
                              ...classes.map((cls) => ({
                                label: cls.name,
                                value: cls._id,
                              })),
                            ]}
                            defaultValue={
                              formData.classId
                                ? {
                                    label: classes.find((c) => c._id === formData.classId)?.name || "All Classes",
                                    value: formData.classId,
                                  }
                                : { label: "All Classes", value: "all" }
                            }
                            onChange={(option) => handleSelectChange(option, "classId")}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Visibility</label>
                          <CommonSelect
                            className="select"
                            options={messageToOptions}
                            defaultValue={messageToOptions.find((option) => option.value === formData.messageTo)}
                            onChange={(option) => handleSelectChange(option, "messageTo")}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Title</label>
                          <input
                            type="text"
                            className="form-control"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Notice Date</label>
                          <input
                            type="date"
                            className="form-control"
                            name="noticeDate"
                            value={formData.noticeDate}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Publish On</label>
                          <input
                            type="date"
                            className="form-control"
                            name="publishOn"
                            value={formData.publishOn}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Attachment</label>
                          <div className="bg-light p-3 rounded">
                            <p>Upload size of 4MB, Accepted Format PDF</p>
                            <button type="button" className="btn btn-primary">
                              <i className="ti ti-file-upload me-2" />
                              Upload
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Details</label>
                          <textarea
                            className="form-control"
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            rows={4}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <Link
                    to="#"
                    className="btn btn-light me-2"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary" disabled={isFormLoading}>
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {["admin", "superadmin", "teacher"].includes(userRole.toLowerCase()) && (
        <div className="modal fade" id="edit_notice">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Message</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => {
                    setFormData({
                      title: "",
                      noticeDate: "",
                      publishOn: "",
                      message: "",
                      messageTo: "Parent",
                      sessionId: "",
                      classId: "",
                    });
                    setClasses([]);
                    setEditNotice(null);
                    setIsFormLoading(false);
                  }}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form onSubmit={handleEditNotice}>
                <div className="modal-body">
                  {isFormLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                      <Spin size="large" />
                    </div>
                  ) : (
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Session</label>
                          <CommonSelect
                            className="select"
                            options={sessions.map((session) => ({
                              label: session.name,
                              value: session._id,
                            }))}
                            defaultValue={
                              formData.sessionId
                                ? {
                                    label: sessions.find((s) => s._id === formData.sessionId)?.name || "",
                                    value: formData.sessionId,
                                  }
                                : undefined
                            }
                            onChange={(option) => handleSelectChange(option, "sessionId")}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Class</label>
                          <CommonSelect
                            className="select"
                            options={[
                              { label: "All Classes", value: "all" },
                              ...classes.map((cls) => ({
                                label: cls.name,
                                value: cls._id,
                              })),
                            ]}
                            defaultValue={
                              formData.classId
                                ? {
                                    label: classes.find((c) => c._id === formData.classId)?.name || "All Classes",
                                    value: formData.classId,
                                  }
                                : { label: "All Classes", value: "all" }
                            }
                            onChange={(option) => handleSelectChange(option, "classId")}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Visibility</label>
                          <CommonSelect
                            className="select"
                            options={messageToOptions}
                            defaultValue={messageToOptions.find((option) => option.value === formData.messageTo)}
                            onChange={(option) => handleSelectChange(option, "messageTo")}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Title</label>
                          <input
                            type="text"
                            className="form-control"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Notice Date</label>
                          <input
                            type="date"
                            className="form-control"
                            name="noticeDate"
                            value={formData.noticeDate}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Publish On</label>
                          <input
                            type="date"
                            className="form-control"
                            name="publishOn"
                            value={formData.publishOn}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Attachment</label>
                          <div className="bg-light p-3 rounded">
                            <p>Upload size of 4MB, Accepted Format PDF</p>
                            <button type="button" className="btn btn-primary" disabled>
                              <i className="ti ti-file-upload me-2" />
                              Upload
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Details</label>
                          <textarea
                            className="form-control"
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            rows={4}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <Link
                    to="#"
                    className="btn btn-light me-2"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary" disabled={isFormLoading}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Notice Modal */}
      <div className="modal fade" id="view_notice">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Notice Details</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setEditNotice(null)}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Title">{editNotice?.title}</Descriptions.Item>
                <Descriptions.Item label="Message">{editNotice?.message}</Descriptions.Item>
                <Descriptions.Item label="Notice Date">
                  {editNotice && new Date(editNotice.noticeDate).toLocaleDateString()}
                </Descriptions.Item>
                <Descriptions.Item label="Publish On">
                  {editNotice && new Date(editNotice.publishOn).toLocaleDateString()}
                </Descriptions.Item>
                <Descriptions.Item label="Session">
                  {editNotice?.sessionId
                    ? typeof editNotice.sessionId === "string"
                      ? editNotice.sessionId
                      : editNotice.sessionId.name
                    : "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Classes">
                  {editNotice?.classIds && editNotice.classIds.length > 0
                    ? editNotice.classIds
                        .map((cls) => (typeof cls === "string" ? cls : cls.name))
                        .join(", ")
                    : "All Classes"}
                </Descriptions.Item>
                <Descriptions.Item label="Message To">
                  {editNotice?.messageTo.map((role) => (
                    <span key={role} className="badge badge-soft-info me-2">
                      {role}
                    </span>
                  ))}
                </Descriptions.Item>
                <Descriptions.Item label="Attachment">
                  {editNotice?.attachment ? (
                    <a href={editNotice.attachment} target="_blank" rel="noopener noreferrer">
                      View Attachment
                    </a>
                  ) : (
                    "No attachment"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Added On">
                  {editNotice && new Date(editNotice.createdAt).toLocaleDateString()}
                </Descriptions.Item>
              </Descriptions>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
                onClick={() => setEditNotice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeBoard;