import express from 'express';
import {
  handleAssistantChat,
  getConversations,
  getConversationMessages,
  deleteConversation,
  submitMessageFeedback,
  getTopics,
  listKbDocs,
  createKbDoc,
  updateKbDoc,
  deleteKbDoc,
  getKbAnalytics,
} from '../controller/assistantController.js';
import { requireAuth, requireAdmin } from '../utilities/jwt.js';

export default function(app) {
  // ── User-facing QA assistant ──
  const router = express.Router();
  router.post('/chat', requireAuth, handleAssistantChat);
  router.get('/conversations', requireAuth, getConversations);
  router.get('/conversations/:id/messages', requireAuth, getConversationMessages);
  router.delete('/conversations/:id', requireAuth, deleteConversation);
  router.post('/messages/:id/feedback', requireAuth, submitMessageFeedback);
  router.get('/topics', requireAuth, getTopics);
  app.use('/api/assistant', router);

  // ── Admin: knowledge base management ──
  const adminRouter = express.Router();
  adminRouter.get('/kb-docs/analytics', requireAdmin, getKbAnalytics);
  adminRouter.get('/kb-docs', requireAdmin, listKbDocs);
  adminRouter.post('/kb-docs', requireAdmin, createKbDoc);
  adminRouter.patch('/kb-docs/:id', requireAdmin, updateKbDoc);
  adminRouter.delete('/kb-docs/:id', requireAdmin, deleteKbDoc);
  app.use('/api/admin', adminRouter);
}
