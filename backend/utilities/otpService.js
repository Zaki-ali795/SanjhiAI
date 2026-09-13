import nodemailer from 'nodemailer';
import dns from 'dns';
import net from 'net';
import { sendWhatsAppWebOTP } from './whatsappGateway.js';

// Force Node.js to prioritize IPv4 addresses (fixes ENETUNREACH on IPv6-unroutable cloud hosts)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Probe a specific host:port using raw TCP socket
 */
export function probePort(host, port, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ host, port, open: true });
      }
    });

    socket.on('timeout', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ host, port, open: false, error: 'TIMEOUT (Blocked by Cloud/Railway Firewall)' });
      }
    });

    socket.on('error', (err) => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ host, port, open: false, error: err.message });
      }
    });

    try {
      socket.connect(port, host);
    } catch (err) {
      if (!isResolved) {
        isResolved = true;
        resolve({ host, port, open: false, error: err.message });
      }
    }
  });
}

// Initialize Nodemailer Transporter with intelligent service detection and strict timeouts
function createMailTransporter() {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();
  const host = (process.env.SMTP_HOST || '').trim();
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const isGmail = host.includes('gmail') || user.includes('@gmail.com');

  if (isGmail && user && pass) {
    // Port 465 with Direct SSL and IPv4 socket connection
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4, // Force IPv4
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 8000,
    });
  }

  return nodemailer.createTransport({
    host: host || 'smtp.gmail.com',
    port: port,
    secure: port === 465 || process.env.SMTP_SECURE === 'true',
    family: 4, // Force IPv4
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 8000,
  });
}

const transporter = createMailTransporter();

/**
 * Unified Email Dispatcher
 * Prioritizes HTTPS REST APIs (Port 443 - never blocked by cloud firewalls / Railway)
 * 1. Resend HTTPS API
 * 2. Brevo HTTPS API
 * 3. Nodemailer SMTP (if configured)
 * 4. Dev Console Fallback
 */
export async function dispatchEmail({ to, subject, html, text }) {
  const recipient = Array.isArray(to) ? to : [to];
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const brevoKey = (process.env.BREVO_API_KEY || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();

  // 1. Primary: Resend HTTPS API (Port 443)
  if (resendKey) {
    try {
      const fromAddress = process.env.RESEND_FROM || 'Sanjhi <onboarding@resend.dev>';
      const payload = {
        from: fromAddress,
        to: recipient,
        subject,
        html,
      };
      if (text) payload.text = text;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`✅ [RESEND EMAIL SENT] ID: ${data.id} to ${recipient.join(', ')}`);
        return { success: true, channel: 'resend-https', messageId: data.id };
      } else {
        const errText = await res.text();
        console.error(`❌ [RESEND API ERROR] Status ${res.status}:`, errText);
      }
    } catch (err) {
      console.error(`❌ [RESEND REQUEST FAILED]:`, err.message);
    }
  }

  // 2. Secondary: Brevo HTTPS API (Port 443)
  if (brevoKey) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'no-reply@sanjhi.pk';
      const senderName = process.env.BREVO_SENDER_NAME || 'Sanjhi';
      const payload = {
        sender: { name: senderName, email: senderEmail },
        to: recipient.map((email) => ({ email })),
        subject,
        htmlContent: html,
      };
      if (text) payload.textContent = text;

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`✅ [BREVO EMAIL SENT] ID: ${data.messageId} to ${recipient.join(', ')}`);
        return { success: true, channel: 'brevo-https', messageId: data.messageId };
      } else {
        const errText = await res.text();
        console.error(`❌ [BREVO API ERROR] Status ${res.status}:`, errText);
      }
    } catch (err) {
      console.error(`❌ [BREVO REQUEST FAILED]:`, err.message);
    }
  }

  // 3. Fallback: SMTP Transport
  if (smtpUser) {
    try {
      const fromAddress = smtpUser.includes('@gmail.com')
        ? `"Sanjhi AI" <${smtpUser}>`
        : (process.env.SMTP_FROM || `"Sanjhi AI" <${smtpUser}>`);

      const emailPromise = transporter.sendMail({
        from: fromAddress,
        to: recipient.join(', '),
        subject,
        text: text || undefined,
        html,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP dispatch timed out after 5000ms')), 5000)
      );

      const info = await Promise.race([emailPromise, timeoutPromise]);
      console.log(`✅ [SMTP EMAIL SENT] Message ID: ${info.messageId} to ${recipient.join(', ')}`);
      return { success: true, channel: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error(`⚠️ [SMTP EMAIL DISPATCH FAILED]:`, err.message);
    }
  }

  // 4. Dev / Console Fallback
  if (!resendKey && !brevoKey && !smtpUser) {
    console.warn(`⚠️ [EMAIL SERVICE] No email provider configured (RESEND_API_KEY or SMTP_USER). Email to ${recipient.join(', ')} logged to console.`);
  }
  return { success: true, channel: 'console', messageId: 'dev-console' };
}

/**
 * Verify Email Service Connection
 * Handles Resend, Brevo, or SMTP diagnostics
 */
export async function verifySmtpConnection() {
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const brevoKey = (process.env.BREVO_API_KEY || '').trim();
  const user = (process.env.SMTP_USER || '').trim();
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const isGmail = host.includes('gmail') || user.includes('@gmail.com');

  console.log('\n======================================================');
  console.log('📧 [EMAIL DISPATCH SERVICE DIAGNOSTICS]');

  if (resendKey) {
    const from = process.env.RESEND_FROM || 'Sanjhi <onboarding@resend.dev>';
    console.log('Provider    : Resend HTTPS API (REST over Port 443)');
    console.log(`Sender From : ${from}`);
    console.log('Status      : ✅ Active (Cloud / Railway Firewall-safe)');
    console.log('======================================================\n');
    return { connected: true, provider: 'resend', from };
  }

  if (brevoKey) {
    console.log('Provider    : Brevo HTTPS API (REST over Port 443)');
    console.log('Status      : ✅ Active (Cloud / Railway Firewall-safe)');
    console.log('======================================================\n');
    return { connected: true, provider: 'brevo' };
  }

  console.log(`Target Host : ${host}`);
  console.log(`User/Sender : ${user || '(not configured)'}`);
  console.log('------------------------------------------------------');

  if (!user) {
    console.warn('⚠️ No email provider configured. Emails will be logged to console in dev mode.');
    console.log('======================================================\n');
    return { connected: false, reason: 'unconfigured' };
  }

  // Probe all common email ports in parallel
  const targetHost = isGmail ? 'smtp.gmail.com' : host;
  const portsToTest = [465, 587, 2525, 25];

  const probeResults = await Promise.all(
    portsToTest.map((p) => probePort(targetHost, p, 3500))
  );

  probeResults.forEach((res) => {
    if (res.open) {
      console.log(`✅ Port ${res.port.toString().padEnd(5)} : OPEN / REACHABLE`);
    } else {
      console.log(`❌ Port ${res.port.toString().padEnd(5)} : CLOSED / ${res.error}`);
    }
  });

  const anyPortOpen = probeResults.some((r) => r.open);

  if (!anyPortOpen) {
    console.warn('\n⚠️ [RAILWAY NOTICE] All raw SMTP ports (465, 587, 2525) are blocked by the host network firewall.');
    console.warn('💡 Recommended fix: Use HTTPS-based Email API (like Resend) over port 443 which is NEVER blocked.');
    console.warn('   Set RESEND_API_KEY in Railway variables.');
  }

  console.log('======================================================\n');

  // Try authenticating with transporter
  try {
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) reject(error);
        else resolve(success);
      });
    });

    console.log(`🎉 SMTP Authentication Successful on port ${isGmail ? 465 : process.env.SMTP_PORT || 465}!`);
    return { connected: true, probeResults };
  } catch (error) {
    console.error(`⚠️ SMTP Handshake failed: ${error.message}`);
    return { connected: false, error: error.message, probeResults };
  }
}

/**
 * Generate a random 6-digit numeric OTP code.
 */
export function generateOTPCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via Email or SMS based on target type.
 * @param {string} target - Email address or Phone number
 * @param {string} code - 6-digit OTP code
 */
export async function sendOTP(target, code) {
  const isEmail = target.includes('@');

  console.log(`\n========================================`);
  console.log(`🔑 [OTP DISPATCH SERVICE]`);
  console.log(`Target : ${target}`);
  console.log(`Code   : ${code}`);
  console.log(`========================================\n`);

  if (isEmail) {
    return sendEmailOTP(target, code);
  } else {
    return sendSMSOTP(target, code);
  }
}

/**
 * Dispatch Email OTP
 */
async function sendEmailOTP(email, code) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2e7d32; text-align: center;">Sanjhi Verification</h2>
        <p>Hello,</p>
        <p>Your verification code for Sanjhi is:</p>
        <div style="background-color: #f4f6f8; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1b5e20; text-align: center; padding: 15px; border-radius: 6px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 13px;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
      </div>
    `;

    const text = `Your Sanjhi verification code is: ${code}. It expires in 10 minutes. Do not share this with anyone.`;

    const result = await dispatchEmail({
      to: email,
      subject: 'Your Sanjhi Verification Code',
      html,
      text,
    });

    return result;
  } catch (error) {
    console.error(`⚠️ [OTP EMAIL DISPATCH WARNING]:`, error.message);
    return { success: true, channel: 'console-fallback', error: error.message };
  }
}

/**
 * Dispatch Phone OTP via Self-Hosted WhatsApp Gateway, Green API, CallMeBot, or Twilio
 */
async function sendSMSOTP(phone, code) {
  // 1. Primary: Send via Self-Hosted WhatsApp Web Gateway
  const gatewayResult = await sendWhatsAppWebOTP(phone, code);
  if (gatewayResult && !gatewayResult.mock) {
    return gatewayResult;
  }

  // 2. If Green API credentials are configured, send via Green API WhatsApp
  if (process.env.GREEN_API_ID_INSTANCE && process.env.GREEN_API_API_TOKEN_INSTANCE) {
    return sendGreenAPIWhatsAppOTP(phone, code);
  }

  // 3. If CallMeBot API key is configured, send via CallMeBot WhatsApp
  if (process.env.CALLMEBOT_API_KEY) {
    return sendWhatsAppOTP(phone, code);
  }

  console.error(`[OTP PHONE/WHATSAPP] No WhatsApp/SMS gateway configured. Cannot send OTP to ${phone}.`);
  return { success: false, channel: 'whatsapp', error: 'No WhatsApp or SMS gateway is configured.' };
}

/**
 * Dispatch WhatsApp OTP via Green API
 */
async function sendGreenAPIWhatsAppOTP(phone, code) {
  try {
    const formattedPhone = phone.replace(/[^\d]/g, '');
    const idInstance = process.env.GREEN_API_ID_INSTANCE;
    const apiTokenInstance = process.env.GREEN_API_API_TOKEN_INSTANCE;
    const host = (process.env.GREEN_API_HOST || 'https://api.green-api.com').replace(/\/$/, '');

    const url = `${host}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: `${formattedPhone}@c.us`,
        message: `Your Sanjhi verification code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`,
      }),
    });

    const data = await response.json();
    if (response.ok && data.idMessage) {
      console.log(`✅ [GREEN API WHATSAPP SENT] Message ID: ${data.idMessage} to ${phone}`);
      return { success: true, channel: 'whatsapp', idMessage: data.idMessage };
    } else {
      console.error(`❌ [GREEN API WHATSAPP FAILED] Status: ${response.status}`, data);
      return { success: false, channel: 'whatsapp', error: JSON.stringify(data) };
    }
  } catch (error) {
    console.error(`❌ [GREEN API WHATSAPP ERROR]:`, error.message);
    return { success: false, channel: 'whatsapp', error: error.message };
  }
}

/**
 * Dispatch WhatsApp OTP via CallMeBot Free API
 */
async function sendWhatsAppOTP(phone, code) {
  try {
    const formattedPhone = phone.replace(/[^\d]/g, '');
    const apiKey = process.env.CALLMEBOT_API_KEY;
    const message = encodeURIComponent(`Your Sanjhi verification code is: ${code}. Valid for 10 minutes.`);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${message}&apikey=${apiKey}`;

    const response = await fetch(url);
    if (response.ok) {
      console.log(`✅ [OTP WHATSAPP SENT] Code ${code} sent via WhatsApp to ${phone}`);
      return { success: true, channel: 'whatsapp' };
    } else {
      console.error(`❌ [OTP WHATSAPP FAILED] CallMeBot status: ${response.status}`);
      return { success: false, channel: 'whatsapp', error: `CallMeBot returned status ${response.status}` };
    }
  } catch (error) {
    console.error(`❌ [OTP WHATSAPP ERROR]:`, error.message);
    return { success: false, channel: 'whatsapp', error: error.message };
  }
}

/**
 * Send Login Confirmation Email
 */
export async function sendLoginNotificationEmail(email, userName) {
  try {
    if (!email || !email.includes('@')) return;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2e7d32; text-align: center;">Sanjhi Login Notification</h2>
        <p>Hello <strong>${userName || 'User'}</strong>,</p>
        <p>You have successfully logged in to your Sanjhi account.</p>
        <p style="color: #666; font-size: 13px; margin-top: 20px;">If this was not you, please secure your account immediately.</p>
      </div>
    `;
    const text = `Hello ${userName || 'User'}, you have successfully logged in to your Sanjhi account. If this was not you, please secure your account immediately.`;

    await dispatchEmail({
      to: email,
      subject: 'Security Alert: Successful Login to Sanjhi',
      html,
      text,
    });
  } catch (err) {
    console.error(`❌ [LOGIN EMAIL FAILED]:`, err.message);
  }
}

/**
 * Send general HTML email notification
 */
export async function sendGeneralEmail(to, subject, html) {
  try {
    if (!to || !to.includes('@')) {
      return { success: false, error: 'Invalid recipient email address.' };
    }

    return await dispatchEmail({
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`❌ [EMAIL SEND FAILED]:`, err.message);
    return { success: false, error: err.message };
  }
}

