import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import StudentModals from "../studentModals";
import StudentSidebar from "./studentSidebar";
import StudentBreadcrumb from "./studentBreadcrumb";
import { useAuth } from "../../../../context/AuthContext";
// Interfaces
interface Student {
  _id: string;
  classId: string;
}
const API_URL = process.env.REACT_APP_URL;

interface TimetableSlot {
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "09:30"
  activity: string; // e.g., "Circle Time"
  teacherId?: { _id: string; name: string };
  status?: string;
  notes?: string;
  _id?: string;
}

interface TimetableDay {
  day: string;
  date: string;
  slots: TimetableSlot[];
}

interface Timetable {
  _id: string;
  classId: string;
  weekStartDate: string;
  weekEndDate: string;
  days: TimetableDay[];
}

const StudentTimeTable: React.FC = () => {
  const routes = all_routes;
  const { admissionNumber } = useParams<{ admissionNumber: string }>();
  const {token} = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [weekStartDate, setWeekStartDate] = useState<Date>(
    () => {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(today.setDate(diff));
    }
  );
  const [error, setError] = useState<string | null>(null);

  // Fetch student data on mount
  useEffect(() => {
    console.log("useEffect: Checking token and admissionNumber");
    if (token && admissionNumber) {
      console.log("Calling fetchStudent with admissionNumber:", admissionNumber);
      fetchStudent();
    } else {
      setError("Missing token or admission number");
    }
  }, [token, admissionNumber]);

  // Fetch timetable when student or weekStartDate changes
  useEffect(() => {
    console.log("useEffect: Checking student and weekStartDate");
    console.log("student:", student);
    console.log("weekStartDate:", weekStartDate);
    if (student?.classId && weekStartDate) {
      console.log("Calling fetchTimetable");
      fetchTimetable();
    } else {
      console.log("Not calling fetchTimetable: Missing classId or weekStartDate");
    }
  }, [student, weekStartDate]);

  const fetchStudent = async () => {
    try {
      console.log("fetchStudent: Sending request");
      const response = await axios.get(
        `${API_URL}/api/student/admission/${admissionNumber}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("fetchStudent: Response:", response.data);
      setStudent(response.data);
      setError(null);
    } catch (error: any) {
      console.error("fetchStudent: Error:", error);
      setError(`Failed to fetch student data: ${error.message}`);
    }
  };

  const fetchTimetable = async () => {
    try {
      console.log("fetchTimetable: Starting");
      if (!weekStartDate) {
        console.log("fetchTimetable: No weekStartDate");
        setError("Please select a week start date");
        return;
      }
      const formattedWeekStartDate = weekStartDate.toISOString().split("T")[0];
      console.log(
        `fetchTimetable: Fetching for classId: ${student!.classId}, weekStartDate: ${formattedWeekStartDate}`
      );
      const response = await axios.get(
        `${API_URL}/api/timetable/${student!.classId}/${formattedWeekStartDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("fetchTimetable: Response:", response.data);
      setTimetable(response.data);
      setError(null);
    } catch (error: any) {
      console.error("fetchTimetable: Error:", error);
      setError(
        error.response?.status === 404
          ? "Timetable not found for this week"
          : `Failed to fetch timetable: ${error.message}`
      );
      setTimetable(null);
    }
  };

  const formatTime = (time: string) => {
    console.log("formatTime: Input:", time);
    if (/^\d{2}:\d{2}$/.test(time)) {
      const [hours, minutes] = time.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      const formatted = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      console.log("formatTime: Output:", formatted);
      return formatted;
    }
    console.log("formatTime: Invalid format, returning original:", time);
    return time;
  };

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
                        className="nav-link"
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
                        className="nav-link active"
                      >
                        <i className="ti ti-table-options me-2" />
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
                      <h4 className="mb-3">Planner</h4>
                      <div className="d-flex align-items-center flex-wrap">
                        <div className="mb-3">
                          <label className="form-label me-2">Week Starting:</label>
                          <DatePicker
                            selected={weekStartDate}
                            onChange={(date: Date) => {
                              console.log("DatePicker: New date:", date);
                              setWeekStartDate(date);
                            }}
                            dateFormat="yyyy-MM-dd"
                            className="form-control"
                            placeholderText="Select week start date"
                            showWeekNumbers
                            filterDate={(date) => date.getDay() === 1}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="card-body pb-0">
                      {error && (
                        <div className="alert alert-warning" role="alert">
                          {error}
                        </div>
                      )}
                      {timetable ? (
                        <div className="d-flex flex-nowrap overflow-auto">
                          {timetable.days.map((day, index) => (
                            <div
                              key={index}
                              className="d-flex flex-column me-4 flex-fill"
                            >
                              <div className="mb-3">
                                <h6>
                                  {day.day} (
                                  {new Date(day.date).toLocaleDateString()})
                                </h6>
                              </div>
                              {day.slots.map((slot, slotIndex) => (
                                <div
                                  key={slotIndex}
                                  className={`bg-transparent-${
                                    slot.activity.toLowerCase().includes("circle")
                                      ? "danger"
                                      : "pending"
                                  } rounded p-3 mb-4`}
                                >
                                  <p className="d-flex align-items-center text-nowrap mb-1">
                                    <i className="ti ti-clock me-1" />
                                    {formatTime(slot.startTime)} -{" "}
                                    {formatTime(slot.endTime)}
                                  </p>
                                  <p className="text-dark">
                                    Activity: {slot.activity}
                                  </p>
                                  <div className="bg-white rounded p-1 mt-3">
                                    <span className="text-muted d-flex align-items-center">
                                      <span className="avatar avatar-sm me-2">
                                        <ImageWithBasePath
                                          src="assets/img/teachers/teacher-07.jpg"
                                          alt="Teacher"
                                        />
                                      </span>
                                      {slot.teacherId?.name || "Not Assigned"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        !error && <p>Loading timetable...</p>
                      )}
                    </div>
                    {/* <div className="card-footer border-0 pb-0">
                      <div className="row">
                        <div className="col-lg-4 col-xxl-4 col-xl-4 d-flex">
                          <div className="card flex-fill">
                            
                          </div>
                        </div>
                      </div>
                    </div> */}
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

export default StudentTimeTable;