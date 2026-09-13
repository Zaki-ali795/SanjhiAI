/**
 * openrouterLlm.js — OpenAI-compatible chat completion client for OpenRouter.
 *
 * OpenRouter aggregates models from multiple providers (NVIDIA, Google, etc.)
 * and exposes them via an OpenAI-compatible API.
 *
 * Used by the Complaint Case-Builder Agent to access Nemotron 3 Super.
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b';
// Ordered fallbacks tried when the primary model is rate-limited / unavailable / invalid.
const FALLBACK_MODELS = [
  'nvidia/nemotron-3-nano-30b-a3b',
  'meta-llama/llama-3.3-70b-instruct',
  'google/gemma-3-27b-it',
];

/**
 * Returns true when the error indicates the model itself is unusable right now
 * (rate-limited 429, not available, or invalid model ID) and a fallback should be tried.
 */
function shouldFallback(err) {
  const m = err.message || '';
  return /429|rate.?limit|not available|not a valid model|no endpoints|temporarily/i.test(m);
}

/**
 * Send a chat completion request to OpenRouter and return the assistant content.
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ model?: string, temperature?: number, top_p?: number, max_tokens?: number, timeoutMs?: number }} options
 * @returns {Promise<string>} assistant message content
 */
export async function chatCompletion(messages, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const model = options.model || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 30000);

  try {
    const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        'X-Title': 'Sanjhi AI - Complaint Case Builder',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.3,
        top_p: options.top_p ?? 0.9,
        max_tokens: options.max_tokens ?? 4096,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`OpenRouter API error ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenRouter API returned empty content');
    return content;
  } catch (err) {
    // If the model is rate-limited / unavailable / invalid, try fallbacks in order
    if (shouldFallback(err)) {
      for (const fb of FALLBACK_MODELS) {
        if (fb === model) continue;
        console.warn(`LLM: ${model} unusable (${err.message.slice(0, 60)}), falling back to ${fb}`);
        try {
          return await chatCompletion(messages, { ...options, model: fb });
        } catch (fbErr) {
          console.warn(`LLM: fallback ${fb} also failed (${fbErr.message.slice(0, 60)})`);
        }
      }
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Send a chat completion request and parse JSON response.
 * Useful for structured outputs (case files, judge assessments).
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ model?: string, temperature?: number, top_p?: number, max_tokens?: number }} options
 * @returns {Promise<object>} parsed JSON response
 */
export async function chatCompletionJSON(messages, options = {}) {
  const content = await chatCompletion(messages, options);

  // Try to extract JSON from the response (may be wrapped in markdown code blocks)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/({[\s\S]*})/);
  const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse LLM JSON response:', err.message);
    console.error('Raw content:', content);
    throw new Error('LLM returned invalid JSON');
  }
}
