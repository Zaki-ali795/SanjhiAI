import express from 'express';
import multer from 'multer';
import {
  sendOTPController,
  verifyOTPController,
  resendOTPController,
  loginWithPasswordController,
  getProfileController,
  setupProfileController,
  getSessionController,
  logoutController,
  uploadProfilePhotoController,
  submitCnicController,
  getCnicStatusController,
  scanCnicOcrController,
  getNotificationPrefsController,
  updateNotificationPrefsController,
  sendContactOTPController,
  verifyContactOTPController,
} from '../controller/authController.js';
import { requireAuth } from '../utilities/jwt.js';
import { getWhatsAppStatus } from '../utilities/whatsappGateway.js';

const router = express.Router();

// Multer — memory storage so we can write to disk in the controller
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed.'));
    }
  },
});

const uploadCnic = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, or WebP images are allowed for CNIC.'));
    }
  },
});

// WhatsApp Gateway Status
router.get('/whatsapp-status', (req, res) => {
  res.json(getWhatsAppStatus());
});

// SMTP Email Connection Status
router.get('/smtp-status', async (req, res) => {
  const { verifySmtpConnection } = await import('../utilities/otpService.js');
  const result = await verifySmtpConnection();
  res.json(result);
});

// Public OTP & Auth routes
router.post('/otp/send', sendOTPController);
router.post('/otp/verify', verifyOTPController);
router.post('/otp/resend', resendOTPController);
router.post('/login-password', loginWithPasswordController);

// Protected routes (Requires Bearer Token)
router.get('/profile', requireAuth, getProfileController);
router.put('/profile', requireAuth, setupProfileController);
router.patch('/profile', requireAuth, setupProfileController);
router.get('/session', requireAuth, getSessionController);
router.post('/logout', requireAuth, logoutController);

// Link Contact with OTP Verification
router.post('/contact/send-otp', requireAuth, sendContactOTPController);
router.post('/contact/verify-otp', requireAuth, verifyContactOTPController);

// Profile photo upload
router.post('/profile/photo', requireAuth, upload.single('photo'), uploadProfilePhotoController);

// CNIC verification
router.post('/cnic/scan-ocr', requireAuth, upload.single('image'), scanCnicOcrController);
router.post(
  '/cnic/submit',
  requireAuth,
  uploadCnic.fields([
    { name: 'front', maxCount: 1 },
    { name: 'back', maxCount: 1 },
  ]),
  submitCnicController
);
router.get('/cnic/status', requireAuth, getCnicStatusController);

// Notification preferences
router.get('/notification-preferences', requireAuth, getNotificationPrefsController);
router.put('/notification-preferences', requireAuth, updateNotificationPrefsController);

export default router;
