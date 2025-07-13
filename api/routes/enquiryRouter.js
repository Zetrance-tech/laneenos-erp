import express from 'express';
import { getAllEnquiries, createEnquiry, getEnquiry, updateEnquiry, deleteEnquiry } from '../controllers/enquiryController.js';
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Get all enquiries
router.get('/', authMiddleware(["admin", "parent", "teacher"]), getAllEnquiries);

// Create a new enquiry
router.post('/create', authMiddleware(["admin", "parent", "teacher"]),createEnquiry);

// Get an enquiry by ID
router.get('/:id', authMiddleware(["admin", "parent", "teacher"]),getEnquiry);

// Update an enquiry by ID
router.put('/:id', authMiddleware(["admin", "parent", "teacher"]),updateEnquiry);

// Delete an enquiry by ID
router.delete('/:id',authMiddleware(["admin", "parent", "teacher"]), deleteEnquiry);

export default router;