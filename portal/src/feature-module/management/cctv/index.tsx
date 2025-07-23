import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import { status } from "../../../core/common/selectoption/selectoption";
import CommonSelect from "../../../core/common/commonSelect";
import TooltipOption from "../../../core/common/tooltipOption";
import axios from "axios";
import Table from "../../../core/common/dataTable/index";
import { Modal, Descriptions, Spin } from "antd";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { jwtDecode } from "jwt-decode";
// Define interfaces
interface CCTV {
  _id: string;
  cctvId: string;
  cctvName: string;
  cctvLink: string;
  photoUrl?: string;
  description?: string;
  status: string;
}

interface User {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "superadmin" | "student" | "parent" | "teacher";
  branchId: string | null;
}
interface MyTokenPayload {
  userId: string;
  role: string;
  branchId: string;
  iat: number;
  exp: number;
}
interface FormData {
  cctvId: string;
  cctvName: string;
  cctvLink: string;
  photoUrl: string;
  description: string;
  status: string;
}

interface AxiosError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const API_URL = process.env.REACT_APP_URL;

const CctvData = () => {
  let decoded: MyTokenPayload | null = null;
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [cctvs, setCCTVs] = useState<CCTV[]>([]);
  const [formData, setFormData] = useState<FormData>({
    cctvId: "",
    cctvName: "",
    cctvLink: "",
    photoUrl: "",
    description: "",
    status: "inactive",
  });
  const [editCCTV, setEditCCTV] = useState<CCTV | null>(null);
  const [cctvToDelete, setCCTVToDelete] = useState<CCTV | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { token, user } = useAuth() as {
    token: string | null;
    user: User | null;
  };
  const [selectedCCTV, setSelectedCCTV] = useState<CCTV | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  //   console.log(user);
  try {
    decoded = token ? jwtDecode<MyTokenPayload>(token) : null;
  } catch (error) {
    console.error("Error decoding token:", error);
    toast.error("Invalid token. Please log in again.");
  }
  console.log(decoded);

  // Fetch CCTVs for the user's branch
  const fetchCCTVs = async () => {
    if (!token) {
      toast.error("Authentication token not found");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await axios.get<CCTV[]>(`${API_URL}/api/cctv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCCTVs(res.data); // ✅ res.data is now CCTV[]

      console.log("Fetched CCTVs:", res.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Error fetching CCTVs:", axiosError);
      //   toast.error(axiosError.response?.data?.message || "Failed to fetch CCTVs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCCTVs();
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleViewClick = (cctv: CCTV) => {
    setSelectedCCTV(cctv);
    setIsViewModalOpen(true);
  };

  // Handle form submission for adding a CCTV
  const handleAddCCTV = async () => {
    if (!formData.cctvId || !formData.cctvName || !formData.cctvLink) {
      toast.error("CCTV ID, Name, and Link are required");
      return;
    }

    if (!token) {
      toast.error("Authentication token not found");
      return;
    }

    const cctvData = {
      cctvId: formData.cctvId,
      cctvName: formData.cctvName,
      cctvLink: formData.cctvLink,
      photoUrl: formData.photoUrl,
      description: formData.description,
      status: formData.status,
      createdBy: decoded?.userId,
    };
    console.log("Add CCTV payload:", cctvData);

    try {
      const response = await axios.post(
        `${API_URL}/api/cctv/create`,
        cctvData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Add CCTV response:", response.data);
      toast.success("CCTV created successfully!");
      fetchCCTVs();
      setFormData({
        cctvId: "",
        cctvName: "",
        cctvLink: "",
        photoUrl: "",
        description: "",
        status: "inactive",
      });
      setIsAddModalOpen(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Error creating CCTV:", axiosError);
      toast.error(
        axiosError.response?.data?.message || "Failed to create CCTV"
      );
    }
  };

  // Handle edit button click
  const handleEditClick = (cctv: CCTV) => {
    setEditCCTV(cctv);
    setFormData({
      cctvId: cctv.cctvId,
      cctvName: cctv.cctvName,
      cctvLink: cctv.cctvLink,
      photoUrl: cctv.photoUrl || "",
      description: cctv.description || "",
      status: cctv.status,
    });
    setIsEditModalOpen(true);
  };

  // Handle form submission for editing a CCTV
  const handleEditCCTV = async () => {
    if (!editCCTV) return;

    if (!formData.cctvId || !formData.cctvName || !formData.cctvLink) {
      toast.error("CCTV ID, Name, and Link are required");
      return;
    }

    if (!token) {
      toast.error("Authentication token not found");
      return;
    }

    const updatedCCTVData = {
      cctvId: formData.cctvId,
      cctvName: formData.cctvName,
      cctvLink: formData.cctvLink,
      photoUrl: formData.photoUrl,
      description: formData.description,
      status: formData.status,
    };
    console.log("Update CCTV payload:", updatedCCTVData);

    try {
      const response = await axios.put(
        `${API_URL}/api/cctv/${editCCTV._id}`,
        updatedCCTVData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Update CCTV response:", response.data);
      toast.success("CCTV updated successfully!");
      fetchCCTVs();
      setFormData({
        cctvId: "",
        cctvName: "",
        cctvLink: "",
        photoUrl: "",
        description: "",
        status: "inactive",
      });
      setEditCCTV(null);
      setIsEditModalOpen(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Error updating CCTV:", axiosError);
      toast.error(
        axiosError.response?.data?.message || "Failed to update CCTV"
      );
    }
  };

  // Handle delete button click
  const handleDeleteClick = (cctv: CCTV) => {
    setCCTVToDelete(cctv);
    setIsDeleteModalOpen(true);
  };

  // Handle form submission for deleting a CCTV
  const handleDeleteCCTV = async () => {
    if (!cctvToDelete) return;

    if (!token) {
      toast.error("Authentication token not found");
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/api/cctv/${cctvToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Delete CCTV response:", response.data);
      toast.success("CCTV deleted successfully!");
      setCCTVs((prev) => prev.filter((cctv) => cctv._id !== cctvToDelete._id));
      setCCTVToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Error deleting CCTV:", axiosError);
      toast.error(
        axiosError.response?.data?.message || "Failed to delete CCTV"
      );
    }
  };

  // Handle filter apply click
  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList?.remove("show");
    }
  };

  // Table columns
  const columns = [
    {
      title: "",
      key: "status-dot",
      width: 20,
      render: (_: any, record: CCTV) => (
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
      title: "CCTV ID",
      dataIndex: "cctvId",
      sorter: (a: CCTV, b: CCTV) => a.cctvId.length - b.cctvId.length,
    },
    {
      title: "CCTV Name",
      dataIndex: "cctvName",
      sorter: (a: CCTV, b: CCTV) => a.cctvName.length - b.cctvName.length,
    },
    {
      title: "CCTV Link",
      dataIndex: "cctvLink",
      render: (text: string) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span
          className={`badge badge-soft-${
            text === "active" ? "success" : "danger"
          } d-inline-flex align-items-center`}
        >
          <i className="ti ti-circle-filled fs-5 me-1"></i>
          {text}
        </span>
      ),
      sorter: (a: CCTV, b: CCTV) => a.status.length - b.status.length,
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: CCTV) => (
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
            {(user?.role === "admin" || user?.role === "teacher") && (
              <>
                <li>
                  <Link
                    className="dropdown-item rounded-1"
                    to="#"
                    onClick={() => handleViewClick(record)}
                  >
                    <i className="ti ti-eye me-2" />
                    View Details
                  </Link>
                </li>
                <li>
                  <Link
                    className="dropdown-item rounded-1"
                    to="#"
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
              <h3 className="page-title mb-1">CCTVs</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    CCTVs
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              {/* <TooltipOption /> */}
              {(user?.role === "admin" || user?.role === "teacher") && (
                <div className="mb-2">
                  <Link
                    to="#"
                    className="btn btn-primary"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <i className="ti ti-square-rounded-plus-filled me-2" />
                    Add CCTV
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">CCTVs</h4>
            </div>
            <div className="card-body p-0 py-3">
              {isLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "200px",
                  }}
                >
                  <Spin size="large" />
                </div>
              ) : (
                <Table columns={columns} dataSource={cctvs} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add CCTV Modal */}
      <Modal
        title="Add CCTV"
        style={{ top: "6px" }}
        open={isAddModalOpen}
        onOk={handleAddCCTV}
        zIndex={10000}
        onCancel={() => {
          setFormData({
            cctvId: "",
            cctvName: "",
            cctvLink: "",
            photoUrl: "",
            description: "",
            status: "inactive",
          });
          setIsAddModalOpen(false);
        }}
        okText="Add CCTV"
        cancelText="Cancel"
      >
        <div className="row">
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">CCTV ID</label>
              <input
                type="text"
                className="form-control"
                name="cctvId"
                value={formData.cctvId}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">CCTV Name</label>
              <input
                type="text"
                className="form-control"
                name="cctvName"
                value={formData.cctvName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">CCTV Link</label>
              <input
                type="url"
                className="form-control"
                name="cctvLink"
                value={formData.cctvLink}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Photo URL (Optional)</label>
              <input
                type="url"
                className="form-control"
                name="photoUrl"
                value={formData.photoUrl}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-control"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Status</label>
              <CommonSelect
                className="select"
                options={status}
                defaultValue={status.find(
                  (option: any) => option.value === formData.status
                )}
                onChange={(option: any) => {
                  if (option) {
                    setFormData({
                      ...formData,
                      status: option.value,
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit CCTV Modal */}
      <Modal
        zIndex={10000}
        style={{ top: "6px" }}
        title="Edit CCTV"
        open={isEditModalOpen}
        onOk={handleEditCCTV}
        onCancel={() => {
          setFormData({
            cctvId: "",
            cctvName: "",
            cctvLink: "",
            photoUrl: "",
            description: "",
            status: "inactive",
          });
          setEditCCTV(null);
          setIsEditModalOpen(false);
        }}
        okText="Save Changes"
        cancelText="Cancel"
      >
        <div className="row">
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">CCTV ID</label>
              <input
                type="text"
                className="form-control"
                name="cctvId"
                value={formData.cctvId}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">CCTV Name</label>
              <input
                type="text"
                className="form-control"
                name="cctvName"
                value={formData.cctvName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">CCTV Link</label>
              <input
                type="url"
                className="form-control"
                name="cctvLink"
                value={formData.cctvLink}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Photo URL (Optional)</label>
              <input
                type="url"
                className="form-control"
                name="photoUrl"
                value={formData.photoUrl}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-control"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Status</label>
              <CommonSelect
                className="select"
                options={status}
                defaultValue={status.find(
                  (option: any) => option.value === formData.status
                )}
                onChange={(option: any) => {
                  if (option) {
                    setFormData({
                      ...formData,
                      status: option.value,
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        title="CCTV Details"
        open={isViewModalOpen}
        onCancel={() => {
          setSelectedCCTV(null);
          setIsViewModalOpen(false);
        }}
        footer={null}
        zIndex={10000}
      >
        {selectedCCTV && (
          <Descriptions
            bordered
            column={1}
            size="middle"
            labelStyle={{ fontWeight: 600, width: "140px" }}
          >
            <Descriptions.Item label="CCTV ID">
              {selectedCCTV.cctvId}
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              {selectedCCTV.cctvName}
            </Descriptions.Item>
            <Descriptions.Item label="Link">
              <a
                href={selectedCCTV.cctvLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {selectedCCTV.cctvLink}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <span
                className={`badge badge-soft-${
                  selectedCCTV.status === "active" ? "success" : "danger"
                }`}
              >
                {selectedCCTV.status}
              </span>
            </Descriptions.Item>
            {selectedCCTV.description && (
              <Descriptions.Item label="Description">
                {selectedCCTV.description}
              </Descriptions.Item>
            )}
            {selectedCCTV.photoUrl && (
              <Descriptions.Item label="Photo">
                <img
                  src={selectedCCTV.photoUrl}
                  alt="CCTV"
                  style={{ maxWidth: "100%", borderRadius: "6px" }}
                />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Deletion"
        open={isDeleteModalOpen}
        onOk={handleDeleteCCTV}
        onCancel={() => {
          setCCTVToDelete(null);
          setIsDeleteModalOpen(false);
        }}
        okText="Yes, Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <div className="text-center">
          <span className="delete-icon">
            <i className="ti ti-trash-x" />
          </span>
          <p>
            Are you sure you want to delete the CCTV "{cctvToDelete?.cctvName}"?
            This cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default CctvData;
