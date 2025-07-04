import React from "react";
import { Link, useParams } from "react-router-dom";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import StudentModals from "../studentModals";
import StudentSidebar from "./studentSidebar";
import StudentBreadcrumb from "./studentBreadcrumb";

const StudentFees = () => {
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
                    <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                      <h4 className="mb-3">Fees</h4>
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
                    <div className="card-body p-0 py-3">
                      <div className="custom-datatable-filter table-responsive">
                        <table className="table datatable">
                          <thead className="thead-light">
                            <tr>
                              <th>Fees Group</th>
                              <th>Fees Code</th>
                              <th>Due Date</th>
                              <th>Amount $</th>
                              <th>Status</th>
                              <th>Ref ID</th>
                              <th>Mode</th>
                              <th>Date Paid</th>
                              <th>Discount ($)</th>
                              <th>Fine ($)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>
                                <p className="text-primary fees-group">
                                  Class 1 General
                                  <span className="d-block">
                                    (Admission Fees)
                                  </span>
                                </p>
                              </td>
                              <td>admission-fees</td>
                              <td>25 Mar 2024</td>
                              <td>2000</td>
                              <td>
                                <span className="badge badge-soft-success d-inline-flex align-items-center">
                                  <i className="ti ti-circle-filled fs-5 me-1" />
                                  Paid
                                </span>
                              </td>
                              <td>#435454</td>
                              <td>Cash</td>
                              <td>25 Jan 2024</td>
                              <td>10%</td>
                              <td>200</td>
                            </tr>
                            {/* Additional rows omitted for brevity */}
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
      <StudentModals />
    </>
  );
};

export default StudentFees;
