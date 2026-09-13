/**
 * assistantService.js — Sanjhi AI QA assistant.
 *
 * Maps to: assistant_kb_docs, assistant_conversations, assistant_messages
 */
import api from '../api';

const BASE = '/assistant';

/**
 * Send a chat message to the grounded QA assistant.
 * @param {{ prompt: string, conversation_id?: string }} payload
 * @returns {Promise<{ reply, conversation_id, message_id, sources: Array<{id, title, category}> }>}
 */
export function sendChatMessage(payload) {
  return api.post(`${BASE}/chat`, payload);
}

/**
 * List the user's chat threads (most recent first).
 */
export function getConversations() {
  return api.get(`${BASE}/conversations`);
}

/**
 * Load full history of one thread, with source citations.
 * @param {string} conversationId
 */
export function getConversationMessages(conversationId) {
  return api.get(`${BASE}/conversations/${conversationId}/messages`);
}

/**
 * Delete a chat thread.
 * @param {string} conversationId
 */
export function deleteConversation(conversationId) {
  return api.delete(`${BASE}/conversations/${conversationId}`);
}

/**
 * Submit thumbs up/down feedback on an assistant answer.
 * @param {string} messageId
 * @param {1 | -1} value
 */
export function sendFeedback(messageId, value) {
  return api.post(`${BASE}/messages/${messageId}/feedback`, { value });
}

/**
 * Top knowledge topics — powers the dynamic suggested prompt cards.
 * @returns {Promise<{ topics: Array<{id, title, category}> }>}
 */
export function getTopics() {
  return api.get(`${BASE}/topics`);
}
