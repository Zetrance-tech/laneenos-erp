// routes.js
import express from 'express';
import { addEvent, getAllEvents, getEventById ,deleteEvent, updateEvent} from '../controllers/eventController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.post('/add', authMiddleware(["admin", "parent", "teacher"]), addEvent);
router.get('/get', authMiddleware(["admin", "parent", "teacher"]), getAllEvents);
router.get('/get/:id', authMiddleware(["admin", "parent", "teacher"]), getEventById);
router.delete('/delete/:id', authMiddleware(["admin", "parent", "teacher"]), deleteEvent)
router.put('/update/:id', authMiddleware(["admin", "parent", "teacher"]), updateEvent)

export default router;