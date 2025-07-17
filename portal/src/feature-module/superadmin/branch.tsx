import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";
import TooltipOption from "../../core/common/tooltipOption";
import axios from "axios";
import Table from "../../core/common/dataTable/index";
import { Modal, Form, Input, Select, Row, Col, Alert, Spin, Descriptions } from "antd";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
const API_URL = process.env.REACT_APP_URL || "http://localhost:5000";

interface Branch {
  _id: string;
  branchId: string;
  name: string;
  branchType: string;
  address: string;
  city: string;
  state: string;
  email: string;
  phoneNumber: string;
  directorName: string;
  directorEmail: string;
  directorPhoneNumber: string;
  status: "active" | "inactive";
  admin?: {
    _id: string;
    name: string;
    email: string;
  } | null;
}

interface AuthContext {
  token: string;
  user: {
    _id: string;
    role: string;
    branchId?: string;
  };
}

const branchTypes = [
  { label: "Daycare", value: "Daycare" },
  { label: "Daycare Kindergarten", value: "Daycare Kindergarten" },
  { label: "Premium Daycare", value: "Premium Daycare" },
  { label: "Corporate Daycare", value: "Corporate Daycare" },
];

const AddBranch: React.FC = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddBranchModal, setShowAddBranchModal] = useState<boolean>(false);
  const [showEditBranchModal, setShowEditBranchModal] = useState<boolean>(false);
  const [showViewBranchModal, setShowViewBranchModal] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const { token, user } = useAuth();

  // Fetch branches
  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<Branch[]>(`${API_URL}/api/branch`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(response.data);
      setFilteredBranches(response.data);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to fetch branches. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Handle search
  useEffect(() => {
    const filtered = branches.filter(
      (branch) =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.branchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBranches(filtered);
  }, [searchTerm, branches]);

  // Handle branch creation
  const handleAddBranch = async (values: Omit<Branch, "_id" | "admin" | "status">) => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/api/branch`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Branch created successfully!");
      fetchBranches();
      setShowAddBranchModal(false);
      form.resetFields();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add branch");
      toast.error(err.response?.data?.message || "Failed to add branch");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle branch editing
  const handleEditBranch = async (values: Omit<Branch, "_id" | "branchId" | "admin">) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!selectedBranch) throw new Error("No branch selected");
      await axios.put(`${API_URL}/api/branch/${selectedBranch._id}`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Branch updated successfully!");
      fetchBranches();
      setShowEditBranchModal(false);
      editForm.resetFields();
      setSelectedBranch(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update branch");
      toast.error(err.response?.data?.message || "Failed to update branch");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view branch
  const handleViewBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowViewBranchModal(true);
  };

  // Table columns
  const columns = [
    {
      title: "",
      key: "status-dot",
      width: 20,
      render: (_: any, record: Branch) => (
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
      title: "Branch ID",
      dataIndex: "branchId",
      sorter: (a: Branch, b: Branch) => a.branchId.localeCompare(b.branchId),
    },
    {
      title: "Branch Name",
      dataIndex: "name",
      sorter: (a: Branch, b: Branch) => a.name.localeCompare(b.name),
    },
    {
      title: "Type",
      dataIndex: "branchType",
      sorter: (a: Branch, b: Branch) => a.branchType.localeCompare(b.branchType),
    },
    {
      title: "City",
      dataIndex: "city",
      sorter: (a: Branch, b: Branch) => a.city.localeCompare(b.city),
    },
    {
      title: "Admin",
      dataIndex: "admin",
      render: (admin: Branch["admin"]) => admin?.name || "Unassigned",
      sorter: (a: Branch, b: Branch) => (a.admin?.name || "").localeCompare(b.admin?.name || ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span
          className={`badge badge-soft-${text === "active" ? "success" : "danger"} d-inline-flex align-items-center`}
        >
          <i className="ti ti-circle-filled fs-5 me-1"></i>
          {text}
        </span>
      ),
      sorter: (a: Branch, b: Branch) => a.status.localeCompare(b.status),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Branch) => (
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
                  onClick={() => handleViewBranch(record)}
                >
                  <i className="ti ti-eye me-2" />
                  View Details
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  onClick={() => {
                    setSelectedBranch(record);
                    setShowEditBranchModal(true);
                    editForm.setFieldsValue(record);
                  }}
                >
                  <i className="ti ti-edit-circle me-2" />
                  Edit
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
              <h3 className="page-title mb-1">Branches</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Branches
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
                  onClick={() => setShowAddBranchModal(true)}
                >
                  <i className="ti ti-square-rounded-plus-filled me-2" />
                  Add Branch
                </Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Branches</h4>
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
                <Table columns={columns} dataSource={filteredBranches} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Branch Modal */}
      <Modal
        title="Add New Branch"
        open={showAddBranchModal}
        onCancel={() => {
          setShowAddBranchModal(false);
          form.resetFields();
          setError(null);
        }}
        footer={null}
        width={800}
        zIndex={10000}
        style={{ top: 50 }}
      >
        <Form form={form} onFinish={handleAddBranch} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Branch ID"
                name="branchId"
                rules={[{ required: true, message: "Please enter branch ID" }]}
              >
                <Input placeholder="e.g., BR001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Branch Name"
                name="name"
                rules={[{ required: true, message: "Please enter branch name" }]}
              >
                <Input placeholder="e.g., Main Branch" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Branch Type"
                name="branchType"
                rules={[{ required: true, message: "Please select branch type" }]}
              >
                <Select placeholder="Select branch type">
                  {branchTypes.map((type) => (
                    <Select.Option key={type.value} value={type.value}>
                      {type.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Address"
                name="address"
                rules={[{ required: true, message: "Please enter address" }]}
              >
                <Input placeholder="e.g., 123 Main St" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="City"
                name="city"
                rules={[{ required: true, message: "Please enter city" }]}
              >
                <Input placeholder="e.g., New York" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="State"
                name="state"
                rules={[{ required: true, message: "Please enter state" }]}
              >
                <Input placeholder="e.g., NY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="e.g., branch@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phone Number"
                name="phoneNumber"
                rules={[
                  { required: true, message: "Please enter phone number" },
                  { pattern: /^\d{10}$/, message: "Please enter a valid 10-digit phone number" },
                ]}
              >
                <Input placeholder="e.g., 1234567890" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Director Name"
                name="directorName"
                rules={[{ required: true, message: "Please enter director name" }]}
              >
                <Input placeholder="e.g., John Doe" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Director Email"
                name="directorEmail"
                rules={[
                  { required: true, message: "Please enter director email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="e.g., director@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Director Phone Number"
                name="directorPhoneNumber"
                rules={[
                  { required: true, message: "Please enter director phone number" },
                  { pattern: /^\d{10}$/, message: "Please enter a valid 10-digit phone number" },
                ]}
              >
                <Input placeholder="e.g., 0987654321" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              Add Branch
            </button>
            {error && <Alert message={error} type="error" style={{ marginTop: 16 }} />}
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Branch Modal */}
      <Modal
        title="Edit Branch"
        open={showEditBranchModal}
        onCancel={() => {
          setShowEditBranchModal(false);
          editForm.resetFields();
          setError(null);
          setSelectedBranch(null);
        }}
        footer={null}
        width={800}
        zIndex={10000}
        style={{ top: 50 }}
      >
        <Form form={editForm} onFinish={handleEditBranch} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Branch Name"
                name="name"
                rules={[{ required: true, message: "Please enter branch name" }]}
              >
                <Input placeholder="e.g., Main Branch" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Branch Type"
                name="branchType"
                rules={[{ required: true, message: "Please select branch type" }]}
              >
                <Select placeholder="Select branch type">
                  {branchTypes.map((type) => (
                    <Select.Option key={type.value} value={type.value}>
                      {type.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Address"
                name="address"
                rules={[{ required: true, message: "Please enter address" }]}
              >
                <Input placeholder="e.g., 123 Main St" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="City"
                name="city"
                rules={[{ required: true, message: "Please enter city" }]}
              >
                <Input placeholder="e.g., New York" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="State"
                name="state"
                rules={[{ required: true, message: "Please enter state" }]}
              >
                <Input placeholder="e.g., NY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="e.g., branch@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phone Number"
                name="phoneNumber"
                rules={[
                  { required: true, message: "Please enter phone number" },
                  { pattern: /^\d{10}$/, message: "Please enter a valid 10-digit phone number" },
                ]}
              >
                <Input placeholder="e.g., 1234567890" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Director Name"
                name="directorName"
                rules={[{ required: true, message: "Please enter director name" }]}
              >
                <Input placeholder="e.g., John Doe" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Director Email"
                name="directorEmail"
                rules={[
                  { required: true, message: "Please enter director email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="e.g., director@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Director Phone Number"
                name="directorPhoneNumber"
                rules={[
                  { required: true, message: "Please enter director phone number" },
                  { pattern: /^\d{10}$/, message: "Please enter a valid 10-digit phone number" },
                ]}
              >
                <Input placeholder="e.g., 0987654321" />
              </Form.Item>
            </Col>
            <Col span={12}>
        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true, message: "Please select status" }]}
        >
          <Select placeholder="Select status">
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </Form.Item>
      </Col>
          </Row>
          <Form.Item>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              Update Branch
            </button>
            {error && <Alert message={error} type="error" style={{ marginTop: 16 }} />}
          </Form.Item>
        </Form>
      </Modal>

      {/* View Branch Modal */}
      <Modal
        title="Branch Details"
        open={showViewBranchModal}
        onCancel={() => {
          setShowViewBranchModal(false);
          setSelectedBranch(null);
        }}
        footer={null}
        width={800}
        zIndex={10000}
        style={{ top: 50 }}
      >
        {selectedBranch && (
          <Descriptions
            bordered
            column={2}
            size="middle"
          >
            <Descriptions.Item label="Branch ID">{selectedBranch.branchId}</Descriptions.Item>
            <Descriptions.Item label="Email">{selectedBranch.email}</Descriptions.Item>
            
            <Descriptions.Item label="Name">{selectedBranch.name}</Descriptions.Item>
            <Descriptions.Item label="Phone Number">{selectedBranch.phoneNumber}</Descriptions.Item>

            <Descriptions.Item label="Type">{selectedBranch.branchType}</Descriptions.Item>
            <Descriptions.Item label="Director Name">{selectedBranch.directorName}</Descriptions.Item>

            <Descriptions.Item label="Address">{selectedBranch.address}</Descriptions.Item>
            <Descriptions.Item label="Director Email">{selectedBranch.directorEmail}</Descriptions.Item>

            <Descriptions.Item label="City">{selectedBranch.city}</Descriptions.Item>
            <Descriptions.Item label="Director Phone">{selectedBranch.directorPhoneNumber}</Descriptions.Item>

            <Descriptions.Item label="State">{selectedBranch.state}</Descriptions.Item>
            {/* <Descriptions.Item label="Status">{selectedBranch.status}</Descriptions.Item> */}

            <Descriptions.Item label="Admin Name">{selectedBranch.admin?.name || "Unassigned"}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AddBranch;