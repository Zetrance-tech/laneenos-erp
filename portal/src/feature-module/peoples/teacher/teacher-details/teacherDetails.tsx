import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import TeacherModal from "../teacherModal";
import { all_routes } from "../../../router/all_routes";
import TeacherSidebar from "./teacherSidebar";
import TeacherBreadcrumb from "./teacherBreadcrumb";
import { useAuth } from "../../../../context/AuthContext";
import { Button, Modal, message } from "antd";

const API_URL = process.env.REACT_APP_URL;

const TeacherDetails = () => {
  const routes = all_routes;
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFilePath, setPreviewFilePath] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/teacher/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeacher(response.data);
        setLoading(false);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to fetch teacher details"
        );
        setLoading(false);
      }
    };

    if (id) {
      fetchTeacher();
    }
  }, [id]);

  const handlePreview = (filePath: string) => {
    setPreviewFilePath(filePath);
    setPreviewVisible(true);
  };

  const handlePreviewCancel = () => {
    setPreviewVisible(false);
    setPreviewFilePath(null);
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <TeacherBreadcrumb id={id || ""} />
            <TeacherSidebar teacher={teacher} />

            <div className="col-xxl-9 col-xl-8">
              <div className="row">
                <div className="col-md-12">
                  <ul className="nav nav-tabs nav-tabs-bottom mb-4">
                    <li>
                      <Link
                        to={routes.teacherDetails.replace(":id", id || "")}
                        className="nav-link active"
                      >
                        <i className="ti ti-school me-2" /> Staff Details
                      </Link>
                    </li>
                    {/* <li>
                      <Link
                        to={routes.teachersRoutine.replace(":id", id || "")}
                        className="nav-link"
                      >
                        <i className="ti ti-table-options me-2" /> Routine
                      </Link>
                    </li> */}
                    <li>
                      <Link
                        to={routes.teacherLeaves.replace(":id", id || "")}
                        className="nav-link"
                      >
                        <i className="ti ti-calendar-due me-2" /> Attendance
                      </Link>
                    </li>
                    {/* <li>
                      <Link
                        to={routes.teacherSalary.replace(":id", id || "")}
                        className="nav-link"
                      >
                        <i className="ti ti-report-money me-2" /> Salary
                      </Link>
                    </li> */}
                    {/* <li>
                      <Link
                        to={routes.teacherLibrary.replace(":id", id || "")}
                        className="nav-link"
                      >
                        <i className="ti ti-bookmark-edit me-2" /> Library
                      </Link>
                    </li> */}
                  </ul>

                  <div className="card">
                    <div className="card-header">
                      <h5>Profile Details</h5>
                    </div>
                    <div className="card-body">
                      <div className="border rounded p-3 pb-0">
                        <div className="row">
                          <div className="col-sm-6 col-lg-4">
                            <p className="text-dark fw-medium mb-1">
                              Staff Role
                            </p>
                            <p>{teacher.role}</p>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <p className="text-dark fw-medium mb-1">Staff ID</p>
                            <p>{teacher.id}</p>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <p className="text-dark fw-medium mb-1">Name</p>
                            <p>{teacher.name}</p>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <p className="text-dark fw-medium mb-1">DOB</p>
                            <p>
                              {new Date(
                                teacher.dateOfBirth
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <p className="text-dark fw-medium mb-1">Gender</p>
                            <p>{teacher.gender}</p>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <p className="text-dark fw-medium mb-1">
                              Experience
                            </p>
                            <p>{teacher.experienceYears} Years</p>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <p className="text-dark fw-medium mb-1">
                              Emergency Contact
                            </p>
                            <p>{teacher.emergencyContact || "Not provided"}</p>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <p className="text-dark fw-medium mb-1">
                              Basic Salary
                            </p>
                            <p>
                              {teacher.payroll?.basicSalary
                                ? `₹${teacher.payroll.basicSalary}`
                                : "Not provided"}
                            </p>
                          </div>
                          <div className="col-sm-6 col-lg-4">
                            <p className="text-dark fw-medium mb-1">
                              Work Location
                            </p>
                            <p>{teacher.workLocation || "Not provided"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="col-xxl-6 d-flex">
                  <div className="card flex-fill">
                    <div className="card-header">
                      <h5>Documents</h5>
                    </div>
                    <div className="card-body">
                      {teacher.documents && teacher.documents.length > 0 ? (
                        teacher.documents.map((doc: any, index: number) => {
                          const fullPath = `${API_URL}/${doc.path}`;
                          return (
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
                              <div className="d-flex gap-2">
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<i className="ti ti-eye" />}
                                  onClick={() => handlePreview(fullPath)}
                                >
                                  Preview
                                </Button>
                                <Button
                                  size="small"
                                  type="default"
                                  icon={<i className="ti ti-download" />}
                                >
                                  <a
                                    href={fullPath}
                                    download
                                    style={{
                                      color: "inherit",
                                      textDecoration: "none",
                                    }}
                                  >
                                    Download
                                  </a>
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-muted">Documents not uploaded</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="col-xxl-6 d-flex">
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
                          <p>{teacher.address || "Not provided"}</p>
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

      {/* Ant Design Preview Modal */}
      <Modal
        title="Document Preview"
        open={previewVisible}
        footer={null}
        onCancel={handlePreviewCancel}
        width={800}
        style={{ top: 20 }}
        zIndex={10000}
      >
        {previewFilePath ? (
          <iframe
            src={previewFilePath}
            style={{ width: "100%", height: "500px", border: "none" }}
            title="Document Preview"
          />
        ) : (
          <p>No preview available</p>
        )}
      </Modal>

      <TeacherModal />
    </>
  );
};

export default TeacherDetails;
