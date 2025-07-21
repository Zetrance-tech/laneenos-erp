import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Modal, Spin, Input, Select, Button, Upload } from "antd";
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

interface VideoFile {
  filename: string;
  path: string;
  mimetype: string;
  size: number;
}

interface Video {
  _id: string;
  key: string;
  sessionId: Session | null;
  classId: Class | null;
  name: string;
  description: string;
  video: VideoFile | null;
  createdBy: User | null;
}

interface FormData {
  sessionId: string;
  classId: string;
  name: string;
  description: string;
  video: File | null;
  deleteVideo?: boolean; // Only used in edit mode
}

interface Route {
  adminDashboard: string;
}

interface AuthContext {
  token: string;
  user: { role: string; userId: string } | null;
}

const VideoManager: React.FC = () => {
  const route = all_routes as Route;
  const { token, user } = useAuth() as AuthContext;
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editVideoId, setEditVideoId] = useState<string | null>(null);
  const [viewVideo, setViewVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState<FormData>({
    sessionId: "",
    classId: "",
    name: "",
    description: "",
    video: null,
  });
  const [searchText, setSearchText] = useState<string>("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewVideo, setPreviewVideo] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  
  const [filterSessionId, setFilterSessionId] = useState<string>("");
  const [filterClassId, setFilterClassId] = useState<string>("");
  const [filterClasses, setFilterClasses] = useState<Class[]>([]);

  const columns = [
    {
      title: "Video Name",
      dataIndex: "name",
      sorter: (a: Video, b: Video) => a.name.localeCompare(b.name),
    },
    {
      title: "Session",
      dataIndex: "sessionId",
      render: (session: Session | null) => session?.name || "N/A",
      sorter: (a: Video, b: Video) => (a.sessionId?.name || "").localeCompare(b.sessionId?.name || ""),
    },
    {
      title: "Class",
      dataIndex: "classId",
      render: (classData: Class | null) => classData?.name || "N/A",
      sorter: (a: Video, b: Video) => (a.classId?.name || "").localeCompare(b.classId?.name || ""),
    },
    
    {
      title: "Created By",
      dataIndex: "createdBy",
      render: (createdBy: User | null) => createdBy?.name || "N/A",
      sorter: (a: Video, b: Video) => (a.createdBy?.name || "").localeCompare(b.createdBy?.name || ""),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Video) => (
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
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      toast.error(error.response?.data?.message || "Failed to fetch sessions");
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
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      toast.error(error.response?.data?.message || "Failed to fetch classes");
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
    } catch (error: any) {
      console.error("Error fetching filter classes:", error);
      toast.error(error.response?.data?.message || "Failed to fetch filter classes");
    }
  };

  const fetchVideos = async (sessionId: string = "", classId: string = "") => {
    try {
      setIsLoading(true);
      const endpoint = user?.role === "superadmin"
        ? `${API_URL}/api/video/superadmin`
        : `${API_URL}/api/video`;
      
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId);
      if (classId) params.append('classId', classId);
      
      const res = await axios.get(`${endpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const formattedData: Video[] = res.data.map((item: any) => ({
        ...item,
        key: item._id,
      }));
      
      setVideos(formattedData);
      setFilteredVideos(formattedData);
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      toast.error(error.response?.data?.message || "Failed to fetch videos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVideo = async () => {
    if (!formData.sessionId || !formData.classId || !formData.name || !formData.description || !formData.video) {
      toast.error("All fields are required, including a video");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("sessionId", formData.sessionId);
      formDataToSend.append("classId", formData.classId);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      if (formData.video) {
        formDataToSend.append("video", formData.video);
      }

      const res = await axios.post(`${API_URL}/api/video`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const populatedVideo = await axios.get(`${API_URL}/api/video/${res.data._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newVideo: Video = { ...populatedVideo.data, key: populatedVideo.data._id };
      setVideos((prev) => [...prev, newVideo]);
      setFilteredVideos((prev) => [...prev, newVideo]);
      resetForm();
      setIsAddModalOpen(false);
      toast.success("Video added successfully");
    } catch (error: any) {
      console.error("Error adding video:", error);
      toast.error(error.response?.data?.message || "Error adding video");
    }
  };

  const handleEdit = (record: Video) => {
    setFormData({
      sessionId: record.sessionId?._id || "",
      classId: record.classId?._id || "",
      name: record.name || "",
      description: record.description || "",
      video: null,
      deleteVideo: false,
    });
    setEditVideoId(record._id);
    if (record.sessionId?._id) {
      fetchClasses(record.sessionId._id);
    }
    
    if (record.video) {
      const existingFile: UploadFile = {
        uid: `existing-0`,
        name: record.video.filename,
        status: 'done',
        url: `${API_URL}/${record.video.path}`,
      };
      setFileList([existingFile]);
    } else {
      setFileList([]);
    }
    
    setIsEditModalOpen(true);
  };

  const handleView = (record: Video) => {
    setViewVideo(record);
    setIsViewModalOpen(true);
  };

  const handleUpdateVideo = async () => {
    if (!formData.sessionId || !formData.classId || !formData.name || !formData.description) {
      toast.error("All fields are required");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("sessionId", formData.sessionId);
      formDataToSend.append("classId", formData.classId);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      if (formData.deleteVideo) {
        formDataToSend.append("deleteVideo", "true");
      }
      if (formData.video) {
        formDataToSend.append("video", formData.video);
      }

      const res = await axios.put(`${API_URL}/api/video/${editVideoId}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const populatedVideo = await axios.get(`${API_URL}/api/video/${editVideoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedVideo: Video = { ...populatedVideo.data, key: populatedVideo.data._id };
      setVideos((prev) =>
        prev.map((video) => (video._id === editVideoId ? updatedVideo : video))
      );
      setFilteredVideos((prev) =>
        prev.map((video) => (video._id === editVideoId ? updatedVideo : video))
      );
      resetForm();
      setIsEditModalOpen(false);
      setEditVideoId(null);
      toast.success("Video updated successfully");
    } catch (error: any) {
      console.error("Error updating video:", error);
      toast.error(error.response?.data?.message || "Error updating video");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/video/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVideos((prev) => prev.filter((video) => video._id !== id));
      setFilteredVideos((prev) => prev.filter((video) => video._id !== id));
      toast.success("Video deleted successfully");
    } catch (error: any) {
      console.error("Error deleting video:", error);
      toast.error(error.response?.data?.message || "Error deleting video");
    }
  };

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "sessionId" && value) {
      fetchClasses(value);
      setFormData((prev) => ({ ...prev, classId: "" }));
    }
  };

  const resetForm = () => {
    setFormData({
      sessionId: "",
      classId: "",
      name: "",
      description: "",
      video: null,
      deleteVideo: false,
    });
    setEditVideoId(null);
    setClasses([]);
    setFileList([]);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    applyFilters(value, filterSessionId, filterClassId);
  };

  const applyFilters = (search: string, sessionId: string, classId: string) => {
    let filtered = videos;
    
    if (search) {
      const lowerValue = search.toLowerCase();
      filtered = filtered.filter(
        (video) =>
          video.name.toLowerCase().includes(lowerValue) ||
          (video.sessionId?.name || "").toLowerCase().includes(lowerValue) ||
          (video.classId?.name || "").toLowerCase().includes(lowerValue) ||
          (video.createdBy?.name || "").toLowerCase().includes(lowerValue)
      );
    }
    
    if (sessionId) {
      filtered = filtered.filter(video => video.sessionId?._id === sessionId);
    }
    
    if (classId) {
      filtered = filtered.filter(video => video.classId?._id === classId);
    }
    
    setFilteredVideos(filtered);
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
    const files = newFileList
      .filter(file => file.originFileObj)
      .map(file => file.originFileObj as File);
    
    setFileList(newFileList);
    setFormData(prev => ({
      ...prev,
      video: files[0] || null,
      deleteVideo: newFileList.length === 0 && prev.video !== null ? true : false,
    }));
  };

  const handleRemove = (file: UploadFile) => {
    setFormData(prev => ({
      ...prev,
      video: null,
      deleteVideo: file.status === 'done' ? true : prev.deleteVideo,
    }));
    return true;
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewVideo(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleViewVideoPreview = (videoUrl: string) => {
    setPreviewVideo(videoUrl);
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
      <div style={{ marginTop: 8 }}>Upload Video</div>
    </div>
  );

  useEffect(() => {
    fetchSessions();
    fetchVideos();
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
                <h3 className="page-title mb-1">Videos</h3>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={route.adminDashboard}>Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="#">Videos</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      All Videos
                    </li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                <TooltipOption />
                <div className="mb-2">
                  <Button
                    type="primary"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <i className="ti ti-square-rounded-plus-filled me-2" />
                    Add Video
                  </Button>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                <h4 className="mb-3">Videos List</h4>
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
                  <Table columns={columns} dataSource={filteredVideos} />
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal
          title="Add Video"
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
            >
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleAddVideo}>
              Add Video
            </Button>,
          ]}
        >
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
              <label className="form-label">Class *</label>
              <Select
                placeholder="Select Class"
                value={formData.classId || undefined}
                onChange={(value: string) => handleInputChange("classId", value)}
                className="w-100"
                disabled={!formData.sessionId}
              >
                {classes.map((classItem) => (
                  <Option key={classItem._id} value={classItem._id}>
                    {classItem.name} ({classItem.id})
                  </Option>
                ))}
              </Select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Video Name *</label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("name", e.target.value)
                }
                placeholder="Enter Video Name"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Video *</label>
              <Upload
                listType="picture-card"
                fileList={fileList}
                onPreview={handlePreview}
                onChange={handleUploadChange}
                onRemove={handleRemove}
                beforeUpload={() => false}
                accept="video/mp4,video/mov,video/avi,video/wmv,video/mkv"
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
        </Modal>

        <Modal
          title="Edit Video"
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
            >
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleUpdateVideo}>
              Update Video
            </Button>,
          ]}
        >
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
              <label className="form-label">Class *</label>
              <Select
                placeholder="Select Class"
                value={formData.classId || undefined}
                onChange={(value: string) => handleInputChange("classId", value)}
                className="w-100"
                disabled={!formData.sessionId}
              >
                {classes.map((classItem) => (
                  <Option key={classItem._id} value={classItem._id}>
                    {classItem.name} ({classItem.id})
                  </Option>
                ))}
              </Select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Video Name *</label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("name", e.target.value)
                }
                placeholder="Enter Video Name"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Video</label>
              <Upload
                listType="picture-card"
                fileList={fileList}
                onPreview={handlePreview}
                onChange={handleUploadChange}
                onRemove={handleRemove}
                beforeUpload={() => false}
                accept="video/mp4,video/mov,video/avi,video/wmv,video/mkv"
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
        </Modal>

        <Modal
          title="Video Details"
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
          {viewVideo && (
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Session</label>
                <Input value={viewVideo.sessionId?.name || "N/A"} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Class</label>
                <Input value={viewVideo.classId?.name || "N/A"} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Video Name</label>
                <Input value={viewVideo.name || "N/A"} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Created By</label>
                <Input value={viewVideo.createdBy?.name || "N/A"} readOnly />
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">Video</label>
                <div className="d-flex flex-wrap gap-2">
                  {viewVideo.video ? (
                    <div className="position-relative">
                      <video
                        src={`${API_URL}/${viewVideo.video.path}`}
                        style={{
                          width: "150px",
                          height: "150px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
                        controls
                      />
                      <div
                        className="position-absolute top-0 end-0 p-1"
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          borderRadius: "0 8px 0 8px",
                          cursor: "pointer",
                        }}
                        onClick={() => viewVideo.video && handleViewVideoPreview(`${API_URL}/${viewVideo.video.path}`)}
                      >
                        <EyeOutlined style={{ color: "white", fontSize: "16px" }} />
                      </div>
                    </div>
                  ) : (
                    <div>No Video</div>
                  )}
                </div>
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">Description</label>
                <TextArea value={viewVideo.description || "N/A"} readOnly rows={4} />
              </div>
            </div>
          )}
        </Modal>

        <Modal
          open={previewOpen}
          title="Video Preview"
          footer={null}
          zIndex={10002}
          onCancel={() => setPreviewOpen(false)}
        >
          <video
            src={previewVideo}
            style={{ width: "100%" }}
            controls
            autoPlay
          />
        </Modal>
      </div>
    </>
  );
};

export default VideoManager;