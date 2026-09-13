import express from 'express';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import fs from 'fs';

// Force Node.js to use IPv4 by default (prevents ENETUNREACH on IPv6-unroutable networks)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
import { testConnection, query } from './config/db.js';
import { requireAuth } from './utilities/jwt.js';
import { initWhatsAppGateway } from './utilities/whatsappGateway.js';
import { initReminderScheduler } from './services/reminderScheduler.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import committeeRoutes from './routes/committeeRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import initAssistantRoutes from './routes/assistantRoutes.js';
import initNotificationRoutes from './routes/notificationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import { initQueue } from './utilities/complaintAgent/queue.js';
import { startSweeper } from './utilities/complaintAgent/sweeper.js';
import { processComplaint } from './utilities/complaintAgent/index.js';
import { ensureAssistantTables, seedDefaultKbDocs } from './assistant/schema.js';
import { ensureTrustScoreTables, backfillTrustEvents } from './utilities/trustScore.js';
import { verifySmtpConnection } from './utilities/otpService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Serve uploaded profile photos as static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));


// Auth Routes
app.use('/api/auth', authRoutes);

// Dashboard Routes
app.use('/api/dashboard', dashboardRoutes);

// Committee Routes
app.use('/api/committees', committeeRoutes);

// Payment Routes
app.use('/api/payments', paymentRoutes);

// Assistant Routes
initAssistantRoutes(app);

// Notification Routes
initNotificationRoutes(app);

// Activity Routes
app.use('/api/activities', activityRoutes);

// Admin Routes
app.use('/api/admin', adminRoutes);

// Complaint Routes (user-facing)
app.use('/api/complaints', complaintRoutes);


/**
 * Initializes the default Super Admin account on server startup.
 * Uses the `admins` table (per DDL schema) — NO is_admin column on users.
 * Also drops is_admin column if it was accidentally added previously.
 */
async function initDefaultAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@sanjhi.pk';
  const adminPhone = process.env.ADMIN_PHONE || '03000000000';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Sanjhi2026';

  // Step 1: Drop is_admin column from users if it exists (cleanup from previous approach)
  try {
    await query(`ALTER TABLE users DROP COLUMN IF EXISTS is_admin`);
    console.log('✅ [Admin Init] Cleaned up: dropped is_admin column from users (not in schema).');
  } catch (err) {
    // Ignore — may not exist or DB may restrict DDL
  }

  // Step 2: Hash password
  let passwordHash;
  try {
    passwordHash = await bcrypt.hash(adminPassword, 10);
  } catch (hashErr) {
    console.error('❌ [Admin Init] bcrypt hash failed:', hashErr.message);
    return;
  }

  // Step 3: Upsert admin user into `users` table
  let adminUser = null;
  try {
    const upsertRes = await query(
      `INSERT INTO users (full_name, email, phone_number, password_hash, is_suspended)
       VALUES ($1, $2, $3, $4, false)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             full_name = EXCLUDED.full_name
       RETURNING id, email, full_name`,
      ['Sanjhi Super Admin', adminEmail, adminPhone, passwordHash]
    );
    adminUser = upsertRes.rows[0];
    console.log(`✅ [Admin Init] Admin user in users table → id: ${adminUser.id}, email: ${adminUser.email}`);
  } catch (upsertErr) {
    console.error('❌ [Admin Init] users upsert failed:', upsertErr.message);
    return;
  }

  // Step 4: Ensure admin user has an entry in the `admins` table
  try {
    const adminRes = await query(
      `INSERT INTO admins (user_id, granted_by)
       VALUES ($1, NULL)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING id, user_id, granted_at`,
      [adminUser.id]
    );
    if (adminRes.rows.length > 0) {
      console.log(`✅ [Admin Init] Super Admin entry created in admins table → admin_id: ${adminRes.rows[0].id}`);
    } else {
      console.log(`ℹ️ [Admin Init] Super Admin already exists in admins table.`);
    }
  } catch (adminErr) {
    console.error('❌ [Admin Init] admins table insert failed:', adminErr.message);
  }
}

/**
 * Ensures the notification_channel enum includes 'in_app' (used by all
 * dashboard bell notifications). Idempotent — runs on every startup.
 * Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction block,
 * so we check pg_enum first and run it as a standalone statement.
 */
async function ensureInAppNotificationChannel() {
  try {
    const check = await query(
      `SELECT 1 FROM pg_enum
       WHERE enumlabel = 'in_app'
         AND enumtypid = 'notification_channel'::regtype`
    );
    if (check.rows.length === 0) {
      await query(`ALTER TYPE notification_channel ADD VALUE 'in_app'`);
      console.log("✅ [Schema] Added 'in_app' to notification_channel enum.");
    }
  } catch (err) {
    console.warn('⚠️ [Schema] notification_channel enum check failed:', err.message);
  }
}

/**
 * Ensures the complaints table has the ai_case_file JSONB column
 * for storing AI investigation case files. Idempotent — runs on every startup.
 */
async function ensureAiCaseFileColumn() {
  try {
    const check = await query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'complaints' AND column_name = 'ai_case_file'`
    );
    if (check.rows.length === 0) {
      await query(`ALTER TABLE complaints ADD COLUMN ai_case_file JSONB`);
      console.log('✅ [Schema] Added ai_case_file JSONB column to complaints table.');
    }
  } catch (err) {
    console.warn('⚠️ [Schema] ai_case_file column check failed:', err.message);
  }
}

/**
 * Ensures the complaint_status enum includes 'ai_resolved' and 'needs_human_review'
 * used by the AI Case-Builder Agent routing logic. Idempotent — runs on every startup.
 */
async function ensureComplaintStatusEnum() {
  const newValues = ['ai_resolved', 'needs_human_review'];
  for (const val of newValues) {
    try {
      const check = await query(
        `SELECT 1 FROM pg_enum WHERE enumlabel = $1 AND enumtypid = 'complaint_status'::regtype`,
        [val]
      );
      if (check.rows.length === 0) {
        await query(`ALTER TYPE complaint_status ADD VALUE '${val}'`);
        console.log(`\u2705 [Schema] Added '${val}' to complaint_status enum.`);
      }
    } catch (err) {
      console.warn(`\u26a0\ufe0f [Schema] complaint_status enum check for '${val}' failed:`, err.message);
    }
  }
}

/**
 * Ensures admin_action_logs table supports AI agent operations:
 * - Makes admin_id nullable (SYSTEM actions have no admin)
 * - Adds required action_type enum values
 */
async function ensureAdminActionLogsCompat() {
  try {
    // Rename 'details' column to 'notes' if old schema exists
    const hasDetails = await query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_action_logs' AND column_name = 'details'`
    );
    const hasNotes = await query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_action_logs' AND column_name = 'notes'`
    );
    if (hasDetails.rows.length > 0 && hasNotes.rows.length === 0) {
      await query(`ALTER TABLE admin_action_logs RENAME COLUMN details TO notes`);
      console.log('\u2705 [Schema] Renamed details -> notes in admin_action_logs.');
    }

    // Make admin_id nullable
    const colInfo = await query(
      `SELECT is_nullable FROM information_schema.columns WHERE table_name = 'admin_action_logs' AND column_name = 'admin_id'`
    );
    if (colInfo.rows[0]?.is_nullable === 'NO') {
      await query(`ALTER TABLE admin_action_logs ALTER COLUMN admin_id DROP NOT NULL`);
      console.log('\u2705 [Schema] Made admin_id nullable in admin_action_logs.');
    }
  } catch (err) {
    console.warn('\u26a0\ufe0f [Schema] admin_action_logs compat check failed:', err.message);
  }

  // Add enum values
  const newActionTypes = ['AI_COMPLAINT_INVESTIGATION', 'AI_COMPLAINT_INVESTIGATION_FAILED', 'REINVESTIGATE_COMPLAINT'];
  for (const val of newActionTypes) {
    try {
      const check = await query(
        `SELECT 1 FROM pg_enum WHERE enumlabel = $1 AND enumtypid = 'admin_action_type'::regtype`,
        [val]
      );
      if (check.rows.length === 0) {
        await query(`ALTER TYPE admin_action_type ADD VALUE '${val}'`);
        console.log(`\u2705 [Schema] Added '${val}' to admin_action_type enum.`);
      }
    } catch (err) {
      console.warn(`\u26a0\ufe0f [Schema] admin_action_type enum check for '${val}' failed:`, err.message);
    }
  }
}

/**
 * Ensures users table has CNIC verification columns.
 */
async function ensureCnicColumns() {
  const columns = [
    { name: 'cnic_number', type: 'VARCHAR(15)' },
    { name: 'cnic_front_url', type: 'TEXT' },
    { name: 'cnic_back_url', type: 'TEXT' },
    { name: 'cnic_status', type: "VARCHAR(20) NOT NULL DEFAULT 'unverified'" },
    { name: 'cnic_submitted_at', type: 'TIMESTAMPTZ' },
    { name: 'cnic_verified_at', type: 'TIMESTAMPTZ' },
    { name: 'cnic_rejection_reason', type: 'TEXT' },
  ];

  for (const col of columns) {
    try {
      const check = await query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = 'users' AND column_name = $1`,
        [col.name]
      );
      if (check.rows.length === 0) {
        await query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`\u2705 [Schema] Added ${col.name} column to users table.`);
      }
    } catch (err) {
      console.warn(`\u26a0\ufe0f [Schema] CNIC column check for '${col.name}' failed:`, err.message);
    }
  }

  // Add CHECK constraint idempotently if not present
  try {
    const constraintCheck = await query(
      `SELECT constraint_name FROM information_schema.table_constraints
       WHERE table_name = 'users' AND constraint_name = 'users_cnic_status_check'`
    );
    if (constraintCheck.rows.length === 0) {
      await query(`ALTER TABLE users ADD CONSTRAINT users_cnic_status_check
        CHECK (cnic_status IN ('unverified', 'pending', 'verified', 'rejected'))`);
      console.log('\u2705 [Schema] Added cnic_status CHECK constraint.');
    }
  } catch (err) {
    console.warn('\u26a0\ufe0f [Schema] cnic_status CHECK constraint check failed:', err.message);
  }
}

/**
 * Ensures committees table supports public marketplace fields.
 */
async function ensurePublicCommitteeColumns() {
  const columns = [
    { name: 'is_public', type: 'BOOLEAN NOT NULL DEFAULT FALSE' },
    { name: 'category', type: 'VARCHAR(50)' },
    { name: 'description', type: 'TEXT' },
    { name: 'rules', type: 'TEXT' },
    { name: 'public_toggle_requested_by', type: 'UUID REFERENCES users(id)' },
    { name: 'public_toggle_approved_by', type: 'UUID REFERENCES users(id)' },
  ];

  for (const col of columns) {
    try {
      const check = await query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = 'committees' AND column_name = $1`,
        [col.name]
      );
      if (check.rows.length === 0) {
        await query(`ALTER TABLE committees ADD COLUMN ${col.name} ${col.type}`);
        console.log(`\u2705 [Schema] Added ${col.name} column to committees table.`);
      }
    } catch (err) {
      console.warn(`\u26a0\ufe0f [Schema] Public committee column check for '${col.name}' failed:`, err.message);
    }
  }

  // Add marketplace index idempotently
  try {
    const idxCheck = await query(
      `SELECT indexname FROM pg_indexes
       WHERE tablename = 'committees' AND indexname = 'idx_committees_public_marketplace'`
    );
    if (idxCheck.rows.length === 0) {
      await query(`CREATE INDEX idx_committees_public_marketplace
        ON committees(is_public, status, category)`);
      console.log('\u2705 [Schema] Added public marketplace index to committees.');
    }
  } catch (err) {
    console.warn(`\u26a0\ufe0f [Schema] Public marketplace index check failed:`, err.message);
  }
}

/**
 * Ensures notification_type enum includes all required values.
 */
async function ensureNotificationTypes() {
  const newValues = [
    'cnic_verified', 'cnic_rejected', 'public_toggle_request', 'public_toggle_approved',
    'cycle_completed', 'payment_submitted',
  ];
  for (const val of newValues) {
    try {
      const check = await query(
        `SELECT 1 FROM pg_enum WHERE enumlabel = $1 AND enumtypid = 'notification_type'::regtype`,
        [val]
      );
      if (check.rows.length === 0) {
        await query(`ALTER TYPE notification_type ADD VALUE '${val}'`);
        console.log(`✅ [Schema] Added '${val}' to notification_type enum.`);
      }
    } catch (err) {
      console.warn(`⚠️ [Schema] notification_type enum check for '${val}' failed:`, err.message);
    }
  }
}

/**
 * Ensures admin_action_type enum includes CNIC-related actions.
 */
async function ensureAdminActionTypeCnic() {
  const newValues = ['VERIFY_CNIC', 'REJECT_CNIC'];
  for (const val of newValues) {
    try {
      const check = await query(
        `SELECT 1 FROM pg_enum WHERE enumlabel = $1 AND enumtypid = 'admin_action_type'::regtype`,
        [val]
      );
      if (check.rows.length === 0) {
        await query(`ALTER TYPE admin_action_type ADD VALUE '${val}'`);
        console.log(`\u2705 [Schema] Added '${val}' to admin_action_type enum.`);
      }
    } catch (err) {
      console.warn(`\u26a0\ufe0f [Schema] admin_action_type enum check for '${val}' failed:`, err.message);
    }
  }
}

// Authenticated CNIC image endpoint (do not serve via public /uploads static mount)
app.get('/api/uploads/cnic/:filename', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user?.userId;
    const isAdmin = await query(
      'SELECT 1 FROM admins WHERE user_id = $1',
      [userId]
    );

    if (isAdmin.rows.length === 0) {
      const ownerCheck = await query(
        `SELECT 1 FROM users
         WHERE id = $1 AND (cnic_front_url LIKE $2 OR cnic_back_url LIKE $2)`,
        [userId, `%/uploads/cnic/${filename}`]
      );
      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    const filePath = path.join(__dirname, '../public/uploads/cnic', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found.' });
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error('Error serving CNIC image:', err.message);
    res.status(500).json({ error: 'Failed to serve image.' });
  }
});


// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend static build files (dist/ directory) when running on Railway / Production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Single Page Application (SPA) fallback: serve index.html for all non-API GET requests
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
} else {
  // API-only fallback if dist does not exist
  app.get('/', (req, res) => {
    res.json({ message: 'Sanjhi AI Backend is active', status: 'OK', uptime: process.uptime() });
  });
}


/**
 * Railway & Cloud Host Keep-Alive Self-Pinger.
 * Pings the server health endpoint every 5 minutes to keep the instance active.
 * Automatically detects Railway variables (RAILWAY_STATIC_URL, RAILWAY_PUBLIC_DOMAIN),
 * standard host variables (APP_URL, PUBLIC_URL, SERVER_URL, RENDER_EXTERNAL_URL),
 * or defaults to the Railway production endpoint.
 */
function initKeepAlive() {
  let rawUrl =
    process.env.RAILWAY_STATIC_URL ||
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    process.env.APP_URL ||
    process.env.SERVER_URL ||
    process.env.PUBLIC_URL ||
    process.env.BACKEND_URL ||
    process.env.RENDER_EXTERNAL_URL;

  // Fallback if running on Railway/production environment without explicit URL env var
  if (!rawUrl && (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)) {
    rawUrl = 'https://sanjhiai-production.up.railway.app';
  }

  if (!rawUrl) {
    console.log('ℹ️ [KeepAlive] Local environment detected (no host URL found). KeepAlive pinger idle.');
    return;
  }

  let formattedUrl = rawUrl.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }
  formattedUrl = formattedUrl.replace(/\/$/, '').replace(/\/api$/, '');

  const pingUrl = `${formattedUrl}/api/health`;
  const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes

  console.log(`🚀 [KeepAlive] Initialized self-pinger targeting: ${pingUrl} (every 5m)`);

  const doPing = async () => {
    try {
      const response = await fetch(pingUrl);
      if (response.ok) {
        console.log(`💓 [KeepAlive] Ping successful at ${new Date().toLocaleTimeString('en-PK')}`);
      } else {
        console.warn(`⚠️ [KeepAlive] Ping returned status ${response.status}`);
      }
    } catch (err) {
      console.warn('⚠️ [KeepAlive] Ping error:', err.message);
    }
  };

  // Perform initial ping 10 seconds after server startup
  setTimeout(doPing, 10000);

  // Repeat ping every 5 minutes
  setInterval(doPing, PING_INTERVAL);
}


app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server listening on port ${PORT}`);
  await testConnection(); // logs DB connection status to terminal on startup
  await verifySmtpConnection(); // verifies SMTP socket handshake & credentials on startup
  await ensureInAppNotificationChannel(); // ensures 'in_app' notification channel exists
  await ensureAiCaseFileColumn(); // ensures ai_case_file column exists
  await ensureComplaintStatusEnum(); // ensures 'ai_resolved' + 'needs_human_review' in enum
  await ensureAdminActionLogsCompat(); // ensures admin_action_logs supports AI agent actions
  await ensureCnicColumns(); // ensures users table CNIC verification columns
  await ensurePublicCommitteeColumns(); // ensures committees table public marketplace columns
  await ensureNotificationTypes(); // ensures all notification_type enum values exist
  await ensureAdminActionTypeCnic(); // ensures CNIC admin action types
  await ensureAssistantTables(); // QA assistant tables (KB docs + chat memory)
  await seedDefaultKbDocs(); // idempotent seed of default knowledge-base docs
  await ensureTrustScoreTables(); // trust score event log
  await backfillTrustEvents(); // derive events from historical data (idempotent)
  await initDefaultAdmin(); // ensures default super admin account exists
  initQueue(processComplaint); // initialize complaint agent queue
  startSweeper(); // start periodic stuck-complaint sweeper
  initWhatsAppGateway();  // Initializes WhatsApp Web Socket Gateway
  initReminderScheduler(); // Initializes Multi-channel payment reminder scheduler
  initKeepAlive(); // Keeps Render instance awake 24/7
});
