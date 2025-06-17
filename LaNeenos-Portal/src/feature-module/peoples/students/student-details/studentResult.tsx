import React from "react";
import { Link, useParams } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import StudentModals from "../studentModals";
import StudentSidebar from "./studentSidebar";
import StudentBreadcrumb from "./studentBreadcrumb";

const StudentResult = () => {
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
                    <li>
                      <Link
                        to={routes.studentFees.replace(
                          ":admissionNumber",
                          admissionNumber!
                        )}
                        className="nav-link"
                      >
                        <i className="ti ti-report-money me-2" />
                        Fees
                      </Link>
                    </li>
                  </ul>
                  <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                      <h4 className="mb-3">Exams & Results</h4>
                      <div className="d-flex align-items-center flex-wrap">
                        <div className="dropdown mb-3 me-2">
                          <Link
                            to="#"
                            className="btn btn-outline-light bg-white dropdown-toggle"
                            data-bs-toggle="dropdown"
                            data-bs-auto-close="outside"
                          >
                            <i className="ti ti-calendar-due me-2" />
                            Year: 2024 / 2025
                          </Link>
                          <ul className="dropdown-menu p-3">
                            <li>
                              <Link to="#" className="dropdown-item rounded-1">
                                Year: 2024 / 2025
                              </Link>
                            </li>
                            <li>
                              <Link to="#" className="dropdown-item rounded-1">
                                Year: 2023 / 2024
                              </Link>
                            </li>
                            <li>
                              <Link to="#" className="dropdown-item rounded-1">
                                Year: 2022 / 2023
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      <div
                        className="accordions-items-seperate"
                        id="accordionExample"
                      >
                        <div className="accordion-item">
                          <h2 className="accordion-header">
                            <button
                              className="accordion-button"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target="#collapseOne"
                              aria-expanded="true"
                              aria-controls="collapseOne"
                            >
                              <span className="avatar avatar-sm bg-success me-2">
                                <i className="ti ti-checks" />
                              </span>
                              Monthly Test (May)
                            </button>
                          </h2>
                          <div
                            id="collapseOne"
                            className="accordion-collapse collapse show"
                            data-bs-parent="#accordionExample"
                          >
                            <div className="accordion-body">
                              <div className="table-responsive">
                                <table className="table">
                                  <thead className="thead-light">
                                    <tr>
                                      <th>Subject</th>
                                      <th>Max Marks</th>
                                      <th>Min Marks</th>
                                      <th>Marks Obtained</th>
                                      <th className="text-end">Result</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td>English (150)</td>
                                      <td>100</td>
                                      <td>35</td>
                                      <td>65</td>
                                      <td className="text-end">
                                        <span className="badge badge-soft-success d-inline-flex align-items-center">
                                          <i className="ti ti-circle-filled fs-5 me-1" />
                                          Pass
                                        </span>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
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

export default StudentResult;
