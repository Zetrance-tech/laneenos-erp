import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import axios from "axios";
import { Spin, Alert } from "antd";
import { useAuth } from "../../../context/AuthContext";
import Table from "../../../core/common/dataTable/index";
import TooltipOption from "../../../core/common/tooltipOption";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.REACT_APP_URL || "http://localhost:5000";

interface AdminInfo {
  _id: string;
  name: string;
  email: string;
}

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
  admin: AdminInfo | null;
  status: "active" | "inactive";
}

const SuperAdminDashboard = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/branch`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBranches(response.data);
        setFilteredBranches(response.data);
      } catch (err) {
        setError("Failed to fetch branches");
        toast.error("Failed to fetch branches. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [token]);

  useEffect(() => {
    const filtered = branches.filter((branch) =>
      [branch.name, branch.branchId, branch.city]
        .some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredBranches(filtered);
  }, [searchTerm, branches]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const columns = [
    {
      title: "",
      key: "status-dot",
      width: 20,
      render: () => (
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#fff",
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
      render: (admin: AdminInfo | null) => admin?.name || "Unassigned",
    },
  ];

  return (
    <div className="page-wrapper">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Super Admin Dashboard</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Super Admin Dashboard
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            {/* <TooltipOption /> */}
          </div>
        </div>

        <div className="card bg-dark">
          <div className="overlay-img">
            <ImageWithBasePath src="assets/img/bg/shape-04.png" className="img-fluid shape-01" />
            <ImageWithBasePath src="assets/img/bg/shape-01.png" className="img-fluid shape-02" />
            <ImageWithBasePath src="assets/img/bg/shape-02.png" className="img-fluid shape-03" />
            <ImageWithBasePath src="assets/img/bg/shape-03.png" className="img-fluid shape-04" />
          </div>
          <div className="card-body">
            <div className="d-flex align-items-xl-center justify-content-xl-between flex-xl-row flex-column">
              <div className="mb-3 mb-xl-0">
                <div className="d-flex align-items-center flex-wrap mb-2">
                  <h1 className="text-white me-2">Welcome Back, {user?.name}</h1>
                  <Link to="profile" className="avatar avatar-sm img-rounded bg-gray-800 dark-hover">
                    <i className="ti ti-edit text-white" />
                  </Link>
                </div>
                <p className="text-white">Manage your branches and admins</p>
              </div>
              <p className="text-white custom-text-white">
                <i className="ti ti-refresh me-1" />
                Updated Recently on {currentDate}
              </p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
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
                {loading ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                    <Spin size="large" />
                  </div>
                ) : error ? (
                  <Alert message={error} type="error" />
                ) : filteredBranches.length === 0 ? (
                  <p className="text-center">No branches found.</p>
                ) : (
                  <Table columns={columns} dataSource={filteredBranches} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
