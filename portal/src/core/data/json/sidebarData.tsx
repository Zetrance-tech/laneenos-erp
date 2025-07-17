import { all_routes } from "../../../feature-module/router/all_routes";
const routes = all_routes;

// Helper function to get the correct dashboard link based on role
const getDashboardLink = (role: string) => {
  switch (role.toLowerCase()) {  // Make case-insensitive
    case "admin":
      return routes.adminDashboard;
    case "teacher":
      return routes.teacherDashboard;
    case "student":
      return routes.studentDashboard;
    case "parent":
      return routes.parentDashboard;
    case "superadmin":
      return routes.superAdminDashboard;
    default:
      return routes.studentDashboard;
  }
};

// Improved recursive filtering function
const filterMenuItems = (items: any[], userRole: string) => {
  return items
    .filter(item => {
      // If no allowedRoles specified, show the item
      if (!item.allowedRoles) return true;
      
      // Check if userRole is in allowedRoles (case-insensitive)
      return item.allowedRoles.some((role: string) => 
        role.toLowerCase() === userRole.toLowerCase()
      );
    })
    .map(item => {
      // Clone the item to avoid mutation
      const newItem = {...item};
      
      // Recursively filter submenuItems if they exist
      if (newItem.submenuItems) {
        newItem.submenuItems = filterMenuItems(newItem.submenuItems, userRole);
        
        // If submenuItems becomes empty, remove the parent item if it's a submenu container
        if (newItem.submenuItems.length === 0 && newItem.submenu) {
          return null;
        }
      }
      
      return newItem;
    })
    .filter(item => item !== null); // Remove null items
};

export const SidebarData = (userRole: string) => {
  // Convert userRole to lowercase for consistent comparison
  const normalizedUserRole = userRole.toLowerCase();

  const allSections = [
    {
      label: "MAIN",
      submenuOpen: true,
      showSubRoute: false,
      submenuHdr: "Main",
      submenuItems: [
        {
          label: `${normalizedUserRole.charAt(0).toUpperCase() + normalizedUserRole.slice(1)} Dashboard`,
          icon: "ti ti-layout-dashboard",
          link: getDashboardLink(normalizedUserRole),
          submenu: false,
          showSubRoute: false,
          allowedRoles: [normalizedUserRole],
        },
          // {
        //   label: "Application",
        //   icon: "ti ti-layout-list",
        //   submenu: true,
        //   showSubRoute: false,
        //   submenuItems: [
        //     {
        //       label: "Chat",
        //       link: routes.chat,
        //       showSubRoute: false,
        //     },
        //     {
        //       label: "Call",
        //       link: routes.audioCall,
        //       showSubRoute: false,
        //     },
        //     {
        //       label: "Calendar",
        //       link: routes.calendar,
        //       showSubRoute: false,
        //     },
        //     {
        //       label: "Email",
        //       link: routes.email,
        //       showSubRoute: false,
        //     },
        //     {
        //       label: "To Do",
        //       link: routes.todo,
        //       showSubRoute: false,
        //     },
        //     {
        //       label: "Notes",
        //       link: routes.notes,
        //       showSubRoute: false,
        //     },
        //     {
        //       label: "File Manager",
        //       link: routes.fileManager,
        //       showSubRoute: false,
        //     },
        //   ],
        // },
      ],
    },
    {
      label: "Management",
      submenuOpen: false,
      showSubRoute: false,
      allowedRoles: ["superadmin"],
      submenuItems: [
        {
          label: "Branch Management",
          icon: "ti ti-building-bank",
          submenu: true,
          submenuHdr: "Branch Management",
          showSubRoute: false,
          allowedRoles: ["superadmin"],
          submenuItems: [
            {
              label: "Add Branch",
              icon: "ti ti-building-bank",
              submenu: false,
              link: routes.addBranch,
              showSubRoute: false,
              allowedRoles: ["superadmin"],
            },
            {
              label: "Add Admin",
              icon: "ti ti-user-plus",
              submenu: false,
              link: routes.addAdmin,
              showSubRoute: false,
              allowedRoles: ["superadmin"],
            },
            {
              label: "Assign Admin",
              icon: "ti ti-user-check",
              link: routes.assignAdmin,
              submenu: false,
              showSubRoute: false,
              allowedRoles: ["superadmin"],
            },
          ],
        },
        {
          label: "Students",
          link: routes.students,
          icon: "ti ti-backpack",
          showSubRoute: false,
          allowedRoles: ["superadmin"],
        },
        {
          label: "Staff",
          link: routes.staffs,
          icon: "ti ti-chalkboard",
          showSubRoute: false,
          allowedRoles: ["superadmin"],
        },
      ],
    },
    
    {
      label: "Academic",
      submenuOpen: true,
      showSubRoute: false,
      submenuHdr: "Academic",
      allowedRoles: ["admin", "teacher"],
      submenuItems: [
        {
          label: "Classes",
          icon: "ti ti-school-bell",
          submenu: true,
          showSubRoute: false,
          allowedRoles: ["admin"],
          submenuItems: [
            { label: "Sessions", link: routes.session },
            { label: "All Classes", link: routes.classes },
          ],
        },
        // {
        //   label: "Class Room",
        //   link: routes.classRoom,
        //   icon: "ti ti-building",
        //   showSubRoute: false,
        //   submenu: false,
        // },
        // {
        //   label: "Class Routine",
        //   link: routes.classRoutine,
        //   icon: "ti ti-bell-school",
        //   showSubRoute: false,
        //   submenu: false,
        // },
        // {
        //   label: "Section",
        //   link: routes.classSection,
        //   icon: "ti ti-square-rotated-forbid-2",
        //   showSubRoute: false,
        //   submenu: false,
        // },
        // {
        //   label: "Subject",
        //   link: routes.classSubject,
        //   icon: "ti ti-book",
        //   showSubRoute: false,
        //   submenu: false,
        // },
        // {
        //   label: "Syllabus",
        //   link: routes.classSyllabus,
        //   icon: "ti ti-book-upload",
        //   showSubRoute: false,
        //   submenu: false,
        // },
        {
          label: "Planner",
          link: routes.classTimetable,
          icon: "ti ti-table",
          showSubRoute: false,
          submenu: false,
          allowedRoles: ["admin", "teacher"],
        },
        {
          label: "Home Work",
          link: routes.classHomeWork,
          icon: "ti ti-license",
          showSubRoute: false,
          submenu: false,
          allowedRoles: ["admin", "teacher"],
        },
        {
          label: "Consents",
          link: routes.consents,
          icon: "ti ti-clipboard-data",
          showSubRoute: false,
          submenu: false,
          allowedRoles: ["admin", "teacher"],
        },
        {
          label: "Meals",
          link: routes.meals,
          icon: "ti ti-lifebuoy",
          showSubRoute: false,
          submenu: false,
          allowedRoles: ["admin"],
        },
        // {
        //   label: "Examinations",
        //   icon: "ti ti-hexagonal-prism-plus",
        //   submenu: true,
        //   showSubRoute: false,
        //   submenuItems: [
        //     { label: "Exam", link: routes.exam },
        //     { label: "Exam Schedule", link: routes.examSchedule },
        //     { label: "Grade", link: routes.grade },
        //     { label: "Exam Attendance", link: routes.examAttendance },
        //     { label: "Exam Results", link: routes.examResult },
        //   ],
        // },
        // {
        //   label: "Reasons",
        //   link: routes.AcademicReason,
        //   icon: "ti ti-lifebuoy",
        //   showSubRoute: false,
        //   submenu: false,
        // },
      ],
    },
    {
      label: "Peoples",
      submenuOpen: true,
      showSubRoute: false,
      submenuHdr: "Peoples",
      allowedRoles: ["admin", "teacher"],
      submenuItems: [
        {
          label: "Students",
          icon: "ti ti-school",
          submenu: true,
          showSubRoute: false,
          allowedRoles: ["admin", "teacher"],
          submenuItems: [
            {
              label: "All Students",
              link: routes.studentGrid,
              subLink1: routes.addStudent,
              subLink2: routes.editStudent,
            },
            { label: "Students List", link: routes.studentList },
            // {
            //   label: "Students Details",
            //   link: routes.studentDetail,
            //   allowedRoles: ["admin", "teacher"],
            //   subLink1: routes.studentLibrary,
            //   subLink2: routes.studentResult,
            //   subLink3: routes.studentFees,
            //   subLink4: routes.studentLeaves,
            //   subLink5: routes.studentTimeTable,
            // },
            {
              label: "Student Promotion",
              link: routes.studentPromotion,
              allowedRoles: ["admin", "teacher"],
            },
          ],
        },
          // {
        //   label: "Parents",
        //   icon: "ti ti-user-bolt",
        //   showSubRoute: false,
        //   submenu: true,
        //   submenuItems: [
        //     { label: "All Parents", link: routes.parentGrid },
        //     { label: "Parents List", link: routes.parentList },
        //   ],
        // },
        // {
        //   label: "Guardians",
        //   icon: "ti ti-user-shield",
        //   showSubRoute: false,
        //   submenu: true,
        //   submenuItems: [
        //     { label: "All Guardians", link: routes.guardiansGrid },
        //     { label: "Guardians List", link: routes.guardiansList },
        //   ],
        // },
        {
          label: "Staff",
          icon: "ti ti-users",
          submenu: true,
          showSubRoute: false,
          allowedRoles: ["admin"],
          submenuItems: [
            {
              label: "All Staff",
              link: routes.teacherGrid,
              subLink1: routes.addTeacher,
              subLink2: routes.editTeacher,
            },
            { label: "Staff List", link: routes.teacherList },
             // {
            //   label: "Teacher Details",
            //   link: routes.teacherDetails,
            //   allowedRoles: ["admin", "teacher"],
            //   subLink1: routes.teacherLibrary,
            //   subLink2: routes.teacherSalary,
            //   subLink3: routes.teacherLeaves,
            // },
            // { label: "Routine", link: routes.teachersRoutine, allowedRoles: ["admin", "teacher"], },
          ],
        },
        {
          label: "Change Password",
          icon: "ti ti-school",
          // submenu: true,
          // showSubRoute: false,
          link: routes.changePassword,
          allowedRoles: ["admin"],
          // submenuItems: [
          //   {
          //     label: "All Students",
          //     link: routes.studentGrid,
          //     subLink1: routes.addStudent,
          //     subLink2: routes.editStudent,
          //   },
          // ],
        },
      ],
    },
    {
      label: "MANAGEMENT",
      submenuOpen: true,
      submenuHdr: "Management",
      allowedRoles: ["admin"],
      showSubRoute: false,
      submenuItems: [
        {
          label: "Fees Collection",
          icon: "ti ti-report-money",
          submenu: true,
          showSubRoute: false,
          submenuItems: [
            { label: "Fees Group", link: routes.feesGroup },
            { label: "Fees Concession", link: routes.feesType },
            { label: "Fees Structure", link: routes.feesStructure },
            // { label: "Fees Master", link: routes.feesMaster },
            { label: "Fees Manager", link: routes.feesAssign },
            { label: "Fees Generation", link: routes.generateFees },
            { label: "Fees Collection", link: routes.collectFees },
            { label: "Fees Details", link: routes.feedetails },
          ],
        },
        {
          label: "CCTV",
          icon: "ti ti-camera",
          submenu: true,
          showSubRoute: false,
          allowedRoles: ["admin"],
          submenuItems: [
            { label: "CCTV Details", link: routes.cctvDetails },
            { label: "CCTV Access", link: routes.cctvList },
          ],
        },
        {
          label: "Enquiries",
          icon: "ti ti-message",
          submenu: true,
          showSubRoute: false,
          link:routes.enquiry,
          submenuItems: [
            { 
              label: "Add Enquiry", 
              link: routes.enquiry,
              allowedRoles: ["admin"],
            },
            { 
              label: "Enquiry List", 
              link: routes.enquiryList,
              allowedRoles: ["admin"],
            },
          ],
        },
        // {
        //   label: "Library",
        //   icon: "ti ti-notebook",
        //   submenu: true,
        //   showSubRoute: false,
        //   submenuItems: [
        //     { label: "Library Members", link: routes.libraryMembers },
        //     { label: "Books", link: routes.libraryBooks },
        //     { label: "Issue Book", link: routes.libraryIssueBook },
        //     { label: "Return", link: routes.libraryReturn },
        //   ],
        // },
        {
          label: "Expenses",
          link: routes.expenses,
          icon: "ti ti-wallet",
          showSubRoute: false,
          submenu: false,
        },
        {
          label: "Income",
          link: routes.income,
          icon: "ti ti-wallet",
          showSubRoute: false,
          submenu: false,
        },
        // {
        //   label: "Players",
        //   link: routes.playerList,
        //   icon: "ti ti-play-football",
        //   showSubRoute: false,
        //   submenu: false,
        // },
        // {
        //   label: "Hostel",
        //   icon: "ti ti-building-fortress",
        //   submenu: true,
        //   showSubRoute: false,
        //   submenuItems: [
        //     { label: "Hostel List", link: routes.hostelList },
        //     { label: "Hostel Rooms", link: routes.hostelRoom },
        //     { label: "Room Type", link: routes.hostelType },
        //   ],
        // },
        // {
        //   label: "Transport",
        //   icon: "ti ti-bus",
        //   submenu: true,
        //   showSubRoute: false,
        //   submenuItems: [
        //     { label: "Routes", link: routes.transportRoutes },
        //     { label: "Pickup Points", link: routes.transportPickupPoints },
        //     { label: "Vehicle Drivers", link: routes.transportVehicleDrivers },
        //     { label: "Vehicle", link: routes.transportVehicle },
        //     { label: "Assign Vehicle", link: routes.transportAssignVehicle },
        //   ],
        // },
      ],
    },
    {
      label: "HRM",
      submenuOpen: true,
      submenuHdr: "HRM",
      allowedRoles: ["admin", "teacher"],
      showSubRoute: false,
      submenuItems: [
        // {
        //   label: "Staffs",
        //   link: routes.staff,
        //   subLink1: routes.addStaff,
        //   subLink2: routes.editStaff,
        //   icon: "ti ti-users-group",
        //   showSubRoute: false,
        //   submenu: false,
        //   allowedRoles: ["admin"],
        // },
        // {
        //   label: "Departments",
        //   link: routes.departments,
        //   icon: "ti ti-layout-distribute-horizontal",
        //   showSubRoute: false,
        //   submenu: false,
        //   allowedRoles: ["admin"],
        // },
        // {
        //   label: "Designation",
        //   link: routes.designation,
        //   icon: "ti ti-user-exclamation",
        //   showSubRoute: false,
        //   submenu: false,
        //   allowedRoles: ["admin"],
        // },
        {
          label: "Attendance",
          icon: "ti ti-calendar-share",
          submenu: true,
          showSubRoute: false,
          allowedRoles: ["admin", "teacher"],
          submenuItems: [
            { 
              label: "Student Attendance", 
              link: routes.studentAttendance,
              allowedRoles: ["admin", "teacher"],
            },
            // { 
            //   label: "Teacher Attendance", 
            //   link: routes.teacherAttendance,
            //   allowedRoles: ["admin"],
            // },
            { 
              label: "Staff Attendance", 
              link: routes.staffAttendance,
              allowedRoles: ["admin"],
            },
          ],
        },
        {
          label: "Leaves",
          icon: "ti ti-calendar-stats",
          submenu: true,
          showSubRoute: false,
          allowedRoles: ["admin", "teacher"],
          submenuItems: [
            // { label: "List of leaves", link: routes.listLeaves },
            { label: "Approve Request", link: routes.approveRequest },
          ],
        },
        // {
        //   label: "Holidays",
        //   link: routes.holidays,
        //   icon: "ti ti-briefcase",
        //   showSubRoute: false,
        //   allowedRoles: ["admin"],
        //   submenu: false,
        // },
        // {
        //   label: "Payroll",
        //   link: routes.payroll,
        //   icon: "ti ti-moneybag",
        //   showSubRoute: false,
        //   submenu: false,
        //   allowedRoles: ["admin"],
        // },
      ],
    },
    {
      label: "Announcements",
      submenuOpen: true,
      submenuHdr: "Announcements",
      allowedRoles: ["admin", "teacher"],
      showSubRoute: false,
      submenuItems: [
        {
          label: "Communication Board",
          link: routes.noticeBoard,
          icon: "ti ti-clipboard-data",
          showSubRoute: false,
          submenu: false,
        },
        // {
        //   label: "Events",
        //   link: routes.events,
        //   icon: "ti ti-calendar-question",
        //   showSubRoute: false,
        //   submenu: false,
        // },
        {
          label: "Messages",
          icon: "ti ti-report-money",
          submenu: true,
          allowedRoles: ["admin", "teacher"],
          showSubRoute: false,
          submenuItems: [
            { label: "Compose", link: routes.compose },
            { label: "Inbox", link: routes.inbox },
            { label: "Sent", link: routes.sent },
          ],
        },
      ],
    },
  ];

  // Apply the filtering
  return filterMenuItems(allSections, normalizedUserRole);
};