import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import axios from "axios";
import StudentProfileUpload from "./StudentProfileUpload";
import { Modal } from "antd";

interface Student {
  session: string;
  firstName: string;
  lastName: string;
  regNo: string;
  gender: string;
  className: string; // Renamed from 'class' to avoid reserved keyword
  joinedOn: string;
  status: string;
  profileImage: string;
  profilePhoto?: {
    filename: string;
    path: string;
    mimetype: string;
    size: number;
  };
  dateOfBirth?: string;
  bloodGroup?: string;
  religion?: string;
  caste?: string;
  category?: string;
  motherTongue?: string;
  languagesKnown?: string[];
  fatherInfo?: {
    phoneNumber?: string;
    email?: string;
  };
  transportInfo?: {
    route?: string;
    vehicleNumber?: string;
    pickupPoint?: string;
  };
}

const API_URL = process.env.REACT_APP_URL || "";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

interface StudentSidebarProps {
  admissionNumber: string;
}

const StudentSidebar = ({ admissionNumber }: StudentSidebarProps) => {
  const [student, setStudent] = useState<Student>({
    session: "",
    firstName: "",
    lastName: "",
    regNo: "",
    gender: "",
    className: "",
    joinedOn: "",
    status: "",
    profileImage: "",
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentById = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_URL}/api/student/${admissionNumber}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const studentData = response.data;

      // Handle name splitting safely
      const nameParts = studentData.name?.trim().split(" ") || ["", ""];
      const firstName = nameParts[0] || "Unknown";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      // Normalize profile image path
      const profileImagePath = studentData.profilePhoto?.path
        ? `${BACKEND_URL}/${studentData.profilePhoto.path.replace(/\\/g, "/")}`
        : "/assets/img/students/student-01.jpg";

      setStudent({
        session: studentData.sessionId?.name || "N/A",
        firstName,
        lastName,
        regNo: studentData.admissionNumber || "N/A",
        gender: studentData.gender || "N/A",
        className: studentData.classId?.name || "N/A",
        joinedOn: studentData.admissionDate || "N/A",
        status: studentData.status || "N/A",
        profileImage: profileImagePath,
        profilePhoto: studentData.profilePhoto || null,
        dateOfBirth: studentData.dateOfBirth || "",
        bloodGroup: studentData.bloodGroup || "N/A",
        religion: studentData.religion || "N/A",
        caste: studentData.caste || "N/A",
        category: studentData.category || "N/A",
        fatherInfo: studentData.fatherInfo || {},
        transportInfo: studentData.transportInfo || {},
      });
      console.log()
    } catch (error) {
      console.error("Error fetching student:", error);
      setError("Failed to load student data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admissionNumber) {
      fetchStudentById();
    }
  }, [admissionNumber]);

  const handleUploadSuccess = () => {
    fetchStudentById();
    setIsModalOpen(false);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

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
                  src={student?.profileImage}
                  className="img-fluid"
                  alt="Student Profile"
                />
                <>{console.log(student?.profileImage)}</>
              </div>
              <div className="overflow-hidden">
                <span className="badge badge-soft-success d-inline-flex align-items-center mb-1">
                  <i className="ti ti-circle-filled fs-5 me-1" />
                  {student.status}
                </span>
                <h5 className="mb-1 text-truncate">
                  {student.firstName} {student.lastName}
                </h5>
                <p className="text-primary">{student.regNo}</p>
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
              <dt className="col-6 fw-medium text-dark mb-3">Gender</dt>
              <dd className="col-6 mb-3">{student.gender}</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Date Of Birth</dt>
              <dd className="col-6 mb-3">
                {student.dateOfBirth
                  ? new Date(student.dateOfBirth).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })
                  : "N/A"}
              </dd>
              <dt className="col-6 fw-medium text-dark mb-3">Blood Group</dt>
              <dd className="col-6 mb-3">{student.bloodGroup}</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Religion</dt>
              <dd className="col-6 mb-3">{student.religion}</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Caste</dt>
              <dd className="col-6 mb-3">{student.caste}</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Category</dt>
              <dd className="col-6 mb-3">{student.category}</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Class</dt>
              <dd className="col-6 mb-3">{student.className}</dd>
            </dl>
            <Link
              to="#"
              data-bs-toggle="modal"
              data-bs-target="#add_fees_collect"
              className="btn btn-primary btn-sm w-100"
            >
              Add Fees
            </Link>
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
                <p>{student.fatherInfo?.phoneNumber || "N/A"}</p>
              </div>
            </div>
            <div className="d-flex align-items-center">
              <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                <i className="ti ti-mail" />
              </span>
              <div>
                <span className="text-dark fw-medium mb-1">Email Address</span>
                <p>{student.fatherInfo?.email || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card border-white mb-0">
          <div className="card-body pb-1">
            <h5 className="mb-3">Transportation Infoබ- Info</h5>
            <div className="d-flex align-items-center mb-3">
              <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                <i className="ti ti-bus fs-16" />
              </span>
              <div>
                <span className="fs-12 mb-1">Route</span>
                <p className="text-dark">
                  {student.transportInfo?.route || "N/A"}
                </p>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <div className="mb-3">
                  <span className="fs-12 mb-1">Bus Number</span>
                  <p className="text-dark">
                    {student.transportInfo?.vehicleNumber || "N/A"}
                  </p>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="mb-3">
                  <span className="fs-12 mb-1">Pickup Point</span>
                  <p className="text-dark">
                    {student.transportInfo?.pickupPoint || "N/A"}
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
          zIndex={1000} // Reduced zIndex to a reasonable value
        >
          <StudentProfileUpload
            admissionNumber={admissionNumber}
            onUploadSuccess={handleUploadSuccess}
          />
        </Modal>
      </div>
    </div>
  );
};

export default StudentSidebar;
