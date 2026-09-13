import express from 'express';
import multer from 'multer';
import {
  createCommittee,
  getMyCommittees,
  getCommittee,
  parseCommitteeAIAudio,
  parseCommitteeAIText,
  getCommitteeByCode,
  joinByCode,
  getJoinRequests,
  updateMemberRequestStatus,
  addMemberDirectly,
  searchUsers,
  updateCommittee,
  updateCommitteeStatus,
  getCollectionAccount,
  upsertCollectionAccount,
  regenerateInviteCode,
  promoteCoOrganizer,
  demoteCoOrganizer,
  removeMember,
  submitPayment,
  getCyclePayments,
  confirmPayment,
  releasePayout,
  getPublicCommittees,
  requestPublicToggle,
  approvePublicToggle,
} from '../controller/committeeController.js';
import { requireAuth } from '../utilities/jwt.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// AI Natural Language Parsing
router.post('/parse-ai-audio', upload.single('audio'), parseCommitteeAIAudio);
router.post('/parse-ai-text', parseCommitteeAIText);

// Protected routes
router.post('/', requireAuth, createCommittee);
router.get('/', requireAuth, getMyCommittees);
router.get('/public', requireAuth, getPublicCommittees);
router.get('/:id', requireAuth, getCommittee);
router.get('/code/:code', getCommitteeByCode);

// Public/private toggle with co-organizer approval
router.post('/:id/request-public-toggle', requireAuth, requestPublicToggle);
router.post('/:id/approve-public-toggle', requireAuth, approvePublicToggle);
router.get('/:id/members/requests', requireAuth, getJoinRequests);
router.get('/:id/members/search-users', requireAuth, searchUsers);
router.post('/:id/members/add', requireAuth, addMemberDirectly);
router.post('/join', requireAuth, joinByCode);
router.patch('/:id/members/:memberId/approve', requireAuth, (req, res) => { req.body.status = 'approved'; updateMemberRequestStatus(req, res); });
router.patch('/:id/members/:memberId/reject', requireAuth, (req, res) => { req.body.status = 'rejected'; updateMemberRequestStatus(req, res); });
router.patch('/:id/requests/:memberId', requireAuth, updateMemberRequestStatus);

// Settings & lifecycle (organizer / co-organizer)
router.patch('/:id', requireAuth, updateCommittee);
router.patch('/:id/status', requireAuth, updateCommitteeStatus);
router.get('/:id/collection-account', requireAuth, getCollectionAccount);
router.post('/:id/collection-account', requireAuth, upsertCollectionAccount);
router.post('/:id/invite/regenerate', requireAuth, regenerateInviteCode);
router.post('/:id/co-organizers', requireAuth, promoteCoOrganizer);
router.delete('/:id/co-organizers/:coOrganizerId', requireAuth, demoteCoOrganizer);
router.delete('/:id/members/:memberId', requireAuth, removeMember);

// Payments
router.get('/:id/cycles/:cycleId/payments', requireAuth, getCyclePayments);
router.post('/:id/cycles/:cycleId/payments', requireAuth, submitPayment);
router.patch('/:id/cycles/:cycleId/payments/:paymentId/confirm', requireAuth, confirmPayment);
router.post('/:id/cycles/:cycleId/payout/release', requireAuth, releasePayout);

export default router;
