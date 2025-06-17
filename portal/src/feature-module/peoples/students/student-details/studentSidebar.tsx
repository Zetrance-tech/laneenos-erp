import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import axios from "axios";

// Define the Student interface within the file
interface Student {
  session: string;
  firstName: string;
  lastName: string;
  regNo: string;
  // rollNo: string;
  gender: string;
  class: string;
  joinedOn: string;
  status: string;
  profileImage: string | null;
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
const API_URL = process.env.REACT_APP_URL;

interface StudentSidebarProps {
  admissionNumber: string; // Updated prop name to match API field
}

const StudentSidebar = ({ admissionNumber }: StudentSidebarProps) => {
  const [student, setStudent] = useState<Student>({
    session: "",
    firstName: "",
    lastName: "",
    regNo: "",
    gender: "",
    class: "",
    joinedOn: "",
    status: "",
    profileImage: null,
  });

  const fetchStudentById = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/student/${admissionNumber}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      const studentData = response.data;
      setStudent({
        session: studentData.sessionId?.name || "",
        firstName: studentData.name.split(" ")[0] || "",
        lastName: studentData.name.split(" ")[1] || "",
        regNo: studentData.admissionNumber || "",
        gender: studentData.gender || "",
        class: studentData.classId?.name || "",
        joinedOn: studentData.admissionDate || "",
        status: studentData.status || "",
        profileImage: studentData.profileImage || null,
        dateOfBirth: studentData.dateOfBirth || "",
        bloodGroup: studentData.bloodGroup || "",
        religion: studentData.religion || "",
        caste: studentData.caste || "",
        category: studentData.category || "",
        // motherTongue: studentData.motherTongue || "",
        // languagesKnown: studentData.languagesKnown || [],
        fatherInfo: studentData.fatherInfo || {},
        transportInfo: studentData.transportInfo || {},
      });
    } catch (error) {
      console.error("Error fetching student:", error);
    }
  };

  useEffect(() => {
    fetchStudentById();
  }, [admissionNumber]);

  return (
    <div className="col-xxl-3 col-xl-4 theiaStickySidebar">
      <div className="stickybar pb-4">
        <div className="card border-white">
          <div className="card-header">
            <div className="d-flex align-items-center flex-wrap row-gap-3">
              <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0 text-dark frames">
                <ImageWithBasePath
                  src={student.profileImage || "assets/img/students/student-01.jpg"}
                  className="img-fluid"
                  alt="Student Profile"
                />
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
          </div>
          <div className="card-body">
            <h5 className="mb-3">Basic Information</h5>
            <dl className="row mb-0">
              {/* <dt className="col-6 fw-medium text-dark mb-3">Roll No</dt>
              <dd className="col-6 mb-3">{student.rollNo}</dd> */}
              <dt className="col-6 fw-medium text-dark mb-3">Gender</dt>
              <dd className="col-6 mb-3">{student.gender}</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Date Of Birth</dt>
              <dd className="col-6 mb-3">
                {student.dateOfBirth
                  ? new Date(student.dateOfBirth).toLocaleDateString()
                  : "N/A"}
              </dd>
              <dt className="col-6 fw-medium text-dark mb-3">Blood Group</dt>
              <dd className="col-6 mb-3">{student.bloodGroup || "N/A"}</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Religion</dt>
              <dd className="col-6 mb-3">{student.religion || "N/A"}</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Caste</dt>
              <dd className="col-6 mb-3">{student.caste || "N/A"}</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Category</dt>
              <dd className="col-6 mb-3">{student.category || "N/A"}</dd>
              
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
            <h5 className="mb-3">Transportation Info</h5>
            <div className="d-flex align-items-center mb-3">
              <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                <i className="ti ti-bus fs-16" />
              </span>
              <div>
                <span className="fs-12 mb-1">Route</span>
                <p className="text-dark">{student.transportInfo?.route || "N/A"}</p>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <div className="mb-3">
                  <span className="fs-12 mb-1">Bus Number</span>
                  <p className="text-dark">{student.transportInfo?.vehicleNumber || "N/A"}</p>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="mb-3">
                  <span className="fs-12 mb-1">Pickup Point</span>
                  <p className="text-dark">{student.transportInfo?.pickupPoint || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSidebar;