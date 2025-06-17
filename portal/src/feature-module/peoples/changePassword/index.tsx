import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import Table from "../../../core/common/dataTable/index";
import TooltipOption from "../../../core/common/tooltipOption";
import axios from "axios";
import { Spin, Modal, Form, Input, message, Select } from "antd";
import { useAuth } from "../../../context/AuthContext";
const API_URL = process.env.REACT_APP_URL;

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  status: string;
  lastLogin?: string;
}

const UserList = () => {
  const routes = all_routes;
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { token, user } = useAuth();
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);

  const fetchUsers = async () => {
  try {
    setIsLoading(true);
    const res = await axios.get(`${API_URL}/api/auth`, {
      headers: { Authorization: `Bearer ${token}` },
      params: roleFilter && roleFilter !== "all" ? { role: roleFilter } : {},
    });
    setUsers(res.data);
  } catch (error) {
    console.error("Error fetching users:", error);
    message.error("Failed to fetch users");
  } finally {
    setIsLoading(false);
  }
};


  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [roleFilter, user]);

  // Check if user is admin after hooks
  if (user?.role !== "admin") {
    return <div>Access Denied: Admin privileges required</div>;
  }

  const handleChangePassword = async (values: { password: string }) => {
    try {
      await axios.put(
        `${API_URL}/api/auth/${selectedUserId}/password`,
        { password: values.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Password updated successfully");
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error updating password:", error);
      message.error("Failed to update password");
    }
  };

  const showPasswordModal = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedUserId(null);
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
      sorter: (a: User, b: User) => a.name.localeCompare(b.name),
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: (a: User, b: User) => a.email.localeCompare(b.email),
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (text: string) => text.charAt(0).toUpperCase() + text.slice(1),
      sorter: (a: User, b: User) => a.role.localeCompare(b.role),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      render: (text: string) => text || "N/A",
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: User) => (
        <div className="d-flex align-items-center">
          <Link
            to="#"
            className="btn btn-light fs-12 fw-semibold me-3"
            onClick={() => showPasswordModal(record._id)}
          >
            Change Password
          </Link>
        </div>
      ),
    },
  ];

  const roleOptions = [
    { label: "All Roles", value: "all" },
    { label: "Admin", value: "admin" },
    { label: "Teacher", value: "teacher" },
    { label: "Parent", value: "parent" },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Users List</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">Users</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    All Users
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Users List</h4>
              <div className="d-flex align-items-center flex-wrap">
                <Select
                  style={{ width: 150 }}
                  options={roleOptions}
                  value={roleFilter}
                  onChange={(value) => setRoleFilter(value)}
                  placeholder="Filter by Role"
                  className="mb-3 me-2"
                />
              </div>
            </div>
            <div className="card-body p-0 py-3">
              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Table dataSource={users} columns={columns} />
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="Change Password"
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText="Update Password"
        zIndex={10000}
      >
        <Form form={form} onFinish={handleChangePassword} layout="vertical">
          <Form.Item
            name="password"
            label="New Password"
            // rules={[
            //   { required: true, message: "Please input the new password!" },
            //   { min: 6, message: "Password must be at least 6 characters!" },
            // ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UserList;