import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import StudentModals from "../studentModals";
import Table from "../../../../core/common/dataTable/index";
import TooltipOption from "../../../../core/common/tooltipOption";
import axios from "axios";
import { Spin } from "antd";
import { useAuth } from "../../../../context/AuthContext";
const API_URL = process.env.REACT_APP_URL;

interface Student {
  _id: string;
  admissionNumber: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  admissionDate: string;
  class?: string; // Optional as not in API response
}

const StudentList = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const {token} = useAuth();

  // const handleApplyClick = () => {
  //   if (dropdownMenuRef.current) {
  //     dropdownMenuRef.current.classList.remove("show");
  //   }
  // };

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/api/student`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data);
      console.log(res.data)
    } catch (error) {
      console.error("Error fetching students:", error);
    }
    finally{
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const columns = [
    {
      title: "Admission Number",
      dataIndex: "admissionNumber",
      render: (text: string) => (
        <Link to={routes.studentDetail.replace(":admissionNumber", text)} className="link-primary">
          {text}
        </Link>
      ),
      sorter: (a: Student, b: Student) => a.admissionNumber.localeCompare(b.admissionNumber),
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text: string) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md">
            <ImageWithBasePath
              src="assets/img/students/student-01.jpg"
              className="img-fluid rounded-circle"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <p className="text-dark mb-0">
              <Link to="#">{text}</Link>
            </p>
          </div>
        </div>
      ),
      sorter: (a: Student, b: Student) => a.name.localeCompare(b.name),
    },
    // {
    //   title: "Class",
    //   dataIndex: "class",
    //   render: (text: string) => text || "N/A",
    //   sorter: (a: Student, b: Student) => (a.class || "").localeCompare(b.class || ""),
    // },
    {
      title: "Gender",
      dataIndex: "gender",
      sorter: (a: Student, b: Student) => a.gender.localeCompare(b.gender),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <>
          {text === "active" ? (
            <span className="badge badge-soft-success d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              Active
            </span>
          ) : (
            <span className="badge badge-soft-danger d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              Inactive
            </span>
          )}
        </>
      ),
      sorter: (a: Student, b: Student) => a.status.localeCompare(b.status),
    },
    {
      title: "Date of Join",
      dataIndex: "admissionDate",
      render: (text: string) =>
        new Date(text).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      sorter: (a: Student, b: Student) =>
        new Date(a.admissionDate).getTime() - new Date(b.admissionDate).getTime(),
    },
    {
      title: "Date of Birth",
      dataIndex: "dateOfBirth",
      render: (text: string) =>
        new Date(text).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      sorter: (a: Student, b: Student) =>
        new Date(a.dateOfBirth).getTime() - new Date(b.dateOfBirth).getTime(),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Student) => (
        <div className="d-flex align-items-center">

          <Link
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#add_fees_collect"
            className="btn btn-light fs-12 fw-semibold me-3"
          >
            Collect Fees
          </Link>
          <div className="dropdown">
            <Link
              to="#"
              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="ti ti-dots-vertical fs-14" />
            </Link>
            <ul className="dropdown-menu dropdown-menu-right p-3">
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to={routes.studentDetail.replace(":admissionNumber", record.admissionNumber)}
                >
                  <i className="ti ti-menu me-2" />
                  View Student
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to={routes.editStudent.replace(":regNo", record.admissionNumber)}
                >
                  <i className="ti ti-edit-circle me-2" />
                  Edit
                </Link>
              </li>
              {/* <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#login_detail"
                >
                  <i className="ti ti-lock me-2" />
                  Login Details
                </Link>
              </li>
              <li>
                <Link className="dropdown-item rounded-1" to="#">
                  <i className="ti ti-toggle-right me-2" />
                  Disable
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to={routes.studentPromotion}
                >
                  <i className="ti ti-arrow-ramp-right-2 me-2" />
                  Promote Student
                </Link>
              </li> */}
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#delete-modal"
                >
                  <i className="ti ti-trash-x me-2" />
                  Delete
                </Link>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Students List</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">Students</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    All Students
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
              <div className="mb-2">
                <Link to={routes.addStudent} className="btn btn-primary d-flex align-items-center">
                  <i className="ti ti-square-rounded-plus me-2" />
                  Add Student
                </Link>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Students List</h4>
              <div className="d-flex align-items-center flex-wrap">
                {/* <div className="input-icon-start mb-3 me-2 position-relative">
                  <PredefinedDateRanges />
                </div>
                <div className="dropdown mb-3 me-2">
                  <Link
                    to="#"
                    className="btn btn-outline-light bg-white dropdown-toggle"
                    data-bs-toggle="dropdown"
                    data-bs-auto-close="outside"
                  >
                    <i className="ti ti-filter me-2" />
                    Filter
                  </Link>
                  <div className="dropdown-menu drop-width" ref={dropdownMenuRef}>
                    <form>
                      <div className="d-flex align-items-center border-bottom p-3">
                        <h4>Filter</h4>
                      </div>
                      <div className="p-3 pb-0 border-bottom">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Class</label>
                              <CommonSelect
                                className="select"
                                options={allClass}
                                defaultValue={allClass[0]}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Section</label>
                              <CommonSelect
                                className="select"
                                options={allSection}
                                defaultValue={allSection[0]}
                              />
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="mb-3">
                              <label className="form-label">Name</label>
                              <CommonSelect
                                className="select"
                                options={names}
                                defaultValue={names[0]}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Gender</label>
                              <CommonSelect
                                className="select"
                                options={gender}
                                defaultValue={gender[0]}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Status</label>
                              <CommonSelect
                                className="select"
                                options={status}
                                defaultValue={status[0]}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 d-flex align-items-center justify-content-end">
                        <Link to="#" className="btn btn-light me-3">
                          Reset
                        </Link>
                        <Link
                          to={routes.studentGrid}
                          className="btn btn-primary"
                          onClick={handleApplyClick}
                        >
                          Apply
                        </Link>
                      </div>
                    </form>
                  </div>
                </div> */}
                <div className="d-flex align-items-center bg-white border rounded-2 p-1 mb-3 me-2">
                  <Link
                    to={routes.studentList}
                    className="active btn btn-icon btn-sm me-1 primary-hover"
                  >
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link
                    to={routes.studentGrid}
                    className="btn btn-icon btn-sm bg-light primary-hover"
                  >
                    <i className="ti ti-grid-dots" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                  <Spin size="large" />
                </div>
              ) : (
                <Table dataSource={students} columns={columns} Selection={true} />
              )}
            </div>
            
          </div>
        </div>
      </div>
      <StudentModals />
    </>
  );
};

export default StudentList;