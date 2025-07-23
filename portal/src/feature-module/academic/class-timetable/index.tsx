import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Toaster, toast } from "react-hot-toast";
import { Table, Alert, Spin } from "antd";
import "antd/dist/reset.css";
import { useAuth } from "../../../context/AuthContext";
import { all_routes } from "../../router/all_routes";
import TooltipOption from "../../../core/common/tooltipOption";

interface Class {
  _id: string;
  name: string;
  teacherId: { _id: string; name: string; email: string }[];
  sessionId: { _id: string; name: string; sessionId: string };
}

interface TimetableSlot {
  plannerHead: string;
  name: string;
  _id?: string;
}

interface DayTimetable {
  day: string;
  date: string;
  slots: TimetableSlot[];
}

interface WeeklyTimetable {
  _id?: string;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  days: DayTimetable[];
}

const plannerHeads = [
  "Circle Time",
  "Large Group",
  "Play Time",
  "Small Group",
  "Exploring Time",
  "Concept",
  "Activity",
  "Worksheet",
  "Workbook",
  "Holiday",
  "Hindi",
  "Other",
];

const ClassTimetable = () => {
  const routes = all_routes;
  const { token, user } = useAuth();
  const apiBaseUrl = process.env.REACT_APP_URL;
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
  const [timetables, setTimetables] = useState<WeeklyTimetable[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [modalClass, setModalClass] = useState<string>("");
  const [modalMonth, setModalMonth] = useState<Date | null>(new Date());
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [weeklyData, setWeeklyData] = useState<DayTimetable[]>([
    { day: "Monday", date: "", slots: [{ plannerHead: "", name: "" }] },
    { day: "Tuesday", date: "", slots: [{ plannerHead: "", name: "" }] },
    { day: "Wednesday", date: "", slots: [{ plannerHead: "", name: "" }] },
    { day: "Thursday", date: "", slots: [{ plannerHead: "", name: "" }] },
    { day: "Friday", date: "", slots: [{ plannerHead: "", name: "" }] },
  ]);
  const [modalData, setModalData] = useState<{ [weekNumber: number]: DayTimetable[] }>({});
  const [editSlot, setEditSlot] = useState<{
    timetableId?: string;
    dayIndex: number;
    slotIndex: number;
    plannerHead: string;
    name: string;
    _id?: string;
  } | null>(null);
  const [deleteSlot, setDeleteSlot] = useState<{
    timetableId?: string;
    dayIndex: number;
    slotIndex: number;
    _id?: string;
  } | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        setUserRole(decodedToken.role);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [token]);

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
  }, [userRole, token, apiBaseUrl]);

  useEffect(() => {
  const fetchTimetables = async () => {
    if (!selectedClass || !selectedMonth) return;
    setLoading(true);
    try {
      const weeks: WeeklyTimetable[] = [];
      const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const lastDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      const monthStart = firstDayOfMonth.getTime();
      const monthEnd = lastDayOfMonth.getTime();

      const numWeeks = Math.ceil((lastDayOfMonth.getDate() + (firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1)) / 7);

      let weekNumberCounter = 1;

      for (let i = 0; i < numWeeks; i++) {
        // Calculate weekStart and adjust for IST
        const weekStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1 + i * 7);
        const istOffset = 5.5 * 60 * 60 * 1000; // IST offset (+5:30)
        weekStart.setTime(weekStart.getTime() + istOffset);
        // Adjust to Monday of the week (IST)
        const dayOfWeek = weekStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
        weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        weekStart.setUTCHours(0, 0, 0, 0); // Normalize to midnight IST
        const weekEnd = new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000);

        const weekStartTime = weekStart.getTime();
        const weekEndTime = weekEnd.getTime();
        const overlaps = weekStartTime <= monthEnd && weekEndTime >= monthStart;

        if (!overlaps) {
          console.log(`Skipping week ${weekStart.toISOString().split("T")[0]} - ${weekEnd.toISOString().split("T")[0]}`);
          continue;
        }

        try {
          const response = await axios.get(
            `${apiBaseUrl}/api/timetable/${selectedClass}/${weekStart.toISOString().split("T")[0]}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const timetable = response.data;
          weeks.push({
            _id: timetable._id,
            weekNumber: weekNumberCounter++,
            weekStartDate: weekStart.toISOString().split("T")[0],
            weekEndDate: weekEnd.toISOString().split("T")[0],
            days: timetable.days.map((day: any) => ({
              day: day.day,
              date: day.date,
              slots: day.slots.map((slot: any) => ({
                plannerHead: slot.activity,
                name: slot.description,
                _id: slot._id,
              })),
            })),
          });
        } catch (error) {
          weeks.push({
            weekNumber: weekNumberCounter++,
            weekStartDate: weekStart.toISOString().split("T")[0],
            weekEndDate: weekEnd.toISOString().split("T")[0],
            days: [
              { day: "Monday", date: weekStart.toISOString().split("T")[0], slots: [] },
              { day: "Tuesday", date: new Date(weekStart.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], slots: [] },
              { day: "Wednesday", date: new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], slots: [] },
              { day: "Thursday", date: new Date(weekStart.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], slots: [] },
              { day: "Friday", date: new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], slots: [] },
            ],
          });
        }
      }
      setTimetables(weeks);
      setModalData({});
    } catch (error) {
      console.error("Error fetching timetables:", error);
    } finally {
      setLoading(false);
    }
  };
  fetchTimetables();
}, [selectedClass, selectedMonth, token, apiBaseUrl]);
  useEffect(() => {
    if (isModalVisible) {
      setModalData((prev) => ({
        ...prev,
        [selectedWeek]: weeklyData,
      }));
      console.log(`Updated modalData for Week ${selectedWeek}:`, weeklyData);
    }
  }, [weeklyData, selectedWeek, isModalVisible]);

  const handleModalOpen = (weekNumber: number) => {
    console.log(`Opening modal for Week ${weekNumber}, current modalData:`, modalData);
    setSelectedWeek(weekNumber);
    setModalClass(selectedClass);
    setModalMonth(selectedMonth);

    if (modalData[weekNumber]) {
      console.log(`Loading from modalData for Week ${weekNumber}:`, modalData[weekNumber]);
      setWeeklyData(modalData[weekNumber]);
    } else {
      const week = timetables.find((t) => t.weekNumber === weekNumber);
      if (week) {
        console.log(`Loading from timetables for Week ${weekNumber}:`, week.days);
        setWeeklyData(
          week.days.map((day) => ({
            ...day,
            slots: day.slots.length > 0 ? day.slots : [{ plannerHead: "", name: "" }],
          }))
        );
      } else {
        console.log(`Loading default data for Week ${weekNumber}`);
        setWeeklyData([
          { day: "Monday", date: "", slots: [{ plannerHead: "", name: "" }] },
          { day: "Tuesday", date: "", slots: [{ plannerHead: "", name: "" }] },
          { day: "Wednesday", date: "", slots: [{ plannerHead: "", name: "" }] },
          { day: "Thursday", date: "", slots: [{ plannerHead: "", name: "" }] },
          { day: "Friday", date: "", slots: [{ plannerHead: "", name: "" }] },
        ]);
      }
    }
    setIsModalVisible(true);
  };

  const handleAddSlot = (dayIndex: number) => {
    setWeeklyData((prev) => {
      const newData = [...prev];
      newData[dayIndex].slots.push({ plannerHead: "", name: "" });
      console.log(`Added slot for Week ${selectedWeek}, Day ${dayIndex}:`, newData);
      return newData;
    });
  };

  const handleDeleteSlot = async (timetableId: string, dayIndex: number, slotIndex: number) => {
    if (weeklyData[dayIndex].slots.length <= 1) {
      console.log(`Cannot delete last slot for Week ${selectedWeek}, Day ${dayIndex}`);
      toast.error("At least one slot is required per day.");
      setDeleteSlot(null);
      return;
    }

    try {
      const response = await axios.delete(`${apiBaseUrl}/api/timetable/slot`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { timetableId, dayIndex, slotIndex },
      });

      setTimetables((prev) =>
        prev.map((week) =>
          week._id === timetableId
            ? {
                ...week,
                days: response.data.days.map((day: any) => ({
                  day: day.day,
                  date: day.date,
                  slots: day.slots.map((slot: any) => ({
                    plannerHead: slot.activity,
                    name: slot.description,
                    _id: slot._id,
                  })),
                })),
              }
            : week
        )
      );

      setWeeklyData((prev) => {
        const newData = [...prev];
        newData[dayIndex].slots = newData[dayIndex].slots.filter((_, i) => i !== slotIndex);
        return newData;
      });

      toast.success("Slot deleted successfully!");
      setDeleteSlot(null);
    } catch (error) {
      console.error("Error deleting slot:", error);
      toast.error("Failed to delete slot.");
      setDeleteSlot(null);
    }
  };

  const handleEditSlot = (timetableId: string, dayIndex: number, slotIndex: number, slot: TimetableSlot) => {
    console.log(`Opening edit modal for slot in Week ${selectedWeek}, Day ${dayIndex}, Slot ${slotIndex}`);
    setEditSlot({ timetableId, dayIndex, slotIndex, ...slot });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSlot || !editSlot.timetableId) return;

    try {
      setLoading(true);
      const response = await axios.put(
        `${apiBaseUrl}/api/timetable/slot`,
        {
          timetableId: editSlot.timetableId,
          dayIndex: editSlot.dayIndex,
          slotIndex: editSlot.slotIndex,
          description: editSlot.name,
          activity: editSlot.plannerHead,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTimetables((prev) =>
        prev.map((week) =>
          week._id === editSlot.timetableId
            ? {
                ...week,
                days: response.data.days.map((day: any) => ({
                  day: day.day,
                  date: day.date,
                  slots: day.slots.map((slot: any) => ({
                    plannerHead: slot.activity,
                    name: slot.description,
                    _id: slot._id,
                  })),
                })),
              }
            : week
        )
      );

      setWeeklyData((prev) => {
        const newData = [...prev];
        newData[editSlot.dayIndex].slots[editSlot.slotIndex] = {
          plannerHead: editSlot.plannerHead,
          name: editSlot.name,
          _id: editSlot._id,
        };
        return newData;
      });

      toast.success("Slot updated successfully!");
      setEditSlot(null);
    } catch (error) {
      console.error("Error updating slot:", error);
      toast.error("Failed to update slot.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (editSlot) {
      setEditSlot({ ...editSlot, [field]: value });
    }
  };

  const handleModalInputChange = (dayIndex: number, slotIndex: number, field: string, value: string) => {
    setWeeklyData((prev) => {
      const newData = [...prev];
      newData[dayIndex].slots[slotIndex] = { ...newData[dayIndex].slots[slotIndex], [field]: value };
      console.log(`Updated ${field} for Week ${selectedWeek}, Day ${dayIndex}, Slot ${slotIndex}:`, newData);
      return newData;
    });
  };

  const handleSubmitTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalClass) {
      toast.error("Please select a class.");
      return;
    }
    if (!modalMonth) {
      toast.error("Please select a month.");
      return;
    }

    const decodedToken = token ? JSON.parse(atob(token.split(".")[1])) : null;
    const teacherId = decodedToken?.userId;

    if (!teacherId) {
      toast.error("Unable to determine user ID. Please log in again.");
      return;
    }

    setLoading(true);
    let allSaved = true;
    const newTimetables = [...timetables];
    const newModalData = { ...modalData };
    const weeksToSave = Object.keys(modalData).map(Number);

    for (const weekNumber of weeksToSave) {
      const weekData = modalData[weekNumber];
      const hasValidSlots = weekData.some((day) =>
        day.slots.some((slot) => slot.plannerHead || slot.name)
      );
      if (!hasValidSlots) {
        console.log(`Skipping Week ${weekNumber}: No valid slots`);
        continue;
      }

      const week = timetables.find((t) => t.weekNumber === weekNumber) || {
        weekNumber,
        weekStartDate: new Date(modalMonth.getFullYear(), modalMonth.getMonth(), 1 + (weekNumber - 1) * 7).toISOString().split("T")[0],
        weekEndDate: new Date(modalMonth.getFullYear(), modalMonth.getMonth(), 5 + (weekNumber - 1) * 7).toISOString().split("T")[0],
        days: weekData,
      };

      const timetablePayload = {
        classId: modalClass,
        weekStartDate: week.weekStartDate,
        weekEndDate: week.weekEndDate,
        days: weekData.map((day) => ({
          day: day.day,
          date: day.date || new Date(new Date(week.weekStartDate).getTime() + ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].indexOf(day.day) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          slots: day.slots
            .filter((slot) => slot.plannerHead || slot.name)
            .map((slot) => ({
              description: slot.name,
              activity: slot.plannerHead,
              teacherId,
              _id: slot._id,
            })),
        })),
      };

      try {
        console.log(`Saving timetable for Week ${weekNumber}:`, timetablePayload);
        const response = await axios.post(`${apiBaseUrl}/api/timetable`, timetablePayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const weekIndex = newTimetables.findIndex((t) => t.weekNumber === weekNumber);
        const updatedWeek = {
          ...week,
          _id: response.data._id,
          days: response.data.days.map((day: any) => ({
            day: day.day,
            date: day.date,
            slots: day.slots.map((slot: any) => ({
              plannerHead: slot.activity,
              name: slot.description,
              _id: slot._id,
            })),
          })),
        };
        if (weekIndex !== -1) {
          newTimetables[weekIndex] = updatedWeek;
        } else {
          newTimetables.push(updatedWeek);
        }
        delete newModalData[weekNumber];
        console.log(`Successfully saved Week ${weekNumber}`);
      } catch (error) {
        console.error(`Error saving timetable for Week ${weekNumber}:`, error);
        toast.error(`Failed to save timetable for Week ${weekNumber}.`);
        allSaved = false;
      }
    }

    if (allSaved && weeksToSave.length > 0) {
      setTimetables(newTimetables.sort((a, b) => a.weekNumber - b.weekNumber));
      setModalData(newModalData);
      setSelectedMonth(modalMonth);
      setIsModalVisible(false);
      toast.success("All timetables successfully saved!");
    } else if (weeksToSave.length === 0) {
      toast.error("No valid data to save.");
    }
    setLoading(false);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setModalData({});
    setEditSlot(null);
    setDeleteSlot(null);
    console.log("Modal closed, cleared modalData");
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
  };

  const formatDayDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getTableColumns = (weekNumber: number) => [
    {
      title: "Slot",
      dataIndex: "slot",
      key: "slot",
      render: (_: any, __: any, index: number) => `Slot ${index + 1}`,
      width: 100,
    },
    ...(timetables
      .find((t) => t.weekNumber === weekNumber)
      ?.days.map((day, dayIndex) => ({
        title: (
          <div>
            {day.day}
            <br />
            <small>{formatDayDate(day.date)}</small>
          </div>
        ),
        dataIndex: day.day,
        key: day.day,
        render: (_: any, record: any) => {
          const slot = record[day.day];
          const timetableId = timetables.find((t) => t.weekNumber === weekNumber)?._id;
          return slot ? (
            <div>
              <p style={{ margin: "0 0 4px", color: "#333" }}>
                <strong>{slot.plannerHead}</strong>
              </p>
              <p style={{ margin: "0 0 4px", color: "#333" }}>
                {slot.name}
              </p>
              {userRole !== "parent" && timetableId && (
                <div style={{ marginTop: "8px" }}>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    data-bs-toggle="modal"
                    data-bs-target="#edit_slot"
                    onClick={() => {
                      const slotIndex = record.key;
                      handleEditSlot(timetableId, dayIndex, slotIndex, slot);
                    }}
                  >
                    <i className="ti ti-edit me-1" /> Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    data-bs-toggle="modal"
                    data-bs-target="#delete_slot"
                    onClick={() => {
                      const slotIndex = record.key;
                      console.log(`Opening delete modal for slot in Week ${weekNumber}, Day ${dayIndex}, Slot ${slotIndex}`);
                      setDeleteSlot({ timetableId, dayIndex, slotIndex, _id: slot._id });
                    }}
                  >
                    <i className="ti ti-trash me-1" /> Delete
                  </button>
                </div>
              )}
            </div>
          ) : (
            "-"
          );
        },
      })) || []),
  ];

  const getTableDataSource = (weekNumber: number) => {
    const week = timetables.find((t) => t.weekNumber === weekNumber);
    if (!week?.days || week.days.length === 0) return [];
    
    const maxSlots = Math.max(...week.days.map((day) => day.slots.length));
    const rows = [];
    for (let i = 0; i < maxSlots; i++) {
      const row: any = { key: i };
      week.days.forEach((day) => {
        row[day.day] = day.slots[i] || null;
      });
      rows.push(row);
    }
    return rows;
  };

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="page-wrapper">
        <div className="content content-two">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Monthly Planner</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to={routes.adminDashboard}>Dashboard</Link></li>
                  <li className="breadcrumb-item">Academic</li>
                  <li className="breadcrumb-item active" aria-current="page">Planner</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              {/* <TooltipOption /> */}
              <div className="mb-2">
                <Link
                  to="#"
                  className="btn btn-primary d-flex align-items-center"
                  data-bs-toggle="modal"
                  data-bs-target="#add_time_table"
                  onClick={() => handleModalOpen(timetables.length > 0 ? timetables[0].weekNumber : 1)}
                >
                  <i className="ti ti-square-rounded-plus me-2" /> Add Planner
                </Link>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Monthly Planner</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="mb-3 me-2">
                  <label className="form-label">Select Month</label>
                  <DatePicker
                    selected={selectedMonth}
                    onChange={(date: Date) => setSelectedMonth(date)}
                    className="form-control"
                    dateFormat="MMMM yyyy"
                    showMonthYearPicker
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
              <Spin spinning={loading}>
                {timetables.map((week) => (
                  <div key={week.weekNumber} className="mb-4">
                    <h5>{formatDateRange(week.weekStartDate, week.weekEndDate)}</h5>
                    {week.days && week.days.length > 0 ? (
                      <div className="table-responsive">
                        <Table
                          columns={getTableColumns(week.weekNumber)}
                          dataSource={getTableDataSource(week.weekNumber)}
                          pagination={false}
                          bordered
                          rowKey="key"
                          scroll={{ x: true }}
                        />
                      </div>
                    ) : (
                      <Alert
                        message={`No Timetable found for ${formatDateRange(week.weekStartDate, week.weekEndDate)}`}
                        type="error"
                        showIcon
                        className="mx-3"
                      />
                    )}
                    {userRole !== "parent" && (
                      <Link
                        to="#"
                        className="btn btn-primary mt-2"
                        data-bs-toggle="modal"
                        data-bs-target="#add_time_table"
                        onClick={() => handleModalOpen(week.weekNumber)}
                      >
                        Edit {formatDateRange(week.weekStartDate, week.weekEndDate)}
                      </Link>
                    )}
                  </div>
                ))}
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
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={handleModalClose}>
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmitTimetable}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-4">
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
                  <div className="col-lg-4">
                    <div className="mb-3">
                      <label className="form-label">Month</label>
                      <DatePicker
                        selected={modalMonth}
                        onChange={(date: Date) => setModalMonth(date)}
                        className="form-control"
                        dateFormat="MMMM yyyy"
                        showMonthYearPicker
                      />
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-3">
                      <label className="form-label">Week</label>
                      <select
                        className="form-control"
                        value={selectedWeek}
                        onChange={(e) => handleModalOpen(Number(e.target.value))}
                      >
                        {timetables.map((week) => (
                          <option key={week.weekNumber} value={week.weekNumber}>
                            {formatDateRange(week.weekStartDate, week.weekEndDate)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="add-more-timetable">
                  <ul className="tab-links nav nav-pills" id="pills-tab2" role="tablist">
                    {weeklyData.map((day, index) => (
                      <li
                        key={day.day}
                        className={`nav-link ${index === 0 ? "active" : ""}`}
                        id={`pills-${day.day.toLowerCase()}-tab`}
                        data-bs-toggle="pill"
                        data-bs-target={`#pills-${day.day.toLowerCase()}`}
                        role="tab"
                        aria-controls={`pills-${day.day.toLowerCase()}`}
                        aria-selected={index === 0}
                      >
                        <Link to="#">
                          {day.day} <br />
                          <small>{formatDayDate(day.date)}</small>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="tab-content pt-0 dashboard-tab">
                    {weeklyData.map((day, dayIndex) => (
                      <div
                        key={day.day}
                        className={`tab-pane fade ${day.day === "Monday" ? "show active" : ""}`}
                        id={`pills-${day.day.toLowerCase()}`}
                        role="tabpanel"
                        aria-labelledby={`pills-${day.day.toLowerCase()}-tab`}
                      >
                        {day.slots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="add-timetable-row">
                            <div className="row timetable-count">
                              <div className="col-lg-6">
                                <div className="mb-3">
                                  <label className="form-label">Planner Head</label>
                                  <select
                                    className="form-control"
                                    value={slot.plannerHead}
                                    onChange={(e) => handleModalInputChange(dayIndex, slotIndex, "plannerHead", e.target.value)}
                                  >
                                    <option value="">Select Planner Head</option>
                                    {plannerHeads.map((head) => (
                                      <option key={head} value={head}>
                                        {head}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="col-lg-6">
                                <div className="d-flex align-items-end">
                                  <div className="mb-3 flex-fill">
                                    <label className="form-label">Name</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={slot.name}
                                      onChange={(e) => handleModalInputChange(dayIndex, slotIndex, "name", e.target.value)}
                                      placeholder="Enter name"
                                    />
                                  </div>
                                  {day.slots.length > 1 && (
                                    <div className="mb-3 ms-2">
                                      <Link to="#" className="delete-time-table" onClick={() => {
                                        const timetableId = timetables.find((t) => t.weekNumber === selectedWeek)?._id;
                                        if (timetableId) {
                                          setDeleteSlot({ timetableId, dayIndex, slotIndex, _id: slot._id });
                                        }
                                      }}>
                                        <i className="ti ti-trash" />
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Link to="#" className="btn btn-primary add-new-timetable" onClick={() => handleAddSlot(dayIndex)}>
                          <i className="ti ti-square-rounded-plus-filled me-2" /> Add New
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Link to="#" className="btn btn-light me-2" data-bs-dismiss="modal" onClick={handleModalClose}>
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

      <div className="modal fade" id="edit_slot">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Slot</h4>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setEditSlot(null)}></button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Planner Head</label>
                  <select
                    className="form-control"
                    value={editSlot?.plannerHead || ""}
                    onChange={(e) => handleInputChange("plannerHead", e.target.value)}
                  >
                    <option value="">Select Planner Head</option>
                    {plannerHeads.map((head) => (
                      <option key={head} value={head}>
                        {head}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editSlot?.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter name"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal" onClick={() => setEditSlot(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal fade" id="delete_slot">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Delete Slot</h4>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setDeleteSlot(null)}></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this slot?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal" onClick={() => setDeleteSlot(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                data-bs-dismiss="modal"
                onClick={() => {
                  if (deleteSlot && deleteSlot.timetableId) {
                    handleDeleteSlot(deleteSlot.timetableId, deleteSlot.dayIndex, deleteSlot.slotIndex);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassTimetable;