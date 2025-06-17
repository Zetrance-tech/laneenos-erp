import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  setDataLayout,
  setDataTheme,
} from "../../data/redux/themeSettingSlice";
import ImageWithBasePath from "../imageWithBasePath";
import {
  setExpandMenu,
  setMobileSidebar,
  toggleMiniSidebar,
} from "../../data/redux/sidebarSlice";
import { useState, useEffect } from "react";
import { all_routes } from "../../../feature-module/router/all_routes";
import { useAuth } from "../../../context/AuthContext";

interface User {
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'parent' | 'teacher';
  password?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

const Header = () => {
  const routes = all_routes;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const dataTheme = useSelector((state: any) => state.themeSetting.dataTheme);
  const dataLayout = useSelector((state: any) => state.themeSetting.dataLayout);
  const mobileSidebar = useSelector(
    (state: any) => state.sidebarSlice.mobileSidebar
  );
  const { user, logout } = useAuth(); // Use the AuthContext

  const [notificationVisible, setNotificationVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Load theme from local storage if it exists
    const storedTheme = localStorage.getItem("dataTheme");
    if (storedTheme) {
      dispatch(setDataTheme(storedTheme));
    }
  }, [dispatch]);

  const toggleMobileSidebar = () => {
    dispatch(setMobileSidebar(!mobileSidebar));
  };

  const onMouseEnter = () => {
    dispatch(setExpandMenu(true));
  };

  const onMouseLeave = () => {
    dispatch(setExpandMenu(false));
  };

  const handleToggleMiniSidebar = () => {
    if (dataLayout === "mini_layout") {
      dispatch(setDataLayout("default_layout"));
      localStorage.setItem("dataLayout", "default_layout");
    } else {
      dispatch(toggleMiniSidebar());
    }
  };

  const handleToggleClick = () => {
    if (dataTheme === "default_data_theme") {
      dispatch(setDataTheme("dark_data_theme"));
      localStorage.setItem("dataTheme", "dark_data_theme");
    } else {
      dispatch(setDataTheme("default_data_theme"));
      localStorage.setItem("dataTheme", "default_data_theme");
    }
  };

  const toggleNotification = () => {
    setNotificationVisible(!notificationVisible);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error("Error attempting to enable fullscreen:", err);
        });
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch((err) => {
            console.error("Error attempting to exit fullscreen:", err);
          });
        }
        setIsFullscreen(false);
      }
    }
  };

  const handleLogout = () => {
    logout(); // Use the logout function from AuthContext
    navigate(routes.login);
  };

  return (
    <>
      {/* Header */}
      <div className="header">
        {/* Logo */}
        <div
          className="header-left active"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <Link to={routes.adminDashboard} className="logo logo-normal">
            <ImageWithBasePath src="assets/img/logo.png" alt="Logo" />
          </Link>
          <Link to={routes.adminDashboard} className="logo-small">
            <ImageWithBasePath src="assets/img/logo-small.png" alt="Logo" />
          </Link>
          <Link to={routes.adminDashboard} className="dark-logo">
            <ImageWithBasePath src="assets/img/logo-dark.svg" alt="Logo" />
          </Link>
          <Link id="toggle_btn" to="#" onClick={handleToggleMiniSidebar}>
            <i className="ti ti-menu-deep" />
          </Link>
        </div>
        {/* /Logo */}
        <Link
          id="mobile_btn"
          className="mobile_btn"
          to="#sidebar"
          onClick={toggleMobileSidebar}
        >
          <span className="bar-icon">
            <span />
            <span />
            <span />
          </span>
        </Link>
        <div className="header-user">
          <div className="nav user-menu">
            {/* Search */}
            <div className="nav-item nav-search-inputs me-auto"></div>
            {/* /Search */}

            <div className="d-flex align-items-center">
              <div className="dropdown me-2">
                <Link
                  to="#"
                  className="btn btn-outline-light fw-normal bg-white d-flex align-items-center p-2"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="ti ti-calendar-due me-1" />
                  Academic Year : 2024 / 2025
                </Link>
                <div className="dropdown-menu dropdown-menu-right">
                  <Link
                    to="#"
                    className="dropdown-item d-flex align-items-center"
                  >
                    Academic Year : 2023 / 2024
                  </Link>
                  <Link
                    to="#"
                    className="dropdown-item d-flex align-items-center"
                  >
                    Academic Year : 2022 / 2023
                  </Link>
                  <Link
                    to="#"
                    className="dropdown-item d-flex align-items-center"
                  >
                    Academic Year : 2021 / 2022
                  </Link>
                </div>
              </div>

              <div className="pe-1">
                {!location.pathname.includes("layout-dark") && (
                  <Link
                    onClick={handleToggleClick}
                    to="#"
                    id="dark-mode-toggle"
                    className="dark-mode-toggle activate btn btn-outline-light bg-white btn-icon me-1"
                  >
                    <i
                      className={
                        dataTheme === "default_data_theme"
                          ? "ti ti-moon"
                          : "ti ti-brightness-up"
                      }
                    />
                  </Link>
                )}
              </div>

              <div
                className={`pe-1 ${
                  notificationVisible ? "notification-item-show" : ""
                }`}
                id="notification_item"
              >
                <Link
                  onClick={toggleNotification}
                  to="#"
                  className="btn btn-outline-light bg-white btn-icon position-relative me-1"
                  id="notification_popup"
                >
                  <i className="ti ti-bell" />
                  <span className="notification-status-dot" />
                </Link>
                <div className="dropdown-menu dropdown-menu-end notification-dropdown p-4">
                  <div className="d-flex align-items-center justify-content-between border-bottom p-0 pb-3 mb-3">
                    <h4 className="notification-title">Notifications (2)</h4>
                    <div className="d-flex align-items-center">
                      <Link to="#" className="text-primary fs-15 me-3 lh-1">
                        Mark all as read
                      </Link>
                      <div className="dropdown">
                        <Link
                          to="#"
                          className="bg-white dropdown-toggle"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-calendar-due me-1" />
                          Today
                        </Link>
                        <ul className="dropdown-menu mt-2 p-3">
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              This Week
                            </Link>
                          </li>
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              Last Week
                            </Link>
                          </li>
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              Last Week
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="noti-content">
                    <div className="d-flex flex-column">
                      <div className="border-bottom mb-3 pb-3">
                        <Link to={routes.activity}>
                          <div className="d-flex">
                            <span className="avatar avatar-lg me-2 flex-shrink-0">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-27.jpg"
                                alt="Profile"
                              />
                            </span>
                            <div className="flex-grow-1">
                              <p className="mb-1">
                                <span className="text-dark fw-semibold">
                                  Shawn
                                </span>{" "}
                                performance in Math is below the threshold.
                              </p>
                              <span>Just Now</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                      <div className="border-bottom mb-3 pb-3">
                        <Link to={routes.activity} className="pb-0">
                          <div className="d-flex">
                            <span className="avatar avatar-lg me-2 flex-shrink-0">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-23.jpg"
                                alt="Profile"
                              />
                            </span>
                            <div className="flex-grow-1">
                              <p className="mb-1">
                                <span className="text-dark fw-semibold">
                                  Sylvia
                                </span>{" "}
                                added appointment on 02:00 PM
                              </p>
                              <span>10 mins ago</span>
                              <div className="d-flex justify-content-start align-items-center mt-1">
                                <span className="btn btn-light btn-sm me-2">
                                  Deny
                                </span>
                                <span className="btn btn-primary btn-sm">
                                  Approve
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                      <div className="border-bottom mb-3 pb-3">
                        <Link to={routes.activity}>
                          <div className="d-flex">
                            <span className="avatar avatar-lg me-2 flex-shrink-0">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-25.jpg"
                                alt="Profile"
                              />
                            </span>
                            <div className="flex-grow-1">
                              <p className="mb-1">
                                New student record{" "}
                                <span className="text-dark fw-semibold">
                                  {" "}
                                  George
                                </span>{" "}
                                is created by{" "}
                                <span className="text-dark fw-semibold">
                                  Teressa
                                </span>
                              </p>
                              <span>2 hrs ago</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                      <div className="border-0 mb-3 pb-0">
                        <Link to={routes.activity}>
                          <div className="d-flex">
                            <span className="avatar avatar-lg me-2 flex-shrink-0">
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-01.jpg"
                                alt="Profile"
                              />
                            </span>
                            <div className="flex-grow-1">
                              <p className="mb-1">
                                A new teacher record for{" "}
                                <span className="text-dark fw-semibold">
                                  Elisa
                                </span>
                              </p>
                              <span>09:45 AM</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex p-0">
                    <Link to="#" className="btn btn-light w-100 me-2">
                      Cancel
                    </Link>
                    <Link to={routes.activity} className="btn btn-primary w-100">
                      View All
                    </Link>
                  </div>
                </div>
              </div>

              <div className="pe-1">
                <Link
                  onClick={toggleFullscreen}
                  to="#"
                  className="btn btn-outline-light bg-white btn-icon me-1"
                  id="btnFullscreen"
                >
                  <i className="ti ti-maximize" />
                </Link>
              </div>

              <div className="dropdown ms-1">
                <Link
                  to="#"
                  className="dropdown-toggle d-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  <span className="avatar avatar-md rounded">
                    <ImageWithBasePath
                      src="assets/img/profiles/avatar-27.jpg"
                      alt="Img"
                      className="img-fluid"
                    />
                  </span>
                </Link>
                <div className="dropdown-menu">
                  <div className="d-block">
                    <div className="d-flex align-items-center p-2">
                      <span className="avatar avatar-md me-2 online avatar-rounded">
                        <ImageWithBasePath
                          src="assets/img/profiles/avatar-27.jpg"
                          alt="img"
                        />
                      </span>
                      <div>
                        <h6>{user?.name || "User"}</h6>
                        <p className="text-primary mb-0">{user?.role || "Role"}</p>
                      </div>
                    </div>
                    <hr className="m-0" />
                    <Link
                      className="dropdown-item d-inline-flex align-items-center p-2"
                      to={routes.profile}
                    >
                      <i className="ti ti-user-circle me-2" />
                      My Profile
                    </Link>
                    <Link
                      className="dropdown-item d-inline-flex align-items-center p-2"
                      to={routes.profilesettings}
                    >
                      <i className="ti ti-settings me-2" />
                      Settings
                    </Link>
                    <hr className="m-0" />
                    <Link
                      className="dropdown-item d-inline-flex align-items-center p-2"
                      to={routes.login}
                      onClick={handleLogout}
                    >
                      <i className="ti ti-login me-2" />
                      Logout
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="dropdown mobile-user-menu">
          <Link
            to="#"
            className="nav-link dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fa fa-ellipsis-v" />
          </Link>
          <div className="dropdown-menu dropdown-menu-end">
            <Link className="dropdown-item" to={routes.profile}>
              My Profile
            </Link>
            <Link className="dropdown-item" to={routes.profilesettings}>
              Settings
            </Link>
            <Link className="dropdown-item" to={routes.login} onClick={handleLogout}>
              Logout
            </Link>
          </div>
        </div>
        {/* /Mobile Menu */}
      </div>
      {/* /Header */}
    </>
  );
};

export default Header;