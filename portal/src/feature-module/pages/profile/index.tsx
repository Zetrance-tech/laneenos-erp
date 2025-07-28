import React, { useState, useEffect, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import { Spin, message, Descriptions, Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const API_URL = process.env.REACT_APP_URL;

interface AdminData {
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  lastLogin?: string;
  photo?: string;
  branchId?: string;
  branchName?: string;
}

const Profilesettings: React.FC = () => {
  const routes = all_routes;
  const { token, user } = useAuth();
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [photo, setPhoto] = useState<string>("assets/img/teachers/teacher-01.jpg");

  const fetchAdminProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: AdminData = response.data.data;
      setAdminData(data);
      setPhoto(data.photo ? `${API_URL}/${data.photo}` : "assets/img/teachers/teacher-01.jpg");
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      message.error("Failed to fetch profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("profilePhoto", file);
      try {
        setIsLoading(true);
        const response = await axios.post(`${API_URL}/api/auth/upload-photo`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        message.success("Profile photo uploaded successfully");
        await fetchAdminProfile();
      } catch (error) {
        console.error("Error uploading photo:", error);
        message.error("Failed to upload profile photo");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "superadmin") {
      fetchAdminProfile();
    }
  }, [user]);

  if (user?.role !== "admin" && user?.role !== "superadmin") {
    return <div>Access Denied: Admin privileges required</div>;
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Profile Settings</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="#">Settings</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Profile Settings
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="pe-1 mb-2">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="tooltip-top">Refresh</Tooltip>}
              >
                <button
                  className="btn btn-outline-light bg-white btn-icon me-1"
                  onClick={fetchAdminProfile}
                >
                  <i className="ti ti-refresh" />
                </button>
              </OverlayTrigger>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <Spin size="large" />
          </div>
        ) : (
          <div className="row">
            <div className="col-xxl-10 col-xl-9">
              <div className="card">
                <div className="card-header p-3">
                  <h5>Profile Photo</h5>
                </div>
                <div className="card-body p-3 pb-0">
                  <div className="text-center mb-3">
                    <img
                      src={photo}
                      alt="Profile"
                      style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover" }}
                    />
                  </div>
                  <div className="text-center mb-4">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="form-control w-auto mx-auto"
                    />
                  </div>

                  {adminData && (
                    <Descriptions
                      bordered
                      column={1}
                      size="middle"
                      title="Admin Details"
                    >
                      <Descriptions.Item label="Name">{adminData.name}</Descriptions.Item>
                      <Descriptions.Item label="Email">{adminData.email}</Descriptions.Item>
                      <Descriptions.Item label="Phone">{adminData.phone || "N/A"}</Descriptions.Item>
                      <Descriptions.Item label="Role">{adminData.role}</Descriptions.Item>
                      <Descriptions.Item label="Status">{adminData.status}</Descriptions.Item>
                      {adminData.lastLogin && (
                        <Descriptions.Item label="Last Login">
                          {new Date(adminData.lastLogin).toLocaleString()}
                        </Descriptions.Item>
                      )}
                      {adminData.branchName && (
                        <Descriptions.Item label="Branch Name">{adminData.branchName}</Descriptions.Item>
                      )}
                    </Descriptions>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profilesettings;
