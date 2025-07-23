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

interface Pdf {
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  _id: string;
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

interface Story {
  _id: string;
  key: string;
  sessionId: Session | null;
  classId: Class[] | null;
  name: string;
  description: string;
  pdfs: Pdf[];
  createdBy: User | null;
}

interface FormData {
  sessionId: string;
  classId: string[];
  name: string;
  description: string;
  pdf: File | null;
}

interface Route {
  adminDashboard: string;
}

interface AuthContext {
  token: string;
  user: { role: string; userId: string } | null;
}

const StoriesManager: React.FC = () => {
  const route = all_routes as Route;
  const { token, user } = useAuth() as AuthContext;
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editStoryId, setEditStoryId] = useState<string | null>(null);
  const [viewStory, setViewStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState<FormData>({
    sessionId: "",
    classId: [],
    name: "",
    description: "",
    pdf: null,
  });
  const [searchText, setSearchText] = useState<string>("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [filterSessionId, setFilterSessionId] = useState<string>("");
  const [filterClassId, setFilterClassId] = useState<string>("");
  const [filterClasses, setFilterClasses] = useState<Class[]>([]);

  const columns = [
    {
      title: "Story Name",
      dataIndex: "name",
      sorter: (a: Story, b: Story) => a.name.localeCompare(b.name),
    },
    {
      title: "Session",
      dataIndex: "sessionId",
      render: (session: Session | null) => session?.name || "N/A",
      sorter: (a: Story, b: Story) =>
        (a.sessionId?.name || "").localeCompare(b.sessionId?.name || ""),
    },
    {
      title: "Classes",
      dataIndex: "classId",
      render: (classes: Class[] | null) =>
        classes && Array.isArray(classes) && classes.length > 0
          ? classes.map(c => c.name).join(", ")
          : "N/A",
      sorter: (a: Story, b: Story) =>
        (a.classId && a.classId.length > 0 ? a.classId[0].name : "").localeCompare(
          b.classId && b.classId.length > 0 ? b.classId[0].name : ""
        ),
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      render: (createdBy: User | null) => createdBy?.name || "N/A",
      sorter: (a: Story, b: Story) =>
        (a.createdBy?.name || "").localeCompare(b.createdBy?.name || ""),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Story) => (
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

        teacherClasses.forEach((c) => {
          if (c.sessionId) {
            if (typeof c.sessionId === "string") {
              // Skip string IDs, handled later
            } else if (typeof c.sessionId === "object" && c.sessionId._id) {
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
                .map((c) =>
                  typeof c.sessionId === "string" ? c.sessionId : null
                )
                .filter(Boolean)
            )
          );

          if (sessionIds.length > 0) {
            const sessionPromises = sessionIds.map((sessionId) =>
              axios.get(`${API_URL}/api/session/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            );
            const sessionResponses = await Promise.all(sessionPromises);
            const teacherSessions = sessionResponses.map((res) => res.data);
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
      const endpoint =
        user?.role === "teacher"
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
      const endpoint =
        user?.role === "teacher"
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

  const fetchStories = async (sessionId: string = "", classId: string = "") => {
    try {
      setIsLoading(true);
      const endpoint =
        user?.role === "superadmin"
          ? `${API_URL}/api/story/superadmin`
          : `${API_URL}/api/story`;

      const params = new URLSearchParams();
      if (sessionId) params.append("sessionId", sessionId);
      if (classId) params.append("classId", classId);

      const res = await axios.get(`${endpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedData: Story[] = res.data.map((item: any) => ({
        ...item,
        key: item._id,
        pdfs: item.pdfs || [],
      }));

      setStories(formattedData);
      setFilteredStories(formattedData);
    } catch (error: any) {
      console.error("Error fetching stories:", error);
      if (error.response?.status === 403) {
        toast.error("Access denied to this class");
      } else {
        toast.error("Failed to fetch stories");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStory = async () => {
    if (
      !formData.sessionId ||
      formData.classId.length === 0 ||
      !formData.name ||
      !formData.description ||
      !formData.pdf
    ) {
      toast.error("All fields are required, including at least one class and a PDF file");
      return;
    }

    try {
      setIsSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append("sessionId", formData.sessionId);
      formData.classId.forEach(id => formDataToSend.append("classId[]", id));
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("pdf", formData.pdf);

      const res = await axios.post(`${API_URL}/api/story`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const populatedStory = await axios.get(
        `${API_URL}/api/story/${res.data._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newStory: Story = {
        ...populatedStory.data,
        key: populatedStory.data._id,
      };
      setStories((prev) => [...prev, newStory]);
      setFilteredStories((prev) => [...prev, newStory]);
      resetForm();
      setIsAddModalOpen(false);
      toast.success("Story added successfully");
    } catch (error: any) {
      console.error("Error adding story:", error);
      toast.error(error.response?.data?.message || "Error adding story");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: Story) => {
    setFormData({
      sessionId: record.sessionId?._id || "",
      classId: record.classId?.map(c => c._id) || [],
      name: record.name || "",
      description: record.description || "",
      pdf: null,
    });
    setEditStoryId(record._id);
    if (record.sessionId?._id) {
      fetchClasses(record.sessionId._id);
    }

    if (record.pdfs && record.pdfs.length > 0) {
      const existingFile: UploadFile = {
        uid: "existing-1",
        name: record.pdfs[0].filename,
        status: "done",
        url: `${API_URL}/${record.pdfs[0].path}`,
      };
      setFileList([existingFile]);
    } else {
      setFileList([]);
    }

    setIsEditModalOpen(true);
  };

  const handleView = (record: Story) => {
    setViewStory(record);
    setIsViewModalOpen(true);
  };

  const handleUpdateStory = async () => {
    if (
      !formData.sessionId ||
      formData.classId.length === 0 ||
      !formData.name ||
      !formData.description
    ) {
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

      if (formData.pdf) {
        formDataToSend.append("pdf", formData.pdf);
      }

      const res = await axios.put(
        `${API_URL}/api/story/${editStoryId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const populatedStory = await axios.get(
        `${API_URL}/api/story/${editStoryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedStory: Story = {
        ...populatedStory.data,
        key: populatedStory.data._id,
      };
      setStories((prev) =>
        prev.map((story) => (story._id === editStoryId ? updatedStory : story))
      );
      setFilteredStories((prev) =>
        prev.map((story) => (story._id === editStoryId ? updatedStory : story))
      );
      resetForm();
      setIsEditModalOpen(false);
      setEditStoryId(null);
      toast.success("Story updated successfully");
    } catch (error: any) {
      console.error("Error updating story:", error);
      toast.error(error.response?.data?.message || "Error updating story");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/story/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStories((prev) => prev.filter((story) => story._id !== id));
      setFilteredStories((prev) => prev.filter((story) => story._id !== id));
      toast.success("Story deleted successfully");
    } catch (error: any) {
      console.error("Error deleting story:", error);
      toast.error(error.response?.data?.message || "Error deleting story");
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
      pdf: null,
    });
    setEditStoryId(null);
    setClasses([]);
    setFileList([]);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    applyFilters(value, filterSessionId, filterClassId);
  };

  const applyFilters = (search: string, sessionId: string, classId: string) => {
    let filtered = stories;

    if (search) {
      const lowerValue = search.toLowerCase();
      filtered = filtered.filter(
        (story) =>
          story.name.toLowerCase().includes(lowerValue) ||
          (story.sessionId?.name || "").toLowerCase().includes(lowerValue) ||
          (story.classId?.some(c => c.name.toLowerCase().includes(lowerValue)) || false) ||
          (story.createdBy?.name || "").toLowerCase().includes(lowerValue)
      );
    }

    if (sessionId) {
      filtered = filtered.filter((story) => story.sessionId?._id === sessionId);
    }

    if (classId) {
      filtered = filtered.filter((story) => story.classId?.some(c => c._id === classId));
    }

    setFilteredStories(filtered);
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

  const handleUploadChange = ({
    fileList: newFileList,
  }: {
    fileList: UploadFile[];
  }) => {
    const file = newFileList.length > 0 ? newFileList[0] : null;
    setFileList(newFileList);
    setFormData((prev) => ({
      ...prev,
      pdf: file && file.originFileObj ? (file.originFileObj as File) : null,
    }));
  };

  const handleRemove = () => {
    setFileList([]);
    setFormData((prev) => ({ ...prev, pdf: null }));
    return true;
  };

  const handlePreview = (file: UploadFile) => {
    if (file.url) {
      setPreviewUrl(file.url);
      setPreviewOpen(true);
      setPreviewError(null);
    }
  };

  const handleViewPdfPreview = async (pdfUrl: string) => {
    try {
      setPreviewError(null);
      const response = await axios.get(pdfUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (error: any) {
      console.error(
        "Error fetching PDF:",
        error.response?.status,
        error.response?.data
      );
      setPreviewError(
        error.response?.data?.message || "Failed to load PDF for preview"
      );
      toast.error("Failed to load PDF for preview");
    }
  };

  // Cleanup blob URL when preview modal closes
  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
    fetchStories();
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
                <h3 className="page-title mb-1">Stories</h3>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={route.adminDashboard}>Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="#">Stories</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      All Stories
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
                    Add Story
                  </Button>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                <h4 className="mb-3">Stories List</h4>
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
                    {(user?.role === "teacher" ? classes : filterClasses).map(
                      (classItem) => (
                        <Option key={classItem._id} value={classItem._id}>
                          {classItem.name}
                        </Option>
                      )
                    )}
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
                  <Table columns={columns} dataSource={filteredStories} />
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal
          title="Add Story"
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
              onClick={handleAddStory}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spin size="small" /> : 'Add Story'}
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
                  onChange={(value: string) =>
                    handleInputChange("sessionId", value)
                  }
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
                  onChange={(value: string[]) =>
                    handleInputChange("classId", value)
                  }
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
                <label className="form-label">Story Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("name", e.target.value)
                  }
                  placeholder="Enter Story Name"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label d-block">PDF *</label>
                <Upload
                  listType="picture"
                  fileList={fileList}
                  onPreview={handlePreview}
                  onChange={handleUploadChange}
                  onRemove={handleRemove}
                  beforeUpload={() => false}
                  accept="application/pdf"
                  maxCount={1}
                >
                  {fileList.length >= 1 ? null : (
                    <div
                      style={{
                        border: '1px dashed #d9d9d9',
                        borderRadius: '6px',
                        padding: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <p className="ant-upload-drag-icon">
                        <i className="fas fa-file-upload" style={{ fontSize: 24 }} />
                      </p>
                      <p className="ant-upload-text">Upload pdf</p>
                    </div>
                  )}
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
          title="Edit Story"
          open={isEditModalOpen}
          onCancel={() => {
            resetForm();
            setIsEditModalOpen(false);
          }}
          zIndex={10001}
          width={1000}
          footer={
            <>
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
              onClick={handleUpdateStory}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spin size="small" /> : 'Update Story'}
            </Button>
            </>
          }
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
                  onChange={(value: string) =>
                    handleInputChange("sessionId", value)
                  }
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
                  onChange={(value: string[]) =>
                    handleInputChange("classId", value)
                  }
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
                <label className="form-label">Story Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("name", e.target.value)
                  }
                  placeholder="Enter Story Name"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">PDF</label>
                <Upload
                  listType="text"
                  fileList={fileList}
                  onPreview={handlePreview}
                  onChange={handleUploadChange}
                  onRemove={handleRemove}
                  beforeUpload={() => false}
                  accept="application/pdf"
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
          title="Story Details"
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
          {viewStory && (
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Session</label>
                <Input value={viewStory.sessionId?.name || "N/A"} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Classes</label>
                <Input
                  value={
                    viewStory.classId && viewStory.classId.length > 0
                      ? viewStory.classId.map(c => c.name).join(", ")
                      : "N/A"
                  }
                  readOnly
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Story Name</label>
                <Input value={viewStory.name || "N/A"} readOnly />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Created By</label>
                <Input value={viewStory.createdBy?.name || "N/A"} readOnly />
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">PDF</label>
                <div className="d-flex flex-wrap gap-2">
                  {viewStory.pdfs && viewStory.pdfs.length > 0 ? (
                    viewStory.pdfs.map((pdf, index) => (
                      <div
                        className="position-relative"
                        key={index}
                        style={{ minWidth: "150px" }}
                      >
                        <iframe
                          src={`${API_URL}/${pdf.path}`}
                          title="PDF Preview"
                          width="100%"
                          height="200px"
                          style={{
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                          }}
                        ></iframe>
                        <div
                          className="position-absolute top-0 end-0 p-1"
                          style={{
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            borderRadius: "0 8px 0 8px",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            handleViewPdfPreview(`${API_URL}/${pdf.path}`)
                          }
                        >
                          <EyeOutlined
                            style={{ color: "white", fontSize: "16px" }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div>No PDF</div>
                  )}
                </div>
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">Description</label>
                <TextArea
                  value={viewStory.description || "N/A"}
                  readOnly
                  rows={4}
                />
              </div>
            </div>
          )}
        </Modal>

        <Modal
          open={previewOpen}
          title="PDF Preview"
          footer={[
            <Button
              key="download"
              type="primary"
              href={previewUrl}
              download
              disabled={!previewUrl || previewError !== null}
            >
              Download PDF
            </Button>,
            <Button
              key="close"
              onClick={() => {
                setPreviewOpen(false);
                setPreviewError(null);
                if (previewUrl.startsWith("blob:")) {
                  window.URL.revokeObjectURL(previewUrl);
                }
                setPreviewUrl("");
              }}
            >
              Close
            </Button>,
          ]}
          zIndex={10002}
          onCancel={() => {
            setPreviewOpen(false);
            setPreviewError(null);
            if (previewUrl.startsWith("blob:")) {
              window.URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl("");
          }}
        >
          {previewError ? (
            <div style={{ textAlign: "center", color: "red", padding: "20px" }}>
              {previewError}
              <br />
              Please check the console for more details or try downloading the
              PDF.
            </div>
          ) : (
            <iframe
              src={previewUrl}
              style={{ width: "100%", height: "500px" }}
              title="PDF Preview"
              onError={() => setPreviewError("Failed to load PDF in viewer")}
            />
          )}
        </Modal>
      </div>
    </>
  );
};

export default StoriesManager;