import express from 'express';
import {
 getParentStories
} from '../controllers/storiesController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware(['parent']), getParentStories);


export default router;