import { getSession, refreshTTL, deleteSession, checkRateLimit } from './sessionManager.js';
import { handleAuthFlow, isAuthState } from './authFlow.js';
import { runAgent } from './agent.js';
import { transcribeVoiceNote } from './stt.js';
import { resolveLidFromDb } from '../utilities/postgresAuthState.js';

const SESSION_EXPIRED_MSG = `⏰ آپ کا سیشن ختم ہو گیا۔
Your session has expired.

_Please start over with a new message._`;

const RATE_LIMIT_MSG = `⏸️ آہستہ! / Slow down! Please wait a moment before sending more messages.`;

const STT_FAILURE_MSG = `🎤 آواز سمجھ نہیں آئی۔ / Couldn't understand the voice note.
براہ کرم دوبارہ بھیجیں یا text لکھیں۔
Please resend or type your message instead.`;

const SESSION_ENDED_MSG = `👋 سیشن ختم ہو گیا۔
Your session has been ended.

_Send any message to start again / دوبارہ شروع کرنے کے لیے کوئی بھی پیغام بھیجیں_`;

const lidCache = new Map();

async function resolveLidToPhone(lidNumber) {
  if (lidCache.has(lidNumber)) return lidCache.get(lidNumber);

  try {
    const phone = await resolveLidFromDb(lidNumber);
    if (phone) {
      lidCache.set(lidNumber, phone);
      return phone;
    }
  } catch (err) {
    console.error(`[Bot] LID resolution failed for ${lidNumber}:`, err.message);
  }

  return null;
}

async function extractPhone(jid) {
  const raw = jid.split(':')[0].split('@')[0];
  const server = jid.split('@')[1];

  if (server === 'lid') {
    const phone = await resolveLidToPhone(raw);
    if (phone) return phone.replace(/[^\d]/g, '');
    console.warn(`[Bot] Could not resolve LID JID: ${jid}`);
    return null;
  }

  return raw.replace(/[^\d]/g, '');
}

function extractText(msg) {
  if (msg.message?.conversation) return msg.message.conversation;
  if (msg.message?.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
  return null;
}

function isAudioMessage(msg) {
  return !!msg.message?.audioMessage;
}

function isEndSessionCommand(text) {
  if (!text) return false;
  const lower = text.trim().toLowerCase();
  const keywords = [
    'end session', 'end', 'reset', 'restart', 'start over',
    'ختم', 'ختم کرو', 'بند', 'دوبارہ شروع',
    'band karo', 'khatam', 'dobara shuru',
  ];
  return keywords.some((kw) => lower === kw || lower.includes(kw));
}

export async function routeMessage(sock, msg) {
  const jid = msg.key?.remoteJid;
  if (!jid) return;

  if (jid === 'status@broadcast') return;
  if (jid.endsWith('@g.us')) return;
  if (msg.key.fromMe) return;

  const msgTimestamp = msg.messageTimestamp;
  if (msgTimestamp && (Date.now() / 1000 - Number(msgTimestamp)) > 30) return;

  const phone = await extractPhone(jid);
  if (!phone || phone.length < 10) return;

  const allowed = await checkRateLimit(phone);
  if (!allowed) {
    await sock.sendMessage(jid, { text: RATE_LIMIT_MSG });
    return;
  }

  await refreshTTL(phone);

  let text = extractText(msg);

  if (isAudioMessage(msg)) {
    try {
      text = await transcribeVoiceNote(msg);
      if (!text) {
        await sock.sendMessage(jid, { text: STT_FAILURE_MSG });
        return;
      }
    } catch (err) {
      console.error('[Bot STT Error]', err.message);
      await sock.sendMessage(jid, { text: STT_FAILURE_MSG });
      return;
    }
  }

  if (!text) return;

  if (isEndSessionCommand(text)) {
    await deleteSession(phone);
    await sock.sendMessage(jid, { text: SESSION_ENDED_MSG });
    return;
  }

  let session = await getSession(phone);

  if (isAuthState(session?.state)) {
    const result = await handleAuthFlow(phone, jid, text, session);
    await sock.sendMessage(jid, { text: result.reply });
    return;
  }

  const { reply, sessionExpired } = await runAgent(phone, text, session);

  if (sessionExpired) {
    await deleteSession(phone);
    await sock.sendMessage(jid, { text: SESSION_EXPIRED_MSG });
    const freshResult = await handleAuthFlow(phone, jid, 'hi', null);
    await sock.sendMessage(jid, { text: freshResult.reply });
    return;
  }

  if (reply) {
    await sock.sendMessage(jid, { text: reply });
  }
}
