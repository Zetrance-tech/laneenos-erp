import React, { act, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Link } from "react-router-dom";
import CountUp from "react-countup";
import { Calendar } from "primereact/calendar";
import { Nullable } from "primereact/ts-helpers";
import "bootstrap-daterangepicker/daterangepicker.css";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { ApexOptions } from "apexcharts";
import { all_routes } from "../../router/all_routes";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AdminDashboardModal from "./adminDashboardModal";
import { useEffect } from "react";
import axios from "axios";
import apiService from "../../../api/main";

interface Consent {
  _id: string;
  title: string;
  description: string;
  validity: string;
  sessionId: { _id: string; name?: string };
  classId: { _id: string; name?: string };
  branchId: { _id: string; name?: string };
  createdAt: string;
  updatedAt: string;
  __v: number;
  createdBy?: { _id: string; name: string };
}
interface AttendanceRecord {
  id: string;
  admissionNo: string;
  name: string;
  status: "Present" | "Absent" | "Late" | null;
}
interface CCTV {
  _id?: string;
  cctvId: string;
  cctvName: string;
  cctvLink: string;
  photoUrl?: string;
  description?: string;
  status: "active" | "inactive";
  createdBy?: {
    name: string;
    email: string;
  };
  branchId?: {
    name: string;
    branchId: string;
  };
}

interface Student {
  fatherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
  };
  motherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
  };
  guardianInfo: {
    name: string;
    relation: string;
    phoneNumber: string;
    email: string;
    occupation: string;
  };
  transportInfo: {
    route: string;
    vehicleNumber: string;
    pickupPoint: string;
  };
  medicalHistory: {
    condition: string;
    allergies: string[];
    medications: string[];
  };
  previousSchool: {
    name: string;
    address: string;
  };
  _id: string;
  academicYear: string;
  admissionNumber: string;
  admissionDate: string;
  status: "active" | "inactive";
  name: string;
  dateOfBirth: string;
  gender: "male" | "female";
  bloodGroup: string;
  religion: string;
  category: string;
  motherTongue: string;
  languagesKnown: string[];
  currentAddress: string;
  permanentAddress: string;
  email: string;
  password: string;
  role: "student";
  __v: number;
}
const API_URL = process.env.REACT_APP_URL;

interface Event {
  eventFor: string;
  eventTitle: string;
  eventCategory: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  attachment: {
    fileName: string;
    filePath: string;
    fileSize: number;
    fileFormat: string;
  };
}
interface Notice {
  _id: string;
  title: string;
  noticeDate: string;
  attachment: string | null;
  message: string;
  messageTo: [string];
  createdAt: string;
}

const AdminDashboard = () => {
  const routes = all_routes;
  const [date, setDate] = useState<Nullable<Date>>(null);
  function SampleNextArrow(props: any) {
    const { style, onClick } = props;
    return (
      <div
        className="slick-nav slick-nav-next"
        style={{ ...style, display: "flex", top: "30%", right: "30%" }}
        onClick={onClick}
      >
        <i className="fas fa-chevron-right" style={{ color: "#677788" }}></i>
      </div>
    );
  }
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [inactiveStudents, setInactiveStudents] = useState(0);
  const [inactiveStudentPercentage, setInactiveStudentPercentage] = useState(0);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(false);
  const [teacherCount, setTeacherCount] = useState(0);
  const [cctvCount, setCctvCount] = useState<{
    total: number;
    active: number;
    inactive: number;
  }>({ total: 0, active: 0, inactive: 0 });
  const [classCount, setClassCount] = useState(0);
  const [activeTeachers, setActiveTeachers] = useState(0);
  const [inactiveTeachers, setInactiveTeachers] = useState(0);
  const [attendancesummary, setAttendancesummary] = useState({
    present: 0,
    absent: 0,
    notMarked: 0,
  });
  const [staffAttendancesummary, setStaffAttendancesummary] = useState({
    present: 0,
    absent: 0,
    notMarked: 0,
  });
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const data = await apiService.getAllStudents(token || "");
        setStudents(data);
        const total = data.length;
        const active = data.filter(
          (student: Student) => student.status === "active"
        ).length;
        const inactive = data.filter(
          (student: Student) => student.status === "inactive"
        ).length;
        const percentage = total > 0 ? (inactive / total) * 100 : 0;
        setTotalStudents(total);
        setActiveStudents(active);
        setInactiveStudents(inactive);
        setInactiveStudentPercentage(percentage);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/notices`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setNotices(response.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_URL}/api/teacher/count-teacher`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setTeacherCount(response.data.total);
        console.log(response.data);
        setActiveTeachers(response.data.active);
        setInactiveTeachers(response.data.inactive);
      } catch (error) {
        console.error("Error fetching staff count:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCount();
  }, []);
  useEffect(() => {
    const fetchConsents = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/consent/admin`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setConsents(response.data);
      } catch (error) {
        console.error("Error fetching consents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConsents();
  }, []);
  useEffect(() => {
    const fetchClassCount = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/class/count-class`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setClassCount(response.data.count);
      } catch (error) {
        console.error("Error fetching class cpunt:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClassCount();
  }, []);
  useEffect(() => {
    const fetchCCTVCount = async () => {
      setLoading(true);
      try {
        const response = await axios.get<{
          total: number;
          active: number;
          inactive: number;
        }>(`${API_URL}/api/cctv/count/cctv`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setCctvCount(response.data);
      } catch (error) {
        console.error("Error fetching CCTV count:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCCTVCount();
  }, []);

  useEffect(() => {
    const fetchStudentAttendance = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}/api/attendance/attendance-data/data`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log("Attendance API response:", res.data);

        // Validate response structure
        if (
          !res.data.summary ||
          typeof res.data.summary.present !== "number" ||
          typeof res.data.summary.absent !== "number" ||
          typeof res.data.summary.notMarked !== "number"
        ) {
          throw new Error("Invalid attendance summary format");
        }

        const { present, absent, notMarked } = res.data.summary;
        setAttendancesummary({ present, absent, notMarked });
        setStudentDonutChart((prev: any) => ({
          ...prev,
          series: [present, absent, notMarked], // Update series dynamically
        }));
        console.log("Attendance summary updated:", {
          present,
          absent,
          notMarked,
        });
      } catch (err) {
        console.error("Error fetching student attendance:", err);
        setAttendancesummary({ present: 0, absent: 0, notMarked: 0 });
        setStudentDonutChart((prev: any) => ({
          ...prev,
          series: [0, 0, 0],
        }));
      } finally {
        setLoading(false);
      }
    };
    fetchStudentAttendance();
  }, []);
  useEffect(() => {
    const fetchStaffAttendance = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}/api/attendance/staff-attendance/data`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log("Attendance API response:", res.data);

        // Validate response structure
        if (
          !res.data.summary ||
          typeof res.data.summary.present !== "number" ||
          typeof res.data.summary.absent !== "number" ||
          typeof res.data.summary.notMarked !== "number"
        ) {
          throw new Error("Invalid attendance summary format");
        }

        const { present, absent, notMarked } = res.data.summary;
        setStaffAttendancesummary({ present, absent, notMarked });
        setTeacherDonutChart((prev: any) => ({
          ...prev,
          series: [present, absent, notMarked], // Update series dynamically
        }));
        console.log("Attendance summary updated:", {
          present,
          absent,
          notMarked,
        });
      } catch (err) {
        console.error("Error fetching staff attendance:", err);
        setStaffAttendancesummary({ present: 0, absent: 0, notMarked: 0 });
        setStudentDonutChart((prev: any) => ({
          ...prev,
          series: [0, 0, 0],
        }));
      } finally {
        setLoading(false);
      }
    };
    fetchStaffAttendance();
  }, []);
  function SamplePrevArrow(props: any) {
    const { style, onClick } = props;
    return (
      <div
        className="slick-nav slick-nav-prev"
        style={{ ...style, display: "flex", top: "30%", left: "30%" }}
        onClick={onClick}
      >
        <i className="fas fa-chevron-left" style={{ color: "#677788" }}></i>
      </div>
    );
  }
  const settings = {
    dots: false,
    autoplay: false,
    arrows: false,
    slidesToShow: 2,
    margin: 24,
    speed: 500,
    responsive: [
      {
        breakpoint: 1500,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 1400,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 776,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 567,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };
  const student = {
    dots: false,
    autoplay: false,
    slidesToShow: 1,
    speed: 500,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
  };
  const teacher = {
    dots: false,
    autoplay: false,
    slidesToShow: 1,
    speed: 500,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
  };
  const [studentDonutChart, setStudentDonutChart] = useState<any>({
  chart: {
    height: 218,
    width: 218,
    type: "donut",
    toolbar: {
      show: false,
    },
  },
  legend: {
    show: false,
  },
  labels: ["Present", "Absent", "Not Marked"], // ✅ Add labels here
  colors: ["#3D5EE1", "#6FCCD8", "#EAB300"],
  series: [0, 0, 0],
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 180,
        },
      },
    },
  ],
});

  const [teacherDonutChart, setTeacherDonutChart] = useState<any>({
  chart: {
    height: 218,
    width: 218,
    type: "donut",
    toolbar: {
      show: false,
    },
  },
  legend: {
    show: false,
  },
  labels: ["Present", "Absent", "Not Marked"], // ✅ Added labels
  colors: ["#3D5EE1", "#6FCCD8", "#EAB300"],
  series: [346, 54],
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 180,
        },
      },
    },
  ],
});

  const [staffDonutChart] = useState<any>({
    chart: {
      height: 218,
      width: 218,
      type: "donut",
      toolbar: {
        show: false,
      },
    },
    legend: {
      show: false,
    },
    colors: ["#3D5EE1", "#6FCCD8"],
    series: [620, 80],
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 180,
          },
        },
      },
    ],
  });
  const [classDonutChart] = useState<any>({
    chart: {
      height: 218,
      width: 218,
      type: "donut",
      toolbar: {
        show: false,
      },
    },
    labels: ["Good", "Average", "Below Average"],
    legend: { show: false },
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      tickAmount: 3,
      labels: {
        offsetX: -15,
      },
    },
    grid: {
      padding: {
        left: -8,
      },
    },
    colors: ["#3D5EE1", "#EAB300", "#E82646"],
    series: [45, 11, 2],
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 180,
          },
        },
      },
    ],
  });
    const [feesBar, setFeesBar] = useState<any>({
    chart: {
      height: 275,
      type: "bar",
      stacked: true,
      toolbar: {
        show: false,
      },
    },
    legend: {
      show: true,
      horizontalAlign: "left",
      position: "top",
      fontSize: "14px",
      labels: {
        colors: "#5D6369",
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        endingShape: "rounded",
      },
    },
    colors: ["#3D5EE1", "#E9EDF4"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    grid: {
      padding: {
        left: -8,
      },
    },
    series: [
      {
        name: "Collected Fee",
        data: Array(12).fill(0), // Placeholder for 12 months
      },
      {
        name: "Total Fee",
        data: Array(12).fill(0), // Placeholder for 12 months
      },
    ],
    xaxis: {
      categories: [
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ],
    },
    yaxis: {
      tickAmount: 3,
      labels: {
        offsetX: -15,
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val: any) {
          return "₹ " + (val).toFixed(1) + "k";
        },
      },
    },
  });
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const [totalExpenseArea] = useState<any>({
    chart: {
      height: 90,
      type: "area",
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: true,
      },
    },
    colors: ["#E82646"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "straight",
    },
    series: [
      {
        name: "Expense",
        data: [40, 30, 60, 55, 50, 55, 40],
      },
    ],
  });
  const [events, setEvents] = useState<Event[]>([]);

  const getDaysRemaining = (noticeDate: string) => {
    const today = new Date();
    const notice = new Date(noticeDate);
    const diffTime = Math.abs(today.getTime() - notice.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/events/get`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.data && Array.isArray(response.data.events)) {
          setEvents(response.data.events);
        } else {
          console.error("Invalid response format: Expected an array of events");
          setEvents([]);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, []);
  const token = localStorage.getItem("token");
  const user = JSON.parse(
    localStorage.getItem("user") ?? JSON.stringify({ role: "student" })
  );
  const formatEventDate = (dateString: any) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatEventTime = (timeString: any) => {
    return timeString;
  };
useEffect(() => {
    const fetchFeeCollection = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/studentFees/fees-collection-summary`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const feeData = response.data.data;
        
        // Map data to chart series
        const collectedFeeData = feeData.map((item: any) => item.collectedFee / 1000); // Convert to thousands
        const totalFeeData = feeData.map((item: any) => item.totalFee / 1000); // Convert to thousands

        setFeesBar((prev: any) => ({
          ...prev,
          series: [
            {
              name: "Collected Fee",
              data: collectedFeeData,
            },
            {
              name: "Total Fee",
              data: totalFeeData,
            },
          ],
        }));
      } catch (error) {
        console.error("Error fetching fee collection data:", error);
        // Keep placeholder data or handle error as needed
      } finally {
        setLoading(false);
      }
    };
    fetchFeeCollection();
  }, []);
  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          <>
            {/* Page Header */}
            <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
              <div className="my-auto mb-2">
                <h3 className="page-title mb-1">Admin Dashboard</h3>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={routes.adminDashboard}>Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Admin Dashboard
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
            {/* /Page Header */}
            <div className="row">
              <div className="col-md-12">
                {/* Dashboard Content */}
                <div className="card bg-dark">
                  <div className="overlay-img">
                    <ImageWithBasePath
                      src="assets/img/bg/shape-04.png"
                      alt="img"
                      className="img-fluid shape-01"
                    />
                    <ImageWithBasePath
                      src="assets/img/bg/shape-01.png"
                      alt="img"
                      className="img-fluid shape-02"
                    />
                    <ImageWithBasePath
                      src="assets/img/bg/shape-02.png"
                      alt="img"
                      className="img-fluid shape-03"
                    />
                    <ImageWithBasePath
                      src="assets/img/bg/shape-03.png"
                      alt="img"
                      className="img-fluid shape-04"
                    />
                  </div>
                  <div className="card-body">
                    <div className="d-flex align-items-xl-center justify-content-xl-between flex-xl-row flex-column">
                      <div className="mb-3 mb-xl-0">
                        <div className="d-flex align-items-center flex-wrap mb-2">
                          <h1 className="text-white me-2">
                            Welcome Back, {user.name}
                          </h1>
                          <Link
                            to="profile"
                            className="avatar avatar-sm img-rounded bg-gray-800 dark-hover"
                          >
                            <i className="ti ti-edit text-white" />
                          </Link>
                        </div>
                        <p className="text-white">Have a Good day at work</p>
                      </div>
                      <p className="text-white custom-text-white">
                        <i className="ti ti-refresh me-1" />
                        Updated Recently on {formattedDate}
                      </p>
                    </div>
                  </div>
                </div>
                {/* /Dashboard Content */}
              </div>
            </div>
            <div className="row">
              {/* Total Students */}
              <div className="col-xxl-3 col-sm-6 d-flex">
                <div className="card flex-fill animate-card border-0">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="avatar avatar-xl bg-danger-transparent me-2 p-1">
                        <ImageWithBasePath
                          src="assets/img/icons/student.svg"
                          alt="img"
                        />
                      </div>
                      <div className="overflow-hidden flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <h2 className="counter">
                            <CountUp end={totalStudents} duration={2} />
                          </h2>
                          <span className="badge bg-danger"></span>
                        </div>
                        <p>Total Students</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between border-top mt-3 pt-3">
                      <p className="mb-0">
                        Active :{" "}
                        <span className="text-dark fw-semibold">
                          {activeStudents}
                        </span>
                      </p>
                      <span className="text-light">|</span>
                      <p>
                        Inactive :{" "}
                        <span className="text-dark fw-semibold">
                          {inactiveStudents}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Total Students */}
              {/* Total Teachers */}
              <div className="col-xxl-3 col-sm-6 d-flex">
                <div className="card flex-fill animate-card border-0">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="avatar avatar-xl me-2 bg-secondary-transparent p-1">
                        <ImageWithBasePath
                          src="assets/img/icons/teacher.svg"
                          alt="img"
                        />
                      </div>
                      <div className="overflow-hidden flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <h2 className="counter">
                            <CountUp end={teacherCount} />
                          </h2>
                          <span className="badge bg-pending"></span>
                        </div>
                        <p>Total Staff</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between border-top mt-3 pt-3">
                      <p className="mb-0">
                        Active :{" "}
                        <span className="text-dark fw-semibold">
                          {activeTeachers}
                        </span>
                      </p>
                      <span className="text-light">|</span>
                      <p>
                        Inactive :{" "}
                        <span className="text-dark fw-semibold">
                          {inactiveTeachers}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Total Teachers */}
              {/* Total Classes */}
              <div className="col-xxl-3 col-sm-6 d-flex">
                <div className="card flex-fill animate-card border-0">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="avatar avatar-xl me-2 bg-warning-transparent p-1">
                        <ImageWithBasePath
                          src="assets/img/icons/staff.svg"
                          alt="img"
                        />
                      </div>
                      <div className="overflow-hidden flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <h2 className="counter">
                            <CountUp end={classCount} />
                          </h2>
                          <span className="badge bg-warning"></span>
                        </div>
                        <p>Total Classes</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between border-top mt-3 pt-3">
                      <p className="mb-0">
                        Active :{" "}
                        <span className="text-dark fw-semibold">
                          {classCount}
                        </span>
                      </p>
                      <span className="text-light">|</span>
                      <p>
                        Inactive :{" "}
                        <span className="text-dark fw-semibold">0</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Total Staff */}
              {/* Total CCTV */}
              <div className="col-xxl-3 col-sm-6 d-flex">
                <div className="card flex-fill animate-card border-0">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="avatar avatar-xl me-2 bg-success-transparent p-1">
                        <ImageWithBasePath
                          src="assets/img/icons/company-icon-09.svg"
                          alt="img"
                        />
                      </div>
                      <div className="overflow-hidden flex-fill">
                        <div className="d-flex align-items-center justify-content-between">
                          <h2 className="counter">
                            <CountUp end={cctvCount.total} />
                          </h2>
                          <span className="badge bg-success"></span>
                        </div>
                        <p>Total CCTV</p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between border-top mt-3 pt-3">
                      <p className="mb-0">
                        Active :{" "}
                        <span className="text-dark fw-semibold">
                          {cctvCount.active}
                        </span>
                      </p>
                      <span className="text-light">|</span>
                      <p>
                        Inactive :{" "}
                        <span className="text-dark fw-semibold">
                          {cctvCount.inactive}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Total Subjects */}
            </div>
            <div className="row">
              {/* Communication  Board */}
              <div className="col-xxl-4 col-xl-6 col-md-12 d-flex flex-column">
                <div className="card flex-fill">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h4 className="card-title">Communication Board</h4>
                    <Link to={routes.noticeBoard} className="fw-medium">
                      View All
                    </Link>
                  </div>
                  <div className="card-body">
                    <div className="notice-widget">
                      {loading ? (
                        <p>Loading...</p>
                      ) : notices.length === 0 ? (
                        <p>No notices available</p>
                      ) : (
                        notices.slice(0, 5).map((notice) => (
                          <div
                            key={notice._id}
                            className="d-sm-flex align-items-center justify-content-between mb-4"
                          >
                            <div className="d-flex align-items-center overflow-hidden me-2 mb-2 mb-sm-0">
                              <span className="bg-skyblue-transparent avatar avatar-md me-2 rounded-circle flex-shrink-0">
                                <i className="ti ti-notes fs-16" />
                              </span>
                              <div className="overflow-hidden">
                                <h6 className="text-truncate mb-1">
                                  {notice.title}
                                </h6>
                                <p>
                                  <i className="ti ti-calendar me-2" />
                                  Added on:{" "}
                                  {new Date(
                                    notice.noticeDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className="badge bg-light text-dark">
                              <i className="ti ti-clck me-1" />
                              {getDaysRemaining(notice.noticeDate)} Days
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* /Notice Board */}

              {/* Attendance */}
              <div className="col-xxl-4 col-xl-6 col-md-12 d-flex flex-column">
                <div className="card">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h4 className="card-title">Attendance</h4>
                    <div className="dropdown">
                      <i className="ti ti-calendar-due me-1" />
                      Today
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="list-tab mb-4">
                      <ul className="nav">
                        <li>
                          <Link
                            to="#"
                            className="active"
                            data-bs-toggle="tab"
                            data-bs-target="#students"
                          >
                            Students
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            data-bs-toggle="tab"
                            data-bs-target="#teachers"
                          >
                            Teachers
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="tab-content">
                      <div className="tab-pane fade active show" id="students">
                        <div className="row gx-3">
                          <div className="col-sm-4">
                            <div className="card bg-light-300 shadow-none border-0">
                              <div className="card-body p-3 text-center">
                                <h5>{attendancesummary.present}</h5>
                                <p className="fs-12">Present</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-4">
                            <div className="card bg-light-300 shadow-none border-0">
                              <div className="card-body p-3 text-center">
                                <h5>{attendancesummary.absent}</h5>
                                <p className="fs-12">Absent</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-4">
                            <div className="card bg-light-300 shadow-none border-0">
                              <div className="card-body p-3 text-center">
                                <h5>{attendancesummary.notMarked}</h5>
                                <p className="fs-12">Not Marked</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <ReactApexChart
                            id="student-chart"
                            className="mb-4"
                            options={studentDonutChart}
                            series={studentDonutChart.series}
                            type="donut"
                            height={210}
                          />
                        </div>
                      </div>
                      {/* Static teacher tab */}
                      <div className="tab-pane fade" id="teachers">
                        <div className="row gx-3">
                          <div className="col-sm-4">
                            <div className="card bg-light-300 shadow-none border-0">
                              <div className="card-body p-3 text-center">
                                <h5>{staffAttendancesummary.present}</h5>
                                <p className="fs-12">Present</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-4">
                            <div className="card bg-light-300 shadow-none border-0">
                              <div className="card-body p-3 text-center">
                                <h5>{staffAttendancesummary.absent}</h5>
                                <p className="fs-12">Absent</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-4">
                            <div className="card bg-light-300 shadow-none border-0">
                              <div className="card-body p-3 text-center">
                                <h5>{staffAttendancesummary.notMarked}</h5>
                                <p className="fs-12">Not Marked</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <ReactApexChart
                            id="teacher-chart"
                            className="mb-4"
                            options={teacherDonutChart}
                            series={teacherDonutChart.series}
                            type="donut"
                            height={210}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Attendance */}

              {/* Communication  Board */}
              <div className="col-xxl-4 col-xl-6 col-md-12 d-flex flex-column">
                <div className="card flex-fill">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h4 className="card-title">Consents</h4>
                    <Link to={routes.consents} className="fw-medium">
                      View All
                    </Link>
                  </div>
                  <div className="card-body">
                    <div className="notice-widget">
                      {loading ? (
                        <p>Loading...</p>
                      ) : consents.length === 0 ? (
                        <p>No consents available</p>
                      ) : (
                        consents.slice(0, 5).map((consent) => (
                          <div
                            key={consent._id}
                            className="d-sm-flex align-items-center justify-content-between mb-4"
                          >
                            <div className="d-flex align-items-center overflow-hidden me-2 mb-2 mb-sm-0">
                              <span className="bg-success-transparent avatar avatar-md me-2 rounded-circle flex-shrink-0">
                                <i className="ti ti-note fs-16" />
                              </span>
                              <div className="overflow-hidden">
                                <h6 className="text-truncate mb-1">
                                  {consent.title}
                                </h6>
                                <p className="mb-0">
                                  <i className="ti ti-calendar me-2" />
                                  Added on:{" "}
                                  {new Date(
                                    consent.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className="badge bg-light text-dark">
                              <i className="ti ti-clock me-1" />
                              {getDaysRemaining(consent.validity)} Days
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-xxl-12 col-xl-6 d-flex">
                <div className="card flex-fill">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h4 className="card-title">Fees Collection</h4>
                  </div>
                  <div className="card-body pb-0">
                    {loading ? (
                      <p>Loading fee data...</p>
                    ) : (
                      <ReactApexChart
                        id="fees-chart"
                        options={feesBar}
                        series={feesBar.series}
                        type="bar"
                        height={270}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
              
          </>
        </div>
      </div>
      <AdminDashboardModal />
    </>
  );
};

export default AdminDashboard;
