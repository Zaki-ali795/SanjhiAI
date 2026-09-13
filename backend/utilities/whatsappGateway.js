import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { usePostgresAuthState } from './postgresAuthState.js';

let sock = null;
let isConnected = false;
let legacyCleanupDone = false;

function cleanupOldAuthFolder() {
  if (legacyCleanupDone) return;
  legacyCleanupDone = true;

  const authFolder = path.resolve('.whatsapp_auth');
  if (fs.existsSync(authFolder)) {
    const count = fs.readdirSync(authFolder).length;
    if (count > 0) {
      console.log(`🧹 [WhatsApp Auth] Cleaning up ${count} legacy files from ${authFolder}...`);
      fs.rmSync(authFolder, { recursive: true, force: true });
      console.log('✅ [WhatsApp Auth] Legacy auth folder removed. Using PostgreSQL now.');
    }
  }
}

export async function initWhatsAppGateway() {
  if (process.env.ENABLE_WHATSAPP_GATEWAY === 'false') {
    console.log('ℹ️ [WHATSAPP GATEWAY] Disabled locally via ENABLE_WHATSAPP_GATEWAY=false (Cloud server is handling WhatsApp).');
    return;
  }

  try {
    cleanupOldAuthFolder();
    const { state, saveCreds } = await usePostgresAuthState();

    const hasExistingSession = Boolean(state.creds && state.creds.me && state.creds.me.id);
    if (hasExistingSession) {
      console.log('🔑 [WhatsApp Auth] Found existing session in PostgreSQL. Attempting auto-connect...');
    }

    sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'error' }),
      printQRInTerminal: false,
    });

    sock.ev.on('creds.update', async (updatedCreds) => {
      try {
        await saveCreds(updatedCreds);
      } catch (err) {
        console.error('⚠️ [WhatsApp Auth] Failed to save creds to DB:', err.message);
      }
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\n======================================================');
        console.log('📲 WHATSAPP OTP GATEWAY — QR CODE REQUIRED');
        console.log('Scan the QR code below with WhatsApp > Linked Devices:');
        console.log('After scanning, session persists in PostgreSQL.');
        console.log('No re-scanning needed after restarts or deploys.');
        console.log('======================================================\n');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const error = lastDisconnect?.error;
        const statusCode = error?.output?.statusCode;
        const errorMsg = error?.message || error?.data?.error || 'unknown';
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        const isReplacedConflict = statusCode === 440 || String(errorMsg).includes('conflict');
        isConnected = false;

        if (isLoggedOut) {
          console.log('🚪 [WHATSAPP GATEWAY] Session logged out. Will request new QR code...');
          setTimeout(initWhatsAppGateway, 5000);
        } else if (isReplacedConflict) {
          console.warn('⚠️ [WHATSAPP GATEWAY] Another instance (e.g. Railway or Local) is actively connected. Backing off to prevent session fighting...');
          // Delay reconnect by 60 seconds so the primary instance maintains connection
          setTimeout(initWhatsAppGateway, 60000);
        } else {
          console.log(`⚠️ [WHATSAPP GATEWAY] Disconnected (code: ${statusCode}, reason: ${errorMsg}). Reconnecting in 5s...`);
          setTimeout(initWhatsAppGateway, 5000);
        }
      } else if (connection === 'open') {
        const rawId = sock?.user?.id || '';
        const phone = rawId.split(':')[0] || rawId.split('@')[0] || 'Unknown';
        const name = sock?.user?.name || 'WhatsApp Account';

        console.log('\n======================================================');
        console.log('🎉 WHATSAPP GATEWAY SUCCESSFULLY CONNECTED!');
        console.log(`📱 Linked Phone Number : +${phone}`);
        console.log(`👤 WhatsApp Account    : ${name}`);
        console.log('💾 Session saved to PostgreSQL (persists across restarts)');
        console.log('🚀 Ready to send automatic WhatsApp OTPs!');
        console.log('======================================================\n');
        isConnected = true;

        try {
          const { registerBotListener } = await import('../bot/index.js');
          registerBotListener(sock);
        } catch (botErr) {
          console.error('⚠️ [Bot] Failed to register bot listener:', botErr.message);
        }
      }
    });
  } catch (err) {
    console.error('❌ [WHATSAPP GATEWAY INIT ERROR]:', err.message);
    console.error(err.stack);
  }
}

export function getWhatsAppStatus() {
  const rawId = sock?.user?.id || '';
  const phone = rawId.split(':')[0] || rawId.split('@')[0] || null;
  return {
    connected: isConnected,
    phone: phone ? `+${phone}` : null,
    name: sock?.user?.name || null,
  };
}

export async function sendWhatsAppWebOTP(phone, code) {
  const message = `Your Sanjhi verification code is: *${code}*\n\nValid for 10 minutes. Do not share this code with anyone.`;
  return sendWhatsAppMessage(phone, message);
}

export async function sendWhatsAppMessage(phone, text) {
  if (!sock || !isConnected) {
    console.warn(`[WHATSAPP GATEWAY OFFLINE] WhatsApp not connected. Cannot send message to ${phone}.`);
    return { success: false, channel: 'whatsapp', error: 'WhatsApp gateway is not connected.' };
  }

  try {
    const formattedPhone = phone.replace(/[^\d]/g, '');
    const jid = `${formattedPhone}@s.whatsapp.net`;

    await sock.sendMessage(jid, { text });
    console.log(`✅ [WHATSAPP MESSAGE SENT] Successfully sent notification to ${phone} via WhatsApp Gateway!`);
    return { success: true, channel: 'whatsapp' };
  } catch (error) {
    console.error(`❌ [WHATSAPP MESSAGE ERROR]:`, error.message);
    return { success: false, channel: 'whatsapp', error: error.message };
  }
}
