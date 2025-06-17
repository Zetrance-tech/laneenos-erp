import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import Table from "../../../../core/common/dataTable/index";
import { salarydata } from "../../../../core/data/json/salary";
import TeacherSidebar from "./teacherSidebar";
import TeacherBreadcrumb from "./teacherBreadcrumb";
import TeacherModal from "../teacherModal";
import { TableData } from "../../../../core/data/interface";
import { useAuth } from "../../../../context/AuthContext";
const API_URL = process.env.REACT_APP_URL;

const TeacherSalary = () => {
  const routes = all_routes;
  const { id } = useParams<{ id: string }>();
  const data = salarydata;
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {token} = useAuth();

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/teacher/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeacher(response.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch teacher details");
        setLoading(false);
      }
    };

    if (id) {
      fetchTeacher();
    }
  }, [id]);

  if (loading) return <div className="page-wrapper"><div className="content">Loading...</div></div>;
  if (error) return <div className="page-wrapper"><div className="content"><div className="alert alert-danger">{error}</div></div></div>;
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      render: (text: string) => (
        <Link to="#" className="link-primary">
          {text}
        </Link>
      ),
      sorter: (a: TableData, b: TableData) => a.id.length - b.id.length,
    },
    {
      title: "Salary For",
      dataIndex: "Salary_For",
      sorter: (a: any, b: any) => a.Salary_For.length - b.Salary_For.length,
    },
    {
      title: "Date",
      dataIndex: "date",
      sorter: (a: TableData, b: TableData) =>
        parseFloat(a.date) - parseFloat(b.date),
    },
    {
      title: "Payment Method",
      dataIndex: "Payment_Method",
      sorter: (a: any, b: any) =>
        a.Payment_Method.length - b.Payment_Method.length,
    },
    {
      title: "Net Salary",
      dataIndex: "Net_Salary",
      sorter: (a: any, b: any) => a.Net_Salary.length - b.Net_Salary.length,
    },
    {
      title: " ",
      dataIndex: "Net_Salary",
      render: () => (
        <>
          <Link to="#" className="btn btn-light add-fee">
            View Payslip
          </Link>
        </>
      ),
    },
  ];

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            {/* Page Header */}
            <TeacherBreadcrumb id={id}/>
            {/* /Page Header */}
          </div>
          <div className="row">
            {/* Student Information */}
            <TeacherSidebar teacher={teacher}  />
            {/* /Student Information */}
            <div className="col-xxl-9 col-xl-8">
              <div className="row">
                <div className="col-md-12">
                  {/* List */}
                  <ul className="nav nav-tabs nav-tabs-bottom mb-4">
                  <li>
                      <Link to={routes.teacherDetails.replace(":id", id || "")} className="nav-link">
                        <i className="ti ti-school me-2" />
                        Staff Details
                      </Link>
                    </li>
                    <li>
                      <Link to={routes.teachersRoutine.replace(":id", id || "")} className="nav-link">
                        <i className="ti ti-table-options me-2" />
                        Routine
                      </Link>
                    </li>
                    <li>
                      <Link to={routes.teacherLeaves.replace(":id", id || "")} className="nav-link">
                        <i className="ti ti-calendar-due me-2" />
                        Leave & Attendance
                      </Link>
                    </li>
                    <li>
                      <Link to={routes.teacherSalary.replace(":id", id || "")} className="nav-link active">
                        <i className="ti ti-report-money me-2" />
                        Salary
                      </Link>
                    </li>
                    <li>
                      <Link to={routes.teacherLibrary.replace(":id", id || "")} className="nav-link">
                        <i className="ti ti-bookmark-edit me-2" />
                        Library
                      </Link>
                    </li>
                  </ul>
                  {/* /List */}
                  <div className="students-leaves-tab">
                    <div className="row">
                      <div className="col-md-6 col-xxl-3 d-flex">
                        <div className="d-flex align-items-center justify-content-between rounded border p-3 mb-3 flex-fill bg-white">
                          <div className="ms-2">
                            <p className="mb-1">Total Net Salary</p>
                            <h5>$5,55,410</h5>
                          </div>
                          <span className="avatar avatar-lg bg-secondary-transparent rounded flex-shrink-0 text-secondary">
                            <i className="ti ti-user-dollar fs-24" />
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6 col-xxl-3 d-flex">
                        <div className="d-flex align-items-center justify-content-between rounded border p-3 mb-3 flex-fill bg-white">
                          <div className="ms-2">
                            <p className="mb-1">Total Gross Salary</p>
                            <h5>$5,58,380</h5>
                          </div>
                          <span className="avatar avatar-lg bg-success-transparent rounded flex-shrink-0 text-success">
                            <i className="ti ti-moneybag fs-24" />
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6 col-xxl-3 d-flex">
                        <div className="d-flex align-items-center justify-content-between rounded border p-3 mb-3 flex-fill bg-white">
                          <div className="ms-2">
                            <p className="mb-1">Total Deduction</p>
                            <h5>$2,500</h5>
                          </div>
                          <span className="avatar avatar-lg bg-warning-transparent rounded flex-shrink-0 text-warning">
                            <i className="ti ti-arrow-big-down-lines fs-24" />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                        <h4 className="mb-3">Salary</h4>
                      </div>
                      <div className="card-body p-0 py-3">
                        {/* Payroll List */}
                        <Table
                          dataSource={data}
                          columns={columns}
                          Selection={true}
                        />
                       
                        {/* /Payroll List */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
      <TeacherModal />
    </>
  );
};

export default TeacherSalary;
