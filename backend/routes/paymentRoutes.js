import express from 'express';
import { getMyPayments } from '../controller/paymentController.js';
import { requireAuth } from '../utilities/jwt.js';

const router = express.Router();

router.get('/my', requireAuth, getMyPayments);

export default router;
