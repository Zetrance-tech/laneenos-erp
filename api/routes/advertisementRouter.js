import express from 'express';
import { 
  createAdvertisement, 
  getAllAdvertisements, 
  getAdvertisementById, 
  updateAdvertisement, 
  deleteAdvertisement,
  getAllAdvertisementsForSuperadmin 
} from '../controllers/advertisementController.js';
import authMiddleware from '../middleware/auth.js';
import { advertisementUpload } from '../middleware/multer.js';

const router = express.Router();

// Routes for all authenticated users (admin, superadmin, teacher)
router.get('/', authMiddleware(['admin', 'superadmin', 'teacher']), getAllAdvertisements);
router.get('/:id', authMiddleware(['admin', 'superadmin', 'teacher']), getAdvertisementById);
router.post('/', authMiddleware(['admin', 'superadmin', 'teacher']), advertisementUpload.single('image'), createAdvertisement);
router.put('/:id', authMiddleware(['admin', 'superadmin', 'teacher']), advertisementUpload.single('image'), updateAdvertisement);
router.delete('/:id', authMiddleware(['admin', 'superadmin', 'teacher']), deleteAdvertisement);

// Route for superadmin
router.get('/superadmin', authMiddleware(['admin', 'superadmin']), getAllAdvertisementsForSuperadmin);

export default router;