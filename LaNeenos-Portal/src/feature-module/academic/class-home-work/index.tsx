import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as bootstrap from "bootstrap";
import toast, { Toaster } from "react-hot-toast";
import { Table, Spin } from "antd";
import { useAuth } from "../../../context/AuthContext";
const API_URL = process.env.REACT_APP_URL;

interface User {
  userId: string;
  role: "admin" | "teacher" | "parent" | "student";
}

interface Class {
  _id: string;
  name: string;
}

interface Homework {
  _id: string;
  title: string;
  subject: string;
  description: string;
  teacherId: {
    _id: string;
    name: string;
    email: string;
  };
  teacherName: string;
  dueDate: string;
  createdAt: string;
  classId: {
    _id: string;
    name: string;
  } | null;
}

const ClassHomeWork: React.FC = () => {
  const decodeToken = (token: string): { userId: string; role: string } | null => {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const parsed = JSON.parse(jsonPayload);
      if (!parsed.userId || !parsed.role) return null;
      return { userId: parsed.userId, role: parsed.role };
    } catch (e) {
      console.error("Failed to decode token:", e);
      return null;
    }
  };
  const { token, user } = useAuth();
  const decoded = token ? decodeToken(token) : null;
  const currentUser: User = decoded
    ? { userId: decoded.userId, role: decoded.role as "admin" | "teacher" | "parent" | "student" }
    : { userId: "", role: "teacher" };

  const [homework, setHomework] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const classResponse = await axios.get<Class[]>(`${API_URL}/api/class`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const validClasses = classResponse.data.filter(
          (c): c is Class => c != null && c._id != null && c.name != null
        );
        setClasses(validClasses);

        const params = currentUser.role === "admin" && selectedClass ? { classId: selectedClass } : {};
        console.log("Fetching homework with params:", params);
        const homeworkResponse = await axios.get<Homework[]>(`${API_URL}/api/homework`, {
          params,
          headers: { Authorization: `Bearer ${token}` },
        });
        const validHomework = homeworkResponse.data.filter(
          (h): h is Homework => h != null && h._id != null
        );
        setHomework(validHomework);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser.role, selectedClass, token]);

  const handleAddHomework = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const classIds = formData.getAll("classId") as string[];
    const homeworkData = {
      title: formData.get("title") as string,
      subject: formData.get("subject") as string,
      description: formData.get("description") as string,
      dueDate: formData.get("dueDate") as string,
      classIds: classIds.length > 0 ? classIds : ["all"],
    };

    console.log("Sending homework data:", homeworkData);

    if (!homeworkData.classIds || homeworkData.classIds.length === 0) {
      setError("Please select at least one class or 'All Classes'");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/homework/add`, homeworkData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const params = currentUser.role === "admin" && selectedClass ? { classId: selectedClass } : {};
      const homeworkResponse = await axios.get<Homework[]>(`${API_URL}/api/homework`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      const validHomework = homeworkResponse.data.filter(
        (h): h is Homework => h != null && h._id != null
      );
      setHomework(validHomework);
      (e.target as HTMLFormElement).reset();
      const modalElement = document.getElementById("add_home_work");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
      }
      toast.success(response.data.message || "Homework added successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add homework");
    }
  };

  const handleEditHomework = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedHomework) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const homeworkData = {
      title: formData.get("title") as string,
      subject: formData.get("subject") as string,
      description: formData.get("description") as string,
      dueDate: formData.get("dueDate") as string,
      classId: formData.get("classId") as string,
    };

    console.log("Sending edit homework data:", homeworkData);

    if (!homeworkData.classId) {
      setError("Please select a class");
      return;
    }

    try {
      await axios.put(`${API_URL}/api/homework/${selectedHomework._id}`, homeworkData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const params = currentUser.role === "admin" && selectedClass ? { classId: selectedClass } : {};
      const homeworkResponse = await axios.get<Homework[]>(`${API_URL}/api/homework`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      const validHomework = homeworkResponse.data.filter(
        (h): h is Homework => h != null && h._id != null
      );
      setHomework(validHomework);
      (e.target as HTMLFormElement).reset();
      const modalElement = document.getElementById("edit_home_work");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
      }
      toast.success("Homework updated successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to edit homework");
    }
  };

  const handleDeleteHomework = async () => {
    if (!selectedHomework) return;
    try {
      await axios.delete(`${API_URL}/api/homework/${selectedHomework._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const params = currentUser.role === "admin" && selectedClass ? { classId: selectedClass } : {};
      const homeworkResponse = await axios.get<Homework[]>(`${API_URL}/api/homework`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      const validHomework = homeworkResponse.data.filter(
        (h): h is Homework => h != null && h._id != null
      );
      setHomework(validHomework);
      const modalElement = document.getElementById("delete-modal");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
      }
      toast.success("Homework deleted successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete homework");
    }
  };

  const handleViewDetails = (homework: Homework) => {
    if (!homework.classId || !homework.classId._id || !homework.classId.name) {
      toast.error("Cannot view homework: Associated class is deleted.");
      return;
    }
    setSelectedHomework(homework);
    setShowDetailsModal(true);
    const modalElement = document.getElementById("details_home_work");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const dataSource = homework?.map((item) => ({
    key: item._id,
    className: item.classId && item.classId._id && item.classId.name ? item.classId.name : "Class Deleted",
    subject: item.subject ?? "N/A",
    createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A",
    dueDate: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "N/A",
    teacherName: item.teacherId?.name ?? "N/A",
    homework: item,
  })) ?? [];

  const columns = [
    {
      title: "Class",
      dataIndex: "className",
      key: "className",
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
    },
    {
      title: "Homework Date",
      dataIndex: "createdAt",
      key: "createdAt",
    },
    {
      title: "Submission Date",
      dataIndex: "dueDate",
      key: "dueDate",
    },
    {
      title: "Created By",
      dataIndex: "teacherName",
      key: "teacherName",
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <div className="dropdown">
          <button
            className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="ti ti-dots-vertical fs-14" />
          </button>
          <ul className="dropdown-menu dropdown-menu-right p-3">
            <li>
              <button
                className="dropdown-item rounded-1"
                onClick={() => handleViewDetails(record.homework)}
              >
                <i className="ti ti-eye me-2" />
                View Details
              </button>
            </li>
            <li>
              <button
                className="dropdown-item rounded-1"
                onClick={() => {
                  setSelectedHomework(record.homework);
                  const modalElement = document.getElementById("edit_home_work");
                  if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                    modal.show();
                  }
                }}
              >
                <i className="ti ti-edit-circle me-2" />
                Edit
              </button>
            </li>
            <li>
              <button
                className="dropdown-item rounded-1"
                onClick={() => {
                  setSelectedHomework(record.homework);
                  const modalElement = document.getElementById("delete-modal");
                  if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                    modal.show();
                  }
                }}
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
    <div className="page-wrapper">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#333",
            border: "1px solid #e0e0e0",
          },
          success: {
            style: {
              border: "1px solid #28a745",
              color: "#28a745",
            },
            iconTheme: {
              primary: "#28a745",
              secondary: "#fff",
            },
          },
          error: {
            style: {
              border: "1px solid #dc3545",
              color: "#dc3545",
            },
            iconTheme: {
              primary: "#dc3545",
              secondary: "#fff",
            },
          },
        }}
      />
      <style>
        {`
          .ant-table-tbody > tr.ant-table-row {
            background-color: #ffffff !important;
          }
          .ant-table-tbody > tr.ant-table-row:hover > td {
            background-color: #f5f5f5 !important;
          }
          .ant-table-tbody > tr:nth-child(even) > td,
          .ant-table-tbody > tr:nth-child(odd) > td {
            background-color: #ffffff !important;
          }
        `}
      </style>
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Class Work</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="#">Dashboard</a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#">Academic</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Class Work
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="mb-2">
              <button
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add_home_work"
              >
                <i className="ti ti-square-rounded-plus-filled me-2" />
                Add Home Work
              </button>
            </div>
          </div>
        </div>
        {currentUser.role === "admin" && (
          <div className="mb-3">
            <label className="form-label">Select Class</label>
            <select
              className="form-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes?.map((c) =>
                c && c._id && c.name ? (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ) : null
              ) ?? []}
            </select>
          </div>
        )}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Class Home Work</h4>
          </div>
          <div className="card-body p-0 py-3">
            <div style={{ minHeight: "200px", position: "relative" }}>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <Spin size="large" />
                </div>
              ) : dataSource.length === 0 ? (
                <p>No homework found</p>
              ) : (
                <Table
                  columns={columns}
                  dataSource={dataSource}
                  rowKey="key"
                  rowSelection={{ type: "checkbox" }}
                />
              )}
            </div>
          </div>
        </div>
        <div className="modal fade" id="add_home_work">
  <div className="modal-dialog modal-dialog-centered">
    <div className="modal-content">
      <div className="modal-header">
        <h4 className="modal-title">Add Home Work</h4>
        <button
          type="button"
          className="btn-close custom-btn-close"
          onClick={() => {
            const modalElement = document.getElementById("add_home_work");
            if (modalElement) {
              const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
              modal.hide();
            }
          }}
        >
          <i className="ti ti-x" />
        </button>
      </div>
      <form onSubmit={handleAddHomework}>
        <div className="modal-body">
          <div className="row">
            <div className="col-md-12">
              <div className="mb-3">
                <label className="form-label">Class</label>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="classId"
                    value="all"
                    id="allClasses"
                    onChange={(e) => {
                      const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="classId"]');
                      checkboxes.forEach((checkbox) => {
                        if (checkbox.value !== "all") {
                          checkbox.checked = e.target.checked;
                          checkbox.disabled = e.target.checked;
                        }
                      });
                    }}
                  />
                  <label className="form-check-label" htmlFor="allClasses">
                    All Classes
                  </label>
                </div>
                {classes?.map((c) =>
                  c && c._id && c.name ? (
                    <div className="form-check" key={c._id}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="classId"
                        value={c._id}
                        id={`class-${c._id}`}
                      />
                      <label className="form-check-label" htmlFor={`class-${c._id}`}>
                        {c.name}
                      </label>
                    </div>
                  ) : null
                ) ?? []}
              </div>
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-control"
                  name="subject"
                  placeholder="Enter subject"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  name="description"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="dueDate"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-light me-2"
            onClick={() => {
              const modalElement = document.getElementById("add_home_work");
              if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                modal.hide();
              }
            }}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Add Homework
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
        
        <div className="modal fade" id="edit_home_work">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Home Work</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    const modalElement = document.getElementById("edit_home_work");
                    if (modalElement) {
                      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                      modal.hide();
                    }
                  }}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form onSubmit={handleEditHomework}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Class</label>
                        <select className="form-select" name="classId" defaultValue={selectedHomework?.classId?._id} required>
                          <option value="">Select a class</option>
                          {classes?.map((c) =>
                            c && c._id && c.name ? (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ) : null
                          ) ?? []}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-control"
                          name="title"
                          defaultValue={selectedHomework?.title}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Subject</label>
                        <input
                          type="text"
                          className="form-control"
                          name="subject"
                          defaultValue={selectedHomework?.subject}
                          placeholder="Enter subject"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          name="description"
                          defaultValue={selectedHomework?.description}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Due Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="dueDate"
                          defaultValue={selectedHomework?.dueDate.split("T")[0]}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light me-2"
                    onClick={() => {
                      const modalElement = document.getElementById("edit_home_work");
                      if (modalElement) {
                        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                        modal.hide();
                      }
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="modal fade" id="delete-modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x" />
                </span>
                <h4>Confirm Deletion</h4>
                <p>You want to delete this homework. This cannot be undone once deleted.</p>
                <div className="d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn btn-light me-3"
                    onClick={() => {
                      const modalElement = document.getElementById("delete-modal");
                      if (modalElement) {
                        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                        modal.hide();
                      }
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteHomework}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal fade" id="details_home_work">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Homework Details</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    setShowDetailsModal(false);
                    const modalElement = document.getElementById("details_home_work");
                    if (modalElement) {
                      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                      modal.hide();
                    }
                  }}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <div className="modal-body">
                {selectedHomework && (
                  <div>
                    <p><strong>Title:</strong> {selectedHomework.title ?? "N/A"}</p>
                    <p><strong>Class:</strong> {selectedHomework.classId && selectedHomework.classId._id && selectedHomework.classId.name ? selectedHomework.classId.name : "Class Deleted"}</p>
                    <p><strong>Subject:</strong> {selectedHomework.subject ?? "N/A"}</p>
                    <p><strong>Description:</strong> {selectedHomework.description ?? "N/A"}</p>
                    <p><strong>Homework Date:</strong> {selectedHomework.createdAt ? new Date(selectedHomework.createdAt).toLocaleDateString() : "N/A"}</p>
                    <p><strong>Submission Date:</strong> {selectedHomework.dueDate ? new Date(selectedHomework.dueDate).toLocaleDateString() : "N/A"}</p>
                    <p><strong>Created By:</strong> {selectedHomework.teacherId?.name ?? "N/A"}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    setShowDetailsModal(false);
                    const modalElement = document.getElementById("details_home_work");
                    if (modalElement) {
                      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                      modal.hide();
                    }
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassHomeWork;