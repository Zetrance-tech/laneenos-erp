// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';

// // Ensure uploads directory exists
// const uploadsDir = path.join(process.cwd(), 'uploads');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir);
// }

// // Multer storage configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
//   }
// });

// // File filter for images only
// const fileFilter = (req, file, cb) => {
//   const filetypes = /jpeg|jpg|png/;
//   const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = filetypes.test(file.mimetype);

//   if (extname && mimetype) {
//     return cb(null, true);
//   }
//   cb(new Error('Only JPEG and PNG images are allowed'));
// };

// // Multer upload configuration
// export const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: fileFilter
// });


// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import Branch from '../models/branch.js'; // Import Branch model
// import Student from '../models/student.js'; // Import Student model
// import Teacher from '../models/teacher.js'; // Import Teacher model
// import Class from '../models/class.js'; // Import Class model

// // Create upload directories if they don't exist
// const createUploadDirs = () => {
//   const dirs = [
//     'uploads/',
//     'uploads/students/',
//     'uploads/teachers/',
//     'uploads/albums/'
//   ];
  
//   dirs.forEach(dir => {
//     const fullPath = path.join(process.cwd(), dir);
//     if (!fs.existsSync(fullPath)) {
//       fs.mkdirSync(fullPath, { recursive: true });
//     }
//   });
// };

// // Initialize upload directories
// createUploadDirs();

// // Helper function to sanitize filename
// const sanitizeFilename = (str) => {
//   return str.replace(/[^a-zA-Z0-9-_]/g, '');
// };

// // Student profile photo storage
// const studentStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/students/');
//   },
//   filename: async (req, file, cb) => {
//     try {
//       const admissionNumber = req.params.admissionNumber || req.body.admissionNumber;
//       const { branchId } = req.user;
//       console.log('Admission Number:', admissionNumber, 'Branch ID:', branchId); // Log inputs
//       const branch = await Branch.findById(branchId);
//       const student = await Student.findOne({ admissionNumber, branchId });
//       const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
//       const studentAdmissionNumber = student ? sanitizeFilename(student.admissionNumber) : sanitizeFilename(admissionNumber);
//       const filename = `student-profile-photo-${branchName}-${studentAdmissionNumber}${path.extname(file.originalname)}`;
//       console.log('Generated filename:', filename); // Log filename
//       cb(null, filename);
//     } catch (error) {
//       console.error('Error generating student filename:', error);
//       const fallbackFilename = `student-profile-photo-${Date.now()}${path.extname(file.originalname)}`;
//       cb(null, fallbackFilename);
//     }
//   }
// });
// // Teacher profile photo storage
// const teacherStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/teachers/');
//   },
//   filename: async (req, file, cb) => {
//     try {
//       const staffId = req.params.id || req.body.id;
//       const { branchId } = req.user;
      
//       // Get branch and teacher info
//       const branch = await Branch.findById(branchId);
//       const teacher = await Teacher.findOne({ id: staffId, branchId });
      
//       const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
//       const teacherStaffId = teacher ? sanitizeFilename(teacher.id) : sanitizeFilename(staffId);
      
//       const filename = `staff-profile-photo-${branchName}-${teacherStaffId}${path.extname(file.originalname)}`;
//       cb(null, filename);
//     } catch (error) {
//       console.error('Error generating teacher filename:', error);
//       const fallbackFilename = `staff-profile-photo-${Date.now()}${path.extname(file.originalname)}`;
//       cb(null, fallbackFilename);
//     }
//   }
// });

// // Album storage
// const albumStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/albums/');
//   },
//   filename: async (req, file, cb) => {
//     try {
//       const classId = req.body.classId;
//       const { branchId } = req.user;
      
//       // Get class info
//       const classInfo = await Class.findOne({ _id: classId, branchId });
      
//       const className = classInfo ? sanitizeFilename(classInfo.name) : 'unknown';
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      
//       const filename = `album-${className}-${uniqueSuffix}${path.extname(file.originalname)}`;
//       cb(null, filename);
//     } catch (error) {
//       console.error('Error generating album filename:', error);
//       const fallbackFilename = `album-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
//       cb(null, fallbackFilename);
//     }
//   }
// });

// // File filter for images only
// const imageFileFilter = (req, file, cb) => {
//   const filetypes = /jpeg|jpg|png|gif|webp/;
//   const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = filetypes.test(file.mimetype);

//   if (extname && mimetype) {
//     return cb(null, true);
//   }
//   cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
// };

// // Specific upload configurations
// export const studentUpload = multer({
//   storage: studentStorage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for students
//   fileFilter: imageFileFilter
// });

// export const teacherUpload = multer({
//   storage: teacherStorage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for teachers
//   fileFilter: imageFileFilter
// });

// export const albumUpload = multer({
//   storage: albumStorage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for albums
//   fileFilter: imageFileFilter
// });

// // Generic upload (fallback)
// export const upload = multer({
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
//     }
//   }),
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: imageFileFilter
// });

// // Dynamic upload with custom naming
// export const dynamicUpload = multer({
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       let uploadPath = 'uploads/';
      
//       if (req.originalUrl.includes('/student')) {
//         uploadPath = 'uploads/students/';
//       } else if (req.originalUrl.includes('/teacher')) {
//         uploadPath = 'uploads/teachers/';
//       } else if (req.originalUrl.includes('/album')) {
//         uploadPath = 'uploads/albums/';
//       }
      
//       cb(null, uploadPath);
//     },
//     filename: async (req, file, cb) => {
//       try {
//         let filename = '';
        
//         if (req.originalUrl.includes('/student')) {
//           // Student filename logic
//           const admissionNumber = req.params.admissionNumber || req.body.admissionNumber;
//           console.log("_________________________________", admissionNumber)
//           const { branchId } = req.user;
          
//           const branch = await Branch.findById(branchId);
//           const student = await Student.findOne({ admissionNumber, branchId });
          
//           const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
//           const studentAdmissionNumber = student ? sanitizeFilename(student.admissionNumber) : sanitizeFilename(admissionNumber);
          
//           filename = `student-profile-photo-${branchName}-${studentAdmissionNumber}${path.extname(file.originalname)}`;
          
//         } else if (req.originalUrl.includes('/teacher')) {
//           // Teacher filename logic
//           const staffId = req.params.id || req.body.id;
//           const { branchId } = req.user;
//           console.log("StaffID", staffId)
//           const branch = await Branch.findById(branchId);
//           const teacher = await Teacher.findOne({ id: staffId, branchId });
          
//           const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
//           const teacherStaffId = teacher ? sanitizeFilename(teacher.id) : sanitizeFilename(staffId);
          
//           filename = `staff-profile-photo-${branchName}-${teacherStaffId}${path.extname(file.originalname)}`;
          
//         } else if (req.originalUrl.includes('/album')) {
//           // Album filename logic
//           const classId = req.body.classId;
//           const { branchId } = req.user;
          
//           const classInfo = await Class.findOne({ _id: classId, branchId });
//           const className = classInfo ? sanitizeFilename(classInfo.name) : 'unknown';
//           const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          
//           filename = `album-${className}-${uniqueSuffix}${path.extname(file.originalname)}`;
          
//         } else {
//           // Fallback
//           const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//           filename = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
//         }
        
//         cb(null, filename);
//       } catch (error) {
//         console.error('Error generating dynamic filename:', error);
//         const fallbackFilename = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
//         cb(null, fallbackFilename);
//       }
//     }
//   }),
//   limits: { fileSize: 10 * 1024 * 1024 },
//   fileFilter: imageFileFilter
// });

// // Error handling middleware
// export const handleMulterError = (error, req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ message: 'File size too large' });
//     }
//     if (error.code === 'LIMIT_FILE_COUNT') {
//       return res.status(400).json({ message: 'Too many files' });
//     }
//     if (error.code === 'LIMIT_UNEXPECTED_FILE') {
//       return res.status(400).json({ message: 'Unexpected file field' });
//     }
//   }
//   if (error.message === 'Only image files (JPEG, PNG, GIF, WebP) are allowed') {
//     return res.status(400).json({ message: error.message });
//   }
//   next(error);
// };






import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Branch from '../models/branch.js'; // Import Branch model
import Student from '../models/student.js'; // Import Student model
import Teacher from '../models/teacher.js'; // Import Teacher model
import Class from '../models/class.js'; // Import Class model

// Define the root uploads directory (one level up from api)
const uploadsRoot = path.join(process.cwd(), '..', 'uploads');

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    uploadsRoot,
    path.join(uploadsRoot, 'students'),
    path.join(uploadsRoot, 'teachers'),
    path.join(uploadsRoot, 'albums')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize upload directories
createUploadDirs();

// Helper function to sanitize filename
const sanitizeFilename = (str) => {
  return str.replace(/[^a-zA-Z0-9-_]/g, '');
};

// Student profile photo storage
const studentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsRoot, 'students'));
  },
  filename: async (req, file, cb) => {
    try {
      const admissionNumber = req.params.admissionNumber || req.body.admissionNumber;
      const { branchId } = req.user;
      console.log('Admission Number:', admissionNumber, 'Branch ID:', branchId); // Log inputs
      const branch = await Branch.findById(branchId);
      const student = await Student.findOne({ admissionNumber, branchId });
      const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
      const studentAdmissionNumber = student ? sanitizeFilename(student.admissionNumber) : sanitizeFilename(admissionNumber);
      const filename = `student-profile-photo-${branchName}-${studentAdmissionNumber}${path.extname(file.originalname)}`;
      console.log('Generated filename:', filename); // Log filename
      cb(null, filename);
    } catch (error) {
      console.error('Error generating student filename:', error);
      const fallbackFilename = `student-profile-photo-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, fallbackFilename);
    }
  }
});

// Teacher profile photo storage
const teacherStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsRoot, 'teachers'));
  },
  filename: async (req, file, cb) => {
    try {
      const staffId = req.params.id || req.body.id;
      const { branchId } = req.user;
      
      // Get branch and teacher info
      const branch = await Branch.findById(branchId);
      const teacher = await Teacher.findOne({ id: staffId, branchId });
      
      const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
      const teacherStaffId = teacher ? sanitizeFilename(teacher.id) : sanitizeFilename(staffId);
      
      const filename = `staff-profile-photo-${branchName}-${teacherStaffId}${path.extname(file.originalname)}`;
      cb(null, filename);
    } catch (error) {
      console.error('Error generating teacher filename:', error);
      const fallbackFilename = `staff-profile-photo-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, fallbackFilename);
    }
  }
});

// Album storage
const albumStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsRoot, 'albums'));
  },
  filename: async (req, file, cb) => {
    try {
      const classId = req.body.classId;
      const { branchId } = req.user;
      
      // Get class info
      const classInfo = await Class.findOne({ _id: classId, branchId });
      
      const className = classInfo ? sanitizeFilename(classInfo.name) : 'unknown';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      
      const filename = `album-${className}-${uniqueSuffix}${path.extname(file.originalname)}`;
      cb(null, filename);
    } catch (error) {
      console.error('Error generating album filename:', error);
      const fallbackFilename = `album-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, fallbackFilename);
    }
  }
});

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
};

// Specific upload configurations
export const studentUpload = multer({
  storage: studentStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for students
  fileFilter: imageFileFilter
});

export const teacherUpload = multer({
  storage: teacherStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for teachers
  fileFilter: imageFileFilter
});

export const albumUpload = multer({
  storage: albumStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for albums
  fileFilter: imageFileFilter
});

// Generic upload (fallback)
export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsRoot);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

// Dynamic upload with custom naming
export const dynamicUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath = uploadsRoot;
      
      if (req.originalUrl.includes('/student')) {
        uploadPath = path.join(uploadsRoot, 'students');
      } else if (req.originalUrl.includes('/teacher')) {
        uploadPath = path.join(uploadsRoot, 'teachers');
      } else if (req.originalUrl.includes('/album')) {
        uploadPath = path.join(uploadsRoot, 'albums');
      }
      
      cb(null, uploadPath);
    },
    filename: async (req, file, cb) => {
      try {
        let filename = '';
        
        if (req.originalUrl.includes('/student')) {
          // Student filename logic
          const admissionNumber = req.params.admissionNumber || req.body.admissionNumber;
          console.log("_________________________________", admissionNumber);
          const { branchId } = req.user;
          
          const branch = await Branch.findById(branchId);
          const student = await Student.findOne({ admissionNumber, branchId });
          
          const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
          const studentAdmissionNumber = student ? sanitizeFilename(student.admissionNumber) : sanitizeFilename(admissionNumber);
          
          filename = `student-profile-photo-${branchName}-${studentAdmissionNumber}${path.extname(file.originalname)}`;
          
        } else if (req.originalUrl.includes('/teacher')) {
          // Teacher filename logic
          const staffId = req.params.id || req.body.id;
          const { branchId } = req.user;
          console.log("StaffID", staffId);
          const branch = await Branch.findById(branchId);
          const teacher = await Teacher.findOne({ id: staffId, branchId });
          
          const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
          const teacherStaffId = teacher ? sanitizeFilename(teacher.id) : sanitizeFilename(staffId);
          
          filename = `staff-profile-photo-${branchName}-${teacherStaffId}${path.extname(file.originalname)}`;
          
        } else if (req.originalUrl.includes('/album')) {
          // Album filename logic
          const classId = req.body.classId;
          const { branchId } = req.user;
          
          const classInfo = await Class.findOne({ _id: classId, branchId });
          const className = classInfo ? sanitizeFilename(classInfo.name) : 'unknown';
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          
          filename = `album-${className}-${uniqueSuffix}${path.extname(file.originalname)}`;
          
        } else {
          // Fallback
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          filename = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
        }
        
        cb(null, filename);
      } catch (error) {
        console.error('Error generating dynamic filename:', error);
        const fallbackFilename = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, fallbackFilename);
      }
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

// Error handling middleware
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field' });
    }
  }
  if (error.message === 'Only image files (JPEG, PNG, GIF, WebP) are allowed') {
    return res.status(400).json({ message: error.message });
  }
  next(error);
};