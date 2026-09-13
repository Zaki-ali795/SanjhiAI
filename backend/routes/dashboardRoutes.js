import express from 'express';
import { requireAuth } from '../utilities/jwt.js';
import { getDashboardOverviewController, getTrustScoreBreakdown } from '../controller/dashboardController.js';

const router = express.Router();

// GET /api/dashboard - Get authenticated user's dashboard overview data
router.get('/', requireAuth, getDashboardOverviewController);

// GET /api/dashboard/trust-score - Component breakdown + recent score events
router.get('/trust-score', requireAuth, getTrustScoreBreakdown);

export default router;
