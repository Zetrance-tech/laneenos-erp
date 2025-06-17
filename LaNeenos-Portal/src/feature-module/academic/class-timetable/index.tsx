import React, { useState, useEffect } from "react";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import TooltipOption from "../../../core/common/tooltipOption";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Toaster, toast } from "react-hot-toast";
import { Table, Alert, Spin, Tooltip } from "antd"; // Added Spin import
import "antd/dist/reset.css";
import { useAuth } from "../../../context/AuthContext";
interface Class {
  _id: string;
  id: string;
  name: string;
  teacherId: { _id: string; name: string; email: string }[];
  sessionId: { _id: string; name: string; sessionId: string };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface TimetableSlot {
  subject: string;
  description: string;
}

const ClassTimetable = () => {
  const routes = all_routes;
  const [timetableData, setTimetableData] = useState<any>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // Added loading state

  const [modalClass, setModalClass] = useState<string>("");
  const [modalWeekStart, setModalWeekStart] = useState<Date | null>(null);
  const [mondayContents, setMondayContents] = useState<TimetableSlot[]>([{ subject: "", description: "" }]);
  const [tuesdayContents, setTuesdayContents] = useState<TimetableSlot[]>([{ subject: "", description: "" }]);
  const [wednesdayContents, setWednesdayContents] = useState<TimetableSlot[]>([{ subject: "", description: "" }]);
  const [thursdayContents, setThursdayContents] = useState<TimetableSlot[]>([{ subject: "", description: "" }]);
  const [fridayContents, setFridayContents] = useState<TimetableSlot[]>([{ subject: "", description: "" }]);
  const { token, user } = useAuth();
  const apiBaseUrl = process.env.REACT_APP_URL;

  const getCurrentWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    return new Date(today.setDate(diff));
  };

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        setUserRole(decodedToken.role);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const endpoint = userRole === "admin" ? "api/class" : "api/class/teacher";
        const response = await axios.get(`${apiBaseUrl}/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses(response.data);
        if (response.data.length > 0) setSelectedClass(response.data[0]._id);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };
    if (userRole) fetchClasses();
  }, [userRole]);

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!selectedClass || !selectedWeekStart) return;
      try {
        setLoading(true); // Set loading to true before fetching
        const weekStartString = selectedWeekStart.toISOString().split("T")[0];
        const response = await axios.get(`${apiBaseUrl}/api/timetable/${selectedClass}/${weekStartString}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTimetableData(response.data);
      } catch (error) {
        console.error("Error fetching planner:", error);
        setTimetableData(null);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };
    fetchTimetable();
  }, [selectedClass, selectedWeekStart]);

  useEffect(() => {
    setSelectedWeekStart(getCurrentWeekStart());
  }, []);

  const handleModalOpen = async () => {
    if (!modalClass || !modalWeekStart) {
      setModalClass(selectedClass);
      setModalWeekStart(selectedWeekStart);
    }

    setMondayContents([{ subject: "", description: "" }]);
    setTuesdayContents([{ subject: "", description: "" }]);
    setWednesdayContents([{ subject: "", description: "" }]);
    setThursdayContents([{ subject: "", description: "" }]);
    setFridayContents([{ subject: "", description: "" }]);

    if (modalClass && modalWeekStart) {
      try {
        setLoading(true); // Set loading to true before fetching
        const weekStartString = modalWeekStart.toISOString().split("T")[0];
        const response = await axios.get(`${apiBaseUrl}/api/timetable/${modalClass}/${weekStartString}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        if (data && data.days) {
          const daysMap = {
            Monday: setMondayContents,
            Tuesday: setTuesdayContents,
            Wednesday: setWednesdayContents,
            Thursday: setThursdayContents,
            Friday: setFridayContents,
          };

          data.days.forEach((day: any) => {
            const slots = day.slots.map((s: any) => ({
              subject: s.activity,
              description: s.description,
            }));
            const setter = daysMap[day.day as keyof typeof daysMap];
            if (setter && slots.length > 0) {
              setter(slots);
            }
          });
        }
      } catch (error) {
        console.error("No existing planner found for this week:", error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    }
  };

  const addContent = (setter: React.Dispatch<React.SetStateAction<TimetableSlot[]>>) =>
    setter((prev) => [...prev, { subject: "", description: "" }]);

  const removeContent = (setter: React.Dispatch<React.SetStateAction<TimetableSlot[]>>, index: number) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<TimetableSlot[]>>, index: number, field: string, value: string) => {
    setter((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmitTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalClass || !modalWeekStart) {
      toast.error("Please select a class and week start date.");
      return;
    }

    const decodedToken = token ? JSON.parse(atob(token.split(".")[1])) : null;
    const teacherId = decodedToken?.userId;

    if (!teacherId) {
      toast.error("Unable to determine user ID. Please log in again.");
      return;
    }

    const weekStart = new Date(modalWeekStart);
    const timetablePayload = {
      classId: modalClass,
      weekStartDate: weekStart.toISOString().split("T")[0],
      weekEndDate: new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      days: [
        {
          day: "Monday",
          date: weekStart.toISOString().split("T")[0],
          slots: mondayContents.map((c) => ({ description: c.description, activity: c.subject, teacherId })),
        },
        {
          day: "Tuesday",
          date: new Date(weekStart.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          slots: tuesdayContents.map((c) => ({ description: c.description, activity: c.subject, teacherId })),
        },
        {
          day: "Wednesday",
          date: new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          slots: wednesdayContents.map((c) => ({ description: c.description, activity: c.subject, teacherId })),
        },
        {
          day: "Thursday",
          date: new Date(weekStart.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          slots: thursdayContents.map((c) => ({ description: c.description, activity: c.subject, teacherId })),
        },
        {
          day: "Friday",
          date: new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          slots: fridayContents.map((c) => ({ description: c.description, activity: c.subject, teacherId })),
        },
      ],
    };

    try {
      setLoading(true); // Set loading to true before submitting
      const response = await axios.post(`${apiBaseUrl}/api/timetable`, timetablePayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimetableData(response.data);
      toast.success("Planner successfully saved!");
    } catch (error) {
      console.error("Error saving planner:", error);
      toast.error("Failed to save planner. Please try again.");
    } finally {
      setLoading(false); // Set loading to false after submitting
    }
  };

  const tableColumns = [
    {
      title: "Slot",
      dataIndex: "slot",
      key: "slot",
      render: (_: any, __: any, index: number) => `Slot ${index + 1}`,
      width: 100,
    },
    ...(timetableData?.days?.map((day: any) => ({
      title: day.day,
      dataIndex: day.day,
      key: day.day,
      render: (_: any, record: any) => {
        const slot = record[day.day];
        return slot ? (
          <div>
            <p style={{ margin: "0 0 4px", color: "#333" }}>
              <strong> {slot.activity}</strong>
            </p>
            <p style={{ margin: "0 0 4px", color: "#333" }}>
              {slot.description}
            </p>
            {/* <div style={{ background: "#fff", borderRadius: "4px", padding: "4px", marginTop: "8px" }}>
              {slot.teacherId?.name || "-"}
            </div> */}
          </div>
        ) : (
          "-"
        );
      },
    })) || []),
  ];

  const tableDataSource = (() => {
    if (!timetableData?.days || timetableData.days.length === 0) return [];
    const maxSlots = Math.max(...timetableData.days.map((day: any) => day.slots.length));
    const rows = [];
    for (let i = 0; i < maxSlots; i++) {
      const row: any = { key: i };
      timetableData.days.forEach((day: any) => {
        row[day.day] = day.slots[i] || null;
      });
      rows.push(row);
    }
    return rows;
  })();

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="page-wrapper">
        <div className="content content-two">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Planner</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to={routes.adminDashboard}>Dashboard</Link></li>
                  <li className="breadcrumb-item">Academic</li>
                  <li className="breadcrumb-item active" aria-current="page">Planner</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption/>
              <div className="mb-2">
                <Link
                  to="#"
                  className="btn btn-primary d-flex align-items-center"
                  data-bs-toggle="modal"
                  data-bs-target="#add_time_table"
                  onClick={handleModalOpen}
                >
                  <i className="ti ti-square-rounded-plus me-2" /> Add Planner
                </Link>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Planner</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="mb-3 me-2">
                  <label className="form-label">Select Week</label>
                  <DatePicker
                    selected={selectedWeekStart}
                    onChange={(date: Date) => {
                      const dayOfWeek = date.getDay();
                      const monday = new Date(date);
                      monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                      setSelectedWeekStart(monday);
                    }}
                    className="form-control"
                    dateFormat="MMMM d, yyyy"
                    showWeekNumbers
                    filterDate={(date) => date.getDay() === 1}
                  />
                </div>
                <div className="mb-3 me-2">
                  <label className="form-label">Class</label>
                  <select
                    className="form-control"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {classes.map((classObj) => (
                      <option key={classObj._id} value={classObj._id}>
                        {classObj.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="card-body pb-0">
              <Spin spinning={loading}> {/* Added Spin component */}
                {timetableData && timetableData.days && timetableData.days.length > 0 ? (
                  <div className="table-responsive">
                    <Table
                      columns={tableColumns}
                      dataSource={tableDataSource}
                      pagination={false}
                      bordered
                      rowKey="key"
                      scroll={{ x: true }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Alert
                      message="No Timetable found for this date"
                      type="error"
                      showIcon
                      className="mx-3"
                    />
                  </div>
                )}
              </Spin>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="add_time_table">
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Planner</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmitTimetable}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Class</label>
                      <select
                        className="form-control"
                        value={modalClass}
                        onChange={(e) => setModalClass(e.target.value)}
                      >
                        <option value="">Select Class</option>
                        {classes.map((classObj) => (
                          <option key={classObj._id} value={classObj._id}>
                            {classObj.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Week Start Date</label>
                      <DatePicker
                        selected={modalWeekStart}
                        onChange={(date: Date) => {
                          const dayOfWeek = date.getDay();
                          const monday = new Date(date);
                          monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                          setModalWeekStart(monday);
                          handleModalOpen();
                        }}
                        className="form-control"
                        dateFormat="MMMM d, yyyy"
                        showWeekNumbers
                        filterDate={(date) => date.getDay() === 1}
                      />
                    </div>
                  </div>
                </div>
                <div className="add-more-timetable">
                  <ul className="tab-links nav nav-pills" id="pills-tab2" role="tablist">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => (
                      <li
                        key={day}
                        className={`nav-link ${index === 0 ? "active" : ""}`}
                        id={`pills-${day.toLowerCase()}-tab`}
                        data-bs-toggle="pill"
                        data-bs-target={`#pills-${day.toLowerCase()}`}
                        role="tab"
                        aria-controls={`pills-${day.toLowerCase()}`}
                        aria-selected={index === 0}
                      >
                        <Link to="#">{day}</Link>
                      </li>
                    ))}
                  </ul>
                  <div className="tab-content pt-0 dashboard-tab">
                    <div className="tab-pane fade show active" id="pills-monday" role="tabpanel" aria-labelledby="pills-monday-tab">
                      {mondayContents.map((content, index) => (
                        <div key={index} className="add-timetable-row">
                          <div className="row timetable-count">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">Subject</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={content.subject}
                                  onChange={(e) => handleInputChange(setMondayContents, index, "subject", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="d-flex align-items-end">
                                <div className="mb-3 flex-fill">
                                  <label className="form-label">Description</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={content.description}
                                    onChange={(e) => handleInputChange(setMondayContents, index, "description", e.target.value)}
                                  />
                                </div>
                                {mondayContents.length > 1 && (
                                  <div className="mb-3 ms-2">
                                    <Link to="#" className="delete-time-table" onClick={() => removeContent(setMondayContents, index)}>
                                      <i className="ti ti-trash" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link to="#" className="btn btn-primary add-new-timetable" onClick={() => addContent(setMondayContents)}>
                        <i className="ti ti-square-rounded-plus-filled me-2" /> Add New
                      </Link>
                    </div>

                    <div className="tab-pane fade" id="pills-tuesday" role="tabpanel" aria-labelledby="pills-tuesday-tab">
                      {tuesdayContents.map((content, index) => (
                        <div key={index} className="add-timetable-row">
                          <div className="row timetable-count">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">Subject</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={content.subject}
                                  onChange={(e) => handleInputChange(setTuesdayContents, index, "subject", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="d-flex align-items-end">
                                <div className="mb-3 flex-fill">
                                  <label className="form-label">Description</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={content.description}
                                    onChange={(e) => handleInputChange(setTuesdayContents, index, "description", e.target.value)}
                                  />
                                </div>
                                {tuesdayContents.length > 1 && (
                                  <div className="mb-3 ms-2">
                                    <Link to="#" className="delete-time-table" onClick={() => removeContent(setTuesdayContents, index)}>
                                      <i className="ti ti-trash" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link to="#" className="btn btn-primary add-new-timetable" onClick={() => addContent(setTuesdayContents)}>
                        <i className="ti ti-square-rounded-plus-filled me-2" /> Add New
                      </Link>
                    </div>

                    <div className="tab-pane fade" id="pills-wednesday" role="tabpanel" aria-labelledby="pills-wednesday-tab">
                      {wednesdayContents.map((content, index) => (
                        <div key={index} className="add-timetable-row">
                          <div className="row timetable-count">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">Subject</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={content.subject}
                                  onChange={(e) => handleInputChange(setWednesdayContents, index, "subject", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="d-flex align-items-end">
                                <div className="mb-3 flex-fill">
                                  <label className="form-label">Description</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={content.description}
                                    onChange={(e) => handleInputChange(setWednesdayContents, index, "description", e.target.value)}
                                  />
                                </div>
                                {wednesdayContents.length > 1 && (
                                  <div className="mb-3 ms-2">
                                    <Link to="#" className="delete-time-table" onClick={() => removeContent(setWednesdayContents, index)}>
                                      <i className="ti ti-trash" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link to="#" className="btn btn-primary add-new-timetable" onClick={() => addContent(setWednesdayContents)}>
                        <i className="ti ti-square-rounded-plus-filled me-2" /> Add New
                      </Link>
                    </div>

                    <div className="tab-pane fade" id="pills-thursday" role="tabpanel" aria-labelledby="pills-thursday-tab">
                      {thursdayContents.map((content, index) => (
                        <div key={index} className="add-timetable-row">
                          <div className="row timetable-count">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">Subject</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={content.subject}
                                  onChange={(e) => handleInputChange(setThursdayContents, index, "subject", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="d-flex align-items-end">
                                <div className="mb-3 flex-fill">
                                  <label className="form-label">Description</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={content.description}
                                    onChange={(e) => handleInputChange(setThursdayContents, index, "description", e.target.value)}
                                  />
                                </div>
                                {thursdayContents.length > 1 && (
                                  <div className="mb-3 ms-2">
                                    <Link to="#" className="delete-time-table" onClick={() => removeContent(setThursdayContents, index)}>
                                      <i className="ti ti-trash" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link to="#" className="btn btn-primary add-new-timetable" onClick={() => addContent(setThursdayContents)}>
                        <i className="ti ti-square-rounded-plus-filled me-2" /> Add New
                      </Link>
                    </div>

                    <div className="tab-pane fade" id="pills-friday" role="tabpanel" aria-labelledby="pills-friday-tab">
                      {fridayContents.map((content, index) => (
                        <div key={index} className="add-timetable-row">
                          <div className="row timetable-count">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label">Subject</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={content.subject}
                                  onChange={(e) => handleInputChange(setFridayContents, index, "subject", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="d-flex align-items-end">
                                <div className="mb-3 flex-fill">
                                  <label className="form-label">Description</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={content.description}
                                    onChange={(e) => handleInputChange(setFridayContents, index, "description", e.target.value)}
                                  />
                                </div>
                                {fridayContents.length > 1 && (
                                  <div className="mb-3 ms-2">
                                    <Link to="#" className="delete-time-table" onClick={() => removeContent(setFridayContents, index)}>
                                      <i className="ti ti-trash" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link to="#" className="btn btn-primary add-new-timetable" onClick={() => addContent(setFridayContents)}>
                        <i className="ti ti-square-rounded-plus-filled me-2" /> Add New
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Link to="#" className="btn btn-light me-2" data-bs-dismiss="modal">
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">
                  Add Planner
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassTimetable;