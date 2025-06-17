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
} from '../controllers/feesTemplateController.js';

const router = express.Router();
import authMiddleware from '../middleware/auth.js';

router.post('/', authMiddleware(['admin']), createFeeTemplate);
router.get('/', authMiddleware(['admin', 'parent', 'teacher']), getAllFeeTemplates); 
router.get('/:id', authMiddleware(['admin', 'parent', 'teacher']), getFeeTemplateById);  
router.put('/:id', authMiddleware(['admin']), updateFeeTemplate);
router.delete('/:id', authMiddleware(['admin']), deleteFeeTemplate); 
router.get('/class/:classId', authMiddleware(['admin', 'parent', 'teacher']), getFeeTemplatesForClass); 
router.get('/classes/session/:sessionId', authMiddleware(['admin', 'parent', 'teacher']), getClassesBySession); 
router.post('/assign-fees-to-students', authMiddleware(['admin']), assignFeesToStudents);
router.get('/getTemplateInfoByClass/:sessionId', authMiddleware(['admin', 'parent', 'teacher']), getClassesWithTemplatesBySession);
router.get('/get-assigned-students/:templateId/:sessionId', authMiddleware(['admin', 'parent', 'teacher']), getAssignedStudents);
export default router;