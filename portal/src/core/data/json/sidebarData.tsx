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
            
            // {
            //   label: "Student Promotion",
            //   link: routes.studentPromotion,
            //   allowedRoles: ["admin", "teacher"],
            // },

          ],
        },
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
      allowedRoles: ["admin", "teacher"],
      showSubRoute: false,
      submenuItems: [
        {
          label: "Fees Collection",
          icon: "ti ti-report-money",
          submenu: true,
          allowedRoles: ["admin"],
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
          allowedRoles: ["admin"],
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
        {
          label: "Expenses",
          link: routes.expenses,
          icon: "ti ti-wallet",
          showSubRoute: false,
          allowedRoles: ["admin"],

          submenu: false,
        },
        {
          label: "Income",
          link: routes.income,
          icon: "ti ti-cash",
          showSubRoute: false,
          allowedRoles: ["admin"],

          submenu: false,
        },
        // {
        //   label: "Albums",
        //   link: routes.albums,
        //   icon: "ti ti-photo",
        //   allowedRoles: ["admin", "teacher"],
        //   showSubRoute: false,
        //   submenu: false,
        // },
        {
          label: "Media",
          icon: "ti ti-photo",
          submenu: true,
          allowedRoles: ["admin", "teacher"],
          showSubRoute: false,
          submenuItems: [
            { label: "Albums", link: routes.albums },
            { label: "Advertisement", link: routes.advertisement },
            { label: "Stories", link: routes.stories },
            { label: "Videos", link: routes.videos },
          ],
        },
      ],
    },
    {
      label: "HRM",
      submenuOpen: true,
      submenuHdr: "HRM",
      allowedRoles: ["admin", "teacher"],
      showSubRoute: false,
      submenuItems: [
        {
          label: "Student Attendance",
          icon: "ti ti-calendar-share",
          submenu: false,
          showSubRoute: false,
          allowedRoles: ["admin", "teacher"],
          link: routes.studentAttendance,
        },
        {
          label: "Staff Attendance",
          icon: "ti ti-calendar-share",
          submenu: false,
          showSubRoute: false,
          link: routes.staffAttendance,
          allowedRoles: ["admin"],
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
       
      ],
    },
    {
      label: "REPORTS",
      submenuOpen: true,
      submenuHdr: "Reports",
      allowedRoles: ["admin", "teacher"],
      showSubRoute: false,
      submenuItems: [
        {
          label: "Student",
          icon: "ti ti-calendar-share",
          submenu: true,
          showSubRoute: false,
          allowedRoles: ["admin", "teacher"],
          submenuItems: [
            {
              label: "Student Report",
              link: routes.studentReport,
              subLink1: routes.addStudent,
              subLink2: routes.editStudent,
            },
            { 
              label: "Student Attendance Report", 
              link: routes.studentAttendanceReport,
              allowedRoles: ["admin", "teacher"],
            },
          ],
        },
        {
          label: "Staff",
          icon: "ti ti-calendar-share",
          submenu: true,
          showSubRoute: false,
          allowedRoles: ["admin"],
          submenuItems: [
            { 
              label: "Staff Report", 
              allowedRoles: ["admin"],
              link: routes.teacherReport 
            },
            { 
              label: "Staff Attendance Report", 
              link: routes.teacherAttendanceReport,
              allowedRoles: ["admin"],
            },
          ],
        },
        {
          label: "Fees",
          icon: "ti ti-calendar-share",
          showSubRoute: false,
          allowedRoles: ["admin"],
          link:routes.feeReport
        },
        
        
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