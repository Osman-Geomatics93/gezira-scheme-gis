import express from 'express';
import {
  getAllSectors,
  getSectorById,
  getSectorsByDivision,
  createSector,
  updateSector,
  deleteSector,
  getSectorHistory,
  batchUpdateSectors
} from '../controllers/sectorsController.js';
import { authenticate, canEdit, isAdmin } from '../middleware/auth.js';
import { dataLimiter } from '../middleware/rateLimiter.js';
import { limitPagination } from '../middleware/dataProtection.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Public (authenticated) routes - all users can view
// Apply strict rate limiting and pagination limits to data endpoints
router.get('/', dataLimiter, limitPagination, getAllSectors);
router.get('/:id', getSectorById);
router.get('/division/:division', dataLimiter, limitPagination, getSectorsByDivision);
router.get('/:id/history', getSectorHistory);

// Editor and admin routes - can create and update
router.post('/', canEdit, createSector);
router.put('/:id', canEdit, updateSector);
router.post('/batch-update', canEdit, batchUpdateSectors);

// Admin only routes - can delete
router.delete('/:id', isAdmin, deleteSector);

export default router;
