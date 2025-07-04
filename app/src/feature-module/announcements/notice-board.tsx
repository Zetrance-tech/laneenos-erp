import { DatePicker } from "antd";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PredefinedDateRanges from "../../core/common/datePicker";
import CommonSelect from "../../core/common/commonSelect";
import {
  messageTo,
  transactionDate,
} from "../../core/common/selectoption/selectoption";
import { all_routes } from "../router/all_routes";
import TooltipOption from "../../core/common/tooltipOption";
import axios from "axios";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import * as bootstrap from "bootstrap"; // Import Bootstrap JS
import toast from "react-hot-toast"; // Import react-hot-toast
const API_URL = process.env.REACT_APP_URL;
// Define types for the notice data
interface Notice {
  _id: string;
  title: string;
  noticeDate: string;
  publishOn: string;
  message: string;
  messageTo: string[];
  createdAt: string;
  attachment: string | null;
}

// Define types for the form data
interface FormData {
  title: string;
  noticeDate: Dayjs | null;
  publishOn: Dayjs | null;
  message: string;
  messageTo: string[];
}

// Define types for the select options
interface SelectOption {
  label: string;
  value: string;
}

const NoticeBoard: React.FC = () => {
  const routes = all_routes;
  const [notices, setNotices] = useState<Notice[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    noticeDate: null,
    publishOn: null,
    message: "",
    messageTo: [],
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);

  // Get user role from localStorage
  const user = JSON.parse(localStorage.getItem("user") || JSON.stringify({ role: "student" }));
  const userRole = user.role;

  // Fetch notices on component mount based on user role
  useEffect(() => {
    fetchNoticesByRole();
  }, [userRole]);

  // Fetch notices for the current user's role
  const fetchNoticesByRole = async () => {
    try {
      const response = await axios.get<Notice[]>(
        `${API_URL}/api/notices/role/${userRole}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
      );
      setNotices(response.data);
    } catch (error) {
      console.error(`Error fetching notices for role ${userRole}:`, error);
      toast.error("Failed to fetch notices");
    }
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle date picker changes
  const handleDateChange = (
    name: "noticeDate" | "publishOn",
    date: Dayjs | null
  ) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  // Handle checkbox changes for messageTo
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const updatedMessageTo = checked
        ? [...prev.messageTo, value]
        : prev.messageTo.filter((item) => item !== value);
      return { ...prev, messageTo: updatedMessageTo };
    });
  };

  // Handle form submission (Add Notice)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        noticeDate: formData.noticeDate?.toISOString(),
        publishOn: formData.publishOn?.toISOString(),
        message: formData.message,
        messageTo: formData.messageTo,
      };
      await axios.post(`${API_URL}/api/notices`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Notice added successfully");
      setFormData({
        title: "",
        noticeDate: null,
        publishOn: null,
        message: "",
        messageTo: [],
      });
      setIsAddModalOpen(false);
      const addModal = document.getElementById("add_message");
      if (addModal) {
        const modalInstance = bootstrap.Modal.getInstance(addModal);
        modalInstance?.hide();
      }
      fetchNoticesByRole(); // Refresh the notice list
    } catch (error) {
      console.error("Error adding notice:", error);
      toast.error("Failed to add notice");
    }
  };

  // Handle edit button click
  const handleEditClick = (id: string) => {
    const notice = notices.find((n) => n._id === id);
    if (notice) {
      setFormData({
        title: notice.title,
        noticeDate: dayjs(notice.noticeDate),
        publishOn: dayjs(notice.publishOn),
        message: notice.message,
        messageTo: notice.messageTo,
      });
      setSelectedNoticeId(id);
      setIsEditModalOpen(true);
    }
  };

  // Handle update submission (Edit Notice)
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedNoticeId) return;
    try {
      const payload = {
        title: formData.title,
        noticeDate: formData.noticeDate?.toISOString(),
        publishOn: formData.publishOn?.toISOString(),
        message: formData.message,
        messageTo: formData.messageTo,
      };
      await axios.put(
        `${API_URL}/api/notices/${selectedNoticeId}`,
        payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Notice updated successfully");
      setFormData({
        title: "",
        noticeDate: null,
        publishOn: null,
        message: "",
        messageTo: [],
      });
      setSelectedNoticeId(null);
      setIsEditModalOpen(false);
      const editModal = document.getElementById("edit_message");
      if (editModal) {
        const modalInstance = bootstrap.Modal.getInstance(editModal);
        modalInstance?.hide();
      }
      fetchNoticesByRole(); // Refresh the notice list
    } catch (error) {
      console.error("Error updating notice:", error);
      toast.error("Failed to update notice");
    }
  };

  // Handle delete notice
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/notices/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Notice deleted successfully");
      fetchNoticesByRole(); // Refresh the notice list
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast.error("Failed to delete notice");
    }
  };

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content content-two">
          {/* Page Header */}
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
              {["admin", "super admin"].includes(userRole.toLowerCase()) && (
                <div className="mb-2">
                  <Link
                    to="#"
                    data-bs-toggle="modal"
                    data-bs-target="#add_message"
                    className="btn btn-primary d-flex align-items-center"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <i className="ti ti-square-rounded-plus me-2" />
                    Add Message
                  </Link>
                </div>
              )}
            </div>
          </div>
          {/* Notice Board List */}
          {notices.map((notice) => (
            <div key={notice._id} className="card board-hover mb-3">
              <div className="card-body d-md-flex align-items-center justify-content-between pb-1">
                <div className="d-flex align-items-center mb-3">
                  <div className="form-check form-check-md me-2">
                    <input className="form-check-input" type="checkbox" />
                  </div>
                  <span className="bg-soft-primary text-primary avatar avatar-md me-2 br-5 flex-shrink-0">
                    <i className="ti ti-notification fs-16" />
                  </span>
                  <div>
                    <h6 className="mb-1 fw-semibold">
                      <Link
                        to="#"
                        data-bs-toggle="modal"
                        data-bs-target={`#view_details_${notice._id}`}
                      >
                        {notice.title}
                      </Link>
                    </h6>
                    <p>
                      <i className="ti ti-calendar me-1" />
                      Added on: {new Date(notice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {["admin", "super admin"].includes(userRole.toLowerCase()) && (
                  <div className="d-flex align-items-center board-action mb-3">
                    <Link
                      to="#"
                      data-bs-toggle="modal"
                      data-bs-target="#edit_message"
                      className="text-primary border rounded p-1 badge me-1 primary-btn-hover"
                      onClick={() => handleEditClick(notice._id)}
                    >
                      <i className="ti ti-edit-circle fs-16" />
                    </Link>
                    <Link
                      to="#"
                      data-bs-toggle="modal"
                      data-bs-target={`#delete-modal-${notice._id}`}
                      className="text-danger border rounded p-1 badge danger-btn-hover"
                    >
                      <i className="ti ti-trash-x fs-16" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* /Notice Board List */}
          <div className="text-center">
            <Link to="#" className="btn btn-primary">
              <i className="ti ti-loader-3 me-2" />
              Load More
            </Link>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}

      {/* Add Message */}
      {["admin", "super admin"].includes(userRole.toLowerCase()) && (
        <div className="modal fade" id="add_message" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">New Message</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-control"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Notice Date</label>
                        <div className="date-pic">
                          <DatePicker
                            className="form-control datetimepicker"
                            placeholder="Select Date"
                            value={formData.noticeDate}
                            onChange={(date) => handleDateChange("noticeDate", date)}
                          />
                          <span className="cal-icon">
                            <i className="ti ti-calendar" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Publish On</label>
                        <div className="date-pic">
                          <DatePicker
                            className="form-control datetimepicker"
                            placeholder="Select Date"
                            value={formData.publishOn}
                            onChange={(date) => handleDateChange("publishOn", date)}
                          />
                          <span className="cal-icon">
                            <i className="ti ti-calendar" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="bg-light p-3 pb-2 rounded">
                          <div className="mb-3">
                            <label className="form-label">Attachment</label>
                            <p>Upload size of 4MB, Accepted Format PDF</p>
                          </div>
                          <div className="d-flex align-items-center flex-wrap">
                            <div className="btn btn-primary drag-upload-btn mb-2 me-2">
                              <i className="ti ti-file-upload me-1" />
                              Upload
                              <input
                                type="file"
                                className="form-control image_sign"
                                multiple
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Message</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Message To</label>
                        <div className="row">
                          <div className="col-md-6">
                            {["Student", "Parent", "Admin", "Teacher"].map((role) => (
                              <label className="checkboxs mb-1" key={role}>
                                <input
                                  type="checkbox"
                                  value={role}
                                  checked={formData.messageTo.includes(role)}
                                  onChange={handleCheckboxChange}
                                />
                                <span className="checkmarks" />
                                {role}
                              </label>
                            ))}
                          </div>
                          <div className="col-md-6">
                            {["Accountant", "Librarian", "Receptionist", "Super Admin"].map((role) => (
                              <label className="checkboxs mb-1" key={role}>
                                <input
                                  type="checkbox"
                                  value={role}
                                  checked={formData.messageTo.includes(role)}
                                  onChange={handleCheckboxChange}
                                />
                                <span className="checkmarks" />
                                {role}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <Link
                    to="#"
                    className="btn btn-light me-2"
                    data-bs-dismiss="modal"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary">
                    Add New Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* /Add Message */}

      {/* Edit Message */}
      {["admin", "super admin"].includes(userRole.toLowerCase()) && (
        <div className="modal fade" id="edit_message" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Message</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setFormData({
                      title: "",
                      noticeDate: null,
                      publishOn: null,
                      message: "",
                      messageTo: [],
                    });
                    setSelectedNoticeId(null);
                  }}
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form onSubmit={handleUpdate}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-control"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Notice Date</label>
                        <div className="date-pic">
                          <DatePicker
                            className="form-control datetimepicker"
                            placeholder="Select Date"
                            value={formData.noticeDate}
                            onChange={(date) => handleDateChange("noticeDate", date)}
                          />
                          <span className="cal-icon">
                            <i className="ti ti-calendar" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Publish On</label>
                        <div className="date-pic">
                          <DatePicker
                            className="form-control datetimepicker"
                            placeholder="Select Date"
                            value={formData.publishOn}
                            onChange={(date) => handleDateChange("publishOn", date)}
                          />
                          <span className="cal-icon">
                            <i className="ti ti-calendar" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="bg-light p-3 pb-2 rounded">
                          <div className="mb-3">
                            <label className="form-label">Attachment</label>
                            <p>Upload size of 4MB, Accepted Format PDF</p>
                          </div>
                          <div className="d-flex align-items-center flex-wrap">
                            <div className="btn btn-primary drag-upload-btn mb-2 me-2">
                              <i className="ti ti-file-upload me-1" />
                              Upload
                              <input
                                type="file"
                                className="form-control image_sign"
                                multiple
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Message</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label">Message To</label>
                        <div className="row">
                          <div className="col-md-6">
                            {["Student", "Parent", "Admin", "Teacher"].map((role) => (
                              <label className="checkboxs mb-1" key={role}>
                                <input
                                  type="checkbox"
                                  value={role}
                                  checked={formData.messageTo.includes(role)}
                                  onChange={handleCheckboxChange}
                                />
                                <span className="checkmarks" />
                                {role}
                              </label>
                            ))}
                          </div>
                          <div className="col-md-6">
                            {["Accountant", "Librarian", "Receptionist", "Super Admin"].map((role) => (
                              <label className="checkboxs mb-1" key={role}>
                                <input
                                  type="checkbox"
                                  value={role}
                                  checked={formData.messageTo.includes(role)}
                                  onChange={handleCheckboxChange}
                                />
                                <span className="checkmarks" />
                                {role}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <Link
                    to="#"
                    className="btn btn-light me-2"
                    data-bs-dismiss="modal"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setFormData({
                        title: "",
                        noticeDate: null,
                        publishOn: null,
                        message: "",
                        messageTo: [],
                      });
                      setSelectedNoticeId(null);
                    }}
                  >
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* /Edit Message */}

      {/* View Details Modals (Dynamic per notice) */}
      {notices.map((notice) => (
        <div className="modal fade" id={`view_details_${notice._id}`} key={notice._id}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">{notice.title}</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <div className="modal-body pb-0">
                <div className="mb-3">
                  <p>{notice.message}</p>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Notice Date</label>
                      <p className="d-flex align-items-center">
                        <i className="ti ti-calendar me-1" />
                        {new Date(notice.noticeDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Publish On</label>
                      <p className="d-flex align-items-center">
                        <i className="ti ti-calendar me-1" />
                        {new Date(notice.publishOn).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="bg-light p-3 pb-2 rounded">
                    <div className="mb-0">
                      <label className="form-label">Attachment</label>
                      <p className="text-primary">
                        {notice.attachment || "No attachment"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label d-block">Message To</label>
                  {notice.messageTo.map((role) => (
                    <span key={role} className="badge badge-soft-primary me-2">
                      {role}
                    </span>
                  ))}
                </div>
                <div className="border-top pt-3">
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="d-flex align-items-center me-4 mb-3">
                      <span className="avatar avatar-sm bg-light me-1">
                        <i className="ti ti-calendar text-default fs-14" />
                      </span>
                      Added on: {new Date(notice.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      {/* /View Details Modals */}

      {/* Delete Modals (Dynamic per notice) */}
      {["admin", "super admin"].includes(userRole.toLowerCase()) &&
        notices.map((notice) => (
          <div className="modal fade" id={`delete-modal-${notice._id}`} key={notice._id}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleDelete(notice._id);
                    const modal = document.getElementById(`delete-modal-${notice._id}`);
                    if (modal) {
                      const modalInstance = bootstrap.Modal.getInstance(modal);
                      modalInstance?.hide();
                    }
                  }}
                >
                  <div className="modal-body text-center">
                    <span className="delete-icon">
                      <i className="ti ti-trash-x" />
                    </span>
                    <h4>Confirm Deletion</h4>
                    <p>
                      Are you sure you want to delete "{notice.title}"? This can't be undone.
                    </p>
                    <div className="d-flex justify-content-center">
                      <Link
                        to="#"
                        className="btn btn-light me-3"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </Link>
                      <button type="submit" className="btn btn-danger">
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ))}
      {/* /Delete Modals */}
    </>
  );
};

export default NoticeBoard;