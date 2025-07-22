import express from 'express';
import { 
  getParentAdvertisements 
} from '../controllers/advertisementController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware(["parent"]), getParentAdvertisements);

export default router;