/**
 * schema.js — Idempotent bootstrap for the QA assistant tables
 * (assistant_kb_docs, assistant_conversations, assistant_messages)
 * plus default knowledge-base seeding. Runs on server startup,
 * following the same pattern as the ensureXxx() helpers in server.js.
 */

import { query } from '../config/db.js';
import { SEED_KB_DOCS } from './seedDocs.js';

/**
 * Creates the assistant tables and indexes if they don't exist.
 */
export async function ensureAssistantTables() {
  try {
    // Immutable wrapper: to_tsvector with a text config is STABLE, and
    // array_to_string is STABLE too, so neither can appear directly in a
    // generated column. plpgsql hides the STABLE calls (bodies aren't
    // re-checked) and isn't inlined like SQL-language functions.
    const tableCheck = await query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = 'assistant_kb_docs'`
    );
    if (tableCheck.rows.length === 0) {
      // No table yet → safe to drop legacy signatures and (re)create
      await query(`DROP FUNCTION IF EXISTS sanjhi_kb_tsvector(text, text, text)`);
      await query(`DROP FUNCTION IF EXISTS sanjhi_kb_tsvector(text, text, text[])`);
      await query(`
        CREATE FUNCTION sanjhi_kb_tsvector(p_title text, p_content text, p_keywords text[])
        RETURNS tsvector LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE AS $$
        BEGIN
          RETURN to_tsvector('english', coalesce(p_title,'') || ' ' || coalesce(p_content,'') || ' ' || coalesce(array_to_string(p_keywords,' '),''));
        END
        $$
      `);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS assistant_kb_docs (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title         TEXT NOT NULL,
        category      TEXT NOT NULL,
        content       TEXT NOT NULL,
        keywords      TEXT[] NOT NULL DEFAULT '{}',
        priority      INTEGER NOT NULL DEFAULT 0,
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_by    UUID REFERENCES users(id),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        search_vector tsvector GENERATED ALWAYS AS (
          sanjhi_kb_tsvector(title, content, keywords)
        ) STORED
      )
    `);

    await query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_kb_docs_title ON assistant_kb_docs(title)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_kb_search ON assistant_kb_docs USING GIN (search_vector)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_kb_category ON assistant_kb_docs(category) WHERE is_active`);

    await query(`
      CREATE TABLE IF NOT EXISTS assistant_conversations (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title           TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_message_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_assistant_conv_user ON assistant_conversations(user_id, last_message_at DESC)`);

    await query(`
      CREATE TABLE IF NOT EXISTS assistant_messages (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id   UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
        role              TEXT NOT NULL CHECK (role IN ('user','assistant')),
        content           TEXT NOT NULL,
        retrieved_doc_ids UUID[] DEFAULT '{}',
        feedback          SMALLINT CHECK (feedback IN (1,-1)),
        latency_ms        INTEGER,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_assistant_msgs_conv ON assistant_messages(conversation_id, created_at)`);

    console.log('✅ [Assistant] Schema ready (assistant_kb_docs, assistant_conversations, assistant_messages).');
  } catch (err) {
    console.error('❌ [Assistant] Schema bootstrap failed:', err.message);
  }
}

/**
 * Seeds the default knowledge-base documents. Idempotent —
 * ON CONFLICT (title) DO NOTHING keeps admin edits intact.
 */
export async function seedDefaultKbDocs() {
  try {
    let inserted = 0;
    for (const doc of SEED_KB_DOCS) {
      const res = await query(
        `INSERT INTO assistant_kb_docs (title, category, content, keywords, priority)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (title) DO NOTHING
         RETURNING id`,
        [doc.title, doc.category, doc.content, doc.keywords, doc.priority]
      );
      if (res.rows.length > 0) inserted += 1;
    }

    // Content-correctness sync: the Trust Score doc described the old
    // placeholder model (+15/+50/+30). Keep it aligned with the real
    // event-sourced model regardless of when the DB was first seeded.
    const trustDoc = SEED_KB_DOCS.find((d) => d.title === 'Community Trust Score');
    if (trustDoc) {
      await query(
        `UPDATE assistant_kb_docs SET content = $2, keywords = $3, priority = $4, updated_at = NOW()
         WHERE title = $1`,
        [trustDoc.title, trustDoc.content, trustDoc.keywords, trustDoc.priority]
      );
    }
    if (inserted > 0) {
      console.log(`✅ [Assistant] Seeded ${inserted} knowledge-base document(s).`);
    } else {
      console.log(`ℹ️ [Assistant] Knowledge base already seeded (${SEED_KB_DOCS.length} docs).`);
    }
  } catch (err) {
    console.error('❌ [Assistant] KB seeding failed:', err.message);
  }
}
