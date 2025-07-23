import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Modal, Spin, Input, Select, Button, Upload, Image } from "antd";
import { PlusOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
import Table from "../../../../core/common/dataTable/index";
import TooltipOption from "../../../../core/common/tooltipOption";
import { all_routes } from "../../../router/all_routes";

const { Option } = Select;
const { TextArea } = Input;

const API_URL = process.env.REACT_APP_URL || "";

interface Image {
  filename: string;
  path: string;
  mimetype: string;
  size: number;
}

interface Session {
  _id: string;
  name: string;
  sessionId: string;
}

interface Class {
  _id: string;
  name: string;
  id: string;
  sessionId: string | Session;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Advertisement {
  _id: string;
  key: string;
  sessionId: Session | null;
  classId: Class[] | null;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  image: Image | null;
  createdBy: User | null;
}

interface FormData {
  sessionId: string;
  classId: string[];
  name: string;
  description: string;
  status: 'active' | 'inactive';
  image: File | null;
}

interface Route {
  adminDashboard: string;
}

interface AuthContext {
  token: string;
  user: { role: string; userId: string } | null;
}

const AdvertisementManager: React.FC = () => {
  const route = all_routes as Route;
  const { token, user } = useAuth() as AuthContext;
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [filteredAdvertisements, setFilteredAdvertisements] = useState<Advertisement[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editAdvertisementId, setEditAdvertisementId] = useState<string | null>(null);
  const [viewAdvertisement, setViewAdvertisement] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState<FormData>({
    sessionId: "",
    classId: [],
    name: "",
    description: "",
    status: "active",
    image: null,
  });
  const [searchText, setSearchText] = useState<string>("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [filterSessionId, setFilterSessionId] = useState<string>("");
  const [filterClassId, setFilterClassId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterClasses, setFilterClasses] = useState<Class[]>([]);

  const columns = [
    {
      title: "Advertisement Name",
      dataIndex: "name",
      sorter: (a: Advertisement, b: Advertisement) => a.name.localeCompare(b.name),
    },
    {
      title: "Session",
      dataIndex: "sessionId",
      render: (session: Session | null) => session?.name || "N/A",
      sorter: (a: Advertisement, b: Advertisement) => (a.sessionId?.name || "").localeCompare(b.sessionId?.name || ""),
    },
    {
      title: "Classes",
      dataIndex: "classId",
      render: (classes: Class[] | null) =>
        classes && Array.isArray(classes) && classes.length > 0
          ? classes.map(c => c.name).join(", ")
          : "N/A",
      sorter: (a: Advertisement, b: Advertisement) =>
        (a.classId && a.classId.length > 0 ? a.classId[0].name : "").localeCompare(
          b.classId && b.classId.length > 0 ? b.classId[0].name : ""
        ),
    },
    // {
    //   title: "Status",
    //   dataIndex: "status",
    //   render: (status: string) => status.charAt(0).toUpperCase() + status.slice(1),
    //   sorter: (a: Advertisement, b: Advertisement) => a.status.localeCompare(b.status),
    // },
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
          sorter: (a: Advertisement, b: Advertisement) => a.status.length - b.status.length,
        },
    {
      title: "Created By",
      dataIndex: "createdBy",
      render: (createdBy: User | null) => createdBy?.name || "N/A",
      sorter: (a: Advertisement, b: Advertisement) => (a.createdBy?.name || "").localeCompare(b.createdBy?.name || ""),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Advertisement) => (
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
                  onClick={() => handleView(record)}
                >
                  <i className="ti ti-eye me-2" />
                  View Details
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  onClick={() => handleEdit(record)}
                >
                  <i className="ti ti-edit-circle me-2" />
                  Edit
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  onClick={() => handleDelete(record._id)}
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

  const fetchSessions = async () => {
    try {
      if (user?.role === "teacher") {
        const classRes = await axios.get(`${API_URL}/api/class/teacher`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const teacherClasses = classRes.data as Class[];
        
        const sessionsMap = new Map<string, Session>();
        
        teacherClasses.forEach(c => {
          if (c.sessionId) {
            if (typeof c.sessionId === 'string') {
            } else if (typeof c.sessionId === 'object' && c.sessionId._id) {
              sessionsMap.set(c.sessionId._id, c.sessionId);
            }
          }
        });
        
        if (sessionsMap.size > 0) {
          setSessions(Array.from(sessionsMap.values()));
        } else {
          const sessionIds = Array.from(
            new Set(
              teacherClasses
                .map(c => typeof c.sessionId === 'string' ? c.sessionId : null)
                .filter(Boolean)
            )
          );
          
          if (sessionIds.length > 0) {
            const sessionPromises = sessionIds.map(sessionId => 
              axios.get(`${API_URL}/api/session/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            );
            const sessionResponses = await Promise.all(sessionPromises);
            const teacherSessions = sessionResponses.map(res => res.data);
            setSessions(teacherSessions);
          } else {
            setSessions([]);
          }
        }
      } else {
        const res = await axios.get(`${API_URL}/api/session/get`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSessions(res.data as Session[]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to fetch sessions");
    }
  };

  const fetchClasses = async (sessionId: string = "") => {
    try {
      const endpoint = user?.role === "teacher"
        ? `${API_URL}/api/class/teacher`
        : `${API_URL}/api/class${sessionId ? `/session/${sessionId}` : ""}`;
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(res.data as Class[]);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to fetch classes");
    }
  };

  const fetchFilterClasses = async (sessionId: string = "") => {
    try {
      const endpoint = user?.role === "teacher"
        ? `${API_URL}/api/class/teacher`
        : `${API_URL}/api/class${sessionId ? `/session/${sessionId}` : ""}`;
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFilterClasses(res.data as Class[]);
    } catch (error) {
      console.error("Error fetching filter classes:", error);
      toast.error("Failed to fetch filter classes");
    }
  };

  const fetchAdvertisements = async (sessionId: string = "", classId: string = "", status: string = "") => {
    try {
      setIsLoading(true);
      const endpoint = user?.role === "superadmin"
        ? `${API_URL}/api/advertisement/superadmin`
        : `${API_URL}/api/advertisement`;
      
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId);
      if (classId) params.append('classId', classId);
      if (status) params.append('status', status);
      
      const res = await axios.get(`${endpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const formattedData: Advertisement[] = res.data.map((item: any) => ({
        ...item,
        key: item._id,
        classId: item.classId || [],
      }));
      
      setAdvertisements(formattedData);
      setFilteredAdvertisements(formattedData);
    } catch (error: any) {
      console.error("Error fetching advertisements:", error);
      if (error.response?.status === 403) {
        toast.error("Access denied to this class");
      } else {
        toast.error("Failed to fetch advertisements");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdvertisement = async () => {
    if (!formData.sessionId || formData.classId.length === 0 || !formData.name || !formData.description || !formData.status || !formData.image) {
      toast.error("All fields are required, including at least one class and an image");
      return;
    }

    try {
      setIsSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append("sessionId", formData.sessionId);
      formData.classId.forEach(id => formDataToSend.append("classId[]", id));
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("status", formData.status);
      formDataToSend.append("image", formData.image);

      const res = await axios.post(`${API_URL}/api/advertisement`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const populatedAdvertisement = await axios.get(`${API_URL}/api/advertisement/${res.data._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newAdvertisement: Advertisement = { ...populatedAdvertisement.data, key: populatedAdvertisement.data._id };
      setAdvertisements((prev) => [...prev, newAdvertisement]);
      setFilteredAdvertisements((prev) => [...prev, newAdvertisement]);
      resetForm();
      setIsAddModalOpen(false);
      toast.success("Advertisement added successfully");
    } catch (error: any) {
      console.error("Error adding advertisement:", error);
      toast.error(error.response?.data?.message || "Error adding advertisement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: Advertisement) => {
    setFormData({
      sessionId: record.sessionId?._id || "",
      classId: record.classId?.map(c => c._id) || [],
      name: record.name || "",
      description: record.description || "",
      status: record.status || "active",
      image: null,
    });
    setEditAdvertisementId(record._id);
    if (record.sessionId?._id) {
      fetchClasses(record.sessionId._id);
    }
    
    if (record.image) {
      const existingFile: UploadFile = {
        uid: 'existing-1',
        name: record.image.filename,
        status: 'done',
        url: `${API_URL}/${record.image.path}`,
      };
      setFileList([existingFile]);
    } else {
      setFileList([]);
    }
    
    setIsEditModalOpen(true);
  };

  const handleView = (record: Advertisement) => {
    setViewAdvertisement(record);
    setIsViewModalOpen(true);
  };

  const handleUpdateAdvertisement = async () => {
    if (!formData.sessionId || formData.classId.length === 0 || !formData.name || !formData.description || !formData.status) {
      toast.error("All fields are required, including at least one class");
      return;
    }

    try {
      setIsSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append("sessionId", formData.sessionId);
      formData.classId.forEach(id => formDataToSend.append("classId[]", id));
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("status", formData.status);
      
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const res = await axios.put(`${API_URL}/api/advertisement/${editAdvertisementId}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const populatedAdvertisement = await axios.get(`${API_URL}/api/advertisement/${editAdvertisementId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedAdvertisement: Advertisement = { ...populatedAdvertisement.data, key: populatedAdvertisement.data._id };
      setAdvertisements((prev) =>
        prev.map((advertisement) => (advertisement._id === editAdvertisementId ? updatedAdvertisement : advertisement))
      );
      setFilteredAdvertisements((prev) =>
        prev.map((advertisement) => (advertisement._id === editAdvertisementId ? updatedAdvertisement : advertisement))
      );
      resetForm();
      setIsEditModalOpen(false);
      setEditAdvertisementId(null);
      toast.success("Advertisement updated successfully");
    } catch (error: any) {
      console.error("Error updating advertisement:", error);
      toast.error(error.response?.data?.message || "Error updating advertisement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/advertisement/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdvertisements((prev) => prev.filter((advertisement) => advertisement._id !== id));
      setFilteredAdvertisements((prev) => prev.filter((advertisement) => advertisement._id !== id));
      toast.success("Advertisement deleted successfully");
    } catch (error: any) {
      console.error("Error deleting advertisement:", error);
      toast.error(error.response?.data?.message || "Error deleting advertisement");
    }
  };

  const handleInputChange = (name: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "sessionId" && value) {
      fetchClasses(value);
      setFormData((prev) => ({ ...prev, classId: [] }));
    }
  };

  const handleSelectAllClasses = () => {
    setFormData((prev) => ({
      ...prev,
      classId: classes.map(c => c._id),
    }));
  };

  const resetForm = () => {
    setFormData({
      sessionId: "",
      classId: [],
      name: "",
      description: "",
      status: "active",
      image: null,
    });
    setEditAdvertisementId(null);
    setClasses([]);
    setFileList([]);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    applyFilters(value, filterSessionId, filterClassId, filterStatus);
  };

  const applyFilters = (search: string, sessionId: string, classId: string, status: string) => {
    let filtered = advertisements;
    
    if (search) {
      const lowerValue = search.toLowerCase();
      filtered = filtered.filter(
        (advertisement) =>
          advertisement.name.toLowerCase().includes(lowerValue) ||
          (advertisement.sessionId?.name || "").toLowerCase().includes(lowerValue) ||
          (advertisement.classId?.some(c => c.name.toLowerCase().includes(lowerValue)) || false) ||
          (advertisement.createdBy?.name || "").toLowerCase().includes(lowerValue)
      );
    }
    
    if (sessionId) {
      filtered = filtered.filter(advertisement => advertisement.sessionId?._id === sessionId);
    }
    
    if (classId) {
      filtered = filtered.filter(advertisement => advertisement.classId?.some(c => c._id === classId));
    }
    
    if (status) {
      filtered = filtered.filter(advertisement => advertisement.status === status);
    }
    
    setFilteredAdvertisements(filtered);
  };

  const handleFilterSessionChange = (value: string) => {
    setFilterSessionId(value);
    setFilterClassId("");
    if (value) {
      fetchFilterClasses(value);
    } else {
      setFilterClasses([]);
    }
    applyFilters(searchText, value, "", filterStatus);
  };

  const handleFilterClassChange = (value: string) => {
    setFilterClassId(value);
    applyFilters(searchText, filterSessionId, value, filterStatus);
  };

  const handleFilterStatusChange = (value: string) => {
    setFilterStatus(value);
    applyFilters(searchText, filterSessionId, filterClassId, value);
  };

  const handleUploadChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    const file = newFileList.length > 0 ? newFileList[0] : null;
    setFileList(newFileList);
    setFormData(prev => ({
      ...prev,
      image: file && file.originFileObj ? file.originFileObj as File : null,
    }));
  };

  const handleRemove = () => {
    setFileList([]);
    setFormData(prev => ({ ...prev, image: null }));
    return true;
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleViewImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setPreviewOpen(true);
  };

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const customDropdownRender = (menu: React.ReactElement) => (
    <div>
      <div style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
        <div
          style={{ cursor: 'pointer' }}
          onClick={handleSelectAllClasses}
        >
          Select All Classes
        </div>
      </div>
      {menu}
    </div>
  );

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  useEffect(() => {
    fetchSessions();
    fetchAdvertisements();
    if (user?.role === "teacher") {
      fetchClasses();
      fetchFilterClasses();
    }
  }, []);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div>
        <div className="page-wrapper">
          <div className="content">
            <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
              <div className="my-auto mb-2">
                <h3 className="page-title mb-1">Advertisements</h3>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={route.adminDashboard}>Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="#">Advertisements</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      All Advertisements
                    </li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                {/* <TooltipOption /> */}
                <div className="mb-2">
                  <Button
                    type="primary"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <i className="ti ti-square-rounded-plus-filled me-2" />
                    Add Advertisement
                  </Button>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                <h4 className="mb-3">Advertisements List</h4>
                <div className="d-flex gap-2 align-items-center flex-wrap">
                  <Select
                    placeholder="Select Session"
                    value={filterSessionId || undefined}
                    onChange={handleFilterSessionChange}
                    style={{ width: 150 }}
                    allowClear
                  >
                    {sessions.map((session) => (
                      <Option key={session._id} value={session._id}>
                        {session.name}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="Select Class"
                    value={filterClassId || undefined}
                    onChange={handleFilterClassChange}
                    style={{ width: 150 }}
                    allowClear
                    disabled={!filterSessionId && user?.role !== "teacher"}
                  >
                    {(user?.role === "teacher" ? classes : filterClasses).map((classItem) => (
                      <Option key={classItem._id} value={classItem._id}>
                        {classItem.name}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="Select Status"
                    value={filterStatus || undefined}
                    onChange={handleFilterStatusChange}
                    style={{ width: 150 }}
                    allowClear
                  >
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                  </Select>
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
                ) : (
                  <Table columns={columns} dataSource={filteredAdvertisements} />
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal
          title="Add Advertisement"
          open={isAddModalOpen}
          onCancel={() => {
            resetForm();
            setIsAddModalOpen(false);
          }}
          zIndex={10001}
          width={1000}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              onClick={handleAddAdvertisement}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spin size="small" /> : 'Add Advertisement'}
            </Button>,
          ]}
        >
          {isSubmitting ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Session *</label>
                <Select
                  placeholder="Select Session"
                  value={formData.sessionId || undefined}
                  onChange={(value: string) => handleInputChange("sessionId", value)}
                  className="w-100"
                >
                  {sessions.map((session) => (
                    <Option key={session._id} value={session._id}>
                      {session.name} ({session.sessionId})
                    </Option>
                  ))}
                </Select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Classes *</label>
                <Select
                  mode="multiple"
                  placeholder="Select Classes"
                  value={formData.classId}
                  onChange={(value: string[]) => handleInputChange("classId", value)}
                  className="w-100 text-black"
                  disabled={!formData.sessionId}
                  dropdownRender={customDropdownRender}
                  tagRender={(props) => (
                    <span
                      style={{
                        color: 'black',
                        backgroundColor: '#f5f5f5',
                        padding: '2px 8px',
                        margin: '2px',
                        borderRadius: '4px',
                      }}
                    >
                      {props.label}
                    </span>
                  )}
                >
                  {classes.map((classItem) => (
                    <Option key={classItem._id} value={classItem._id}>
                      {classItem.name}
                    </Option>
                  ))}
                </Select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Advertisement Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("name", e.target.value)
                  }
                  placeholder="Enter Advertisement Name"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Status *</label>
                <Select
                  value={formData.status}
                  onChange={(value: 'active' | 'inactive') => handleInputChange("status", value)}
                  className="w-100"
                >
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Image *</label>
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreview}
                  onChange={handleUploadChange}
                  onRemove={handleRemove}
                  beforeUpload={() => false}
                  accept="image/*"
                  maxCount={1}
                >
                  {fileList.length >= 1 ? null : uploadButton}
                </Upload>
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">Description *</label>
                <TextArea
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Enter Description"
                  rows={4}
                />
              </div>
            </div>
          )}
        </Modal>

        <Modal
          title="Edit Advertisement"
          open={isEditModalOpen}
          onCancel={() => {
            resetForm();
            setIsEditModalOpen(false);
          }}
          zIndex={10001}
          width={1000}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                resetForm();
                setIsEditModalOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              onClick={handleUpdateAdvertisement}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spin size="small" /> : 'Update Advertisement'}
            </Button>,
          ]}
        >
          {isSubmitting ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Session *</label>
                <Select
                  placeholder="Select Session"
                  value={formData.sessionId || undefined}
                  onChange={(value: string) => handleInputChange("sessionId", value)}
                  className="w-100"
                >
                  {sessions.map((session) => (
                    <Option key={session._id} value={session._id}>
                      {session.name} ({session.sessionId})
                    </Option>
                  ))}
                </Select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Classes *</label>
                <Select
                  mode="multiple"
                  placeholder="Select Classes"
                  value={formData.classId}
                  onChange={(value: string[]) => handleInputChange("classId", value)}
                  className="w-100 text-black"
                  disabled={!formData.sessionId}
                  dropdownRender={customDropdownRender}
                  tagRender={(props) => (
                    <span
                      style={{
                        color: 'black',
                        backgroundColor: '#f5f5f5',
                        padding: '2px 8px',
                        margin: '2px',
                        borderRadius: '4px',
                      }}
                    >
                      {props.label}
                    </span>
                  )}
                >
                  {classes.map((classItem) => (
                    <Option key={classItem._id} value={classItem._id}>
                      {classItem.name}
                    </Option>
                  ))}
                </Select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Advertisement Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("name", e.target.value)
                  }
                  placeholder="Enter Advertisement Name"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Status *</label>
                <Select
                  value={formData.status}
                  onChange={(value: 'active' | 'inactive') => handleInputChange("status", value)}
                  className="w-100"
                >
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Image</label>
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreview}
                  onChange={handleUploadChange}
                  onRemove={handleRemove}
                  beforeUpload={() => false}
                  accept="image/*"
                  maxCount={1}
                >
                  {fileList.length >= 1 ? null : uploadButton}
                </Upload>
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">Description *</label>
                <TextArea
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Enter Description"
                  rows={4}
                />
              </div>
            </div>
          )}
        </Modal>

        <Modal
          title="Advertisement Details"
          open={isViewModalOpen}
          onCancel={() => setIsViewModalOpen(false)}
          zIndex={10001}
          width={1000}
          footer={[
            <Button key="close" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>,
          ]}
        >
          {viewAdvertisement && (
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Session</label>
                <Input value={viewAdvertisement.sessionId?.name || "N/A"} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Classes</label>
                <Input
                  value={
                    viewAdvertisement.classId && viewAdvertisement.classId.length > 0
                      ? viewAdvertisement.classId.map(c => c.name).join(", ")
                      : "N/A"
                  }
                  readOnly
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Advertisement Name</label>
                <Input value={viewAdvertisement.name || "N/A"} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Status</label>
                <Input value={viewAdvertisement.status.charAt(0).toUpperCase() + viewAdvertisement.status.slice(1) || "N/A"} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Created By</label>
                <Input value={viewAdvertisement.createdBy?.name || "N/A"} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Image</label>
                <div className="d-flex flex-wrap gap-2">
                  {viewAdvertisement.image ? (
                    <div className="position-relative">
                      <img
                        src={`${API_URL}/${viewAdvertisement.image.path}`}
                        alt={viewAdvertisement.name}
                        style={{ 
                          width: "150px", 
                          height: "150px", 
                          objectFit: "cover",
                          borderRadius: "8px",
                          cursor: "pointer"
                        }}
                        onClick={() => viewAdvertisement.image && handleViewImagePreview(`${API_URL}/${viewAdvertisement.image.path}`)}
                      />
                      <div 
                        className="position-absolute top-0 end-0 p-1"
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          borderRadius: "0 8px 0 8px",
                          cursor: "pointer"
                        }}
                        onClick={() => viewAdvertisement.image && handleViewImagePreview(`${API_URL}/${viewAdvertisement.image.path}`)}
                      >
                        <EyeOutlined style={{ color: "white", fontSize: "16px" }} />
                      </div>
                    </div>
                  ) : (
                    <div>No Image</div>
                  )}
                </div>
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">Description</label>
                <TextArea value={viewAdvertisement.description || "N/A"} readOnly rows={4} />
              </div>
            </div>
          )}
        </Modal>

        <Modal
          open={previewOpen}
          title="Image Preview"
          footer={null}
          zIndex={10002}
          onCancel={() => setPreviewOpen(false)}
        >
          <Image
            alt="preview"
            style={{ width: '100%' }}
            src={previewImage}
          />
        </Modal>
      </div>
    </>
  );
};

export default AdvertisementManager;