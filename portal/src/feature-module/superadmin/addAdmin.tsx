import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";
import { status } from "../../core/common/selectoption/selectoption";
import TooltipOption from "../../core/common/tooltipOption";
import axios from "axios";
import Table from "../../core/common/dataTable/index";
import { Modal, Form, Input, Select, Row, Col, Alert, Spin, Descriptions } from "antd";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const API_URL = process.env.REACT_APP_URL || "http://localhost:5000";

interface Admin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive" | "suspended";
}

interface AuthContext {
  token: string;
  user: {
    _id: string;
    role: string;
    branchId?: string;
  };
}

const AddAdmin: React.FC = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState<boolean>(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState<boolean>(false);
  const [showViewAdminModal, setShowViewAdminModal] = useState<boolean>(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const { token, user } = useAuth();

  // Fetch admins
  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<Admin[]>(`${API_URL}/api/auth/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(response.data);
      setFilteredAdmins(response.data);
    } catch (error: any) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to fetch admins. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Handle search
  useEffect(() => {
    const filtered = admins.filter(
      (admin) =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAdmins(filtered);
  }, [searchTerm, admins]);

  // Handle admin creation
  const handleAddAdmin = async (values: Omit<Admin, "_id"> & { password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/api/auth/admins`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Admin created successfully!");
      fetchAdmins();
      setShowAddAdminModal(false);
      form.resetFields();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add admin");
      toast.error(err.response?.data?.message || "Failed to add admin");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle admin editing
  const handleEditAdmin = async (values: Omit<Admin, "_id">) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!selectedAdmin) throw new Error("No admin selected");
      await axios.put(`${API_URL}/api/auth/admins/${selectedAdmin._id}`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Admin updated successfully!");
      fetchAdmins();
      setShowEditAdminModal(false);
      editForm.resetFields();
      setSelectedAdmin(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update admin");
      toast.error(err.response?.data?.message || "Failed to update admin");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view admin
  const handleViewAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowViewAdminModal(true);
  };

  // Table columns
  const columns = [
    {
      title: "",
      key: "status-dot",
      width: 20,
      render: (_: any, record: Admin) => (
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
      title: "Email",
      dataIndex: "email",
      sorter: (a: Admin, b: Admin) => a.email.localeCompare(b.email),
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a: Admin, b: Admin) => a.name.localeCompare(b.name),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      render: (phone: string) => phone || "N/A",
      sorter: (a: Admin, b: Admin) => (a.phone || "").localeCompare(b.phone || ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span
          className={`badge badge-soft-${
            text === "active" ? "success" : text === "inactive" ? "danger" : "warning"
          } d-inline-flex align-items-center`}
        >
          <i className="ti ti-circle-filled fs-5 me-1"></i>
          {text}
        </span>
      ),
      sorter: (a: Admin, b: Admin) => a.status.localeCompare(b.status),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Admin) => (
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
                  to="#"
                  onClick={() => {
                    setSelectedAdmin(record);
                    setShowEditAdminModal(true);
                    editForm.setFieldsValue(record);
                  }}
                >
                  <i className="ti ti-edit-circle me-2" />
                  Edit
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  onClick={() => handleViewAdmin(record)}
                >
                  <i className="ti ti-eye me-2" />
                  View Details
                </Link>
              </li>
            </ul>
          </div>
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
              <h3 className="page-title mb-1">Admins</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Admins
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
              <div className="mb-2">
                <Link
                  to="#"
                  className="btn btn-primary"
                  onClick={() => setShowAddAdminModal(true)}
                >
                  <i className="ti ti-square-rounded-plus-filled me-2" />
                  Add Admin
                </Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Admins</h4>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="card-body p-0 py-3">
              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Table columns={columns} dataSource={filteredAdmins} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      <Modal
        title="Add New Admin"
        open={showAddAdminModal}
        onCancel={() => {
          setShowAddAdminModal(false);
          form.resetFields();
          setError(null);
        }}
        footer={null}
        width={600}
        zIndex={10000}
        style={{ top: 50 }}
      >
        <Form form={form} onFinish={handleAddAdmin} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: "Please enter admin name" }]}
              >
                <Input placeholder="e.g., John Doe" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="e.g., admin@example.com" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please enter password" },
                  { min: 6, message: "Password must be at least 6 characters" },
                ]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[{ pattern: /^\d{10}$/, message: "Please enter a valid 10-digit phone number" }]}
              >
                <Input placeholder="e.g., 1234567890" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: "Please select status" }]}
              >
                <Select placeholder="Select status">
                  {status.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              Add Admin
            </button>
            {error && <Alert message={error} type="error" style={{ marginTop: 16 }} />}
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal
        title="Edit Admin"
        open={showEditAdminModal}
        onCancel={() => {
          setShowEditAdminModal(false);
          editForm.resetFields();
          setError(null);
          setSelectedAdmin(null);
        }}
        footer={null}
        width={600}
        zIndex={10000}
        style={{ top: 50 }}
      >
        <Form form={editForm} onFinish={handleEditAdmin} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: "Please enter admin name" }]}
              >
                <Input placeholder="e.g., John Doe" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input disabled placeholder="e.g., admin@example.com" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[{ pattern: /^\d{10}$/, message: "Please enter a valid 10-digit phone number" }]}
              >
                <Input placeholder="e.g., 1234567890" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: "Please select status" }]}
              >
                <Select placeholder="Select status">
                  {status.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              Update Admin
            </button>
            {error && <Alert message={error} type="error" style={{ marginTop: 16 }} />}
          </Form.Item>
        </Form>
      </Modal>

      {/* View Admin Modal */}
      <Modal
        title="Admin Details"
        open={showViewAdminModal}
        onCancel={() => {
          setShowViewAdminModal(false);
          setSelectedAdmin(null);
        }}
        footer={null}
        width={600}
        zIndex={10000}
        style={{ top: 50 }}
      >
        {selectedAdmin && (
          <div>
            <Descriptions
              title="Admin Details"
              bordered
              column={1}
              size="middle"
            >
              <Descriptions.Item label="Name">{selectedAdmin.name}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedAdmin.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedAdmin.phone || "N/A"}</Descriptions.Item>
              <Descriptions.Item label="Status">{selectedAdmin.status}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AddAdmin;