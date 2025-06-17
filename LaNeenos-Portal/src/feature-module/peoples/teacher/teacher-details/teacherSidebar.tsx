import React from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";

interface TeacherSidebarProps {
  teacher?: {
    id: string;
    name: string;
    role:string;
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
  if (!teacher) {
    return (
      <div className="col-xxl-3 col-xl-4 theiaStickySidebar">
        <div className="stickytopbar pb-4">
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
      <div className="stickytopbar pb-4">
        <div className="card border-white">
          <div className="card-header">
            <div className="d-flex align-items-center flex-wrap row-gap-3">
              <div className="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0 text-dark frames">
                <ImageWithBasePath
                  src="assets/img/teachers/teacher-01.jpg"
                  className="img-fluid"
                  alt="img"
                />
              </div>
              <div>
                <h5 className="mb-1 text-truncate">{teacher.name}</h5>
                <p className="text-primary mb-1">{teacher.id}</p>
                <p>Joined: {new Date(teacher.joiningDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <h5 className="mb-3">Basic Information</h5>
            <dl className="row mb-0">
              <dt className="col-6 fw-medium text-dark mb-3">Role</dt>
              <dd className="col-6 mb-3">{teacher.role}</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Staff ID</dt>
              <dd className="col-6 mb-3">{teacher.id}</dd>
              {/* <dt className="col-6 fw-medium text-dark mb-3">Subject</dt>
              <dd className="col-6 mb-3">{teacher.subjects.join(", ")}</dd> */}
              <dt className="col-6 fw-medium text-dark mb-3">Gender</dt>
              <dd className="col-6 mb-3">{teacher.gender}</dd>
              <dt className="col-6 fw-medium text-dark mb-3">Experience</dt>
              <dd className="col-6 mb-3">{teacher.experienceYears} Years</dd>
              {/* <dt className="col-6 fw-medium text-dark mb-0">Languages Known</dt>
              <dd className="col-6 mb-0">
                {teacher.languagesSpoken.map((lang, index) => (
                  <span key={index} className="badge badge-light text-dark me-2">
                    {lang}
                  </span>
                ))}
              </dd> */}
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
      </div>
    </div>
  );
};

export default TeacherSidebar;