import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";
import TooltipOption from "../../core/common/tooltipOption";
import axios from "axios";
import Table from "../../core/common/dataTable/index";
import toast, { Toaster } from "react-hot-toast";
import { Spin, Modal, Form, Select, Alert, Row, Col } from "antd";
import { useAuth } from "../../context/AuthContext";
import { Descriptions } from "antd";
const API_URL = process.env.REACT_APP_URL || "http://localhost:5000";

interface Branch {
  _id: string;
  branchId: string;
  name: string;
  branchType: string;
  city: string;
  admin?: {
    _id: string;
    name: string;
    email: string;
    status?: "active" | "inactive" | "suspended"; // Made status optional
  } | null;
  status: "active" | "inactive";
  address?: string;
  email?: string;
  phoneNumber?: string;
  directorName?: string;
}

interface Admin {
  _id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "suspended";
  phone?: string;
}

const AssignAdmin = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [showEditAssignModal, setShowEditAssignModal] = useState(false);
  const [editForm] = Form.useForm();
  const { token } = useAuth();

  // Debug data
  useEffect(() => {
    console.log("Admins:", admins);
    console.log("Branches:", branches);
  }, [admins, branches]);

  // Fetch branches and admins
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/branch`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBranches(response.data);
        console.log("api/branch", response.data);
        setFilteredBranches(response.data);
      } catch (error) {
        console.error("Error fetching branches:", error);
        toast.error("Failed to fetch branches. Please try again.");
      }
    };

    const fetchAdmins = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/admins`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdmins(response.data);
      } catch (error) {
        console.error("Error fetching admins:", error);
        toast.error("Failed to fetch admins. Please try again.");
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchBranches(), fetchAdmins()]);
      setIsLoading(false);
    };

    fetchData();
  }, [token]);

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

  // Handle assign/unassign admin
  const handleAssignAdmin = async (values: any) => {
  setIsLoading(true);
  setError(null);
  try {
    console.log("handleAssignAdmin payload:", values); // Debug payload
    console.log("Selected Branch ID:", values.branchId); // Debug branchId
    if (!values.branchId) {
      throw new Error("Branch ID is required");
    }

    const selectedBranch = branches.find((branch) => branch._id === values.branchId);

    // Choose endpoint based on whether assigning or unassigning
    const endpoint = values.adminId
      ? `${API_URL}/api/branch/assign-admin`
      : `${API_URL}/api/branch/unassign-admin`;
    const payload = values.adminId
      ? { branchId: values.branchId, adminId: values.adminId }
      : { branchId: values.branchId };

    console.log("Calling endpoint:", endpoint); // Debug endpoint
    console.log("Payload:", payload); // Debug payload

    await axios.put(endpoint, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success(values.adminId ? "Admin assigned successfully!" : "Admin unassigned successfully!");
    const response = await axios.get(`${API_URL}/api/branch`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("api/branch response after update:", response.data);
    setBranches(response.data);
    setFilteredBranches(response.data);
    setShowAssignModal(false);
    setShowEditAssignModal(false);
    setSelectedBranchId(null);
    setSelectedAdminId(null);
    form.resetFields();
    editForm.resetFields();
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || err.message || "Failed to update admin assignment";
    console.error("handleAssignAdmin error:", errorMessage, err.response?.data); // Debug error
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};
  // Handle branch selection change
  const handleBranchChange = (value: string) => {
    setSelectedBranchId(value);
  };

  // Handle admin selection change
  const handleAdminChange = (value: string) => {
    setSelectedAdminId(value);
  };

  // Get selected branch details
  const selectedBranch = branches.find((branch) => branch._id === selectedBranchId);
  const branchDetails = selectedBranch && (
    <Descriptions
      bordered
      size="small"
      column={1}
      style={{ marginTop: 8 }}
      labelStyle={{ fontWeight: 600 }}
    >
      <Descriptions.Item label="Branch ID">{selectedBranch.branchId}</Descriptions.Item>
      <Descriptions.Item label="Name">{selectedBranch.name}</Descriptions.Item>
      <Descriptions.Item label="Type">{selectedBranch.branchType}</Descriptions.Item>
      <Descriptions.Item label="City">{selectedBranch.city}</Descriptions.Item>
      <Descriptions.Item label="Address">{selectedBranch.address || "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Email">{selectedBranch.email || "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Phone">{selectedBranch.phoneNumber || "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Director">{selectedBranch.directorName || "N/A"}</Descriptions.Item>
    </Descriptions>
  );

  // Get selected admin details
  const selectedAdmin = admins.find((admin) => admin._id === selectedAdminId);
  const adminDetails = selectedAdmin && (
    <Descriptions
      bordered
      size="small"
      column={1}
      style={{ marginTop: 8 }}
      labelStyle={{ fontWeight: 600 }}
    >
      <Descriptions.Item label="Name">{selectedAdmin.name}</Descriptions.Item>
      <Descriptions.Item label="Email">{selectedAdmin.email}</Descriptions.Item>
      <Descriptions.Item label="Phone">{selectedAdmin.phone || "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Status">{selectedAdmin.status}</Descriptions.Item>
    </Descriptions>
  );

  // Unassigned admins
  const unassignedAdmins = admins.filter(
    (admin) => !branches.some((branch) => branch.admin?._id === admin._id)
  );

  // Edit Assign Modal
  const EditAssignModal: React.FC = () => {
  const handleSubmit = (values: any) => {
    if (values.adminId && selectedBranch?.admin && values.adminId !== selectedBranch.admin._id) {
      Modal.confirm({
        title: "Override Admin Assignment",
        content: `This will unassign ${selectedBranch.admin.name} (${selectedBranch.admin.email}) from ${selectedBranch.name} and assign the new admin. Continue?`,
        onOk: () => handleAssignAdmin(values),
        onCancel: () => {},
      });
    } else {
      handleAssignAdmin(values);
    }
  };

  return (
    <Modal
      title="Edit Admin Assignment"
      visible={showEditAssignModal}
      onCancel={() => {
        setShowEditAssignModal(false);
        setSelectedBranchId(null);
        setSelectedAdminId(null);
        editForm.resetFields();
        setError(null);
      }}
      footer={null}
      width={800}
      zIndex={10000}
      style={{ top: 50 }}
    >
      <Form form={editForm} onFinish={handleSubmit} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Select Branch"
              name="branchId"
              rules={[{ required: true, message: "Please select a branch" }]}
            >
              <Select
                placeholder="Select a branch"
                allowClear
                onChange={handleBranchChange}
              >
                {branches.map((branch) => (
                  <Select.Option key={branch._id} value={branch._id}>
                    {`${branch.name} (${branch.branchId}, ${branch.city})`}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            {branchDetails}
            {selectedBranch?.admin && (
              <Alert
                message={`Current Admin: ${selectedBranch.admin.name} (${selectedBranch.admin.email})`}
                type="info"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </Col>
          <Col span={12}>
            <Form.Item
              label="Select Admin"
              name="adminId"
              rules={[{ required: false, message: "Please select an admin" }]}
            >
              <Select
                placeholder="Select an admin"
                allowClear
                onChange={handleAdminChange}
                optionLabelProp="label"
                disabled={!selectedBranchId}
              >
                <Select.Option
                  key="none"
                  value=""
                  label="None (Unassign)"
                  disabled={!selectedBranch?.admin}
                >
                  None (Unassign)
                </Select.Option>
                {unassignedAdmins
                  .concat(
                    selectedBranch?.admin && "status" in selectedBranch.admin
                      ? [selectedBranch.admin as Admin]
                      : []
                  )
                  .map((admin) => (
                    <Select.Option
                      key={admin._id}
                      value={admin._id}
                      label={`${admin.name || "Unknown"} (${admin.email || "No Email"})`}
                    >
                      {`${admin.name || "Unknown"} (${admin.email || "No Email"})`}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
            {adminDetails}
          </Col>
        </Row>
        <Form.Item>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            Update Assignment
          </button>
          {error && <Alert message={error} type="error" style={{ marginTop: 16 }} />}
        </Form.Item>
      </Form>
    </Modal>
  );
};

  // Table columns
  const columns = [
    {
      title: "",
      key: "status-dot",
      width: 20,
      render: (record: any) => (
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
      title: "Branch → Admin Mapping",
      key: "mapping",
      render: (record: Branch) => {
        const admin = record.admin;
        return (
          <div>
            <strong>{record.name}</strong>
            <span> → </span>
            {admin ? (
              <span>
                {admin.name} <small className="text-muted">({admin.email})</small>
              </span>
            ) : (
              <span className="text-danger">Unassigned</span>
            )}
          </div>
        );
      },
    },
{
  title: "Action",
  key: "action",
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
              onClick={() => {
                setSelectedBranchId(record._id);
                setSelectedAdminId(null); // Reset admin selection
                setShowEditAssignModal(true);
                editForm.setFieldsValue({
                  branchId: record._id, // Only set branchId
                  // Do not set adminId
                });
              }}
            >
              <i className="ti ti-edit-circle me-2" />
              Edit Assignment
            </Link>
          </li>
        </ul>
      </div>
    </div>
  ),
}
  ];

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Assign Admins to Branches</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Assign Admins
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
                  onClick={() => setShowAssignModal(true)}
                >
                  <i className="ti ti-user-plus me-2" />
                  Assign Admin
                </Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Branch Admin Mappings</h4>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Branch ID, Name, or City"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
              ) : error ? (
                <Alert message={error} type="error" />
              ) : branches.length === 0 ? (
                <p>No branches available</p>
              ) : (
                <Table columns={columns} dataSource={filteredBranches} />
              )}
            </div>
          </div>
        </div>

        {/* Assign Admin Modal */}
        <Modal
          title="Assign Admin to Branch"
          visible={showAssignModal}
          onCancel={() => {
            setShowAssignModal(false);
            setSelectedBranchId(null);
            setSelectedAdminId(null);
            form.resetFields();
            setError(null);
          }}
          footer={null}
          width={800}
          zIndex={10000}
          style={{ top: 50 }}
        >
          <Form form={form} onFinish={handleAssignAdmin} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Select Branch"
                  name="branchId"
                  rules={[{ required: true, message: "Please select a branch" }]}
                >
                  <Select
                    placeholder="Select a branch"
                    allowClear
                    onChange={handleBranchChange}
                  >
                    {branches
                      .filter((branch) => !branch.admin)
                      .map((branch) => (
                        <Select.Option key={branch._id} value={branch._id}>
                          {`${branch.name} (${branch.branchId}, ${branch.city})`}
                        </Select.Option>
                      ))}
                  </Select>
                </Form.Item>
                {branchDetails}
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Select Admin"
                  name="adminId"
                  rules={[{ required: true, message: "Please select an admin" }]}
                >
                  <Select
                    placeholder="Select an admin"
                    allowClear
                    onChange={handleAdminChange}
                    optionLabelProp="label"
                  >
                    {unassignedAdmins.map((admin) => (
                      <Select.Option
                        key={admin._id}
                        value={admin._id}
                        label={`${admin.name || "Unknown"} (${admin.email || "No Email"})`}
                      >
                        {`${admin.name || "Unknown"} (${admin.email || "No Email"})`}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                {adminDetails}
              </Col>
            </Row>
            <Form.Item>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                Assign Admin
              </button>
              {error && <Alert message={error} type="error" style={{ marginTop: 16 }} />}
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Assign Modal */}
        <EditAssignModal />
      </div>
    </div>
  );
};

export default AssignAdmin;
