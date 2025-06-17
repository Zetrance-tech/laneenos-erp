import React, { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { Link } from "react-router-dom";
import CommonSelect from "../../core/common/commonSelect";
import {
  classes,
  eventCategory,
  sections,
} from "../../core/common/selectoption/selectoption";
import { DatePicker } from "antd";
import { all_routes } from "../router/all_routes";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { TimePicker } from "antd";
import axios from "axios";
import toast from "react-hot-toast";
import * as bootstrap from "bootstrap";
const API_URL = process.env.REACT_APP_URL;
interface EventDetails {
  _id?: string;
  eventFor: string;
  eventTitle: string;
  eventCategory: string;
  startDate: string;
  endDate: string;
  startTime1: string;
  endTime1: string;
  attachment?: string;
  message?: string;
  start: string; // For FullCalendar (ISO string)
  end: string;   // For FullCalendar (ISO string)
  title: string; // For FullCalendar
  backgroundColor?: string; // For FullCalendar
}

const Events = () => {
  const routes = all_routes;
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // To track if we're editing an event
  const [editEventId, setEditEventId] = useState<string | null>(null); // To store the ID of the event being edited
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [eventDetails, setEventDetailsModal] = useState<EventDetails | null>(null);
  const [formData, setFormData] = useState({
    eventFor: "All",
    eventTitle: "",
    eventCategory: eventCategory[0]?.value || "",
    startDate: null as Dayjs | null,
    endDate: null as Dayjs | null,
    startTime: null as Dayjs | null,
    endTime: null as Dayjs | null,
    message: "",
    attachment: "",
  });
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/events/get`,{
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const fetchedEvents = response.data.events.map((event: any) => {
        const eventData = {
          _id: event._id,
          eventFor: event.eventFor,
          eventTitle: event.eventTitle,
          eventCategory: event.eventCategory,
          start: event.startDate,
          end: event.endDate,
          attachment: event.attachment?.fileName || event.attachment,
          message: event.message,
          title: event.eventTitle, // For FullCalendar
          backgroundColor: getEventColor(event.eventCategory),
          startTime1: event.startTime,
          endTime1: event.endTime,
        };
        return eventData;
      });
      setEvents(fetchedEvents);

      // Force FullCalendar to re-render
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.removeAllEvents();
        calendarApi.addEventSource(fetchedEvents);
        calendarApi.refetchEvents();
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to fetch events");
    }
  };

  const normalizeTime = (time: string): string => {
    if (time.includes("PM") || time.includes("AM")) {
      return dayjs(`1970-01-01 ${time}`, "YYYY-MM-DD h:mm A").format("HH:mm");
    }
    return time.padStart(5, "0"); // Ensure "04:37" format
  };

  const getEventColor = (category: string) => {
    switch (category) {
      case "Celebration": return "#FDE9ED";
      case "Training": return "#E8F9E8";
      case "Meeting": return "#E7F1FC";
      case "Holidays": return "#FFE6E6";
      case "Camp": return "#E6F9FF";
      default: return "#E7F1FC";
    }
  };

  const handleDateClick = () => {
    setIsEditMode(false); // Reset to add mode
    setEditEventId(null);
    setShowAddEventModal(true);
  };

  const handleEventClick = (info: any) => {
    const event = events.find((e) => e._id === info.event.extendedProps?._id || e.eventTitle === info.event.title);
    if (event) {
      setEventDetailsModal(event);
      setShowEventDetailsModal(true);
    }
  };

  const handleAddEventClose = () => {
    setShowAddEventModal(false);
    resetForm();
    setIsEditMode(false);
    setEditEventId(null);
  };

  const handleEventDetailsClose = () => setShowEventDetailsModal(false);

  const resetForm = () => {
    setFormData({
      eventFor: "All",
      eventTitle: "",
      eventCategory: eventCategory[0]?.value || "",
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
      message: "",
      attachment: "",
    });
  };

  const onChangeDate = (name: "startDate" | "endDate", date: Dayjs | null) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const onChangeTime = (name: "startTime" | "endTime", time: Dayjs | null) => {
    setFormData((prev) => ({ ...prev, [name]: time }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        eventFor: formData.eventFor,
        eventTitle: formData.eventTitle,
        eventCategory: formData.eventCategory,
        startDate: formData.startDate?.toISOString(),
        endDate: formData.endDate?.toISOString(),
        startTime: formData.startTime?.format("HH:mm"),
        endTime: formData.endTime?.format("HH:mm"),
        message: formData.message,
        attachment: formData.attachment || undefined,
      };

      if (isEditMode && editEventId) {
        // Update event (PUT request)
        await axios.put(`${API_URL}/api/events/update/${editEventId}`, payload,{
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        toast.success("Event updated successfully!");
      } else {
        // Add new event (POST request)
        await axios.post(`${API_URL}/api/events/add`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        toast.success("Event added successfully!");
      }

      setShowAddEventModal(false);
      const addModal = document.getElementById("add-event-modal");
      if (addModal) {
        const modalInstance = bootstrap.Modal.getInstance(addModal);
        modalInstance?.hide();
      }
      resetForm();
      setIsEditMode(false);
      setEditEventId(null);
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(isEditMode ? "Failed to update event" : "Failed to add event");
    }
  };

  const handleEditEvent = () => {
    if (eventDetails) {
      setFormData({
        eventFor: eventDetails.eventFor,
        eventTitle: eventDetails.eventTitle,
        eventCategory: eventDetails.eventCategory,
        startDate: dayjs(eventDetails.start),
        endDate: dayjs(eventDetails.end),
        startTime: dayjs(eventDetails.startTime1, "HH:mm"),
        endTime: dayjs(eventDetails.endTime1, "HH:mm"),
        message: eventDetails.message || "",
        attachment: eventDetails.attachment || "",
      });
      setEditEventId(eventDetails._id || null);
      setIsEditMode(true);
      setShowEventDetailsModal(false);
      setShowAddEventModal(true);
    }
  };

  const handleDeleteEvent = async () => {
    if (eventDetails && eventDetails._id) {
      try {
        await axios.delete(`${API_URL}/api/events/delete/${eventDetails._id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        toast.success("Event deleted successfully!");
        setShowEventDetailsModal(false);
        fetchEvents();
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event");
      }
    }
  };

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="mb-1">Events</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">Announcement</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Events
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="pe-1 mb-2">
                <OverlayTrigger placement="top" overlay={<Tooltip>Refresh</Tooltip>}>
                  <Link
                    to="#"
                    className="btn btn-outline-light bg-white btn-icon me-1"
                    onClick={fetchEvents}
                  >
                    <i className="ti ti-refresh" />
                  </Link>
                </OverlayTrigger>
              </div>
              <div className="pe-1 mb-2">
                <OverlayTrigger placement="top" overlay={<Tooltip>Print</Tooltip>}>
                  <button type="button" className="btn btn-outline-light bg-white btn-icon me-1">
                    <i className="ti ti-printer" />
                  </button>
                </OverlayTrigger>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-8 col-xxl-9 theiaStickySidebar">
              <div className="stickybar">
                <div className="card">
                  <div className="card-body">
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      events={events}
                      headerToolbar={{
                        start: "title",
                        center: "dayGridMonth,dayGridWeek,dayGridDay",
                        end: "custombtn",
                      }}
                      customButtons={{
                        custombtn: {
                          text: "Add New Event",
                          click: handleDateClick,
                        },
                      }}
                      eventClick={handleEventClick}
                      ref={calendarRef}
                      eventDisplay="block"
                      eventTimeFormat={{
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }}
                      displayEventTime={true}
                      displayEventEnd={true}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-xxl-3 theiaStickySidebar">
              <div className="stickybar">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-3">Events</h5>
                  <div className="dropdown mb-3">
                    <ul className="dropdown-menu p-3">
                      {eventCategory.map((cat) => (
                        <li key={cat.value}>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1 d-flex align-items-center"
                          >
                            <i className={`ti ti-circle-filled fs-8 me-2 ${getCategoryClass(cat.value)}`} />
                            {cat.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {events.map((event) => (
                  <div
                    key={event._id}
                    className="border-start border-3 shadow-sm p-3 mb-3 bg-white"
                    style={{ borderColor: getEventColor(event.eventCategory) }}
                  >
                    <div className="d-flex align-items-center mb-3 pb-3 border-bottom">
                      <span className="avatar p-1 me-3 bg-primary-transparent flex-shrink-0">
                        <i className="ti ti-users-group text-info fs-20" />
                      </span>
                      <div className="flex-fill">
                        <h6 className="mb-1">{event.eventTitle}</h6>
                        <p className="fs-12">
                          <i className="ti ti-calendar me-1" />
                          {new Date(event.start).toLocaleDateString()} -{" "}
                          {new Date(event.end).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <p className="mb-0 fs-12">
                        <i className="ti ti-clock me-1" />
                        {event.startTime1} - {event.endTime1}
                      </p>
                      <div className="avatar-list-stacked avatar-group-sm">
                        <span className="avatar border-0">
                          <ImageWithBasePath
                            src="assets/img/parents/parent-01.jpg"
                            className="rounded"
                            alt="img"
                          />
                        </span>
                        <span className="avatar border-0">
                          <ImageWithBasePath
                            src="assets/img/parents/parent-02.jpg"
                            className="rounded"
                            alt="img"
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal show={showAddEventModal} onHide={handleAddEventClose} id="add-event-modal">
        <div className="modal-header">
          <h4 className="modal-title">{isEditMode ? "Edit Event" : "New Event"}</h4>
          <button
            type="button"
            className="btn-close custom-btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
            onClick={handleAddEventClose}
          >
            <i className="ti ti-x" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-12">
                <div>
                  <label className="form-label">Event For</label>
                  <div className="d-flex align-items-center flex-wrap">
                    {["All", "Students", "Staffs"].map((option) => (
                      <div className="form-check me-3 mb-3" key={option}>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="eventFor"
                          id={option.toLowerCase()}
                          value={option}
                          checked={formData.eventFor === option}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor={option.toLowerCase()}>
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                {formData.eventFor === "Students" && (
                  <div className="all-content">
                    <div className="mb-3">
                      <label className="form-label">Classes</label>
                      <CommonSelect
                        className="select"
                        options={classes}
                        defaultValue={classes[0]}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Sections</label>
                      <CommonSelect
                        className="select"
                        options={sections}
                        defaultValue={sections[0]}
                      />
                    </div>
                  </div>
                )}
                {formData.eventFor === "Staffs" && (
                  <div className="all-content">
                    <div className="mb-3">
                      <div className="bg-light-500 p-3 pb-2 rounded">
                        <label className="form-label">Role</label>
                        <div className="row">
                          <div className="col-md-6">
                            {["Admin", "Teacher", "Driver"].map((role) => (
                              <div className="form-check form-check-sm mb-2" key={role}>
                                <input className="form-check-input" type="checkbox" />
                                {role}
                              </div>
                            ))}
                          </div>
                          <div className="col-md-6">
                            {["Accountant", "Librarian", "Receptionist"].map((role) => (
                              <div className="form-check form-check-sm mb-2" key={role}>
                                <input className="form-check-input" type="checkbox" />
                                {role}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Event Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Title"
                  name="eventTitle"
                  value={formData.eventTitle}
                  onChange={handleInputChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Event Category</label>
                <CommonSelect
                  className="select"
                  options={eventCategory}
                  defaultValue={eventCategory.find((cat) => cat.value === formData.eventCategory)}
                  onChange={(option) => setFormData((prev) => ({ ...prev, eventCategory: option?.value || "" }))}
                />
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Start Date</label>
                  <div className="date-pic">
                    <DatePicker
                      className="form-control datetimepicker"
                      placeholder="Select Date"
                      value={formData.startDate}
                      onChange={(date) => onChangeDate("startDate", date)}
                    />
                    <span className="cal-icon">
                      <i className="ti ti-calendar" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">End Date</label>
                  <div className="date-pic">
                    <DatePicker
                      className="form-control datetimepicker"
                      placeholder="Select Date"
                      value={formData.endDate}
                      onChange={(date) => onChangeDate("endDate", date)}
                    />
                    <span className="cal-icon">
                      <i className="ti ti-calendar" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Start Time</label>
                  <div className="date-pic">
                    <TimePicker
                      placeholder="Select Time"
                      className="form-control timepicker"
                      value={formData.startTime}
                      onChange={(time) => onChangeTime("startTime", time)}
                      format="HH:mm"
                    />
                    <span className="cal-icon">
                      <i className="ti ti-clock" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">End Time</label>
                  <div className="date-pic">
                    <TimePicker
                      placeholder="Select Time"
                      className="form-control timepicker"
                      value={formData.endTime}
                      onChange={(time) => onChangeTime("endTime", time)}
                      format="HH:mm"
                    />
                    <span className="cal-icon">
                      <i className="ti ti-clock" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">Attachment (Document Name/URL)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter document name or URL"
                    name="attachment"
                    value={formData.attachment}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-0">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Enter event description"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Link to="#" className="btn btn-light me-2" onClick={handleAddEventClose}>
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary">
              {isEditMode ? "Update Event" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
      <Modal show={showEventDetailsModal} onHide={handleEventDetailsClose}>
        <div className="modal-header justify-content-between">
          <span className="d-inline-flex align-items-center">
            <i className={`ti ti-circle-filled fs-8 ${getCategoryClass(eventDetails?.eventCategory || "")}`} />
            {eventDetails?.eventCategory}
          </span>
          <div className="d-flex align-items-center">
            <Link to="#" className="me-1 fs-18" onClick={handleEditEvent}>
              <i className="ti ti-edit-circle" />
            </Link>
            <Link to="#" className="me-1 fs-18" onClick={handleDeleteEvent}>
              <i className="ti ti-trash-x" />
            </Link>
            <Link to="#" className="fs-18" onClick={handleEventDetailsClose}>
              <i className="ti ti-x" />
            </Link>
          </div>
        </div>
        <div className="modal-body pb-0">
          {eventDetails && (
            <>
              <div className="d-flex align-items-center mb-3">
                <span className="avatar avatar-xl bg-primary-transparent me-3 flex-shrink-0">
                  <i className="ti ti-users-group fs-30" />
                </span>
                <div>
                  <h3 id="eventTitle" className="mb-1">
                    {eventDetails.eventTitle}
                  </h3>
                  <div className="d-flex align-items-center flex-wrap">
                    <p className="me-3 mb-0">
                      <i className="ti ti-calendar me-1" />
                      {new Date(eventDetails.start).toLocaleDateString()} -{" "}
                      {new Date(eventDetails.end).toLocaleDateString()}
                    </p>
                    <p>
                      <i className="ti ti-clock me-1" />
                      {eventDetails.startTime1} - {eventDetails.endTime1}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-light-400 p-3 rounded mb-3">
                <p>{eventDetails.message || "No description available"}</p>
              </div>
              <>
                {console.log(eventDetails)}
              </>
              {eventDetails.attachment && (
                <div className="mb-3">
                  <label className="form-label">Attachment</label>
                  <p>{eventDetails.attachment}</p>
                </div>
              )}
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <div className="mb-3">
                  <p className="mb-1">Event For</p>
                  <h6>{eventDetails.eventFor}</h6>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

const getCategoryClass = (category: string) => {
  switch (category) {
    case "Celebration": return "text-warning";
    case "Training": return "text-success";
    case "Meeting": return "text-info";
    case "Holidays": return "text-danger";
    case "Camp": return "text-pending";
    default: return "text-info";
  }
};

export default Events;