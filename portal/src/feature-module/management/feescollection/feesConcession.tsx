import React, { useRef, useState, useEffect } from "react";
import { all_routes } from "../../router/all_routes";
import { Link } from "react-router-dom";
import PredefinedDateRanges from "../../../core/common/datePicker";
import CommonSelect from "../../../core/common/commonSelect";
import Table from "../../../core/common/dataTable/index";
import TooltipOption from "../../../core/common/tooltipOption";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
interface FeesGroup {
  _id: string;
  id: string;
  name: string;
  periodicity: "Monthly" | "Quarterly" | "Yearly" | "One Time";
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

interface Discount {
  feesGroup: string;
  percentageDiscount: number;
}

interface FeesConcession {
  _id: string;
  category: string;
  discounts: { feesGroup: { _id: string; name: string }; percentageDiscount: number }[];
  createdAt: string;
  updatedAt: string;
}

interface SelectOption {
  value: string;
  label: string;
}

const API_URL = process.env.REACT_APP_URL;

const categories: SelectOption[] = [
  { value: "EWS", label: "EWS" },
  { value: "Corporate Concession", label: "Corporate Concession" },
  { value: "First Sibling Concession", label: "First Sibling Concession" },
  { value: "Staff Concession", label: "Staff Concession" },
  { value: "Management Concession", label: "Management Concession" },
  { value: "Armed Forces Concession", label: "Armed Forces Concession" },
  { value: "Second Sibling Concession", label: "Second Sibling Concession" },
  { value: "Scholarship Concession", label: "Scholarship Concession" },
  { value: "Readmission Concession", label: "Readmission Concession" },
  { value: "Girl Child Concession", label: "Girl Child Concession" },
  { value: "Early Enrollment Concession", label: "Early Enrollment Concession" },
  { value: "Other", label: "Other" },
];

const FeesConcessions: React.FC = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [feesConcessionsData, setFeesConcessionsData] = useState<FeesConcession[]>([]);
  const [filteredData, setFilteredData] = useState<FeesConcession[]>([]);
  const [feesGroups, setFeesGroups] = useState<FeesGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editConcessionId, setEditConcessionId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    discounts: [] as Discount[],
  });
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
  });
  const {token} = useAuth();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };
        
        const [concessionsResponse, groupsResponse] = await Promise.all([
          axios.get<FeesConcession[]>(`${API_URL}/api/concession`, { headers }),
          axios.get<FeesGroup[]>(`${API_URL}/api/concession/fee-groups`, { headers }),
        ]);
        
        setFeesConcessionsData(concessionsResponse.data);
        setFilteredData(concessionsResponse.data);
        setFeesGroups(groupsResponse.data);
        // Initialize discounts with all fee groups set to 0
        setFormData((prev) => ({
          ...prev,
          discounts: groupsResponse.data.map((group) => ({
            feesGroup: group._id,
            percentageDiscount: 0,
          })),
        }));
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
        toast.error("Failed to fetch data");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const checkExistingConcession = async () => {
      if (formData.category) {
        try {
          const headers = {
            Authorization: `Bearer ${token}`,
          };
          const existingConcession = feesConcessionsData.find((concession) => concession.category === formData.category);
          if (existingConcession) {
            setEditConcessionId(existingConcession._id);
            const allDiscounts = feesGroups.map((group) => {
              const existingDiscount = existingConcession.discounts.find((d) => d.feesGroup._id === group._id);
              return {
                feesGroup: group._id,
                percentageDiscount: existingDiscount ? existingDiscount.percentageDiscount : 0,
              };
            });
            setFormData({
              category: existingConcession.category,
              discounts: allDiscounts,
            });
          } else {
            setEditConcessionId(null);
            setFormData((prev) => ({
              ...prev,
              discounts: feesGroups.map((group) => ({
                feesGroup: group._id,
                percentageDiscount: 0,
              })),
            }));
          }
        } catch (err) {
          toast.error("Failed to check existing concession");
        }
      } else {
        setEditConcessionId(null);
        setFormData((prev) => ({
          ...prev,
          discounts: feesGroups.map((group) => ({
            feesGroup: group._id,
            percentageDiscount: 0,
          })),
        }));
      }
    };
    checkExistingConcession();
  }, [formData.category, feesGroups, feesConcessionsData]);

  useEffect(() => {
    const applyFilters = () => {
      const filtered = feesConcessionsData.filter((item) =>
        !filters.category || item.category === filters.category
      );
      setFilteredData(filtered);
    };
    applyFilters();
  }, [filters, feesConcessionsData]);

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const handleFilterChange = (name: string, option: SelectOption | null) => {
    setFilters((prev) => ({ ...prev, [name]: option ? option.value : "" }));
  };

  const handleResetFilters = () => {
    setFilters({ category: "" });
  };

  const handleDelete = async (id: string) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      await axios.delete(`${API_URL}/api/concession/${id}`, { headers });
      toast.success("Fee concession deleted successfully");
      const response = await axios.get<FeesConcession[]>(`${API_URL}/api/concession`, { headers });
      setFeesConcessionsData(response.data);
      setFilteredData(response.data);
      if (editConcessionId === id) {
        handleReset();
      }
    } catch (err) {
      toast.error("Failed to delete concession");
    }
  };

  const handleDiscountChange = (feesGroupId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      discounts: prev.discounts.map((discount) =>
        discount.feesGroup === feesGroupId
          ? { ...discount, percentageDiscount: parseFloat(value) || 0 }
          : discount
      ),
    }));
  };

  const handleSelectChange = (name: string, option: SelectOption | null) => {
    setFormData((prev) => ({ ...prev, [name]: option ? option.value : "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      const payload = {
        category: formData.category,
        discounts: formData.discounts,
      };
      if (editConcessionId) {
        await axios.put(`${API_URL}/api/concession/${editConcessionId}`, payload, { headers });
        toast.success("Concession updated successfully");
      } else {
        await axios.post(`${API_URL}/api/concession`, payload, { headers });
        toast.success("Concession added successfully");
      }
      const response = await axios.get<FeesConcession[]>(`${API_URL}/api/concession`, { headers });
      setFeesConcessionsData(response.data);
      setFilteredData(response.data);
      handleReset();
    } catch (err) {
      toast.error("Failed to save concession");
    } finally {
      setFormLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      category: "",
      discounts: feesGroups.map((group) => ({
        feesGroup: group._id,
        percentageDiscount: 0,
      })),
    });
    setEditConcessionId(null);
  };

  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      sorter: (a: FeesConcession, b: FeesConcession) => a.category.localeCompare(b.category),
    },
    {
      title: "Discounts",
      dataIndex: "discounts",
      render: (discounts: { feesGroup: { _id: string; name: string }; percentageDiscount: number }[]) => (
        <span>{discounts.map((d) => `${d.feesGroup.name}: ${d.percentageDiscount}%`).join(", ")}</span>
      ),
      sorter: (a: FeesConcession, b: FeesConcession) =>
        a.discounts[0]?.percentageDiscount - b.discounts[0]?.percentageDiscount,
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
                  onClick={() => {
                    const concession = feesConcessionsData.find((c) => c._id === id);
                    if (concession) {
                      setEditConcessionId(id);
                      setFormData({
                        category: concession.category,
                        discounts: feesGroups.map((group) => ({
                          feesGroup: group._id,
                          percentageDiscount:
                            concession.discounts.find((d) => d.feesGroup._id === group._id)?.percentageDiscount || 0,
                        })),
                      });
                    }
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
                  onClick={() => handleDelete(id)}
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
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Fees Concessions</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="#">Fees Collection</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Fees Concessions
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            {/* <TooltipOption /> */}
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header">
            <h4 className="mb-0">{editConcessionId ? "Edit Fee Concession" : "Add Fee Concession"}</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Category</label>
                <CommonSelect
                  className="select"
                  options={categories}
                  defaultValue={formData.category ? categories.find((c) => c.value === formData.category) : undefined}
                  onChange={(option:any) => handleSelectChange("category", option)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Discounts by Fees Group (%)</label>
                {feesGroups.map((group) => (
                  <div key={group._id} className="row mb-2">
                    <div className="col-md-6">
                      <label className="form-label">{group.name}</label>
                    </div>
                    <div className="col-md-6">
                      <input
                        type="number"
                        className="form-control"
                        value={
                          formData.discounts.find((d) => d.feesGroup === group._id)?.percentageDiscount || 0
                        }
                        onChange={(e) => handleDiscountChange(group._id, e.target.value)}
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-light me-2" onClick={handleReset}>
                  Reset
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Fees Concessions</h4>
          </div>
          <div className="card-body p-0 py-3">
            <Table dataSource={filteredData} columns={columns} Selection={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeesConcessions;