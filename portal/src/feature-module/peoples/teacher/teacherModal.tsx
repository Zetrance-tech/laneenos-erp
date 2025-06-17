import React, { useEffect, useState } from "react";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { Link } from "react-router-dom";
import { leaveType } from "../../../core/common/selectoption/selectoption";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import CommonSelect from "../../../core/common/commonSelect";
import axios from "axios";
const API_URL = process.env.REACT_APP_URL;

interface Teacher {
  id: string;
  name: string;
  userId: {
    name: string;
    email: string;
    password?: string;
  };
}

interface TeacherModalProps {
  selectedTeacherId?: string | null; // Made optional with `?`
}

const TeacherModal: React.FC<TeacherModalProps> = ({ selectedTeacherId }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const formattedDate = `${month}-${day}-${year}`;
  const defaultValue = dayjs(formattedDate);

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTeacherId) {
      const fetchTeacher = async () => {
        try {
          setLoading(true);
          console.log(selectedTeacherId)
          const response = await axios.get<Teacher>(
            `${API_URL}/api/teacher/${selectedTeacherId}`,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
          );
          setTeacher(response.data);
          setLoading(false);
        } catch (err) {
          setError("Failed to fetch teacher details");
          setLoading(false);
          console.error("Error fetching teacher:", err);
        }
      };
      fetchTeacher();
    } else {
      setTeacher(null); // Reset teacher data when no ID is provided
    }
  }, [selectedTeacherId]);

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  return (
    <>
      {/* Delete Modal */}
      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form>
              <div className="modal-body text-center">
                <span className="delete-icon">
                  <i className="ti ti-trash-x" />
                </span>
                <h4>Confirm Deletion</h4>
                <p>
                  You want to delete all the marked items, this can’t be undone once you delete.
                </p>
                <div className="d-flex justify-content-center">
                  <Link to="#" className="btn btn-light me-3" data-bs-dismiss="modal">
                    Cancel
                  </Link>
                  <Link to="#" data-bs-dismiss="modal" className="btn btn-danger">
                    Yes, Delete
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Delete Modal */}

      {/* Login Details */}
      <div className="modal fade" id="login_detail">
        <div className="modal-dialog modal-dialog-centered modal-lg">
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
                          <th>User Name</th>
                          <th>Password</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Teacher</td>
                          <td>{teacher.userId.email}</td>
                          <td>{teacher.userId.password || "********"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p>No teacher selecte</p>
              )}
            </div>
            <div className="modal-footer">
              <Link to="#" className="btn btn-light me-2" data-bs-dismiss="modal">
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* /Login Details */}

      {/* Apply Leave */}
      <div className="modal fade" id="apply_leave">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Apply Leave</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Leave Date</label>
                      <div className="date-pic">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          defaultValue={defaultValue}
                          placeholder="16 May 2024"
                        />
                        <span className="cal-icon">
                          <i className="ti ti-calendar" />
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Leave Type</label>
                      <CommonSelect
                        className="select"
                        options={leaveType}
                        defaultValue={leaveType[0]}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Leave From Date</label>
                      <div className="date-pic">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          defaultValue={defaultValue}
                          placeholder="16 May 2024"
                        />
                        <span className="cal-icon">
                          <i className="ti ti-calendar" />
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Leave to Date</label>
                      <div className="date-pic">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          defaultValue={defaultValue}
                          placeholder="16 May 2024"
                        />
                        <span className="cal-icon">
                          <i className="ti ti-calendar" />
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Leave Days</label>
                      <div className="d-flex align-items-center check-radio-group">
                        <label className="custom-radio">
                          <input type="radio" name="radio" defaultChecked />
                          <span className="checkmark" />
                          Full day
                        </label>
                        <label className="custom-radio">
                          <input type="radio" name="radio" />
                          <span className="checkmark" />
                          First Half
                        </label>
                        <label className="custom-radio">
                          <input type="radio" name="radio" />
                          <span className="checkmark" />
                          Second Half
                        </label>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">No of Days</label>
                      <input type="text" className="form-control" />
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Reason</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Link to="#" className="btn btn-light me-2" data-bs-dismiss="modal">
                  Cancel
                </Link>
                <Link to="#" data-bs-dismiss="modal" className="btn btn-primary">
                  Apply Leave
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Apply Leave */}
    </>
  );
};

export default TeacherModal;