import React from "react";
import { Link, useParams } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import StudentModals from "../studentModals";
import StudentSidebar from "./studentSidebar";
import StudentBreadcrumb from "./studentBreadcrumb";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";

const StudentLibrary = () => {
  const routes = all_routes;
  const { admissionNumber } = useParams<{ admissionNumber: string }>();

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
                                            to={routes.studentDetail.replace(':admissionNumber', admissionNumber!)}
                                            className="nav-link active"
                                          >
                                            <i className="ti ti-school me-2" />
                                            Student Details
                                          </Link>
                                        </li>
                                        <li>
                                          <Link to={routes.studentTimeTable.replace(':admissionNumber', admissionNumber!)} className="nav-link">
                                            <i className="ti ti-report-money me-2" />
                                            Planner
                                          </Link>
                                        </li>
                                        <li>
                                          <Link to={routes.studentLeaves.replace(':admissionNumber', admissionNumber!)} className="nav-link">
                                            <i className="ti ti-calendar-due me-2" />
                                            Leave & Attendance
                                          </Link>
                                        </li>
                                        {/* <li>
                                          <Link to={routes.studentFees.replace(':admissionNumber', admissionNumber!)} className="nav-link">
                                            <i className="ti ti-report-money me-2" />
                                            Fees
                                          </Link>
                                        </li> */}
                  </ul>
                  <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                      <h5>Library</h5>
                      <div className="dropdown">
                        <Link
                          to="#"
                          className="btn btn-outline-light border-white bg-white dropdown-toggle shadow-md"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-calendar-due me-2" />
                          This Year
                        </Link>
                        <ul className="dropdown-menu p-3">
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              This Year
                            </Link>
                          </li>
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              This Month
                            </Link>
                          </li>
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              This Week
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="card-body pb-1">
                      <div className="row">
                        <div className="col-xxl-4 col-md-6 d-flex">
                          <div className="card mb-3 flex-fill">
                            <div className="card-body pb-1">
                              <span className="avatar avatar-xl mb-3">
                                <ImageWithBasePath
                                  src="assets/img/books/book-01.jpg"
                                  className="img-fluid rounded"
                                  alt="img"
                                />
                              </span>
                              <h6 className="mb-3">The Small-Town Library</h6>
                              <div className="row">
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">Book taken on</span>
                                    <p className="text-dark">25 Jan 2024</p>
                                  </div>
                                </div>
                                <div className="col-sm-6">
                                  <div className="mb-3">
                                    <span className="fs-12 mb-1">Last Date</span>
                                    <p className="text-dark">25 Jan 2024</p>
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
        </div>
      </div>
      <StudentModals />
    </>
  );
};

export default StudentLibrary;