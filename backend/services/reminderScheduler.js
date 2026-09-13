/**
 * reminderScheduler.js — Multi-channel automated daily payment due date scheduler.
 * Channels: WhatsApp (Baileys), Email (Nodemailer), In-App Notifications.
 */
import { query } from '../config/db.js';
import { sendWhatsAppMessage } from '../utilities/whatsappGateway.js';
import { sendGeneralEmail } from '../utilities/otpService.js';
import { generateGoogleCalendarUrl } from '../utilities/calendarGenerator.js';

/**
 * Execute a payment due date check sweep across all active committees & cycles.
 */
export async function checkPaymentDueDates() {
  console.log('⏰ [REMINDER SCHEDULER] Running daily payment due date check sweep...');

  try {
    // 1. Fetch collecting cycles due in -1 day, 0 days (today), and +3 days
    //    Using explicit p.status::text cast to avoid PostgreSQL enum type mismatch.
    const res = await query(`
      SELECT 
        cy.id AS cycle_id,
        cy.committee_id,
        c.name AS committee_name,
        c.contribution_amount,
        cy.due_date,
        u.id AS user_id,
        u.full_name AS user_name,
        u.email,
        u.phone_number,
        COALESCE(p.status::text, 'unpaid') AS payment_status
      FROM cycles cy
      JOIN committees c ON c.id = cy.committee_id
      JOIN members m ON m.committee_id = c.id AND m.status = 'approved'
      JOIN users u ON u.id = m.user_id
      LEFT JOIN payments p ON p.cycle_id = cy.id AND p.user_id = u.id
      WHERE cy.status = 'collecting'
        AND (p.status IS NULL OR p.status != 'paid')
        AND cy.due_date IS NOT NULL
        AND (
          cy.due_date::date = CURRENT_DATE
          OR cy.due_date::date = CURRENT_DATE + INTERVAL '3 days'
          OR cy.due_date::date = CURRENT_DATE - INTERVAL '1 day'
        )
    `);

    const records = res.rows || [];
    console.log(`⏰ [REMINDER SCHEDULER] Found ${records.length} pending member due notifications to process.`);

    for (const r of records) {
      const dueDate = new Date(r.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDaysDiff = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

      const amountStr = `Rs. ${Number(r.contribution_amount || 0).toLocaleString('en-PK')}`;
      const title = `Sanjhi Payment Due: ${r.committee_name}`;
      const googleCalUrl = generateGoogleCalendarUrl({
        title,
        description: `Contribution of ${amountStr} is due for ${r.committee_name}. Pay on Sanjhi AI to protect your Trust Score.`,
        startDate: dueDate,
      });

      let headerText = '';
      let bodyMessage = '';

      if (dueDaysDiff === 3) {
        headerText = 'Upcoming Payment Due';
        bodyMessage = `Assalam-o-Alaikum ${r.user_name || 'Member'}! Friendly reminder that your ${amountStr} contribution for *${r.committee_name}* is due in 3 days.`;
      } else if (dueDaysDiff === 0) {
        headerText = '🚨 Today is the Last Day to Pay!';
        bodyMessage = `Assalam-o-Alaikum ${r.user_name || 'Member'}! 🚨 Today is the *LAST DAY* to submit your ${amountStr} contribution for *${r.committee_name}*. Please submit your payment receipt to avoid trust score penalties.`;
      } else if (dueDaysDiff === -1) {
        headerText = '⚠️ Overdue Payment Alert';
        bodyMessage = `Assalam-o-Alaikum ${r.user_name || 'Member'}! Your ${amountStr} payment for *${r.committee_name}* is now overdue. Please clear it immediately to restore your Trust Score.`;
      }

      // Add 1-click Google Calendar link to message
      const fullWhatsAppText = `${bodyMessage}\n\n📅 *Add to Google Calendar:* ${googleCalUrl}\n\n_Sanjhi AI — Secured Peer ROSCA_`;

      // ── CHANNEL 1: WHATSAPP ──
      if (r.phone_number) {
        sendWhatsAppMessage(r.phone_number, fullWhatsAppText).catch(() => {});
      }

      // ── CHANNEL 2: EMAIL ──
      if (r.email && r.email.includes('@')) {
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #006972; margin-top: 0;">${headerText}</h2>
            <p style="font-size: 15px; color: #1e293b;">Hello <strong>${r.user_name || 'Member'}</strong>,</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              ${bodyMessage.replace(/\*/g, '')}
            </p>
            <div style="margin: 24px 0; text-align: center;">
              <a href="${googleCalUrl}" target="_blank" style="display: inline-block; background-color: #006972; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none;">
                📅 Add to Google Calendar
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b; text-align: center;">Sanjhi AI ROSCA Platform • Secured Peer Savings</p>
          </div>
        `;
        sendGeneralEmail(r.email, `${headerText} — ${r.committee_name}`, htmlBody).catch(() => {});
      }

      // ── CHANNEL 3: IN-APP NOTIFICATION ──
      try {
        await query(
          `INSERT INTO notifications (user_id, type, channel, content, related_committee_id, created_at)
           VALUES ($1, 'overdue_flag', 'in_app', $2, $3, NOW())`,
          [
            r.user_id,
            `${headerText}: ${r.committee_name} — ${amountStr} payment ${dueDaysDiff === 0 ? 'due today' : dueDaysDiff > 0 ? `due in ${dueDaysDiff} days` : 'overdue'}.`,
            r.committee_id,
          ]
        );
      } catch (notifErr) {
        // ignore duplicate / notification error
      }
    }

    console.log('✅ [REMINDER SCHEDULER] Daily payment due check sweep completed.');
  } catch (error) {
    console.error('❌ [REMINDER SCHEDULER ERROR]:', error.message);
  }
}

/**
 * Initialize daily cron scheduler.
 */
export function initReminderScheduler() {
  console.log('🚀 [REMINDER SCHEDULER] Initializing automated daily payment reminder scheduler (9:00 AM PKT)...');

  // Run initial check on boot (after 10s delay to allow DB/WhatsApp connect)
  setTimeout(() => {
    checkPaymentDueDates();
  }, 10000);

  // Schedule daily interval (every 24 hours)
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    checkPaymentDueDates();
  }, TWENTY_FOUR_HOURS);
}
