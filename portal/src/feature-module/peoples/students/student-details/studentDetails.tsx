import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import StudentSidebar from "./studentSidebar";
import StudentBreadcrumb from "./studentBreadcrumb";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import Modal from "antd/es/modal/Modal";
import { Button, message } from "antd";
const API_URL = process.env.REACT_APP_URL;

// Updated Student interface to match API response
interface Student {
  _id: string;
  admissionNumber: string;
  name: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  admissionDate: string;
  status: "active" | "inactive";
  profileImage: string | null;
  classId: { _id: string; id?: string; name: string } | null;
  rollNumber: string;
  sessionId: { _id: string; name: string; sessionId: string } | null;
  bloodGroup: string;
  religion: string;
  category: string;
  class: string;
  motherTongue: string;
  languagesKnown: string[];
  currentAddress: string;
  permanentAddress: string;
  fatherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
    image: string | null;
  };
  motherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
    image: string | null;
  };
  guardianInfo: {
    name: string;
    relation: string;
    phoneNumber: string;
    email: string;
    occupation: string;
    image: string | null;
  };
  transportInfo: {
    route: string;
    vehicleNumber: string;
    pickupPoint: string;
  };
  documents: {
    aadharCard: string | null;
    medicalCondition: string | null;
    transferCertificate: string | null;
  };
  medicalHistory: {
    condition: string;
    allergies: string[];
    medications: string[];
  };
  previousSchool: {
    name: string;
    address: string;
  };
}

const StudentDetails = () => {
  const routes = all_routes;
  const { admissionNumber } = useParams<{ admissionNumber: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // State for modal
  const [isDeleting, setIsDeleting] = useState(false); // State for delete loading
  const { token } = useAuth();
  const navigate = useNavigate(); // For redirect after deletion

  // Fetch student details by admissionNumber
  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/student/${admissionNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudent(res.data); // API response matches the Student interface
      console.log("Student Data:", res.data);
    } catch (err) {
      console.error("Error fetching student details:", err);
      setError("Failed to load student details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admissionNumber) {
      fetchStudentDetails();
    }
  }, [admissionNumber]);

  // Handle delete action
  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`${API_URL}/api/student/${admissionNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteModal(false);
      message.success("Student deleted successfully"); // Assuming antd message is available
      navigate(routes.studentList); // Redirect to student list
    } catch (error) {
      console.error("Error deleting student:", error);
      message.error("Failed to delete student");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-danger">{error}</div>;
  if (!student) return <div>No student data found</div>;

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <StudentBreadcrumb admissionNumber={admissionNumber!} />
          </div>
          <div className="row">
            <StudentSidebar admissionNumber={admissionNumber!} />
            <div className="col-xxl-9 col-xl-8">
              <div className="row">
                <div className="col-md-12">
                  {/* <div className="d-flex justify-content-end mb-3">
                    <button
                      className="btn btn-danger d-flex align-items-center"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <i className="ti ti-trasx me-2" />
                      Delete Student
                    </button>
                  </div> */}
                  <ul className="nav nav-tabs nav-tabs-bottom mb-4">
                    <li>
                      <Link
                        to={routes.studentDetail.replace(
                          ":admissionNumber",
                          admissionNumber!
                        )}
                        className="nav-link active"
                      >
                        <i className="ti ti-school me-2" />
                        Student Details
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={routes.studentTimeTable.replace(
                          ":admissionNumber",
                          admissionNumber!
                        )}
                        className="nav-link"
                      >
                        <i className="ti ti-report-money me-2" />
                        Planner
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={routes.studentLeaves.replace(
                          ":admissionNumber",
                          admissionNumber!
                        )}
                        className="nav-link"
                      >
                        <i className="ti ti-calendar-due me-2" />
                        Leave & Attendance
                      </Link>
                    </li>
                  </ul>

                  {/* Parents Information */}
                  <div className="card">
                    <div className="card-header">
                      <h5>Parents Information</h5>
                    </div>
                    <div className="card-body">
                      {/* Father Info */}
                      <div className="border rounded p-3 pb-0 mb-3">
                        <div className="row">
                          <div className="col-sm-6 col-lg-4">
                            <div className="d-flex align-items-center mb-3">
                              <span className="avatar avatar-lg flex-shrink-0">
                                {/* <ImageWithBasePath
                                  src={student.fatherInfo.image || 'assets/img/parents/parent-13.jpg'}
                                  className="img-fluid rounded"
                                  alt="Father"
                                /> */}
                              </span>
                              <div className="ms-2 overflow-hidden">
                                <h6 className="text-truncate">
                                  {student.fatherInfo.name}
                                </h6>
                                <p className="text-primary">Father</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="mb-3">
                              <p className="text-dark fw-medium mb-1">Phone</p>
                              <p>{student.fatherInfo.phoneNumber || "N/A"}</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="mb-3 overflow-hidden me-3">
                                <p className="text-dark fw-medium mb-1">
                                  Email
                                </p>
                                <p className="text-truncate">
                                  {student.fatherInfo.email || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mother Info */}
                      <div className="border rounded p-3 pb-0 mb-3">
                        <div className="row">
                          <div className="col-sm-6 col-lg-4">
                            <div className="d-flex align-items-center mb-3">
                              <span className="avatar avatar-lg flex-shrink-0">
                                {/* <ImageWithBasePath
                                  src={student.motherInfo.image || 'assets/img/parents/parent-14.jpg'}
                                  className="img-fluid rounded"
                                  alt="Mother"
                                /> */}
                              </span>
                              <div className="ms-2 overflow-hidden">
                                <h6 className="text-truncate">
                                  {student.motherInfo.name}
                                </h6>
                                <p className="text-primary">Mother</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="mb-3">
                              <p className="text-dark fw-medium mb-1">Phone</p>
                              <p>{student.motherInfo.phoneNumber || "N/A"}</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="mb-3 overflow-hidden me-3">
                                <p className="text-dark fw-medium mb-1">
                                  Email
                                </p>
                                <p className="text-truncate">
                                  {student.motherInfo.email || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Guardian Info */}
                      <div className="border rounded p-3 pb-0">
                        <div className="row">
                          <div className="col-sm-6 col-lg-4">
                            <div className="d-flex align-items-center mb-3">
                              <span className="avatar avatar-lg flex-shrink-0"></span>
                              <div className="ms-2 overflow-hidden">
                                <h6 className="text-truncate">
                                  {student.guardianInfo.name}
                                </h6>
                                <p className="text-primary">
                                  {student.guardianInfo.relation}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="mb-3">
                              <p className="text-dark fw-medium mb-1">Phone</p>
                              <p>{student.guardianInfo.phoneNumber || "N/A"}</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="mb-3 overflow-hidden me-3">
                                <p className="text-dark fw-medium mb-1">
                                  Email
                                </p>
                                <p className="text-truncate">
                                  {student.guardianInfo.email || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="row">
                    {/* Documents */}
                    <div className="col-md-6">
                      <div className="card flex-fill">
                        <div className="card-header">
                          <h5>Documents</h5>
                        </div>
                        <div className="card-body">
                          {Object.entries(student.documents).some(
                            ([_, value]) => value
                          ) ? (
                            Object.entries(student.documents).map(
                              ([key, value], index) =>
                                value ? (
                                  <div
                                    key={index}
                                    className="bg-light-300 border rounded d-flex align-items-center justify-content-between mb-3 p-2"
                                  >
                                    <div className="d-flex align-items-center overflow-hidden">
                                      <span className="avatar avatar-md bg-white rounded flex-shrink-0 text-default">
                                        <i className="ti ti-pdf fs-15" />
                                      </span>
                                      <div className="ms-2">
                                        <p className="text-truncate fw-medium text-dark">
                                          {key.charAt(0).toUpperCase() +
                                            key
                                              .slice(1)
                                              .replace(/([A-Z])/g, " $1")}
                                        </p>
                                      </div>
                                    </div>
                                    <Link
                                      to={value}
                                      className="btn btn-dark btn-icon btn-sm"
                                      download
                                    >
                                      <i className="ti ti-download" />
                                    </Link>
                                  </div>
                                ) : null
                            )
                          ) : (
                            <p>No documents available</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="col-md-6">
                      <div className="card flex-fill">
                        <div className="card-header">
                          <h5>Address</h5>
                        </div>
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-3">
                            <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                              <i className="ti ti-map-pin-up" />
                            </span>
                            <div>
                              <p className="text-dark fw-medium mb-1">
                                Current Address
                              </p>
                              <p>{student.currentAddress || "N/A"}</p>
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            <span className="avatar avatar-md bg-light-300 rounded me-2 flex-shrink-0 text-default">
                              <i className="ti ti-map-pins" />
                            </span>
                            <div>
                              <p className="text-dark fw-medium mb-1">
                                Permanent Address
                              </p>
                              <p>{student.permanentAddress || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Medical History */}
                    <div className="col-md-6">
                      <div className="card flex-fill">
                        <div className="card-header">
                          <h5>Medical History</h5>
                        </div>
                        <div className="card-body pb-1">
                          <div className="row">
                            <div className="col-md-6">
                              <div className="mb-3">
                                <p className="text-dark fw-medium mb-1">
                                  Known Allergies
                                </p>
                                {student.medicalHistory.allergies.length > 0 ? (
                                  student.medicalHistory.allergies.map(
                                    (allergy, index) => (
                                      <span
                                        key={index}
                                        className="badge bg-light text-dark me-1"
                                      >
                                        {allergy}
                                      </span>
                                    )
                                  )
                                ) : (
                                  <p>N/A</p>
                                )}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <p className="text-dark fw-medium mb-1">
                                  Medications
                                </p>
                                {student.medicalHistory.medications.length >
                                0 ? (
                                  student.medicalHistory.medications.map(
                                    (med, index) => <p key={index}>{med}</p>
                                  )
                                ) : (
                                  <p>N/A</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ant Design Modal */}
      {/* <Modal
        title="Confirm Deletion"
        visible={showDeleteModal}
        onCancel={handleCloseModal}
        footer={[
          <Button key="cancel" onClick={handleCloseModal}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={handleDeleteConfirm}
            loading={isDeleting}
          >
            Delete
          </Button>,
        ]}
      >
        <p>Are you sure you want to delete this student?</p>
      </Modal> */}
    </>
  );
};

export default StudentDetails;