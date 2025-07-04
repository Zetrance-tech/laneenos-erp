// import express from 'express';
// import {
//   createFeeTemplate,
//   getAllFeeTemplates,
//   getFeeTemplateById,
//   updateFeeTemplate,
//   deleteFeeTemplate,
//   getClassesBySession,
//   getFeeTemplatesForClass,
// } from '../controllers/feesTemplateController.js';
// import authMiddleware from '../middleware/auth.js';

// const router = express.Router();

// // CRUD Routes for FeeTemplate
// router.post('/', authMiddleware(["admin", "parent", "teacher"]), createFeeTemplate);
// router.get('/', authMiddleware(["admin", "parent", "teacher"]), getAllFeeTemplates); 
// router.get('/:id', authMiddleware(["admin", "parent", "teacher"]), getFeeTemplateById);  
// router.put('/:id', authMiddleware(["admin", "parent", "teacher"]), updateFeeTemplate);
// router.delete('/:id', authMiddleware(["admin", "parent", "teacher"]), deleteFeeTemplate); 
// router.get('/class/:classId', authMiddleware(["admin", "parent", "teacher"]), getFeeTemplatesForClass); 
// router.get('/classes/session/:sessionId', authMiddleware(["admin", "parent", "teacher"]), getClassesBySession); 

// export default router;

import express from 'express';
import {
  createFeeTemplate,
  getAllFeeTemplates,
  getFeeTemplateById,
  updateFeeTemplate,
  deleteFeeTemplate,
  getClassesBySession,
  getFeeTemplatesForClass,
  assignFeesToStudents,
  getClassesWithTemplatesBySession,
  getAssignedStudents,
  getStudentFees
} from '../controllers/feesTemplateController.js';

const router = express.Router();

// CRUD Routes for FeeTemplate
router.post('/', createFeeTemplate);
router.get('/', getAllFeeTemplates); 
router.get('/:id', getFeeTemplateById);  
router.put('/:id', updateFeeTemplate);
router.delete('/:id', deleteFeeTemplate); 
router.get('/class/:classId', getFeeTemplatesForClass); 
router.get('/classes/session/:sessionId', getClassesBySession); 
router.post("/assign-fees-to-students", assignFeesToStudents);
router.get("/getTemplateInfoByClass/:sessionId", getClassesWithTemplatesBySession)
router.get('/get-assigned-students/:templateId/:sessionId', getAssignedStudents);
router.get("/student-fees/:studentId/:sessionId", getStudentFees);

export default router;