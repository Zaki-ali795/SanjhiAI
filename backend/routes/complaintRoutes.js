/**
 * complaintRoutes.js — User-facing complaint filing and retrieval routes.
 */

import { Router } from 'express';
import { requireAuth } from '../utilities/jwt.js';
import { fileComplaint, getMyComplaints, getComplaintById, searchReportableUsers } from '../controller/complaintController.js';

const router = Router();

// GET /api/complaints/search-users — Search reportable users by name/phone/email
router.get('/search-users', requireAuth, searchReportableUsers);

// POST /api/complaints — File a new complaint or report (triggers AI investigation)
router.post('/', requireAuth, fileComplaint);

// GET /api/complaints/my — Get user's own complaints
router.get('/my', requireAuth, getMyComplaints);

// GET /api/complaints/:id — Get specific complaint with case file
router.get('/:id', requireAuth, getComplaintById);

export default router;
