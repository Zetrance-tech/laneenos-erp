import express from 'express';
import {
  createStory,
  getAllStories,
  getStoryById,
  updateStory,
  deleteStory,
  getAllStoriesForSuperadmin
} from '../controllers/storiesController.js';
import authMiddleware from '../middleware/auth.js';
import { storyUpload } from '../middleware/multer.js';

const router = express.Router();

// Routes for all authenticated users (admin, superadmin, teacher)
router.get('/', authMiddleware(['admin', 'superadmin', 'teacher']), getAllStories);
router.get('/:id', authMiddleware(['admin', 'superadmin', 'teacher']), getStoryById);
router.post('/', authMiddleware(['admin', 'superadmin', 'teacher']), storyUpload.array('pdf', 1), createStory);
router.put('/:id', authMiddleware(['admin', 'superadmin', 'teacher']), storyUpload.array('pdf', 1), updateStory);
router.delete('/:id', authMiddleware(['admin', 'superadmin', 'teacher']), deleteStory);

// Route for superadmin
router.get('/superadmin', authMiddleware(['admin', 'superadmin']), getAllStoriesForSuperadmin);

export default router;