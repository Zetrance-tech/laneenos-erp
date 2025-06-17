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

interface Session {
  _id: string;
  name: string;
}

interface Consent {
  _id: string;
  title: string;
  description: string;
  sessionId: {
    _id: string;
    name: string;
  } | null;
  classId: {
    _id: string;
    name: string;
  } | null;
  file?: string;
  validity?: string;
  createdAt: string;
  createdBy?: {
    _id: string;
    name: string;
  };
}

interface ConsentResponse {
  _id: string;
  consentId: Consent;
  studentId: {
    _id: string;
    name: string;
    admissionNumber: string;
  };
  parentId: {
    _id: string;
    name: string;
    email: string;
  };
  status: "pending" | "approved" | "rejected";
  responseDate?: string;
  respondedBy?: {
    _id: string;
    name: string;
  };
}

const Consents: React.FC = () => {
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
      return JSON.parse(jsonPayload);
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

  const [consents, setConsents] = useState<Consent[]>([]);
  const [consentResponses, setConsentResponses] = useState<ConsentResponse[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showResponsesModal, setShowResponsesModal] = useState<boolean>(false);
  const [showRespondModal, setShowRespondModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<ConsentResponse | null>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [applyToAllClasses, setApplyToAllClasses] = useState<boolean>(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
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

        const sessionResponse = await axios.get<Session[]>(`${API_URL}/api/session/get`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const validSessions = sessionResponse.data.filter(
          (s): s is Session => s != null && s._id != null && s.name != null
        );
        setSessions(validSessions);

        let consentEndpoint = "";
        let params = {};
        if (currentUser.role === "parent") {
          consentEndpoint = `${API_URL}/api/consent/my-consents`;
        } else if (currentUser.role === "teacher") {
          consentEndpoint = `${API_URL}/api/consent/teacher`;
        } else if (currentUser.role === "admin") {
          consentEndpoint = `${API_URL}/api/consent/admin`;
          if (selectedClass) {
            params = { classId: selectedClass };
          }
        }

        console.log(`Fetching consents from ${consentEndpoint} with params:`, params);
        const consentResponse = await axios.get<Consent[] | ConsentResponse[]>(consentEndpoint, {
          params,
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Consent response:", consentResponse.data);

        if (currentUser.role === "parent") {
          const validResponses = (consentResponse.data as ConsentResponse[]).filter(
            (r): r is ConsentResponse => r != null && r._id != null && r.consentId != null
          );
          setConsentResponses(validResponses);
          const uniqueConsents = Array.from(
            new Map(
              validResponses
                .filter((r) => r.consentId && r.consentId._id)
                .map((r) => [r.consentId._id, r.consentId])
            ).values()
          );
          setConsents(uniqueConsents);
          console.log("Set consents for parent:", uniqueConsents);
        } else {
          const validConsents = (consentResponse.data as Consent[]).filter(
            (c): c is Consent => c != null && c._id != null
          );
          setConsents(validConsents);
        }
      } catch (err: any) {
        console.error("Failed to fetch data:", err.response?.data?.message || err.message);
        setError(err.response?.data?.message || "Failed to fetch consents");
        setConsents([]);
        setConsentResponses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser.role, selectedClass, token]);

  const handleAddConsent = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.target as HTMLFormElement);
  const consentData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    sessionId: formData.get("sessionId") as string,
    classId: applyToAllClasses ? [] : selectedClasses, // Send array of class IDs
    file: formData.get("file") ? (formData.get("file") as File).name : null,
    validity: formData.get("validity") as string,
    applyToAllClasses: applyToAllClasses,
  };

  console.log("Sending consent data:", consentData);

  if (!consentData.sessionId || (!consentData.classId.length && !consentData.applyToAllClasses)) {
    setError("Please select a session and at least one class or apply to all classes");
    return;
  }

  try {
    const response = await axios.post(`${API_URL}/api/consent/create`, consentData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const consentEndpoint = currentUser.role === "teacher" ? `${API_URL}/api/consent/teacher` : `${API_URL}/api/consent/admin`;
    const params = currentUser.role === "admin" && selectedClass ? { classId: selectedClass } : {};
    const consentResponse = await axios.get<Consent[]>(consentEndpoint, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    const validConsents = consentResponse.data.filter(
      (c): c is Consent => c != null && c._id != null
    );
    setConsents(validConsents);

    (e.target as HTMLFormElement).reset();
    setApplyToAllClasses(false);
    setSelectedClasses([]); // Reset selected classes
    const modalElement = document.getElementById("add_consent");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      modal.hide();
    }
    toast.success(response.data.message || "Consent request created successfully");
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || "Failed to create consent";
    setError(errorMsg);
    toast.error(errorMsg);
  }
};

  const handleEditConsent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedConsent) {
      setError("No consent selected for editing");
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const consentData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      sessionId: formData.get("sessionId") as string,
      classId: formData.get("classId") as string,
      file: formData.get("file") ? (formData.get("file") as File).name : selectedConsent.file,
      validity: formData.get("validity") as string,
    };

    console.log("Sending edit consent data:", consentData);

    if (!consentData.sessionId || !consentData.classId) {
      setError("Please select a session and a class");
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/api/consent/${selectedConsent._id}`, consentData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const consentEndpoint = currentUser.role === "teacher" ? `${API_URL}/api/consent/teacher` : `${API_URL}/api/consent/admin`;
      const params = currentUser.role === "admin" && selectedClass ? { classId: selectedClass } : {};
      const consentResponse = await axios.get<Consent[]>(consentEndpoint, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      const validConsents = consentResponse.data.filter(
        (c): c is Consent => c != null && c._id != null
      );
      setConsents(validConsents);

      (e.target as HTMLFormElement).reset();
      setShowEditModal(false);
      const modalElement = document.getElementById("edit_consent");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
      }
      toast.success(response.data.message || "Consent updated successfully");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to update consent";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDeleteConsent = async () => {
    if (!selectedConsent) {
      setError("No consent selected for deletion");
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/consent/${selectedConsent._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const consentEndpoint = currentUser.role === "teacher" ? `${API_URL}/api/consent/teacher` : `${API_URL}/api/consent/admin`;
      const params = currentUser.role === "admin" && selectedClass ? { classId: selectedClass } : {};
      const consentResponse = await axios.get<Consent[]>(consentEndpoint, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      const validConsents = consentResponse.data.filter(
        (c): c is Consent => c != null && c._id != null
      );
      setConsents(validConsents);

      setShowDeleteModal(false);
      const modalElement = document.getElementById("delete_consent");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
      }
      toast.success("Consent deleted successfully");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to delete consent";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleRespondConsent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedResponse) {
      setError("No response selected");
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const responseData = {
      consentResponseId: selectedResponse._id,
      status: formData.get("status") as "approved" | "rejected",
    };

    console.log("Sending consent response data:", responseData);

    try {
      const response = await axios.put(`${API_URL}/api/consent/respond`, responseData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const consentResponse = await axios.get<ConsentResponse[]>(`${API_URL}/api/consent/my-consents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const validResponses = consentResponse.data.filter(
        (r): r is ConsentResponse => r != null && r._id != null && r.consentId != null
      );
      setConsentResponses(validResponses);
      const uniqueConsents = Array.from(
        new Map(validResponses.map((r) => [r.consentId._id, r.consentId])).values()
      );
      setConsents(uniqueConsents);

      setShowRespondModal(false);
      const modalElement = document.getElementById("respond_consent");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
      }
      toast.success(response.data.message || `Consent ${responseData.status} successfully`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to respond to consent";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleViewDetails = (consent: Consent) => {
    setSelectedConsent(consent);
    setShowDetailsModal(true);
    const modalElement = document.getElementById("details_consent");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  const handleViewResponses = async (consent: Consent) => {
    try {
      const response = await axios.get<ConsentResponse[]>(`${API_URL}/api/consent/responses/${consent._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filteredResponses: ConsentResponse[] = [];
      const studentIds = new Set<string>();

      response.data.forEach((res) => {
        const studentId = res.studentId._id;
        if (!studentIds.has(studentId)) {
          const nonPending = response.data.find(
            (r) => r.studentId._id === studentId && r.status !== "pending"
          );
          if (nonPending) {
            filteredResponses.push(nonPending);
          } else {
            filteredResponses.push(res);
          }
          studentIds.add(studentId);
        }
      });

      setConsentResponses(filteredResponses ?? []);
      setSelectedConsent(consent);
      setShowResponsesModal(true);
      const modalElement = document.getElementById("responses_consent");
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to fetch consent responses";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleOpenRespondModal = (response: ConsentResponse) => {
    setSelectedResponse(response);
    setShowRespondModal(true);
    const modalElement = document.getElementById("respond_consent");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  const handleOpenEditModal = (consent: Consent) => {
    setSelectedConsent(consent);
    setShowEditModal(true);
    const modalElement = document.getElementById("edit_consent");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  const handleOpenDeleteModal = (consent: Consent) => {
    setSelectedConsent(consent);
    setShowDeleteModal(true);
    const modalElement = document.getElementById("delete_consent");
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

  const dataSource = consents?.map((consent) => ({
    key: consent._id,
    title: consent.title ?? "N/A",
    className: consent.classId && consent.classId._id && consent.classId.name ? consent.classId.name : "Class Deleted",
    sessionName: consent.sessionId && consent.sessionId._id && consent.sessionId.name ? consent.sessionId.name : "Session Deleted",
    createdAt: consent.createdAt ? new Date(consent.createdAt).toLocaleDateString() : "N/A",
    consent,
  })) ?? [];

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Class",
      dataIndex: "className",
      key: "className",
    },
    {
      title: "Session",
      dataIndex: "sessionName",
      key: "sessionName",
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
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
                onClick={() => handleViewDetails(record.consent)}
              >
                <i className="ti ti-eye me-2" />
                View Details
              </button>
            </li>
            {(currentUser.role === "teacher" || currentUser.role === "admin") && (
              <>
                <li>
                  <button
                    className="dropdown-item rounded-1"
                    onClick={() => handleViewResponses(record.consent)}
                  >
                    <i className="ti ti-list me-2" />
                    View Responses
                  </button>
                </li>
                {(currentUser.role === "admin" || (currentUser.role === "teacher" && record.consent.createdBy?._id === currentUser.userId)) && (
                  <>
                    <li>
                      <button
                        className="dropdown-item rounded-1"
                        onClick={() => handleOpenEditModal(record.consent)}
                      >
                        <i className="ti ti-edit-circle me-2" />
                        Edit
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item rounded-1"
                        onClick={() => handleOpenDeleteModal(record.consent)}
                      >
                        <i className="ti ti-trash-x me-2" />
                        Delete
                      </button>
                    </li>
                  </>
                )}
              </>
            )}
            {currentUser.role === "parent" && (
              <li>
                <button
                  className="dropdown-item rounded-1"
                  onClick={() => {
                    const response = consentResponses.find(
                      (r) =>
                        r.consentId._id === record.consent._id &&
                        r.parentId._id === currentUser.userId &&
                        r.status === "pending"
                    );
                    if (response) {
                      handleOpenRespondModal(response);
                    } else {
                      toast.error("No pending response available");
                    }
                  }}
                >
                  <i className="ti ti-check me-2" />
                  Respond
                </button>
              </li>
            )}
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
            <h3 className="page-title mb-1">Consents</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="#">Dashboard</a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#">Academic</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Consents
                </li>
              </ol>
            </nav>
          </div>
          {(currentUser.role === "admin" || currentUser.role === "teacher") && (
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2">
                <button
                  className="btn btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#add_consent"
                >
                  <i className="ti ti-square-rounded-plus-filled me-2" />
                  Add Consent
                </button>
              </div>
            </div>
          )}
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
              {classes?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              )) ?? []}
            </select>
          </div>
        )}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Consent Requests</h4>
          </div>
          <div className="card-body p-0 py-3">
            <div style={{ minHeight: "200px", position: "relative" }}>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <Spin size="large" />
                </div>
              ) : consents.length === 0 ? (
                <p>{selectedClass ? "No consents found for this class" : "No consents found"}</p>
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
        {(currentUser.role === "admin" || currentUser.role === "teacher") && (
          <>
            <div className="modal fade" id="add_consent">
  <div className="modal-dialog modal-dialog-centered">
    <div className="modal-content">
      <div className="modal-header">
        <h4 className="modal-title">Add Consent Request</h4>
        <button
          type="button"
          className="btn-close custom-btn-close"
          onClick={() => {
            setApplyToAllClasses(false);
            setSelectedClasses([]); // Reset selected classes
            const modalElement = document.getElementById("add_consent");
            if (modalElement) {
              const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
              modal.hide();
            }
          }}
        >
          <i className="ti ti-x" />
        </button>
      </div>
      <form onSubmit={handleAddConsent}>
        <div className="modal-body">
          <div className="row">
            <div className="col-md-12">
              <div className="mb-3">
                <label className="form-label">Session</label>
                <select className="form-select" name="sessionId" required>
                  <option value="">Select a session</option>
                  {sessions?.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  )) ?? []}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Select Classes</label>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="applyToAllClasses"
                    checked={applyToAllClasses}
                    onChange={(e) => {
                      setApplyToAllClasses(e.target.checked);
                      if (e.target.checked) {
                        setSelectedClasses([]); // Clear selected classes when applying to all
                      }
                    }}
                  />
                  <label className="form-check-label" htmlFor="applyToAllClasses">
                    Apply to all classes
                  </label>
                </div>
                {!applyToAllClasses && (
                  <div className="mt-2">
                    {classes?.map((c) =>
                      c && c._id && c.name ? (
                        <div key={c._id} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`class-${c._id}`}
                            value={c._id}
                            checked={selectedClasses.includes(c._id)}
                            onChange={(e) => {
                              const classId = e.target.value;
                              setSelectedClasses((prev) =>
                                e.target.checked
                                  ? [...prev, classId]
                                  : prev.filter((id) => id !== classId)
                              );
                            }}
                            disabled={applyToAllClasses}
                          />
                          <label className="form-check-label" htmlFor={`class-${c._id}`}>
                            {c.name}
                          </label>
                        </div>
                      ) : null
                    ) ?? []}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  placeholder="e.g., Annual Picnic Consent"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  name="description"
                  placeholder="Describe the activity (e.g., picnic details)"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Attachment</label>
                <input
                  type="file"
                  className="form-control"
                  name="file"
                  accept=".pdf,.doc,.docx"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Validity</label>
                <input
                  type="date"
                  className="form-control"
                  name="validity"
                  min={new Date().toISOString().split("T")[0]}
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
              setApplyToAllClasses(false);
              setSelectedClasses([]); // Reset selected classes
              const modalElement = document.getElementById("add_consent");
              if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                modal.hide();
              }
            }}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Add Consent
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
            <div className="modal fade" id="edit_consent">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h4 className="modal-title">Edit Consent Request</h4>
                    <button
                      type="button"
                      className="btn-close custom-btn-close"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedConsent(null);
                        const modalElement = document.getElementById("edit_consent");
                        if (modalElement) {
                          const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                          modal.hide();
                        }
                      }}
                    >
                      <i className="ti ti-x" />
                    </button>
                  </div>
                  <form onSubmit={handleEditConsent}>
                    <div className="modal-body">
                      <div className="row">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Session</label>
                            <select
                              className="form-select"
                              name="sessionId"
                              defaultValue={selectedConsent?.sessionId?._id || ""}
                              required
                            >
                              <option value="">Select a session</option>
                              {sessions?.map((s) => (
                                <option key={s._id} value={s._id}>
                                  {s.name}
                                </option>
                              )) ?? []}
                            </select>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Class</label>
                            <select
                              className="form-select"
                              name="classId"
                              defaultValue={selectedConsent?.classId?._id || ""}
                              required
                            >
                              <option value="">Select a class</option>
                              {classes?.map((c) => (
                                <option key={c._id} value={c._id}>
                                  {c.name}
                                </option>
                              )) ?? []}
                            </select>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Title</label>
                            <input
                              type="text"
                              className="form-control"
                              name="title"
                              defaultValue={selectedConsent?.title || ""}
                              placeholder="e.g., Annual Picnic Consent"
                              required
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea
                              className="form-control"
                              rows={4}
                              name="description"
                              defaultValue={selectedConsent?.description || ""}
                              placeholder="Describe the activity (e.g., picnic details)"
                              required
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Attachment</label>
                            <input
                              type="file"
                              className="form-control"
                              name="file"
                              accept=".pdf,.doc,.docx"
                            />
                            {selectedConsent?.file && (
                              <p className="mt-2">Current file: {selectedConsent.file}</p>
                            )}
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Validity</label>
                            <input
                              type="date"
                              className="form-control"
                              name="validity"
                              defaultValue={selectedConsent?.validity ? new Date(selectedConsent.validity).toISOString().split("T")[0] : ""}
                              min={new Date().toISOString().split("T")[0]}
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
                          setShowEditModal(false);
                          setSelectedConsent(null);
                          const modalElement = document.getElementById("edit_consent");
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
            <div className="modal fade" id="delete_consent">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-body text-center">
                    <span className="delete-icon">
                      <i className="ti ti-trash-x" />
                    </span>
                    <h4>Confirm Deletion</h4>
                    <p>You want to delete this consent request. This cannot be undone once deleted.</p>
                    <div className="d-flex justify-content-center">
                      <button
                        type="button"
                        className="btn btn-light me-3"
                        onClick={() => {
                          setShowDeleteModal(false);
                          setSelectedConsent(null);
                          const modalElement = document.getElementById("delete_consent");
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
                        onClick={handleDeleteConsent}
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        <div className="modal fade" id="details_consent">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Consent Details</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedConsent(null);
                    const modalElement = document.getElementById("details_consent");
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
                {selectedConsent && (
                  <div>
                    <p><strong>Title:</strong> {selectedConsent.title ?? "N/A"}</p>
                    <p><strong>Class:</strong> {selectedConsent.classId && selectedConsent.classId._id && selectedConsent.classId.name ? selectedConsent.classId.name : "Class Deleted"}</p>
                    <p><strong>Session:</strong> {selectedConsent.sessionId && selectedConsent.sessionId._id && selectedConsent.sessionId.name ? selectedConsent.sessionId.name : "Session Deleted"}</p>
                    <p><strong>Description:</strong> {selectedConsent.description ?? "N/A"}</p>
                    <p><strong>Attachment:</strong> {selectedConsent.file ? selectedConsent.file : "None"}</p>
                    <p><strong>Validity:</strong> {selectedConsent.validity ? new Date(selectedConsent.validity).toLocaleDateString() : "Not specified"}</p>
                    <p><strong>Created Date:</strong> {selectedConsent.createdAt ? new Date(selectedConsent.createdAt).toLocaleDateString() : "N/A"}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedConsent(null);
                    const modalElement = document.getElementById("details_consent");
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
        {(currentUser.role === "teacher" || currentUser.role === "admin") && (
          <div className="modal fade" id="responses_consent">
            <div className="modal-dialog modal-xl" style={{ maxWidth: "90vw" }}>
              <div className="modal-content" style={{ maxHeight: "80vh", overflowY: "auto" }}>
                <div className="modal-header">
                  <h4 className="modal-title">Consent Responses</h4>
                  <button
                    type="button"
                    className="btn-close custom-btn-close"
                    onClick={() => {
                      setShowResponsesModal(false);
                      setSelectedConsent(null);
                      const modalElement = document.getElementById("responses_consent");
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
                  {selectedConsent && (
                    <div>
                      <h5>{selectedConsent.title ?? "N/A"}</h5>
                      <p><strong>Class:</strong> {selectedConsent.classId && selectedConsent.classId._id && selectedConsent.classId.name ? selectedConsent.classId.name : "Class Deleted"}</p>
                      {consentResponses.length === 0 ? (
                        <p>No responses found</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>Student</th>
                                <th>Admission Number</th>
                                <th>Parent</th>
                                <th>Status</th>
                                <th>Response Date</th>
                                <th>Responded By</th>
                              </tr>
                            </thead>
                            <tbody>
                              {consentResponses?.map((response) => (
                                <tr key={response._id}>
                                  <td>{response.studentId?.name ?? "N/A"}</td>
                                  <td>{response.studentId?.admissionNumber ?? "N/A"}</td>
                                  <td>{response.parentId?.name ?? "N/A"} ({response.parentId?.email ?? "N/A"})</td>
                                  <td>
                                    <span
                                      className={`badge ${
                                        response.status === "approved"
                                          ? "bg-success"
                                          : response.status === "rejected"
                                          ? "bg-danger"
                                          : "bg-warning"
                                      }`}
                                    >
                                      {response.status}
                                    </span>
                                  </td>
                                  <td>
                                    {response.responseDate
                                      ? new Date(response.responseDate).toLocaleDateString()
                                      : "N/A"}
                                  </td>
                                  <td>{response.respondedBy?.name ?? "N/A"}</td>
                                </tr>
                              )) ?? []}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setShowResponsesModal(false);
                      setSelectedConsent(null);
                      const modalElement = document.getElementById("responses_consent");
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
        )}
        {currentUser.role === "parent" && (
          <div className="modal fade" id="respond_consent">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Respond to Consent</h4>
                  <button
                    type="button"
                    className="btn-close custom-btn-close"
                    onClick={() => {
                      setShowRespondModal(false);
                      setSelectedResponse(null);
                      const modalElement = document.getElementById("respond_consent");
                      if (modalElement) {
                        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                        modal.hide();
                      }
                  }}
                  >
                    <i className="ti ti-x"></i>
                  </button>
                </div>
                <form onSubmit={handleRespondConsent}>
                  <div className="modal-body">
                    {selectedResponse && (
                      <div>
                        <p><strong>Title:</strong> {selectedResponse.consentId.title ?? "N/A"}</p>
                        <p><strong>Student:</strong> {selectedResponse.studentId.name ?? "N/A"}</p>
                        <p><strong>Description:</strong> {selectedResponse.consentId.description ?? "N/A"}</p>
                        <p><strong>Attachment:</strong> {selectedResponse.consentId.file ? selectedResponse.consentId.file : "None"}</p>
                        <p><strong>Validity:</strong> {selectedResponse.consentId.validity ? new Date(selectedResponse.consentId.validity).toLocaleDateString() : "Not specified"}</p>
                        <div className="mb-3">
                          <label className="form-label">Response</label>
                          <select className="form-select" name="status" required>
                            <option value="">Select response</option>
                            <option value="approved">Approve</option>
                            <option value="rejected">Reject</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-light me-2"
                      onClick={() => {
                        setShowRespondModal(false);
                        setSelectedResponse(null);
                        const modalElement = document.getElementById("respond_consent");
                        if (modalElement) {
                          const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                          modal.hide();
                        }
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Submit Response
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Consents;