// import React, { useEffect, useState } from "react";
// import { Link, useLocation } from "react-router-dom";
// import Scrollbars from "react-custom-scrollbars-2";
// import { SidebarData } from "../../data/json/sidebarData";
// import ImageWithBasePath from "../imageWithBasePath";
// import "../../../style/icon/tabler-icons/webfont/tabler-icons.css";
// import { setExpandMenu } from "../../data/redux/sidebarSlice";
// import { useDispatch } from "react-redux";
// import {
//   resetAllMode,
//   setDataLayout,
// } from "../../data/redux/themeSettingSlice";
// import usePreviousRoute from "./usePreviousRoute";

// // Define types for SidebarData and its nested structures
// interface SubMenuItem {
//   label: string;
//   link: string;
//   allowedRoles?: string[];
//   submenuItems?: SubMenuItem[];
//   subLink1?: string;
//   subLink2?: string;
//   subLink3?: string;
//   subLink4?: string;
//   subLink5?: string;
//   subLink6?: string;
//   subLink7?: string;
//   icon?: string;
//   version?: string;
//   themeSetting?: boolean;
//   submenu?: boolean;
//   links?: string[];
// }

// interface SidebarItem {
//   label: string;
//   submenuOpen?: boolean;
//   showSubRoute?: boolean;
//   submenuHdr?: string;
//   allowedRoles?: string[];
//   submenuItems: SubMenuItem[];
// }

// interface User {
//   role: string;
// }

// const Sidebar = () => {
//   const Location = useLocation();
//   const user: User = JSON.parse(localStorage.getItem("user") || "{}");
//   const userRole = user?.role;

//   const [subOpen, setSubopen] = useState<string>("");
//   const [subsidebar, setSubsidebar] = useState<string>("");

//   const dispatch = useDispatch();
//   const previousLocation = usePreviousRoute();

//   // Filter SidebarData based on user role
//   const filterSidebarDataByRole = (sidebarData: SidebarItem[], role: string): SidebarItem[] => {
//     return sidebarData
//       .map((mainLabel) => ({
//         ...mainLabel,
//         submenuItems: mainLabel.submenuItems
//           .filter((item) => !item.allowedRoles || item.allowedRoles.includes(role))
//           .map((item) => ({
//             ...item,
//             submenuItems: item.submenuItems
//               ? item.submenuItems.filter(
//                   (subItem) => !subItem.allowedRoles || subItem.allowedRoles.includes(role)
//                 )
//               : undefined,
//           })),
//       }))
//       .filter((mainLabel) => mainLabel.submenuItems.length > 0);
//   };

//   // Type assertion to ensure SidebarData matches SidebarItem[] interface
//   const filteredSidebarData = filterSidebarDataByRole(SidebarData as SidebarItem[], userRole);

//   const toggleSidebar = (title: string) => {
//     localStorage.setItem("menuOpened", title);
//     if (title === subOpen) {
//       setSubopen("");
//     } else {
//       setSubopen(title);
//     }
//   };

//   const toggleSubsidebar = (subitem: string) => {
//     if (subitem === subsidebar) {
//       setSubsidebar("");
//     } else {
//       setSubsidebar(subitem);
//     }
//   };

//   const handleLayoutChange = (layout: string) => {
//     dispatch(setDataLayout(layout));
//   };

//   const handleClick = (label: string, themeSetting: boolean | undefined, layout: string) => {
//     toggleSidebar(label);
//     if (themeSetting) {
//       handleLayoutChange(layout);
//     }
//   };

//   const getLayoutClass = (label: string): string => {
//     switch (label) {
//       case "Default":
//         return "default_layout";
//       case "Mini":
//         return "mini_layout";
//       case "Box":
//         return "boxed_layout";
//       case "Dark":
//         return "dark_data_theme";
//       case "RTL":
//         return "rtl";
//       default:
//         return "";
//     }
//   };

//   useEffect(() => {
//     const layoutPages = [
//       "/layout-dark",
//       "/layout-rtl",
//       "/layout-mini",
//       "/layout-box",
//       "/layout-default",
//     ];

//     const isCurrentLayoutPage = layoutPages.some((path) =>
//       Location.pathname.includes(path)
//     );
//     const isPreviousLayoutPage =
//       previousLocation &&
//       layoutPages.some((path) => previousLocation.pathname.includes(path));

//     if (isPreviousLayoutPage && !isCurrentLayoutPage) {
//       dispatch(resetAllMode());
//     }
//   }, [Location, previousLocation, dispatch]);

//   useEffect(() => {
//     setSubopen(localStorage.getItem("menuOpened") || "");
//     const submenus = document.querySelectorAll(".submenu");
//     submenus.forEach((submenu) => {
//       const listItems = submenu.querySelectorAll("li");
//       submenu.classList.remove("active");
//       listItems.forEach((item) => {
//         if (item.classList.contains("active")) {
//           submenu.classList.add("active");
//         }
//       });
//     });
//   }, [Location.pathname]);

//   const onMouseEnter = () => {
//     dispatch(setExpandMenu(true));
//   };

//   const onMouseLeave = () => {
//     dispatch(setExpandMenu(false));
//   };

//   return (
//     <>
//       <div
//         className="sidebar"
//         id="sidebar"
//         onMouseEnter={onMouseEnter}
//         onMouseLeave={onMouseLeave}
//       >
//         <Scrollbars>
//           <div className="sidebar-inner slimscroll">
//             <div id="sidebar-menu" className="sidebar-menu">
//               <ul>
//                 <li>
//                   <Link
//                     to="#"
//                     className="d-flex align-items-center border bg-white rounded p-2 mb-4"
//                   >
//                     <ImageWithBasePath
//                       src="assets/img/icons/global-img.svg"
//                       className="avatar avatar-md img-fluid rounded"
//                       alt="Profile"
//                     />
//                     <span className="text-dark ms-2 fw-normal">
//                       Sector 144 Noida
//                     </span>
//                   </Link>
//                 </li>
//               </ul>

//               <ul>
//                 {filteredSidebarData?.map((mainLabel, index) => (
//                   <li key={index}>
//                     <h6 className="submenu-hdr">
//                       <span>{mainLabel?.label}</span>
//                     </h6>
//                     <ul>
//                       {mainLabel?.submenuItems?.map((title, i) => {
//                         const link_array: string[] = [];
//                         if (title.submenuItems) {
//                           title.submenuItems.forEach((link) => {
//                             link_array.push(link.link);
//                             if (link.submenuItems) {
//                               link.submenuItems.forEach((item) => {
//                                 link_array.push(item.link);
//                               });
//                             }
//                           });
//                         }
//                         title.links = link_array; // Fix type error by using first link

//                         return (
//                           <li className="submenu" key={title.label}>
//                             <Link
//                               to={title.submenu ? "#" : title.link || "#"}
//                               onClick={() =>
//                                 handleClick(
//                                   title.label,
//                                   title.themeSetting,
//                                   getLayoutClass(title.label)
//                                 )
//                               }
//                               className={`${
//                                 subOpen === title.label ? "subdrop" : ""
//                               } ${
//                                 title.link?.includes(Location.pathname)
//                                   ? "active"
//                                   : ""
//                               } ${
//                                 title.submenuItems
//                                   ?.map((link) => link.link)
//                                   .includes(Location.pathname) ||
//                                 title.link === Location.pathname
//                                   ? "active"
//                                   : "" || title.subLink1 === Location.pathname
//                                   ? "active"
//                                   : "" || title.subLink2 === Location.pathname
//                                   ? "active"
//                                   : "" || title.subLink3 === Location.pathname
//                                   ? "active"
//                                   : "" || title.subLink4 === Location.pathname
//                                   ? "active"
//                                   : "" || title.subLink5 === Location.pathname
//                                   ? "active"
//                                   : "" || title.subLink6 === Location.pathname
//                                   ? "active"
//                                   : "" || title.subLink7 === Location.pathname
//                                   ? "active"
//                                   : ""
//                               }`}
//                             >
//                               <i className={title.icon}></i>
//                               <span>{title.label}</span>
//                               {title.version && (
//                                 <span className="badge badge-primary badge-xs text-white fs-10 ms-auto">
//                                   {title.version}
//                                 </span>
//                               )}
//                               <span
//                                 className={title.submenu ? "menu-arrow" : ""}
//                               />
//                             </Link>
//                             {title.submenu && subOpen === title.label && (
//                               <ul
//                                 style={{
//                                   display:
//                                     subOpen === title.label ? "block" : "none",
//                                 }}
//                               >
//                                 {title.submenuItems?.map((item) => (
//                                   <li
//                                     className={
//                                       item.submenuItems
//                                         ? "submenu submenu-two"
//                                         : ""
//                                     }
//                                     key={item.label}
//                                   >
//                                     <Link
//                                       to={item.link || "#"}
//                                       className={`${
//                                         item.submenuItems
//                                           ?.map((link) => link.link)
//                                           .includes(Location.pathname) ||
//                                         item.link === Location.pathname
//                                           ? "active"
//                                           : "" ||
//                                             item.subLink1 === Location.pathname
//                                           ? "active"
//                                           : "" ||
//                                             item.subLink2 === Location.pathname
//                                           ? "active"
//                                           : "" ||
//                                             item.subLink3 === Location.pathname
//                                           ? "active"
//                                           : "" ||
//                                             item.subLink4 === Location.pathname
//                                           ? "active"
//                                           : "" ||
//                                             item.subLink5 === Location.pathname
//                                           ? "active"
//                                           : "" ||
//                                             item.subLink6 === Location.pathname
//                                           ? "active"
//                                           : ""
//                                       } ${
//                                         subsidebar === item.label
//                                           ? "subdrop"
//                                           : ""
//                                       }`}
//                                       onClick={() => {
//                                         toggleSubsidebar(item.label);
//                                       }}
//                                     >
//                                       {item.label}
//                                       <span
//                                         className={
//                                           item.submenu ? "menu-arrow" : ""
//                                         }
//                                       />
//                                     </Link>
//                                     {item.submenuItems && (
//                                       <ul
//                                         style={{
//                                           display:
//                                             subsidebar === item.label
//                                               ? "block"
//                                               : "none",
//                                         }}
//                                       >
//                                         {item.submenuItems.map((items) => (
//                                           <li key={items.label}>
//                                             <Link
//                                               to={items.link || "#"}
//                                               className={`${
//                                                 subsidebar === items.label
//                                                   ? "submenu-two subdrop"
//                                                   : "submenu-two"
//                                               } ${
//                                                 items.submenuItems
//                                                   ?.map((link) => link.link)
//                                                   .includes(
//                                                     Location.pathname
//                                                   ) ||
//                                                 items.link === Location.pathname
//                                                   ? "active"
//                                                   : ""
//                                               }`}
//                                             >
//                                               {items.label}
//                                             </Link>
//                                           </li>
//                                         ))}
//                                       </ul>
//                                     )}
//                                   </li>
//                                 ))}
//                               </ul>
//                             )}
//                           </li>
//                         );
//                       })}
//                     </ul>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           </div>
//         </Scrollbars>
//       </div>
//     </>
//   );
// };

// export default Sidebar;
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Scrollbars from "react-custom-scrollbars-2";
import { SidebarData } from "../../data/json/sidebarData"; // Adjust path as needed
import ImageWithBasePath from "../imageWithBasePath";
import "../../../style/icon/tabler-icons/webfont/tabler-icons.css";
import { setExpandMenu } from "../../data/redux/sidebarSlice";
import { useDispatch } from "react-redux";
import {
  resetAllMode,
  setDataLayout,
} from "../../data/redux/themeSettingSlice";
import usePreviousRoute from "./usePreviousRoute";

// Define types for SidebarData and its nested structures
interface SubMenuItem {
  label: string;
  link?: string; // Made optional to handle cases where link might not exist
  allowedRoles?: string[];
  submenuItems?: SubMenuItem[];
  subLink1?: string;
  subLink2?: string;
  subLink3?: string;
  subLink4?: string;
  subLink5?: string;
  subLink6?: string;
  subLink7?: string;
  icon?: string;
  version?: string;
  themeSetting?: boolean;
  submenu?: boolean;
  links?: string[];
}

interface SidebarItem {
  label: string;
  submenuOpen?: boolean;
  showSubRoute?: boolean;
  submenuHdr?: string;
  allowedRoles?: string[];
  submenuItems: SubMenuItem[];
}

interface User {
  role: string;
}

const Sidebar = () => {
  const Location = useLocation();
  const dispatch = useDispatch();
  const previousLocation = usePreviousRoute();

  // Get user role from localStorage
  const user: User = JSON.parse(localStorage.getItem("user") || JSON.stringify({ role: "student" }));
  const userRole = user.role;

  // Call SidebarData with userRole to get the filtered sidebar data
  const sidebarData: SidebarItem[] = SidebarData(userRole);

  const [subOpen, setSubopen] = useState<string>("");
  const [subsidebar, setSubsidebar] = useState<string>("");

  const toggleSidebar = (title: string) => {
    localStorage.setItem("menuOpened", title);
    setSubopen((prev) => (prev === title ? "" : title));
  };

  const toggleSubsidebar = (subitem: string) => {
    setSubsidebar((prev) => (prev === subitem ? "" : subitem));
  };

  const handleLayoutChange = (layout: string) => {
    dispatch(setDataLayout(layout));
  };

  const handleClick = (label: string, themeSetting?: boolean, layout?: string) => {
    toggleSidebar(label);
    if (themeSetting && layout) {
      handleLayoutChange(layout);
    }
  };

  const getLayoutClass = (label: string): string => {
    switch (label) {
      case "Default": return "default_layout";
      case "Mini": return "mini_layout";
      case "Box": return "boxed_layout";
      case "Dark": return "dark_data_theme";
      case "RTL": return "rtl";
      default: return "";
    }
  };

  useEffect(() => {
    const layoutPages = [
      "/layout-dark",
      "/layout-rtl",
      "/layout-mini",
      "/layout-box",
      "/layout-default",
    ];

    const isCurrentLayoutPage = layoutPages.some((path) =>
      Location.pathname.includes(path)
    );
    const isPreviousLayoutPage =
      previousLocation &&
      layoutPages.some((path) => previousLocation.pathname.includes(path));

    if (isPreviousLayoutPage && !isCurrentLayoutPage) {
      dispatch(resetAllMode());
    }
  }, [Location, previousLocation, dispatch]);

  useEffect(() => {
    setSubopen(localStorage.getItem("menuOpened") || "");
    const submenus = document.querySelectorAll(".submenu");
    submenus.forEach((submenu) => {
      const listItems = submenu.querySelectorAll("li");
      submenu.classList.remove("active");
      listItems.forEach((item) => {
        if (item.classList.contains("active")) {
          submenu.classList.add("active");
        }
      });
    });
  }, [Location.pathname]);

  const onMouseEnter = () => {
    dispatch(setExpandMenu(true));
  };

  const onMouseLeave = () => {
    dispatch(setExpandMenu(false));
  };

  return (
    <div
      className="sidebar"
      id="sidebar"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Scrollbars>
        <div className="sidebar-inner slimscroll">
          <div id="sidebar-menu" className="sidebar-menu">
            <ul>
              <li>
                <Link
                  to="#"
                  className="d-flex align-items-center border bg-white rounded p-2 mb-4"
                >
                  <ImageWithBasePath
                    src="assets/img/icons/global-img.svg"
                    className="avatar avatar-md img-fluid rounded"
                    alt="Profile"
                  />
                  <span className="text-dark ms-2 fw-normal">
                    Sector 144 Noida
                  </span>
                </Link>
              </li>
            </ul>

            <ul>
              {sidebarData.map((mainLabel, index) => (
                <li key={index}>
                  <h6 className="submenu-hdr">
                    <span>{mainLabel.label}</span>
                  </h6>
                  <ul>
                    {mainLabel.submenuItems.map((title, i) => {
                      const link_array: string[] = [];
                      if (title.submenuItems) {
                        title.submenuItems.forEach((link) => {
                          if (link.link) link_array.push(link.link);
                          if (link.submenuItems) {
                            link.submenuItems.forEach((item) => {
                              if (item.link) link_array.push(item.link);
                            });
                          }
                        });
                      }
                      title.links = link_array;

                      return (
                        <li className="submenu" key={title.label}>
                          <Link
                            to={title.submenu ? "#" : title.link || "#"}
                            onClick={() =>
                              handleClick(
                                title.label,
                                title.themeSetting,
                                getLayoutClass(title.label)
                              )
                            }
                            className={`${subOpen === title.label ? "subdrop" : ""} ${
                              title.links.includes(Location.pathname) ||
                              title.link === Location.pathname ||
                              [title.subLink1, title.subLink2, title.subLink3, title.subLink4, title.subLink5, title.subLink6, title.subLink7]
                                .filter(Boolean)
                                .includes(Location.pathname)
                                ? "active"
                                : ""
                            }`}
                          >
                            <i className={title.icon}></i>
                            <span>{title.label}</span>
                            {title.version && (
                              <span className="badge badge-primary badge-xs text-white fs-10 ms-auto">
                                {title.version}
                              </span>
                            )}
                            <span className={title.submenu ? "menu-arrow" : ""} />
                          </Link>
                          {title.submenu && subOpen === title.label && (
                            <ul style={{ display: "block" }}>
                              {title.submenuItems?.map((item) => (
                                <li
                                  className={item.submenuItems ? "submenu submenu-two" : ""}
                                  key={item.label}
                                >
                                  <Link
                                    to={item.link || "#"}
                                    className={`${subsidebar === item.label ? "subdrop" : ""} ${
                                      item.links?.includes(Location.pathname) ||
                                      item.link === Location.pathname ||
                                      [item.subLink1, item.subLink2, item.subLink3, item.subLink4, item.subLink5, item.subLink6]
                                        .filter(Boolean)
                                        .includes(Location.pathname)
                                        ? "active"
                                        : ""
                                    }`}
                                    onClick={() => toggleSubsidebar(item.label)}
                                  >
                                    {item.label}
                                    <span className={item.submenu ? "menu-arrow" : ""} />
                                  </Link>
                                  {item.submenuItems && subsidebar === item.label && (
                                    <ul style={{ display: "block" }}>
                                      {item.submenuItems.map((subItem) => (
                                        <li key={subItem.label}>
                                          <Link
                                            to={subItem.link || "#"}
                                            className={`submenu-two ${
                                              subItem.links?.includes(Location.pathname) ||
                                              subItem.link === Location.pathname
                                                ? "active"
                                                : ""
                                            }`}
                                          >
                                            {subItem.label}
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Scrollbars>
    </div>
  );
};

export default Sidebar;