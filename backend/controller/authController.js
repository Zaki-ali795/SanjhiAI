import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';
import { generateOTPCode, sendOTP, sendLoginNotificationEmail } from '../utilities/otpService.js';
import { signToken } from '../utilities/jwt.js';
import Groq from 'groq-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directories exist
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads/profile-photos');
const CNIC_UPLOADS_DIR = path.join(__dirname, '../../public/uploads/cnic');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(CNIC_UPLOADS_DIR, { recursive: true });


const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

/**
 * Helper to determine if target is email or phone
 */
function parseTarget(target) {
  if (!target || typeof target !== 'string') return null;
  const cleaned = target.trim();
  if (cleaned.includes('@')) {
    return { type: 'email', value: cleaned.toLowerCase() };
  }
  // Basic phone sanitization
  const phone = cleaned.replace(/[^\d+]/g, '');
  return { type: 'phone', value: phone };
}

/**
 * POST /api/auth/otp/send
 * Sends OTP to phone or email for signup or login
 */
export async function sendOTPController(req, res) {
  try {
    const { target, purpose = 'signup' } = req.body;
    const parsed = parseTarget(target);

    if (!parsed || !parsed.value) {
      return res.status(400).json({ error: 'Valid phone number or email address is required' });
    }

    // Login and Password Reset require an existing registered account
    if (purpose === 'login' || purpose === 'password_reset') {
      const userSearchQuery = parsed.type === 'email'
        ? `SELECT id FROM users WHERE email = $1`
        : `SELECT id FROM users WHERE phone_number = $1`;
      const userRes = await query(userSearchQuery, [parsed.value]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({
          error: 'This email or phone number is not registered yet. Please complete your registration details first.',
          unregistered: true,
          target: parsed.value,
          targetType: parsed.type,
        });
      }
    }

    const rawCode = generateOTPCode();
    const codeHash = await bcrypt.hash(rawCode, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate existing active OTPs for this target
    await query(
      `UPDATE otps SET used_at = NOW() WHERE target = $1 AND used_at IS NULL`,
      [parsed.value]
    );

    // Store new OTP in DB
    await query(
      `INSERT INTO otps (target, code_hash, purpose, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [parsed.value, codeHash, purpose, expiresAt]
    );

    // Trigger Email/SMS dispatch (fire in background with fast delivery so client never times out)
    sendOTP(parsed.value, rawCode).catch((err) => {
      console.warn('⚠️ [OTP Dispatch Background Error]:', err.message);
    });

    return res.status(200).json({
      message: `OTP sent successfully to ${parsed.value}`,
      target: parsed.value,
      purpose,
      channel: parsed.type === 'email' ? 'email' : 'whatsapp',
    });
  } catch (error) {
    console.error('Error in sendOTPController:', error);
    return res.status(500).json({ error: 'Failed to send OTP code. Please try again.' });
  }
}

/**
 * POST /api/auth/otp/verify
 * Verifies OTP code, creates/finds user, issues JWT session
 */
export async function verifyOTPController(req, res) {
  try {
    const { target, code, purpose = 'signup', firebaseVerified = false } = req.body;
    const parsed = parseTarget(target);

    if (!parsed || !parsed.value) {
      return res.status(400).json({ error: 'Valid target (phone or email) is required' });
    }

    if (!firebaseVerified) {
      if (!code) {
        return res.status(400).json({ error: 'Verification code is required' });
      }

      // Fetch active OTP record
      const otpResult = await query(
        `SELECT * FROM otps 
         WHERE target = $1 AND used_at IS NULL AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [parsed.value]
      );

      if (otpResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired OTP code. Please request a new one.' });
      }

      const otpRecord = otpResult.rows[0];

      // A password-reset code must have been issued as one
      if (purpose === 'password_reset' && otpRecord.purpose !== 'password_reset') {
        return res.status(400).json({ error: 'This code was not issued for password reset. Please request a new code.' });
      }

      if (otpRecord.attempt_count >= MAX_ATTEMPTS) {
        await query(`UPDATE otps SET used_at = NOW() WHERE id = $1`, [otpRecord.id]);
        return res.status(429).json({ error: 'Maximum verification attempts exceeded. Please request a new code.' });
      }

      // Compare code
      const isMatch = await bcrypt.compare(code.toString().trim(), otpRecord.code_hash);

      if (!isMatch) {
        await query(`UPDATE otps SET attempt_count = attempt_count + 1 WHERE id = $1`, [otpRecord.id]);
        return res.status(400).json({ error: 'Incorrect verification code. Please check and try again.' });
      }

      // Mark OTP as used
      await query(`UPDATE otps SET used_at = NOW() WHERE id = $1`, [otpRecord.id]);
    }

    // Check if user already exists in DB

    const isEmail = parsed.type === 'email';
    const userSearchQuery = isEmail
      ? `SELECT u.*, (a.user_id IS NOT NULL) AS is_admin
         FROM users u LEFT JOIN admins a ON a.user_id = u.id
         WHERE u.email = $1`
      : `SELECT u.*, (a.user_id IS NOT NULL) AS is_admin
         FROM users u LEFT JOIN admins a ON a.user_id = u.id
         WHERE u.phone_number = $1`;

    let userResult = await query(userSearchQuery, [parsed.value]);
    let user = userResult.rows[0];
    let isNew = false;

    // Never create an account through the forgot-password flow
    if (!user && purpose === 'password_reset') {
      return res.status(404).json({ error: 'No account found with this email/phone number.' });
    }

    // Create user if signing up and not found
    if (!user) {
      isNew = true;
      const defaultName = isEmail ? parsed.value.split('@')[0] : `User_${parsed.value.slice(-4)}`;
      const passwordHash = req.body.password ? await bcrypt.hash(req.body.password, 10) : null;

      const insertUserQuery = isEmail
        ? `INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING *`
        : `INSERT INTO users (full_name, phone_number, password_hash) VALUES ($1, $2, $3) RETURNING *`;

      const newUserRes = await query(insertUserQuery, [defaultName, parsed.value, passwordHash]);
      user = newUserRes.rows[0];

      // Initialize notification preferences
      await query(
        `INSERT INTO notification_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
        [user.id]
      );
    }


    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      phone: user.phone_number,
      fullName: user.full_name,
    });

    // Create session record
    const refreshTokenHash = await bcrypt.hash(token.slice(-10), 10);
    await query(
      `INSERT INTO sessions (user_id, refresh_token_hash, device_info)
       VALUES ($1, $2, $3)`,
      [user.id, refreshTokenHash, req.headers['user-agent'] || 'Web Browser']
    );

    return res.status(200).json({
      message: 'Authentication successful',
      token,
      isNew,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        is_admin: Boolean(user.is_admin),
        age: user.age,
        sex: user.sex,
        profile_photo_url: user.profile_photo_url,
      },
    });
  } catch (error) {
    console.error('Error in verifyOTPController:', error);
    return res.status(500).json({ error: 'Verification failed. Internal server error.' });
  }
}

/**
 * POST /api/auth/otp/resend
 */
export async function resendOTPController(req, res) {
  return sendOTPController(req, res);
}

/**
 * GET /api/auth/profile
 */
export async function getProfileController(req, res) {
  try {
    const userRes = await query(
      `SELECT id, full_name, age, sex, profile_photo_url, phone_number, email, created_at,
              cnic_number, cnic_front_url, cnic_back_url, cnic_status,
              cnic_submitted_at, cnic_verified_at, cnic_rejection_reason
       FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(444).json({ error: 'User profile not found' });
    }

    return res.status(200).json(userRes.rows[0]);
  } catch (error) {
    console.error('Error in getProfileController:', error);
    return res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
}

/**
 * PUT /api/auth/profile
 */
export async function setupProfileController(req, res) {
  try {
    const { full_name, age, sex, profile_photo_url, password } = req.body;
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const updateRes = await query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           age = COALESCE($2, age),
           sex = COALESCE($3, sex),
           profile_photo_url = COALESCE($4, profile_photo_url),
           password_hash = COALESCE($5, password_hash),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, full_name, age, sex, profile_photo_url, phone_number, email`,
      [full_name, age, sex, profile_photo_url, passwordHash, req.user.userId]
    );

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Error in setupProfileController:', error);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
}


/**
 * POST /api/auth/profile/photo
 * Handles multer-uploaded profile photo, saves to disk, updates DB URL.
 */
export async function uploadProfilePhotoController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file received.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const filename = `${req.user.userId}-${Date.now()}${ext}`;
    const destPath = path.join(UPLOADS_DIR, filename);

    // Write buffer to disk
    fs.writeFileSync(destPath, req.file.buffer);

    const photoUrl = `/uploads/profile-photos/${filename}`;

    // Persist in DB
    await query(
      `UPDATE users SET profile_photo_url = $1, updated_at = NOW() WHERE id = $2`,
      [photoUrl, req.user.userId]
    );

    return res.status(200).json({
      message: 'Profile photo updated successfully',
      profile_photo_url: photoUrl,
    });
  } catch (error) {
    console.error('Error in uploadProfilePhotoController:', error);
    return res.status(500).json({ error: 'Failed to upload profile photo.' });
  }
}

/**
 * Validates Pakistani CNIC format: XXXXX-XXXXXXX-X
 */
function isValidCnicFormat(cnic) {
  return /^\d{5}-\d{7}-\d{1}$/.test(cnic);
}

async function getAutoVerifyCnicSetting() {
  try {
    const result = await query(`SELECT auto_verify_cnic FROM platform_settings WHERE id = 1`);
    if (result.rows.length > 0) {
      return result.rows[0].auto_verify_cnic === true;
    }
  } catch (err) {
    // ignore
  }
  return true; // default to auto-verify for smoother onboarding
}

/**
 * POST /api/auth/cnic/submit
 * Submits CNIC number + front/back images for verification.
 */
export async function submitCnicController(req, res) {
  try {
    const { cnic_number } = req.body;
    const userId = req.user.userId;

    if (!cnic_number || !isValidCnicFormat(cnic_number)) {
      return res.status(400).json({ error: 'CNIC must be in format XXXXX-XXXXXXX-X' });
    }

    const files = req.files || {};
    const frontFile = files.front?.[0];
    const backFile = files.back?.[0];

    if (!frontFile || !backFile) {
      return res.status(400).json({ error: 'Both CNIC front and back images are required.' });
    }

    const frontExt = path.extname(frontFile.originalname).toLowerCase() || '.jpg';
    const backExt = path.extname(backFile.originalname).toLowerCase() || '.jpg';

    const frontFilename = `${userId}-cnic-front-${Date.now()}${frontExt}`;
    const backFilename = `${userId}-cnic-back-${Date.now()}${backExt}`;

    fs.writeFileSync(path.join(CNIC_UPLOADS_DIR, frontFilename), frontFile.buffer);
    fs.writeFileSync(path.join(CNIC_UPLOADS_DIR, backFilename), backFile.buffer);

    const autoVerify = await getAutoVerifyCnicSetting();
    const status = autoVerify ? 'verified' : 'pending';
    const now = new Date();

    const updateRes = await query(
      `UPDATE users
       SET cnic_number = $1,
           cnic_front_url = $2,
           cnic_back_url = $3,
           cnic_status = $4,
           cnic_submitted_at = $5,
           cnic_verified_at = CASE WHEN $4 = 'verified' THEN $5 ELSE NULL END,
           cnic_rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $6
       RETURNING cnic_number, cnic_front_url, cnic_back_url, cnic_status, cnic_submitted_at, cnic_verified_at`,
      [
        cnic_number,
        `/uploads/cnic/${frontFilename}`,
        `/uploads/cnic/${backFilename}`,
        status,
        now,
        userId,
      ]
    );

    return res.status(200).json({
      message: autoVerify ? 'CNIC submitted and auto-verified.' : 'CNIC submitted for review.',
      cnic: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Error in submitCnicController:', error);
    return res.status(500).json({ error: 'Failed to submit CNIC.' });
  }
}

/**
 * GET /api/auth/cnic/status
 * Returns current user's CNIC verification status.
 */
export async function getCnicStatusController(req, res) {
  try {
    const result = await query(
      `SELECT cnic_number, cnic_front_url, cnic_back_url, cnic_status,
              cnic_submitted_at, cnic_verified_at, cnic_rejection_reason
       FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ cnic: result.rows[0] });
  } catch (error) {
    console.error('Error in getCnicStatusController:', error);
    return res.status(500).json({ error: 'Failed to fetch CNIC status.' });
  }
}

/**
 * POST /api/auth/cnic/scan-ocr
 * Runs AI Vision OCR on uploaded CNIC front card image buffer to auto-extract CNIC number & details.
 */
export async function scanCnicOcrController(req, res) {
  try {
    const file = req.file || (req.files && (req.files.image?.[0] || req.files.front?.[0]));
    if (!file || !file.buffer) {
      return res.status(400).json({ error: 'CNIC card image is required for OCR scanning.' });
    }

    const mimeType = file.mimetype || 'image/jpeg';
    const base64Data = file.buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    let extractedCnic = null;
    let extractedName = null;
    let confidence = 0.95;

    const apiKey = process.env.GROQ_API_KEY;

    if (apiKey && apiKey !== 'your_groq_api_key_here' && apiKey.trim() !== '') {
      try {
        const groq = new Groq({ apiKey });
        const completion = await groq.chat.completions.create({
          model: 'llama-3.2-11b-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this image of a Pakistani CNIC card (National Identity Card). 
Extract the following information:
1. cnic_number: The 13-digit Pakistani CNIC number formatted as XXXXX-XXXXXXX-X (e.g. 35201-1234567-1).
2. full_name: The holder's full name in English if visible.

Return ONLY a valid JSON object with keys "cnic_number" and "full_name". Do not include any extra markdown formatting outside the JSON.`
                },
                {
                  type: 'image_url',
                  image_url: { url: dataUri }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_completion_tokens: 300,
        });

        const rawContent = completion.choices[0]?.message?.content || '';
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.cnic_number && isValidCnicFormat(parsed.cnic_number)) {
            extractedCnic = parsed.cnic_number;
          }
          if (parsed.full_name) {
            extractedName = parsed.full_name;
          }
        }
      } catch (visionErr) {
        console.warn('Groq Vision OCR warning (falling back to pattern scan):', visionErr.message);
      }
    }

    // Fallback: If Vision AI didn't find format or key was missing, attempt binary text buffer matching if any 13-digit sequence exists
    if (!extractedCnic) {
      const strContent = file.buffer.toString('binary');
      const digitMatch = strContent.match(/(\d{5})[-.\s]?(\d{7})[-.\s]?(\d{1})/);
      if (digitMatch) {
        extractedCnic = `${digitMatch[1]}-${digitMatch[2]}-${digitMatch[3]}`;
        confidence = 0.8;
      }
    }

    if (!extractedCnic) {
      return res.status(200).json({
        success: false,
        message: 'Could not automatically detect CNIC number from image. Please enter manually.',
      });
    }

    return res.status(200).json({
      success: true,
      extracted: {
        cnic_number: extractedCnic,
        full_name: extractedName || undefined,
      },
      confidence,
    });
  } catch (error) {
    console.error('Error in scanCnicOcrController:', error);
    return res.status(500).json({ error: 'Failed to scan CNIC card image.' });
  }
}

/**
 * GET /api/auth/notification-preferences
 */
export async function getNotificationPrefsController(req, res) {
  try {
    const result = await query(
      `SELECT push_enabled, sms_enabled, whatsapp_enabled
       FROM notification_preferences WHERE user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      // Insert defaults if missing (e.g. legacy user)
      await query(
        `INSERT INTO notification_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
        [req.user.userId]
      );
      return res.status(200).json({ push_enabled: true, sms_enabled: true, whatsapp_enabled: true });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error in getNotificationPrefsController:', error);
    return res.status(500).json({ error: 'Failed to fetch notification preferences.' });
  }
}

/**
 * PUT /api/auth/notification-preferences
 */
export async function updateNotificationPrefsController(req, res) {
  try {
    const { push_enabled, sms_enabled, whatsapp_enabled } = req.body;

    const result = await query(
      `INSERT INTO notification_preferences (user_id, push_enabled, sms_enabled, whatsapp_enabled)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE
         SET push_enabled     = EXCLUDED.push_enabled,
             sms_enabled      = EXCLUDED.sms_enabled,
             whatsapp_enabled = EXCLUDED.whatsapp_enabled
       RETURNING push_enabled, sms_enabled, whatsapp_enabled`,
      [req.user.userId,
       push_enabled  !== undefined ? push_enabled  : true,
       sms_enabled   !== undefined ? sms_enabled   : true,
       whatsapp_enabled !== undefined ? whatsapp_enabled : true]
    );

    return res.status(200).json({
      message: 'Notification preferences updated',
      ...result.rows[0],
    });
  } catch (error) {
    console.error('Error in updateNotificationPrefsController:', error);
    return res.status(500).json({ error: 'Failed to update notification preferences.' });
  }
}

/**
 * POST /api/auth/contact/send-otp
 * Sends OTP to a new phone or email to link it to current authenticated user's account.
 */
export async function sendContactOTPController(req, res) {
  try {
    const { target } = req.body;
    const parsed = parseTarget(target);

    if (!parsed || !parsed.value) {
      return res.status(400).json({ error: 'Valid phone number or email address is required.' });
    }

    // Check if target is already used by another user
    const checkQuery = parsed.type === 'email'
      ? `SELECT id FROM users WHERE email = $1 AND id != $2`
      : `SELECT id FROM users WHERE phone_number = $1 AND id != $2`;
    const checkRes = await query(checkQuery, [parsed.value, req.user.userId]);

    if (checkRes.rows.length > 0) {
      return res.status(400).json({ error: `This ${parsed.type} is already registered to another account.` });
    }

    const rawCode = generateOTPCode();
    const codeHash = await bcrypt.hash(rawCode, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate existing active OTPs for this target
    await query(
      `UPDATE otps SET used_at = NOW() WHERE target = $1 AND used_at IS NULL`,
      [parsed.value]
    );

    // Store new OTP in DB
    await query(
      `INSERT INTO otps (target, code_hash, purpose, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [parsed.value, codeHash, 'signup', expiresAt]
    );

    // Dispatch OTP
    const dispatchResult = await sendOTP(parsed.value, rawCode);

    if (!dispatchResult.success) {
      return res.status(500).json({
        error: dispatchResult.error || 'Failed to send OTP code. Please try again.',
      });
    }

    return res.status(200).json({
      message: `OTP verification code sent to ${parsed.value}`,
      target: parsed.value,
      type: parsed.type,
      channel: dispatchResult.channel,
    });
  } catch (error) {
    console.error('Error in sendContactOTPController:', error);
    return res.status(500).json({ error: 'Failed to send OTP code. Please try again.' });
  }
}

/**
 * POST /api/auth/contact/verify-otp
 * Verifies OTP code and links the new phone or email to current user's profile.
 */
export async function verifyContactOTPController(req, res) {
  try {
    const { target, code } = req.body;
    const parsed = parseTarget(target);

    if (!parsed || !parsed.value || !code) {
      return res.status(400).json({ error: 'Target (phone or email) and verification code are required.' });
    }

    // Fetch active OTP record
    const otpResult = await query(
      `SELECT * FROM otps 
       WHERE target = $1 AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [parsed.value]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP code. Please request a new one.' });
    }

    const otpRecord = otpResult.rows[0];

    if (otpRecord.attempt_count >= MAX_ATTEMPTS) {
      await query(`UPDATE otps SET used_at = NOW() WHERE id = $1`, [otpRecord.id]);
      return res.status(429).json({ error: 'Maximum verification attempts exceeded. Please request a new code.' });
    }

    // Compare code
    const isMatch = await bcrypt.compare(code.toString().trim(), otpRecord.code_hash);

    if (!isMatch) {
      await query(`UPDATE otps SET attempt_count = attempt_count + 1 WHERE id = $1`, [otpRecord.id]);
      return res.status(400).json({ error: 'Incorrect verification code. Please try again.' });
    }

    // Mark OTP as used
    await query(`UPDATE otps SET used_at = NOW() WHERE id = $1`, [otpRecord.id]);

    // Update user's email or phone_number in users table
    const isEmail = parsed.type === 'email';
    const updateQuery = isEmail
      ? `UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, phone_number, age, sex, profile_photo_url`
      : `UPDATE users SET phone_number = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, phone_number, age, sex, profile_photo_url`;

    const updateRes = await query(updateQuery, [parsed.value, req.user.userId]);

    return res.status(200).json({
      message: `${isEmail ? 'Email' : 'Phone number'} verified and linked successfully!`,
      user: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Error in verifyContactOTPController:', error);
    return res.status(500).json({ error: 'Failed to verify and link contact.' });
  }
}

/**
 * POST /api/auth/login-password
 * Authenticates user via password directly.
 * Tracks failed attempts. If password fails 3 times, suggests/requires OTP login.
 */
export async function loginWithPasswordController(req, res) {
  try {
    const { target, password } = req.body;
    const parsed = parseTarget(target);

    if (!parsed || !parsed.value || !password) {
      return res.status(400).json({ error: 'Email/Phone and password are required.' });
    }

    const isEmail = parsed.type === 'email';
    const userSearchQuery = isEmail
      ? `SELECT u.*, (a.user_id IS NOT NULL) AS is_admin
         FROM users u LEFT JOIN admins a ON a.user_id = u.id
         WHERE u.email = $1`
      : `SELECT u.*, (a.user_id IS NOT NULL) AS is_admin
         FROM users u LEFT JOIN admins a ON a.user_id = u.id
         WHERE u.phone_number = $1`;

    const userRes = await query(userSearchQuery, [parsed.value]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found. Please check your credentials or sign up.' });
    }

    const user = userRes.rows[0];

    // If user has no password set (created via OTP signup)
    if (!user.password_hash) {
      return res.status(400).json({
        error: 'No password set for this account. Please use "Sign in with OTP".',
        requiresOTP: true,
      });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        error: 'Incorrect password. Please try again.',
        requiresOTP: false,
      });
    }

    // Password correct — Generate JWT token and session
    const token = signToken({
      userId: user.id,
      email: user.email,
      phone: user.phone_number,
      fullName: user.full_name,
    });

    const refreshTokenHash = await bcrypt.hash(token.slice(-10), 10);
    await query(
      `INSERT INTO sessions (user_id, refresh_token_hash, device_info)
       VALUES ($1, $2, $3)`,
      [user.id, refreshTokenHash, req.headers['user-agent'] || 'Web Browser']
    );

    // Send login notification email instead of OTP code
    if (user.email) {
      sendLoginNotificationEmail(user.email, user.full_name);
    }

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        is_admin: Boolean(user.is_admin),
        age: user.age,
        sex: user.sex,
        profile_photo_url: user.profile_photo_url,
      },
    });

  } catch (error) {
    console.error('Error in loginWithPasswordController:', error);
    return res.status(500).json({ error: 'Login failed. Internal server error.' });
  }
}

/**
 * GET /api/auth/session
 */
export async function getSessionController(req, res) {

  try {
    const userRes = await query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.profile_photo_url,
              u.cnic_number, u.cnic_front_url, u.cnic_back_url, u.cnic_status,
              u.cnic_submitted_at, u.cnic_verified_at, u.cnic_rejection_reason,
              (a.user_id IS NOT NULL) AS is_admin
       FROM users u
       LEFT JOIN admins a ON a.user_id = u.id
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const u = userRes.rows[0];
    return res.status(200).json({
      authenticated: true,
      user: {
        ...u,
        is_admin: Boolean(u.is_admin),
      },
    });
  } catch (error) {
    console.error('Error in getSessionController:', error);
    return res.status(500).json({ error: 'Failed to verify session' });
  }
}

/**
 * POST /api/auth/logout
 */
export async function logoutController(req, res) {
  try {
    await query(`UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`, [
      req.user.userId,
    ]);
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logoutController:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
}


