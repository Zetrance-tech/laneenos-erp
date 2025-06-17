import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { all_routes } from '../../../router/all_routes';
import ImageWithBasePath from '../../../../core/common/imageWithBasePath';
import { useAuth } from '../../../../context/AuthContext';
interface TeacherBreadcrumbProps {
  id?: string;
}
const API_URL = process.env.REACT_APP_URL;

const TeacherBreadcrumb: React.FC<TeacherBreadcrumbProps> = ({ id }) => {
  const routes = all_routes;
  const [teacher, setTeacher] = useState<any>(null); // Store teacher data for login details
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {token} = useAuth();

  // Fetch teacher data when "Login Details" is clicked
  const fetchTeacherLoginDetails = async () => {
    if (!id) return; // Do nothing if no id is provided
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/teacher/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeacher(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch login details");
      setLoading(false);
    }
  };

  // Handle modal open
  const handleLoginDetailsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Prevent default link behavior
    fetchTeacherLoginDetails();
  };

  return (
    <div className="col-md-12">
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Staff Details</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to={routes.adminDashboard}>Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={id ? routes.teacherDetails.replace(":id", id) : routes.teacherList}>
                  Teachers
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Staff Details
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
          <Link
            to="#"
            className="btn btn-light me-2 mb-2"
            data-bs-toggle="modal"
            data-bs-target="#login_detail"
            onClick={handleLoginDetailsClick} // Fetch data on click
          >
            <i className="ti ti-lock me-2" />
            Login Details
          </Link>
          {id && (
            <Link
              to={routes.editTeacher.replace(":id", id)}
              className="btn btn-primary d-flex align-items-center mb-2"
            >
              <i className="ti ti-edit-circle me-2" />
              Edit Staff
            </Link>
          )}
        </div>
      </div>

      {/* Login Details Modal */}
      <div className="modal fade" id="login_detail" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Login Details</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              {loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="text-danger">{error}</p>
              ) : teacher ? (
                <>
                  <div className="student-detail-info">
                    <span className="student-img">
                      <ImageWithBasePath
                        src="assets/img/teachers/teacher-01.jpg"
                        alt="img"
                      />
                    </span>
                    <div className="name-info">
                      <h6>
                        {teacher.name} <span>{teacher.id}</span>
                      </h6>
                    </div>
                  </div>
                  <div className="table-responsive custom-table no-datatable_length">
                    <table className="table datanew">
                      <thead className="thead-light">
                        <tr>
                          <th>User Type</th>
                          <th>User Email</th>
                          <th>Password</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{teacher.userId.role}</td>
                          <td>{teacher.userId.email}</td>
                          <td>{teacher.userId.password || "********"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p>No teacher selected</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherBreadcrumb;