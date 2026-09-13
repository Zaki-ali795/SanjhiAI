import express from 'express';
import { getUserActivities } from '../controller/activityController.js';
import { requireAuth } from '../utilities/jwt.js';

const router = express.Router();

// Protected route to fetch unified activities
router.get('/', requireAuth, getUserActivities);

export default router;
