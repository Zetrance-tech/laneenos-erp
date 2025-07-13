import React, { useRef, useState, useEffect } from "react";
import { all_routes } from "../../router/all_routes";
import { Link } from "react-router-dom";
import Table from "../../../core/common/dataTable/index";
import FeesModal from "./feesModal";
import TooltipOption from "../../../core/common/tooltipOption";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
const API_URL = process.env.REACT_APP_URL;

export interface FeesGroup {
  _id: string;
  name: string;
  periodicity: "Monthly" | "Quarterly" | "Yearly" | "One Time";
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface FeesType {
  _id: string;
  name: string;
  feesGroup: { _id: string; name: string };
  description?: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

const FeesGroup: React.FC = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [feesGroups, setFeesGroups] = useState<FeesGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModalId, setEditModalId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const {token} = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsResponse] = await Promise.all([
          axios.get<FeesGroup[]>(`${API_URL}/api/feesGroup`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);
        setFeesGroups(groupsResponse.data);
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
        toast.error("Failed to fetch data");
      }
    };
    fetchData();
  }, []);

  // const handleApplyClick = () => {
  //   if (dropdownMenuRef.current) {
  //     dropdownMenuRef.current.classList.remove("show");
  //   }
  // };

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
            backgroundColor: "ffff",
            marginLeft: 15,
          }}
        />
      ),
    },
    {
      title: "Fees Group",
      dataIndex: "name",
      sorter: (a: FeesGroup, b: FeesGroup) => a.name.localeCompare(b.name),
    },
    {
      title: "Periodicity",
      dataIndex: "periodicity",
      sorter: (a: FeesGroup, b: FeesGroup) =>
        (a.periodicity || "").localeCompare(b.periodicity || ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <>
          {text === "Active" ? (
            <span className="badge badge-soft-success d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              {text}
            </span>
          ) : (
            <span className="badge badge-soft-danger d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              {text}
            </span>
          )}
        </>
      ),
      sorter: (a: FeesGroup, b: FeesGroup) => a.status.localeCompare(b.status),
    },
    {
      title: "Action",
      dataIndex: "_id",
      render: (id: string) => (
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
                  onClick={() => setEditModalId(id)}
                >
                  <i className="ti ti-edit-circle me-2" />
                  Edit
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  onClick={() => setDeleteModalId(id)}
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Fees Collection</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="#">Fees Collection</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Fees Group
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
              <div className="mb-2">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="ti ti-square-rounded-plus me-2" />
                  Add Fees Group
                </button>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Fees Groups</h4>
            </div>
            <div className="card-body p-0 py-3">
              <Table dataSource={feesGroups} columns={columns}/>
            </div>
          </div>
        </div>
      </div>
      <FeesModal
        feesGroups={feesGroups}
        setFeesGroups={setFeesGroups}
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        editModalId={editModalId}
        setEditModalId={setEditModalId}
        deleteModalId={deleteModalId}
        setDeleteModalId={setDeleteModalId}
      />
    </>
  );
};

export default FeesGroup;