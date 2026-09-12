import { routeMessage } from './messageRouter.js';

export function registerBotListener(sock) {
  console.log('🤖 [Sanjhi Bot] Registering message listener...');

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        await routeMessage(sock, msg);
      } catch (err) {
        console.error('[Bot] Error handling message:', err.message);
      }
    }
  });

  console.log('🤖 [Sanjhi Bot] Message listener registered successfully!');
}
