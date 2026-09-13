import express from 'express';
import {
  getOverview,
  getUsers,
  getUser,
  suspendUser,
  unsuspendUser,
  getCommittees,
  getCommittee,
  freezeCommittee,
  unfreezeCommittee,
  getComplaints,
  resolveComplaint,
  dismissComplaint,
  reinvestigateComplaint,
  getActivityLogs,
  getAnalytics,
  getPlatformSettings,
  updatePlatformSettings,
  getAnnouncements,
  createAnnouncement,
  getPendingCnicsController,
  verifyCnicController,
  rejectCnicController,
  getGlobalNotificationsController,
  recomputeTrustScores,
} from '../controller/adminController.js';
import { requireAdmin } from '../utilities/jwt.js';

const router = express.Router();

// Overview
router.get('/overview', requireAdmin, getOverview);

// Users
router.get('/users', requireAdmin, getUsers);
router.get('/users/:userId', requireAdmin, getUser);
router.post('/users/:userId/suspend', requireAdmin, suspendUser);
router.post('/users/:userId/unsuspend', requireAdmin, unsuspendUser);

// Committees / Pools
router.get('/committees', requireAdmin, getCommittees);
router.get('/committees/:committeeId', requireAdmin, getCommittee);
router.post('/committees/:committeeId/freeze', requireAdmin, freezeCommittee);
router.post('/committees/:committeeId/unfreeze', requireAdmin, unfreezeCommittee);

// Complaints / Disputes
router.get('/complaints', requireAdmin, getComplaints);
router.post('/complaints/:complaintId/resolve', requireAdmin, resolveComplaint);
router.post('/complaints/:complaintId/dismiss', requireAdmin, dismissComplaint);
router.post('/complaints/:complaintId/reinvestigate', requireAdmin, reinvestigateComplaint);

// Activity Logs
router.get('/logs', requireAdmin, getActivityLogs);

// Analytics
router.get('/analytics', requireAdmin, getAnalytics);

// Settings
router.get('/settings', requireAdmin, getPlatformSettings);
router.put('/settings', requireAdmin, updatePlatformSettings);

// Announcements / Broadcasts
router.get('/announcements', requireAdmin, getAnnouncements);
router.post('/announcements', requireAdmin, createAnnouncement);

// CNIC Verification
router.get('/cnic/pending', requireAdmin, getPendingCnicsController);
router.post('/cnic/:userId/verify', requireAdmin, verifyCnicController);
router.post('/cnic/:userId/reject', requireAdmin, rejectCnicController);

// Notifications Audit Feed
router.get('/notifications', requireAdmin, getGlobalNotificationsController);

// Trust Score
router.post('/trust-score/recompute', requireAdmin, recomputeTrustScores);

export default router;
