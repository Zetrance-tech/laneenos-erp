import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Branch from '../models/branch.js'; // Import Branch model
import Student from '../models/student.js'; // Import Student model
import Teacher from '../models/teacher.js'; // Import Teacher model
import Class from '../models/class.js'; // Import Class model
import User from '../models/user.js';
// Define the root uploads directory (one level up from api)
const uploadsRoot = path.join(process.cwd(), '..', 'uploads');

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    uploadsRoot,
    path.join(uploadsRoot, 'students'),
    path.join(uploadsRoot, 'students', 'documents'), // New directory for student documents
    path.join(uploadsRoot, 'teachers'),
    path.join(uploadsRoot, 'teachers', 'documents'),
    path.join(uploadsRoot, 'admins'),
    path.join(uploadsRoot, 'albums'),
    path.join(uploadsRoot, 'advertisements'),
    path.join(uploadsRoot, 'stories'),
    path.join(uploadsRoot, 'videos'),
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
  if (!str || typeof str !== 'string') return '';
  const cleaned = str.replace(/[^a-zA-Z0-9-_]/g, '');
  return cleaned || 'unknown';
};


// Student profile photo storage (unchanged)
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

// New: Student document storage
// Updated student document storage with improved logic
const studentDocStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsRoot, 'students', 'documents'));
  },
  filename: async (req, file, cb) => {
    try {
      // Use file.originalname as the primary document identifier (always available)
      const extension = path.extname(file.originalname).toLowerCase() || '.pdf';
      const baseNameRaw = path.parse(file.originalname).name;
      const baseName = sanitizeFilename(baseNameRaw) || 'document';

      // Get admission number from multiple sources with better fallback
      let admissionNumber = req.params.admissionNumber || req.body.admissionNumber;
      
      // If still not available, try to extract from route or other sources
      if (!admissionNumber && req.route && req.route.path) {
        const pathMatch = req.route.path.match(/:admissionNumber/);
        if (pathMatch && req.params) {
          admissionNumber = Object.values(req.params)[0];
        }
      }

      const { branchId } = req.user;
      
      // Get branch name
      const branch = await Branch.findById(branchId);
      const branchName = sanitizeFilename(branch?.name) || 'unknown';
      
      // Use admission number directly if available, otherwise generate a unique identifier
      let studentIdentifier = 'unknown';
      if (admissionNumber) {
        studentIdentifier = sanitizeFilename(admissionNumber);
      } else {
        // Create a temporary unique identifier based on user and timestamp
        studentIdentifier = `temp-${branchId?.toString().slice(-4) || 'user'}-${Date.now().toString().slice(-6)}`;
      }

      // Generate final filename with timestamp for uniqueness
      const timestamp = Date.now();
      const filename = `student-doc-${branchName}-${studentIdentifier}-${baseName}-${timestamp}${extension}`;

      console.log(`Generated student document filename: ${filename}`);
      cb(null, filename);
      
    } catch (error) {
      console.error('Error generating student document filename:', error);
      // Guaranteed fallback with meaningful name
      const timestamp = Date.now();
      const baseName = path.parse(file.originalname).name || 'document';
      cb(null, `student-doc-fallback-${sanitizeFilename(baseName)}-${timestamp}.pdf`);
    }
  }
});

const adminStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsRoot, 'admins'));
  },
  filename: async (req, file, cb) => {
    try {
      const { userId, branchId } = req.user;
      const branch = await Branch.findById(branchId);
      const user = await User.findById(userId);
      const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
      const adminEmail = user ? sanitizeFilename(user.email.split('@')[0]) : 'unknown';
      const filename = `admin-profile-photo-${branchName}-${adminEmail}${path.extname(file.originalname)}`;
      cb(null, filename);
    } catch (error) {
      console.error('Error generating admin filename:', error);
      const fallbackFilename = `admin-profile-photo-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, fallbackFilename);
    }
  }
});

// Teacher profile photo storage (unchanged)
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
const teacherDocStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsRoot, 'teachers', 'documents'));
  },
  filename: async (req, file, cb) => {
    try {
      let staffId = req.params.id || req.body.id;
      let docName = 'unknown-document';
      if (!req.fileCounter) {
        req.fileCounter = 0;
      }
      if (req.body.documentNames) {
        try {
          const documentNames = JSON.parse(req.body.documentNames);
          docName = documentNames[req.fileCounter]
            ? sanitizeFilename(documentNames[req.fileCounter]).toLowerCase()
            : docName;
        } catch (error) {
          console.warn('Failed to parse documentNames:', error.message);
        }
      }
      const { branchId } = req.user;
      const branch = await Branch.findById(branchId);
      const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
      let teacherIdentifier = 'unknown';
      if (staffId) {
        const teacher = await Teacher.findOne({ id: staffId, branchId });
        teacherIdentifier = teacher ? sanitizeFilename(teacher.id) : sanitizeFilename(staffId);
      } else {
        teacherIdentifier = `temp-${branchId?.toString().slice(-4) || 'user'}-${Date.now().toString().slice(-6)}`;
      }
      const timestamp = Date.now();
      const extension = path.extname(file.originalname).toLowerCase() || '.pdf';
      const filename = `teacher-doc-${branchName}-${teacherIdentifier}-${docName}-${timestamp}${extension}`;
      req.fileCounter += 1;
      console.log(`Generated teacher document filename: ${filename}`);
      cb(null, filename);
    } catch (error) {
      console.error('Error generating teacher document filename:', error);
      const timestamp = Date.now();
      cb(null, `teacher-doc-fallback-${timestamp}.pdf`);
    }
  }
});
// Album storage (unchanged)
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

// Advertisement storage (unchanged)
const advertisementStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsRoot, 'advertisements'));
  },
  filename: async (req, file, cb) => {
    try {
      const { branchId } = req.user;
      const adName = req.body.name;
      const branch = await Branch.findById(branchId);
      const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
      const adNameSanitized = adName ? sanitizeFilename(adName) : 'advertisement';
      const filename = `advertisement-${branchName}-${adNameSanitized}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, filename);
    } catch (error) {
      console.error('Error generating advertisement filename:', error);
      const fallbackFilename = `advertisement-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, fallbackFilename);
    }
  }
});

// Story storage (unchanged)
const storyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsRoot, 'stories'));
  },
  filename: async (req, file, cb) => {
    try {
      const { branchId } = req.user;
      const storyName = req.body.name;
      const branch = await Branch.findById(branchId);
      const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
      const storyNameSanitized = storyName ? sanitizeFilename(storyName) : 'story';
      const filename = `story-${branchName}-${storyNameSanitized}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, filename);
    } catch (error) {
      console.error('Error generating story filename:', error);
      const fallbackFilename = `story-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, fallbackFilename);
    }
  }
});

// Video storage (unchanged)
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadsRoot, 'videos'));
  },
  filename: async (req, file, cb) => {
    try {
      const classId = req.body.classId;
      const { branchId } = req.user;
      const classInfo = await Class.findOne({ _id: classId, branchId });
      const className = classInfo ? sanitizeFilename(classInfo.name) : 'unknown';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `video-${className}-${uniqueSuffix}${path.extname(file.originalname)}`;
      cb(null, filename);
    } catch (error) {
      console.error('Error generating video filename:', error);
      const fallbackFilename = `video-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, fallbackFilename);
    }
  }
});

// File filter for images only (unchanged)
const imageFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
};

// File filter for PDFs only (unchanged, but used for documents)
const pdfFileFilter = (req, file, cb) => {
  const filetypes = /pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === 'application/pdf';
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only PDF files are allowed'));
};

// File filter for videos only (unchanged)
const videoFileFilter = (req, file, cb) => {
  const filetypes = /mp4|mov|avi|wmv|mkv/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /^video\//.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only video files (MP4, MOV, AVI, WMV, MKV) are allowed'));
};

// Specific upload configurations (updated with studentDocUpload)
export const studentUpload = multer({
  storage: studentStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for students
  fileFilter: imageFileFilter
});
export const adminUpload = multer({
  storage: adminStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for admin photos
  fileFilter: imageFileFilter
});
export const studentDocUpload = multer({
  storage: studentDocStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB per file, max 5 files
  fileFilter: pdfFileFilter
}).array('documents'); // Allows multiple files under 'documents' field; optional (handles 0 files)

export const teacherUpload = multer({
  storage: teacherStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for teachers
  fileFilter: imageFileFilter
});

export const teacherDocUpload = multer({
  storage: teacherDocStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: pdfFileFilter
}).array('documents');

export const albumUpload = multer({
  storage: albumStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 10MB for albums
  fileFilter: imageFileFilter
});

export const advertisementUpload = multer({
  storage: advertisementStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 5MB for advertisements
  fileFilter: imageFileFilter
});

export const storyUpload = multer({
  storage: storyStorage,
  limits: { fileSize: 15 * 1024 * 1024, files: 1 }, // 5MB for stories, max 1 file
  fileFilter: pdfFileFilter
});

export const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 50 * 1024 * 1024, files: 1 }, // 50MB for videos, max 1 file
  fileFilter: videoFileFilter
});

// Generic upload (fallback, unchanged)
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (req.originalUrl.includes('/story')) {
      pdfFileFilter(req, file, cb);
    } else if (req.originalUrl.includes('/video')) {
      videoFileFilter(req, file, cb);
    } else {
      imageFileFilter(req, file, cb);
    }
  }
});

// Dynamic upload with custom naming (unchanged, but can be extended if needed)
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
      } else if (req.originalUrl.includes('/advertisement')) {
        uploadPath = path.join(uploadsRoot, 'advertisements');
      } else if (req.originalUrl.includes('/story')) {
        uploadPath = path.join(uploadsRoot, 'stories');
      } else if (req.originalUrl.includes('/video')) {
        uploadPath = path.join(uploadsRoot, 'videos');
      }
      cb(null, uploadPath);
    },
    filename: async (req, file, cb) => {
      try {
        let filename = '';
        if (req.originalUrl.includes('/student')) {
          // Student filename logic
          const admissionNumber = req.params.admissionNumber || req.body.admissionNumber;
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
        } else if (req.originalUrl.includes('/advertisement')) {
          // Advertisement filename logic
          const adName = req.body.name;
          const { branchId } = req.user;
          const branch = await Branch.findById(branchId);
          const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
          const adNameSanitized = adName ? sanitizeFilename(adName) : 'advertisement';
          filename = `advertisement-${branchName}-${adNameSanitized}-${Date.now()}${path.extname(file.originalname)}`;
        } else if (req.originalUrl.includes('/story')) {
          // Story filename logic
          const storyName = req.body.name;
          const { branchId } = req.user;
          const branch = await Branch.findById(branchId);
          const branchName = branch ? sanitizeFilename(branch.name) : 'unknown';
          const storyNameSanitized = storyName ? sanitizeFilename(storyName) : 'story';
          filename = `story-${branchName}-${storyNameSanitized}-${Date.now()}${path.extname(file.originalname)}`;
        } else if (req.originalUrl.includes('/video')) {
          const classId = req.body.classId;
          const { branchId } = req.user;
          const classInfo = await Class.findOne({ _id: classId, branchId });
          const className = classInfo ? sanitizeFilename(classInfo.name) : 'unknown';
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          filename = `video-${className}-${uniqueSuffix}${path.extname(file.originalname)}`;
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
  fileFilter: (req, file, cb) => {
    if (req.originalUrl.includes('/video')) {
      videoFileFilter(req, file, cb);
    } else if (req.originalUrl.includes('/story')) {
      pdfFileFilter(req, file, cb);
    } else {
      imageFileFilter(req, file, cb);
    }
  }
});

// Error handling middleware (unchanged)
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
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({ message: error.message });
  }
  if (error.message === 'Only video files (MP4, MOV, AVI, WMV, MKV) are allowed') {
    return res.status(400).json({ message: error.message });
  }
  next(error);
};
