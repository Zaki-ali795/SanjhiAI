-- ============================================================
-- SANJHI — DATABASE SCHEMA (v0.2, refactored per review)
-- PostgreSQL.
--
-- CHANGE FROM v0.1:
-- Role-specific tables (organizers, co_organizers, members, admins)
-- now hold identity/permission data for each role, separated out
-- from the generic `users` table (credentials + personal info).
--
-- Participation data (payments, cycles, risk_flags) references
-- users + committees DIRECTLY rather than a role table — because
-- in practice an Organizer or Co-Organizer also pays dues and
-- gets a payout turn like any Member. Routing that through four
-- different role tables would need a polymorphic FK (which
-- Postgres doesn't support natively) for no real benefit here.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------

CREATE TYPE sex_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

CREATE TYPE otp_purpose AS ENUM ('signup', 'login', 'password_reset');

CREATE TYPE committee_interval AS ENUM ('15_days', '1_month', '2_months');
CREATE TYPE payout_order_type AS ENUM ('fixed'); -- extend later: lottery, bidding (Phase 2)
CREATE TYPE committee_status AS ENUM ('active', 'frozen', 'closed');

CREATE TYPE account_type AS ENUM ('jazzcash', 'easypaisa', 'bank');

CREATE TYPE join_status AS ENUM ('pending', 'approved', 'rejected', 'removed');

CREATE TYPE cycle_status AS ENUM ('collecting', 'closed');
CREATE TYPE payout_status AS ENUM ('pending', 'sent', 'confirmed');

CREATE TYPE payment_status AS ENUM ('awaiting_confirmation', 'paid', 'overdue');

CREATE TYPE notification_type AS ENUM (
  'join_request', 'join_approved', 'join_rejected', 'payment_received',
  'payout_released', 'overdue_flag', 'complaint_update',
  'cnic_verified', 'cnic_rejected',
  'public_toggle_request', 'public_toggle_approved'
);
CREATE TYPE notification_channel AS ENUM ('push', 'sms', 'whatsapp', 'in_app');

CREATE TYPE complaint_category AS ENUM ('payment_dispute', 'harassment', 'suspected_fraud', 'other');
CREATE TYPE complaint_status AS ENUM ('pending', 'in_review', 'resolved', 'dismissed', 'ai_resolved', 'needs_human_review');
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE admin_action_type AS ENUM (
  'SUSPEND_USER', 'FREEZE_COMMITTEE', 'RESOLVE_COMPLAINT',
  'DISMISS_COMPLAINT', 'VIEW_FULL_LEDGER',
  'VERIFY_CNIC', 'REJECT_CNIC'
);
CREATE TYPE admin_target_type AS ENUM ('user', 'committee', 'complaint');

-- ------------------------------------------------------------
-- USERS (generic profile + credentials — shared by every role)
-- ------------------------------------------------------------

CREATE TABLE users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name          VARCHAR(100) NOT NULL,
  age                INT CHECK (age IS NULL OR age >= 13),
  sex                sex_type,
  profile_photo_url  VARCHAR(500),

  -- credentials / login
  phone_number       VARCHAR(32) UNIQUE,
  email              VARCHAR(255) UNIQUE,
  password_hash      VARCHAR(255),
  -- NOTE: SRS v1.1 (FR-AUTH-01/02) specifies OTP-only auth, no
  -- password. Kept nullable here in case you're moving to a
  -- password+OTP hybrid — drop this column if staying OTP-only,
  -- to avoid maintaining two auth paths under deadline.

  is_suspended       BOOLEAN NOT NULL DEFAULT FALSE,

  -- CNIC identity verification
  cnic_number             VARCHAR(15),
  cnic_front_url          TEXT,
  cnic_back_url           TEXT,
  cnic_status             VARCHAR(20) NOT NULL DEFAULT 'unverified'
                            CHECK (cnic_status IN ('unverified', 'pending', 'verified', 'rejected')),
  cnic_submitted_at       TIMESTAMPTZ,
  cnic_verified_at        TIMESTAMPTZ,
  cnic_rejection_reason   TEXT,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT users_phone_or_email_required
    CHECK (phone_number IS NOT NULL OR email IS NOT NULL)
);

CREATE TABLE otps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target         VARCHAR(255) NOT NULL, -- phone or email; may precede account creation
  code_hash      VARCHAR(255) NOT NULL,
  purpose        otp_purpose NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  used_at        TIMESTAMPTZ,
  attempt_count  INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_otps_target ON otps(target);

CREATE TABLE sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash   VARCHAR(255) NOT NULL,
  device_info          VARCHAR(255),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at           TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);

CREATE TABLE notification_preferences (
  user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  push_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE admins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  -- platform-level role, not tied to any committee (FR-ADMIN-01)
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by   UUID REFERENCES users(id)
);

-- ------------------------------------------------------------
-- COMMITTEES
-- Defined before the other role tables since organizers /
-- co_organizers / members all hold a committee_id FK.
-- ------------------------------------------------------------

CREATE TABLE committees (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by            UUID NOT NULL REFERENCES users(id),
  -- the founding Organizer's user_id; insert order is:
  -- 1) create committee row, 2) create its matching organizers row
  name                  VARCHAR(150) NOT NULL,
  contribution_amount   DECIMAL(12,2) NOT NULL CHECK (contribution_amount > 0),
  capacity              INT NOT NULL CHECK (capacity > 1),
  interval_type         committee_interval NOT NULL,
  duration_cycles       INT NOT NULL, -- = capacity, derived (FR-CC-01)
  payout_order_type     payout_order_type NOT NULL DEFAULT 'fixed',
  status                committee_status NOT NULL DEFAULT 'active',
  invite_code           VARCHAR(20) UNIQUE,
  invite_link           VARCHAR(500),
  invite_expires_at     TIMESTAMPTZ,

  -- Public marketplace fields
  is_public                   BOOLEAN NOT NULL DEFAULT FALSE,
  category                    VARCHAR(50),
  description                 TEXT,
  rules                       TEXT,
  public_toggle_requested_by  UUID REFERENCES users(id),
  public_toggle_approved_by   UUID REFERENCES users(id),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_committees_created_by ON committees(created_by);
CREATE INDEX idx_committees_invite_code ON committees(invite_code);
CREATE INDEX idx_committees_public_marketplace ON committees(is_public, status, category);

CREATE TABLE collection_accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id   UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  account_type   account_type NOT NULL,
  account_number VARCHAR(64) NOT NULL,
  account_title  VARCHAR(150) NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coll_accounts_committee_id ON collection_accounts(committee_id);
CREATE UNIQUE INDEX idx_coll_accounts_one_active
  ON collection_accounts(committee_id) WHERE is_active;

-- ------------------------------------------------------------
-- ROLE TABLES (committee-scoped)
-- Each row = one user's role assignment for one committee. A
-- user can appear in `organizers` for committee A and `members`
-- for committee B, since role is scoped per committee (SRS 2.2).
-- ------------------------------------------------------------

CREATE TABLE organizers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  committee_id          UUID NOT NULL UNIQUE REFERENCES committees(id) ON DELETE CASCADE,
  -- UNIQUE: exactly one founding Organizer per committee
  became_organizer_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, committee_id)
);

CREATE TABLE co_organizers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  committee_id   UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  promoted_by    UUID NOT NULL REFERENCES users(id),
  -- must be that committee's Organizer; enforce in app logic
  promoted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  demoted_at     TIMESTAMPTZ,
  -- NULL demoted_at = currently active as Co-Organizer
  UNIQUE (user_id, committee_id)
);

CREATE TABLE members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  committee_id        UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  status              join_status NOT NULL DEFAULT 'pending',
  payout_turn_order   INT,
  joined_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, committee_id)
);

CREATE INDEX idx_organizers_committee_id ON organizers(committee_id);
CREATE INDEX idx_co_organizers_committee_id ON co_organizers(committee_id);
CREATE INDEX idx_members_committee_id ON members(committee_id);
CREATE INDEX idx_members_user_id ON members(user_id);

-- ------------------------------------------------------------
-- CYCLES, PAYMENTS, PAYOUTS
-- Reference committees + users directly, not a role table,
-- since anyone participating — Organizer, Co-Organizer, or
-- Member — pays dues and can hold a payout turn.
-- ------------------------------------------------------------

CREATE TABLE cycles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id          UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  cycle_number          INT NOT NULL,
  due_date              DATE NOT NULL,
  status                cycle_status NOT NULL DEFAULT 'collecting',
  recipient_user_id     UUID REFERENCES users(id),
  -- whoever's payout turn this cycle is, regardless of role
  payout_status         payout_status NOT NULL DEFAULT 'pending',
  payout_sent_at        TIMESTAMPTZ,
  UNIQUE (committee_id, cycle_number)
);

CREATE INDEX idx_cycles_committee_id ON cycles(committee_id);

CREATE TABLE payments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id                 UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status                   payment_status NOT NULL DEFAULT 'awaiting_confirmation',
  sender_account_details   VARCHAR(255),
  submitted_at             TIMESTAMPTZ,
  confirmed_by             UUID REFERENCES users(id),
  -- must be that committee's Organizer or Co-Organizer; enforce in app logic
  confirmed_at             TIMESTAMPTZ,
  UNIQUE (cycle_id, user_id)
  -- 'overdue' could instead be derived at query-time from
  -- cycles.due_date + absence of a 'paid' row rather than stored;
  -- left stored for simpler ledger queries — revisit if it drifts.
);

CREATE INDEX idx_payments_cycle_id ON payments(cycle_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);

-- ------------------------------------------------------------
-- TRUST SCORE & RISK FLAGS
-- ------------------------------------------------------------

CREATE TABLE trust_scores (
  user_id                       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  -- Cached output of the Trust Score model (0-1000). New users start at 850.
  -- Source of truth is the append-only trust_score_events table (below).
  score                         DECIMAL(5,2) NOT NULL DEFAULT 850,
  on_time_rate                  DECIMAL(5,4) NOT NULL DEFAULT 0,
  completed_committees_count    INT NOT NULL DEFAULT 0,
  last_calculated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE risk_flags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cycle_id      UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  reason        VARCHAR(255),
  flagged_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  cleared_at    TIMESTAMPTZ,
  UNIQUE (user_id, cycle_id)
  -- Visible only to that committee's Organizer/Co-Organizer —
  -- enforce at the API/query layer (join cycles.committee_id
  -- against organizers/co_organizers), not just in the client.
);

CREATE INDEX idx_risk_flags_user_id ON risk_flags(user_id);

-- Append-only event log behind the Trust Score model (FR-TRUST-01).
-- The cached trust_scores.score is a pure function of these events:
--   Score = clamp(0,1000, 250 + 550·R + 150·C + 50·V + P)
-- R = decayed on-time quality (90-day half-life, Bayesian prior),
-- C = completion vs dropout (180-day half-life), V = verification,
-- P = resolved-complaint penalties (decayed, capped at -400).
CREATE TABLE trust_score_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type     TEXT NOT NULL CHECK (event_type IN (
    'payment_on_time','payment_late','payment_missed',
    'committee_completed','committee_dropout',
    'complaint_penalty','verification')),
  value          DECIMAL(4,3) NOT NULL,          -- 0..1 for payment/completion; -1 for penalty
  half_life_days INT NOT NULL,                   -- decay horizon for this event type
  reference_id   TEXT NOT NULL,                  -- payment_id / committee_id / 'cycleId:userId'
  detail         JSONB,                          -- days_late, interval_days, committee_name, ...
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_type, reference_id)              -- idempotent recording (safe hook retries)
);

CREATE INDEX idx_tse_user ON trust_score_events(user_id, occurred_at);

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------

CREATE TABLE notifications (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                   notification_type NOT NULL,
  channel                notification_channel NOT NULL,
  content                TEXT NOT NULL,
  related_committee_id   UUID REFERENCES committees(id),
  sent_at                TIMESTAMPTZ,
  read_at                TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- ------------------------------------------------------------
-- SUPPORT: COMPLAINTS
-- ------------------------------------------------------------

CREATE TABLE complaints (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filed_by                 UUID NOT NULL REFERENCES users(id),
  accused_user_id          UUID REFERENCES users(id),
  committee_id             UUID REFERENCES committees(id),
  category                 complaint_category NOT NULL,
  description              TEXT NOT NULL,
  evidence_url             VARCHAR(500),
  status                   complaint_status NOT NULL DEFAULT 'pending',
  ai_summary               TEXT,
  ai_suggested_priority    complaint_priority,
  ai_suggested_category    VARCHAR(50),
  ai_case_file             JSONB,
  -- ai_* fields are advisory only (FR-SUPPORT-02): populated solely
  -- by the triage job, never auto-applied without an Admin action.
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at              TIMESTAMPTZ,
  resolved_by              UUID REFERENCES users(id),
  resolution_notes         TEXT,
  user_facing_summary      TEXT
);

CREATE INDEX idx_complaints_filed_by ON complaints(filed_by);
CREATE INDEX idx_complaints_status ON complaints(status);

CREATE TABLE admin_action_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID NOT NULL REFERENCES users(id),
  action_type   admin_action_type NOT NULL,
  target_type   admin_target_type NOT NULL,
  target_id     UUID NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_logs_admin_id ON admin_action_logs(admin_id);

-- ============================================================
-- WhatsApp (Baileys) Auth State — replaces .whatsapp_auth folder
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_auth_state (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_logs_target ON admin_action_logs(target_type, target_id);

-- ============================================================
-- SANJHI AI — QA ASSISTANT (knowledge base + chat memory)
-- ============================================================

-- Curated knowledge documents the assistant answers from.
-- keywords include Roman Urdu variants so FTS-style matching
-- works for bilingual queries without a vector store.

-- Immutable wrapper: to_tsvector with a text config is STABLE, and
-- array_to_string is STABLE too, so neither can appear directly in a
-- generated column. plpgsql hides the STABLE calls (bodies aren't
-- re-checked) and isn't inlined like SQL-language functions.
DROP FUNCTION IF EXISTS sanjhi_kb_tsvector(text, text, text);
DROP FUNCTION IF EXISTS sanjhi_kb_tsvector(text, text, text[]);
CREATE FUNCTION sanjhi_kb_tsvector(p_title text, p_content text, p_keywords text[])
RETURNS tsvector LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE AS $$
BEGIN
  RETURN to_tsvector('english', coalesce(p_title,'') || ' ' || coalesce(p_content,'') || ' ' || coalesce(array_to_string(p_keywords,' '),''));
END
$$;

CREATE TABLE assistant_kb_docs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  category      TEXT NOT NULL,          -- committees | payments | trust_score | payouts | complaints | account | general
  content       TEXT NOT NULL,
  keywords      TEXT[] NOT NULL DEFAULT '{}',
  priority      INTEGER NOT NULL DEFAULT 0,  -- manual ranking boost
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (
    sanjhi_kb_tsvector(title, content, keywords)
  ) STORED
);

CREATE UNIQUE INDEX uq_kb_docs_title ON assistant_kb_docs(title);
CREATE INDEX idx_kb_search   ON assistant_kb_docs USING GIN (search_vector);
CREATE INDEX idx_kb_category ON assistant_kb_docs(category) WHERE is_active;

-- Chat threads (multi-conversation memory)
CREATE TABLE assistant_conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assistant_conv_user ON assistant_conversations(user_id, last_message_at DESC);

-- Individual chat messages. retrieved_doc_ids = provenance for
-- citations + analytics (empty array = grounded generation found
-- nothing = "unanswered"; NULL = canned/non-grounded reply).
CREATE TABLE assistant_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content           TEXT NOT NULL,
  retrieved_doc_ids UUID[] DEFAULT '{}',
  feedback          SMALLINT CHECK (feedback IN (1,-1)),
  latency_ms        INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assistant_msgs_conv ON assistant_messages(conversation_id, created_at);