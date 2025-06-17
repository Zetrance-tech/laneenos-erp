import express from 'express';
import { getAllEnquiries, createEnquiry, getEnquiry, updateEnquiry, deleteEnquiry } from '../controllers/enquiryController.js';

const router = express.Router();

// Get all enquiries
router.get('/', getAllEnquiries);

// Create a new enquiry
router.post('/create', createEnquiry);

// Get an enquiry by ID
router.get('/:id', getEnquiry);

// Update an enquiry by ID
router.put('/:id', updateEnquiry);

// Delete an enquiry by ID
router.delete('/:id', deleteEnquiry);

export default router;