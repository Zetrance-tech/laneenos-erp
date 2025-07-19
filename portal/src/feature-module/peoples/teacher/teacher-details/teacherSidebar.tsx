import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import axios from "axios";
import { Modal } from "antd";
import TeacherProfileUpload from "./TeacherProfileUpload";
import { useAuth } from "../../../../context/AuthContext";

const API_URL = process.env.REACT_APP_URL || "";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

interface TeacherSidebarProps {
  teacher?: {
    id: string;
    name: string;
    role: string;
    joiningDate: string;
    gender: string;
    phoneNumber: string;
    userId: { email: string };
    subjects: string[];
    languagesSpoken: string[];
    experienceYears: number;
    bio?: string;
  } | null;
}

const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ teacher }) => {
  const [profileImage, setProfileImage] = useState<string>("/assets/img/teachers/teacher-01.jpg");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchTeacherProfilePhoto = async () => {
    if (!teacher?.id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/teacher/${teacher.id}/profile-photo`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const photoData = response.data;
      
      // Check if we have a valid path
      if (photoData && photoData.path && photoData.path !== 'undefined') {
        const cleanPath = photoData.path.replace(/\\/g, "/");
        const profileImagePath = cleanPath.startsWith('http') 
          ? cleanPath 
          : `${BACKEND_URL}/${cleanPath}`;
        setProfileImage(profileImagePath);
        console.log(profileImagePath)
      } else {
        // Use default image (don't prepend BACKEND_URL for local assets)
        setProfileImage("/assets/img/teachers/teacher-01.jpg");
      }
    } catch (error:any) {
      console.error("Error fetching teacher profile photo:", error);
      setProfileImage("/assets/img/teachers/teacher-01.jpg");
      if (error.response?.status !== 404) {
        setError("Failed to load profile photo.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teacher?.id) {
      fetchTeacherProfilePhoto();
    }
  }, [teacher?.id]);

  const handleUploadSuccess = () => {
    fetchTeacherProfilePhoto();
    setIsModalOpen(false);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  if (!teacher) {
    return (
      <div className="col-xxl-3 col-xl-4 theiaStickySidebar">
        <div className="stickybar pb-4">
          <div className="card border-white">
            <div className="card-body">
              <p>Loading teacher data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-xxl-3 col-xl-4 theiaStickySidebar">
      <div className="stickybar pb-4">
        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <div className="alert alert-info">Loading...</div>}
        <div className="card border-white">
          <div className="card-header">
            <div className="d-flex align-items-center flex-wrap row-gap-3">
              <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0 text-dark frames">
                <img
                  src={profileImage}
                  className="img-fluid"
                  alt="Teacher Profile"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/assets/img/teachers/teacher-01.jpg";
                  }}
                />
              </div>
              <div className="overflow-hidden">
                <span className="badge badge-soft-success d-inline-flex align-items-center mb-1">
                  <i className="ti ti-circle-filled fs-5 me-1" />
                  Active
                </span>
                <h5 className="mb-1 text-truncate">{teacher.name}</h5>
                <p className="text-primary">{teacher.id}</p>
                <p>Joined: {new Date(teacher.joiningDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="mt-3">
              <button
                className="btn btn-primary btn-sm w-100"
                onClick={showModal}
                disabled={loading}
              >
                Upload Profile Photo
              </button>
            </div>
          </div>
          <div className="card-body">
            <h5 className="mb-3">Basic Information</h5>
            <dl className="row mb-0">
              <dt className="col-6 fw-medium text-dark mb-3">Role</dt>
              <dd className="col-6 mb-3">{teacher.role}</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Staff ID</dt>
              <dd className="col-6 mb-3">{teacher.id}</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Experience</dt>
              <dd className="col-6 mb-3">{teacher.experienceYears} Years</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Subjects</dt>
              <dd className="col-6 mb-3">
                {teacher.subjects && teacher.subjects.length > 0 
                  ? teacher.subjects.join(", ") 
                  : "N/A"}
              </dd>
            </dl>
          </div>
        </div>
        <div className="card border-white">
          <div className="card-body">
            <h5 className="mb-3">Primary Contact Info</h5>
            <div className="d-flex align-items-center mb-3">
              <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                <i className="ti ti-phone" />
              </span>
              <div>
                <span className="text-dark fw-medium mb-1">Phone Number</span>
                <p>{teacher.phoneNumber}</p>
              </div>
            </div>
            <div className="d-flex align-items-center">
              <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                <i className="ti ti-mail" />
              </span>
              <div>
                <span className="text-dark fw-medium mb-1">Email Address</span>
                <p>{teacher.userId.email}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card border-white mb-0">
          <div className="card-body pb-1">
            <h5 className="mb-3">Professional Info</h5>
            <div className="d-flex align-items-center mb-3">
              <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                <i className="ti ti-book fs-16" />
              </span>
              <div>
                <span className="fs-12 mb-1">Languages Spoken</span>
                <p className="text-dark">
                  {teacher.languagesSpoken && teacher.languagesSpoken.length > 0 
                    ? teacher.languagesSpoken.join(", ") 
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-12">
                <div className="mb-3">
                  <span className="fs-12 mb-1">Bio</span>
                  <p className="text-dark">
                    {teacher.bio || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Modal
          title="Upload Profile Photo"
          open={isModalOpen}
          onCancel={handleCancel}
          footer={null}
          zIndex={10000}
        >
          <TeacherProfileUpload id={teacher.id} onUploadSuccess={handleUploadSuccess} />
        </Modal>
      </div>
    </div>
  );
};

export default TeacherSidebar;
