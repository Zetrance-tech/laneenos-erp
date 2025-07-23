import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import Table from "../../../core/common/dataTable/index";
import { Spin } from "antd";
import {
  allClass,
  gender,
  status,
} from "../../../core/common/selectoption/selectoption";
import CommonSelect from "../../../core/common/commonSelect";
import TooltipOption from "../../../core/common/tooltipOption";
import axios, { AxiosError } from "axios";
import toast, { Toaster } from "react-hot-toast";
import dayjs from "dayjs";
import { useAuth } from "../../../context/AuthContext";
const API_URL = process.env.REACT_APP_URL;

interface Enquiry {
  _id: string;
  status: "enquiry generated" | "in process" | "admission taken";
  sessionId: { _id: string; name: string };
  classId?: { _id: string; name: string };
  name: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
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
  remark: string;
}

const EnquiryList = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const { token, user } = useAuth();

  // Fetch all enquiries
  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/enquiry`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEnquiries(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching enquiries:", error);
        // toast.error("Failed to fetch enquiries");
        setLoading(false);
      }
    };
    fetchEnquiries();
  }, []);

  const handleDelete = async () => {
    if (!selectedEnquiryId) return;

    try {
      await axios.delete(`${API_URL}/api/enquiry/${selectedEnquiryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnquiries(enquiries.filter((enquiry) => enquiry._id !== selectedEnquiryId));
      toast.success("Enquiry deleted successfully!");
      setSelectedEnquiryId(null);
      // Manually hide the modal to prevent backdrop issues
      const modal = document.getElementById("delete-modal");
      if (modal) {
        modal.classList.remove("show");
        modal.style.display = "none";
        document.body.classList.remove("modal-open");
        const backdrops = document.querySelectorAll(".modal-backdrop");
        backdrops.forEach((backdrop) => backdrop.remove());
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Delete error:", axiosError.response?.data || axiosError.message);
      toast.error(
        "Failed to delete enquiry: " +
          (axiosError.response?.data?.message || axiosError.message || "Unknown error")
      );
    }
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const openDeleteModal = (id: string) => {
    setSelectedEnquiryId(id);
    const modal = document.getElementById("delete-modal");
    if (modal) {
      modal.classList.add("show");
      modal.style.display = "block";
      document.body.classList.add("modal-open");
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop fade show";
      document.body.appendChild(backdrop);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (text: string) => (
        <div className="d-flex align-items-center">
          <div className="ms-2">
            <p className="text-dark mb-0">
              <Link to="#">{text}</Link>
            </p>
          </div>
        </div>
      ),
      sorter: (a: Enquiry, b: Enquiry) => a.name.localeCompare(b.name),
    },
    {
      title: "Session",
      dataIndex: "sessionId",
      render: (session: { _id: string; name: string }) => session?.name || "N/A",
      sorter: (a: Enquiry, b: Enquiry) =>
        (a.sessionId?.name || "").localeCompare(b.sessionId?.name || ""),
    },
    {
      title: "Class",
      dataIndex: "classId",
      render: (classObj: { _id: string; name: string }) => classObj?.name || "None",
      sorter: (a: Enquiry, b: Enquiry) =>
        (a.classId?.name || "").localeCompare(b.classId?.name || ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <>
          {text === "enquiry generated" ? (
            <span className="badge badge-soft-info d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              Enquiry Generated
            </span>
          ) : text === "in process" ? (
            <span className="badge badge-soft-warning d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              In Process
            </span>
          ) : (
            <span className="badge badge-soft-success d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              Admission Taken
            </span>
          )}
        </>
      ),
      sorter: (a: Enquiry, b: Enquiry) => a.status.localeCompare(b.status),
    },
    {
      title: "Date of Birth",
      dataIndex: "dateOfBirth",
      render: (text: string) =>
        text ? dayjs(text).format("DD MMM YYYY") : "N/A",
      sorter: (a: Enquiry, b: Enquiry) =>
        new Date(a.dateOfBirth).getTime() - new Date(b.dateOfBirth).getTime(),
    },
    {
      title: "Gender",
      dataIndex: "gender",
      sorter: (a: Enquiry, b: Enquiry) => a.gender.localeCompare(b.gender),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Enquiry) => (
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
                  to={routes.viewEnquiry.replace(":id", record._id)}
                >
                  <i className="ti ti-menu me-2" />
                  View Enquiry
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to={routes.editEnquiry.replace(":id", record._id)}
                >
                  <i className="ti ti-edit-circle me-2" />
                  Edit
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  onClick={() => openDeleteModal(record._id)}
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
      <Toaster position="top-right" reverseOrder={false} />
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Enquiries</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    All Enquiries
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              {/* <TooltipOption /> */}
              <div className="mb-2">
                <Link
                  to={routes.enquiry}
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-square-rounded-plus me-2" />
                  Add Enquiry
                </Link>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Enquiry List</h4>
            </div>
            <div className="card-body p-0 py-3">
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                  <Spin size="large" />
                </div>
              ) : enquiries.length === 0 ? (
                <p className="alert alert-danger mx-3" role="alert">No enquiries found.</p>
              ) : (
                <Table dataSource={enquiries} columns={columns} Selection={true} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Delete Modal */}
      <div
        className="modal fade"
        id="delete-modal"
        tabIndex={-1}
        aria-labelledby="deleteModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteModalLabel">
                Confirm Deletion
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setSelectedEnquiryId(null)}
              ></button>
            </div>
            <div className="modal-body">
              Are you sure you want to delete this enquiry? This action cannot be undone.
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
                onClick={() => setSelectedEnquiryId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EnquiryList;