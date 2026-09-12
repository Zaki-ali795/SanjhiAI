/**
 * retriever.js — Knowledge-base retrieval for the QA assistant.
 *
 * Hybrid search chain over assistant_kb_docs:
 *   1. Postgres full-text search (GIN tsvector) on the raw query
 *   2. Keyword-array substring fallback (catches Roman Urdu terms)
 *   3. One cheap LLM rewrite of the query into English keywords,
 *      then a final FTS retry
 *
 * Everything sits behind retrieveDocs() — swapping in pgvector
 * semantic search later is a one-file change.
 */

import { query } from '../config/db.js';
import { chatCompletion } from '../utilities/groqLlm.js';

/**
 * Retrieve the top matching knowledge documents for a user query.
 * @param {string} queryText - raw user message
 * @param {number} limit - max docs to return
 * @returns {Promise<Array<{id, title, category, content, rank}>>}
 */
export async function retrieveDocs(queryText, limit = 3) {
  const clean = (queryText || '').trim();
  if (!clean) return [];

  // 1. Direct full-text search
  let docs = await ftsSearch(clean, limit);
  if (docs.length > 0) return docs;

  // 2. Keyword-array substring fallback (bilingual friendly)
  docs = await keywordSearch(clean, limit);
  if (docs.length > 0) return docs;

  // 3. LLM query rewrite → final FTS retry
  const rewritten = await rewriteQuery(clean);
  if (rewritten && rewritten.toLowerCase() !== clean.toLowerCase()) {
    docs = await ftsSearch(rewritten, limit);
    if (docs.length > 0) return docs;
  }

  return [];
}

/**
 * Full-text search ranked by ts_rank + manual priority boost.
 */
async function ftsSearch(text, limit) {
  try {
    const res = await query(
      `SELECT id, title, category, content,
              ts_rank(search_vector, plainto_tsquery('english', $1)) AS rank
       FROM assistant_kb_docs
       WHERE is_active = TRUE
         AND search_vector @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC, priority DESC, updated_at DESC
       LIMIT $2`,
      [text, limit]
    );
    return res.rows;
  } catch (err) {
    console.error('[Assistant Retriever] FTS search failed:', err.message);
    return [];
  }
}

/**
 * Fallback: match any doc whose keyword tags appear inside the query.
 * Handles Roman Urdu keywords ("bharosa", "kameti") that stemming misses.
 */
async function keywordSearch(text, limit) {
  try {
    const res = await query(
      `SELECT id, title, category, content, 0.05 AS rank
       FROM assistant_kb_docs d
       WHERE d.is_active = TRUE
         AND EXISTS (
           SELECT 1 FROM unnest(d.keywords) AS kw
           WHERE length(kw) > 1 AND position(lower(kw) IN lower($1)) > 0
         )
       ORDER BY d.priority DESC, d.updated_at DESC
       LIMIT $2`,
      [text, limit]
    );
    return res.rows;
  } catch (err) {
    console.error('[Assistant Retriever] Keyword search failed:', err.message);
    return [];
  }
}

/**
 * Cheap LLM rewrite of a (possibly Roman Urdu) question into
 * English search keywords. Returns null on any failure — the
 * chain simply ends and the caller falls back gracefully.
 */
async function rewriteQuery(text) {
  try {
    const out = await chatCompletion(
      [
        {
          role: 'system',
          content:
            'You extract search keywords for the help database of Sanjhi, a Pakistani committee savings (kameti) platform. From the user question, output 2-5 English keywords separated by spaces. The question may be in English, Roman Urdu, or Urdu. Output keywords only, nothing else.',
        },
        { role: 'user', content: text },
      ],
      { temperature: 0, max_tokens: 30 }
    );
    return out.trim().replace(/[,\n]+/g, ' ') || null;
  } catch (err) {
    console.warn('[Assistant Retriever] Query rewrite skipped:', err.message);
    return null;
  }
}
