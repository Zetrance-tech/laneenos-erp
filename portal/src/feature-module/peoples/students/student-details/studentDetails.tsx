import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import StudentSidebar from "./studentSidebar";
import StudentBreadcrumb from "./studentBreadcrumb";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import { Button, message, Modal, Space } from "antd";
import 'antd/dist/reset.css'; // Import antd styles

const API_URL = process.env.REACT_APP_URL;

// Student interface
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
  } | null;
  motherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
    image: string | null;
  } | null;
  guardianInfo: {
    name: string;
    relation: string;
    phoneNumber: string;
    email: string;
    occupation: string;
    image: string | null;
  } | null;
  transportInfo: {
    route: string;
    vehicleNumber: string;
    pickupPoint: string;
  };
  documents: { name: string; path: string }[];
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFilePath, setPreviewFilePath] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  // Fetch student details by admissionNumber
  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/student/${admissionNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudent(res.data);
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
      message.success("Student deleted successfully");
      navigate(routes.studentList);
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

  // Handle preview modal
  const handlePreview = (filePath: string) => {
    setPreviewFilePath(filePath);
    setPreviewVisible(true);
  };

  const handlePreviewCancel = () => {
    setPreviewVisible(false);
    setPreviewFilePath(null);
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
                                  src={student.fatherInfo?.image || 'assets/img/parents/parent-13.jpg'}
                                  className="img-fluid rounded"
                                  alt="Father"
                                /> */}
                              </span>
                              <div className="ms-2 overflow-hidden">
                                <h6 className="text-truncate">
                                  {student.fatherInfo?.name || "Not Provided"}
                                </h6>
                                <p className="text-primary">Father</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="mb-3">
                              <p className="text-dark fw-medium mb-1">Phone</p>
                              <p>{student.fatherInfo?.phoneNumber || "Not Provided"}</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="mb-3 overflow-hidden me-3">
                                <p className="text-dark fw-medium mb-1">Email</p>
                                <p className="text-truncate">
                                  {student.fatherInfo?.email || "Not Provided"}
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
                                  src={student.motherInfo?.image || 'assets/img/parents/parent-14.jpg'}
                                  className="img-fluid rounded"
                                  alt="Mother"
                                /> */}
                              </span>
                              <div className="ms-2 overflow-hidden">
                                <h6 className="text-truncate">
                                  {student.motherInfo?.name || "Not Provided"}
                                </h6>
                                <p className="text-primary">Mother</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="mb-3">
                              <p className="text-dark fw-medium mb-1">Phone</p>
                              <p>{student.motherInfo?.phoneNumber || "Not Provided"}</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="mb-3 overflow-hidden me-3">
                                <p className="text-dark fw-medium mb-1">Email</p>
                                <p className="text-truncate">
                                  {student.motherInfo?.email || "Not Provided"}
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
                                  {student.guardianInfo?.name || "Not Provided"}
                                </h6>
                                <p className="text-primary">
                                  {student.guardianInfo?.relation || "Guardian"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="mb-3">
                              <p className="text-dark fw-medium mb-1">Phone</p>
                              <p>{student.guardianInfo?.phoneNumber || "Not Provided"}</p>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="mb-3 overflow-hidden me-3">
                                <p className="text-dark fw-medium mb-1">Email</p>
                                <p className="text-truncate">
                                  {student.guardianInfo?.email || "Not Provided"}
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
                    <div className="col-md-6">
                      <div className="card flex-fill">
                        <div className="card-header">
                          <h5>Documents</h5>
                        </div>
                        <div className="card-body">
                          {student.documents && student.documents.length > 0 ? (
                            student.documents.map((doc, index) => (
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
                                      {doc.name}
                                    </p>
                                  </div>
                                </div>
                                <Space>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<i className="ti ti-eye" />}
                                    onClick={() => handlePreview(doc.path)}
                                  >
                                    Preview
                                  </Button>
                                  <Button
                                    type="default"
                                    size="small"
                                    icon={<i className="ti ti-download" />}
                                  >
                                    <a
                                      href={`${API_URL}/${doc.path}`}
                                      download
                                      style={{ color: "inherit", textDecoration: "none" }}
                                    >
                                      Download
                                    </a>
                                  </Button>
                                </Space>
                              </div>
                            ))
                          ) : (
                            <p>Not Provided</p>
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
                              <p>{student.currentAddress || "Not Provided"}</p>
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
                              <p>{student.permanentAddress || "Not Provided"}</p>
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
                                  <p>Not Provided</p>
                                )}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <p className="text-dark fw-medium mb-1">
                                  Medications
                                </p>
                                {student.medicalHistory.medications.length > 0 ? (
                                  student.medicalHistory.medications.map(
                                    (med, index) => <p key={index}>{med}</p>
                                  )
                                ) : (
                                  <p>Not Provided</p>
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

      {/* Preview Modal */}
      <Modal
        title="Document Preview"
        open={previewVisible}
        footer={null}
        onCancel={handlePreviewCancel}
        width={800}
        zIndex={10000}
        style={{ top: 20 }}
      >
        {previewFilePath ? (
          <iframe
            src={`${API_URL}/${previewFilePath}`}
            style={{ width: "100%", height: "500px", border: "none" }}
            title="Document Preview"
          />
        ) : (
          <p>No preview available</p>
        )}
      </Modal>
    </>
  );
};

export default StudentDetails;