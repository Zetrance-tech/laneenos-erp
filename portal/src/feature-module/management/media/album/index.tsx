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

interface Image {
  filename: string;
  path: string;
  mimetype: string;
  size: number;
}

interface Album {
  _id: string;
  key: string;
  sessionId: Session | null;
  classId: Class[] | null;
  name: string;
  description: string;
  images: Image[] | null;
  createdBy: User | null;
}

interface FormData {
  sessionId: string;
  classId: string[];
  name: string;
  description: string;
  images: File[];
}

interface Route {
  adminDashboard: string;
}

interface AuthContext {
  token: string;
  user: { role: string; userId: string } | null;
}

const AlbumManager: React.FC = () => {
  const route = all_routes as Route;
  const { token, user } = useAuth() as AuthContext;
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editAlbumId, setEditAlbumId] = useState<string | null>(null);
  const [viewAlbum, setViewAlbum] = useState<Album | null>(null);
  const [formData, setFormData] = useState<FormData>({
    sessionId: "",
    classId: [],
    name: "",
    description: "",
    images: [],
  });
  const [searchText, setSearchText] = useState<string>("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [filterSessionId, setFilterSessionId] = useState<string>("");
  const [filterClassId, setFilterClassId] = useState<string>("");
  const [filterClasses, setFilterClasses] = useState<Class[]>([]);

  const columns = [
    {
      title: "Album Name",
      dataIndex: "name",
      sorter: (a: Album, b: Album) => a.name.localeCompare(b.name),
    },
    {
      title: "Session",
      dataIndex: "sessionId",
      render: (session: Session | null) => session?.name || "N/A",
      sorter: (a: Album, b: Album) => (a.sessionId?.name || "").localeCompare(b.sessionId?.name || ""),
    },
    {
      title: "Classes",
      dataIndex: "classId",
      render: (classes: Class[] | null) => 
        classes && Array.isArray(classes) && classes.length > 0 
          ? classes.map(c => c.name).join(", ") 
          : "N/A",
      sorter: (a: Album, b: Album) => 
        (a.classId && a.classId.length > 0 ? a.classId[0].name : "").localeCompare(
          b.classId && b.classId.length > 0 ? b.classId[0].name : ""
        ),
    },
    {
      title: "Images",
      dataIndex: "images",
      render: (images: Image[] | null) => (images && Array.isArray(images) ? images.length : 0),
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      render: (createdBy: User | null) => createdBy?.name || "N/A",
      sorter: (a: Album, b: Album) => (a.createdBy?.name || "").localeCompare(b.createdBy?.name || ""),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Album) => (
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
              // Skip string IDs, handled later
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
    }
  };

  const fetchAlbums = async (sessionId: string = "", classId: string = "") => {
    try {
      setIsLoading(true);
      const endpoint = user?.role === "superadmin"
        ? `${API_URL}/api/album/superadmin`
        : `${API_URL}/api/album`;
      
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId);
      if (classId) params.append('classId', classId);
      
      const res = await axios.get(`${endpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const formattedData: Album[] = res.data.map((item: any) => ({
        ...item,
        key: item._id,
      }));
      
      setAlbums(formattedData);
      setFilteredAlbums(formattedData);
    } catch (error: any) {
      console.error("Error fetching albums:", error);
      if (error.response?.status === 403) {
        toast.error("Access denied to this class");
      } else {
        toast.error("Failed to fetch albums");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAlbum = async () => {
    if (!formData.sessionId || formData.classId.length === 0 || !formData.name || !formData.description || formData.images.length === 0) {
      toast.error("All fields are required, including at least one class and one image");
      return;
    }

    try {
      setIsSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append("sessionId", formData.sessionId);
      formData.classId.forEach(id => formDataToSend.append("classId[]", id));
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      
      formData.images.forEach((image) => {
        formDataToSend.append("images", image);
      });

      const res = await axios.post(`${API_URL}/api/album`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const populatedAlbum = await axios.get(`${API_URL}/api/album/${res.data._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newAlbum: Album = { ...populatedAlbum.data, key: populatedAlbum.data._id };
      setAlbums((prev) => [...prev, newAlbum]);
      setFilteredAlbums((prev) => [...prev, newAlbum]);
      resetForm();
      setIsAddModalOpen(false);
      toast.success("Album added successfully");
    } catch (error: any) {
      console.error("Error adding album:", error);
      toast.error(error.response?.data?.message || "Error adding album");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: Album) => {
    setFormData({
      sessionId: record.sessionId?._id || "",
      classId: record.classId?.map(c => c._id) || [],
      name: record.name || "",
      description: record.description || "",
      images: [],
    });
    setEditAlbumId(record._id);
    if (record.sessionId?._id) {
      fetchClasses(record.sessionId._id);
    }
    
    if (record.images && Array.isArray(record.images)) {
      const existingFiles: UploadFile[] = record.images.map((img, index) => ({
        uid: `existing-${index}`,
        name: img.filename,
        status: 'done',
        url: `${API_URL}/${img.path}`,
      }));
      setFileList(existingFiles);
    }
    
    setImagesToDelete([]);
    setIsEditModalOpen(true);
  };

  const handleView = (record: Album) => {
    setViewAlbum(record);
    setIsViewModalOpen(true);
  };

  const handleUpdateAlbum = async () => {
    if (!formData.sessionId || formData.classId.length === 0 || !formData.name || !formData.description) {
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
      
      if (imagesToDelete.length > 0) {
        formDataToSend.append("imagesToDelete", JSON.stringify(imagesToDelete));
      }
      
      if (formData.images.length > 0) {
        formData.images.forEach((image) => {
          formDataToSend.append("images", image);
        });
      }

      const res = await axios.put(`${API_URL}/api/album/${editAlbumId}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const populatedAlbum = await axios.get(`${API_URL}/api/album/${editAlbumId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedAlbum: Album = { ...populatedAlbum.data, key: populatedAlbum.data._id };
      setAlbums((prev) =>
        prev.map((album) => (album._id === editAlbumId ? updatedAlbum : album))
      );
      setFilteredAlbums((prev) =>
        prev.map((album) => (album._id === editAlbumId ? updatedAlbum : album))
      );
      resetForm();
      setIsEditModalOpen(false);
      setEditAlbumId(null);
      setImagesToDelete([]);
      toast.success("Album updated successfully");
    } catch (error: any) {
      console.error("Error updating album:", error);
      toast.error(error.response?.data?.message || "Error updating album");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/album/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlbums((prev) => prev.filter((album) => album._id !== id));
      setFilteredAlbums((prev) => prev.filter((album) => album._id !== id));
      toast.success("Album deleted successfully");
    } catch (error: any) {
      console.error("Error deleting album:", error);
      toast.error(error.response?.data?.message || "Error deleting album");
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
      images: [],
    });
    setEditAlbumId(null);
    setClasses([]);
    setFileList([]);
    setImagesToDelete([]);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    applyFilters(value, filterSessionId, filterClassId);
  };

  const applyFilters = (search: string, sessionId: string, classId: string) => {
    let filtered = albums;
    
    if (search) {
      const lowerValue = search.toLowerCase();
      filtered = filtered.filter(
        (album) =>
          album.name.toLowerCase().includes(lowerValue) ||
          (album.sessionId?.name || "").toLowerCase().includes(lowerValue) ||
          (album.classId?.some(c => c.name.toLowerCase().includes(lowerValue)) || false) ||
          (album.createdBy?.name || "").toLowerCase().includes(lowerValue)
      );
    }
    
    if (sessionId) {
      filtered = filtered.filter(album => album.sessionId?._id === sessionId);
    }
    
    if (classId) {
      filtered = filtered.filter(album => album.classId?.some(c => c._id === classId));
    }
    
    setFilteredAlbums(filtered);
  };

  const handleFilterSessionChange = (value: string) => {
    setFilterSessionId(value);
    setFilterClassId("");
    if (value) {
      fetchFilterClasses(value);
    } else {
      setFilterClasses([]);
    }
    applyFilters(searchText, value, "");
  };

  const handleFilterClassChange = (value: string) => {
    setFilterClassId(value);
    applyFilters(searchText, filterSessionId, value);
  };

  const handleUploadChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    const newImagesToDelete = fileList
      .filter(file => !newFileList.some(newFile => newFile.uid === file.uid))
      .filter(file => file.status === 'done')
      .map(file => file.name);
    
    setImagesToDelete(prev => Array.from(new Set([...prev, ...newImagesToDelete])));
    
    const files = newFileList
      .filter(file => file.originFileObj)
      .map(file => file.originFileObj as File);
    
    setFileList(newFileList);
    setFormData(prev => ({ ...prev, images: files }));
  };

  const handleRemove = (file: UploadFile) => {
    if (file.status === 'done') {
      setImagesToDelete(prev => Array.from(new Set([...prev, file.name])));
    }
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

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  useEffect(() => {
    fetchSessions();
    fetchAlbums();
    if (user?.role === "teacher") {
      fetchClasses();
      fetchFilterClasses();
    }
  }, []);

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

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div>
        <div className="page-wrapper">
          <div className="content">
            <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
              <div className="my-auto mb-2">
                <h3 className="page-title mb-1">Albums</h3>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={route.adminDashboard}>Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="#">Albums</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      All Albums
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
                    Add Album
                  </Button>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                <h4 className="mb-3">Albums List</h4>
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
                  <Table columns={columns} dataSource={filteredAlbums} />
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal
          title="Add Album"
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
              onClick={handleAddAlbum}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spin size="small" /> : 'Add Album'}
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
                  style={{ color: 'black' }}
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
                <label className="form-label">Album Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("name", e.target.value)
                  }
                  placeholder="Enter Album Name"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Images *</label>
                <Upload
                  multiple
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreview}
                  onChange={handleUploadChange}
                  onRemove={handleRemove}
                  beforeUpload={() => false}
                  accept="image/*"
                  maxCount={10}
                >
                  {fileList.length >= 10 ? null : uploadButton}
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
          title="Edit Album"
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
              onClick={handleUpdateAlbum}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spin size="small" /> : 'Update Album'}
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
                  dropdownStyle={{ color: 'black' }}
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
                <label className="form-label">Album Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("name", e.target.value)
                  }
                  placeholder="Enter Album Name"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Images</label>
                <Upload
                  multiple
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreview}
                  onChange={handleUploadChange}
                  onRemove={handleRemove}
                  beforeUpload={() => false}
                  accept="image/*"
                  maxCount={10}
                >
                  {fileList.length >= 10 ? null : uploadButton}
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
          title="Album Details"
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
          {viewAlbum && (
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Session</label>
                <Input value={viewAlbum.sessionId?.name || "N/A"} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Classes</label>
                <Input
                  value={
                    viewAlbum.classId && viewAlbum.classId.length > 0
                      ? viewAlbum.classId.map(c => c.name).join(", ")
                      : "N/A"
                  }
                  readOnly
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Album Name</label>
                <Input value={viewAlbum.name || "N/A"} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Created By</label>
                <Input value={viewAlbum.createdBy?.name || "N/A"} readOnly />
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">Images</label>
                <div className="d-flex flex-wrap gap-2">
                  {viewAlbum.images && viewAlbum.images.length > 0 ? (
                    viewAlbum.images.map((img, index) => (
                      <div key={index} className="position-relative">
                        <img
                          src={`${API_URL}/${img.path}`}
                          alt={`${viewAlbum.name} - ${index + 1}`}
                          style={{
                            width: "150px",
                            height: "150px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                          onClick={() => handleViewImagePreview(`${API_URL}/${img.path}`)}
                        />
                        <div
                          className="position-absolute top-0 end-0 p-1"
                          style={{
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            borderRadius: "0 8px 0 8px",
                            cursor: "pointer",
                          }}
                          onClick={() => handleViewImagePreview(`${API_URL}/${img.path}`)}
                        >
                          <EyeOutlined style={{ color: "white", fontSize: "16px" }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div>No Images</div>
                  )}
                </div>
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">Description</label>
                <TextArea value={viewAlbum.description || "N/A"} readOnly rows={4} />
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
            style={{ width: "100%" }}
            src={previewImage}
          />
        </Modal>
      </div>
    </>
  );
};

export default AlbumManager;