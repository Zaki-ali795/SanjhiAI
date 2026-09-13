/**
 * groqLlm.js — Chat completion client using Groq (GROQ_API_KEY),
 * the same provider already used by the assistant and committee
 * parser elsewhere in the backend.
 *
 * Used to curate polished, human-friendly messages (e.g. activity
 * highlights) with graceful fallback on the caller side.
 */

import Groq from 'groq-sdk';

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Send a chat completion request and return the assistant content.
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ temperature?: number, top_p?: number, max_tokens?: number }} options
 * @returns {Promise<string>} assistant message content
 */
export async function chatCompletion(messages, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.trim() === '') {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    messages,
    model: GROQ_MODEL,
    temperature: options.temperature ?? 0.7,
    top_p: options.top_p ?? 0.9,
    max_tokens: options.max_tokens ?? 500,
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq API returned empty content');
  return content;
}
