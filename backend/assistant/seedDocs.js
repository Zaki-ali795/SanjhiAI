/**
 * seedDocs.js — Default knowledge-base documents for the Sanjhi AI
 * QA assistant. Seeded idempotently at server startup (ON CONFLICT
 * on title DO NOTHING), so admins can later edit/add docs in DB
 * without code changes.
 *
 * Content is plain text (bullets with • and numbered steps) — the
 * chat UI renders it as-is, so no markdown symbols.
 *
 * `keywords` include Roman Urdu variants so bilingual queries
 * ("bharosa score kaise barhe") still match without a vector store.
 */

export const SEED_KB_DOCS = [
  {
    title: 'How to Create a Committee Pool',
    category: 'committees',
    priority: 10,
    keywords: ['create', 'committee', 'pool', 'start', 'organize', 'new', 'kameti', 'banana', 'banao'],
    content: `To create a committee pool on Sanjhi:

1. Open your Dashboard and tap Create Committee.
2. Enter a pool name (e.g. Monthly Family Savings).
3. Set the contribution amount per cycle (e.g. PKR 5,000).
4. Choose the member capacity (number of slots) and the interval: 15 days, 1 month, or 2 months.
5. Review and confirm — you get a unique Invite Code to share with trusted friends and family.

As the organizer you manage join requests, payment confirmations, and payout releases for the pool.`,
  },
  {
    title: 'Joining a Committee by Invite Code',
    category: 'committees',
    priority: 9,
    keywords: ['join', 'invite', 'code', 'join karna', 'shamil', 'code se', 'SANJHI'],
    content: `To join an existing committee:

1. Go to Join Committee on your Dashboard.
2. Enter the invite code shared by the organizer (format like SANJHI-1234A).
3. Send your join request — the organizer reviews and approves it.
4. Once approved, you appear in the member list with your assigned payout turn.

You can also browse Public Committees from the Committees screen and request to join those directly.`,
  },
  {
    title: 'Community Trust Score',
    category: 'trust_score',
    priority: 10,
    keywords: ['trust', 'score', 'reliability', 'bharosa', 'rating', 'points', 'increase', 'barhana', 'barhayein', 'decay', 'formula'],
    content: `Your Community Trust Score is a transparent 0-1000 reputation score. Every new user starts at 850.

Formula: Score = 250 (base) + 550 x Reliability + 150 x Completion + 50 x Verification - Dispute Penalties.

- Reliability (up to 550 points): your payment track record. On-time payments count in full; late payments count partially (for example, paying 5 days late in a monthly committee still counts about 83%); missed payments count as zero. Recent payments matter more: each payment's weight halves every 90 days, so old mistakes fade away.
- Completion (up to 150 points): finishing a full committee adds to your score; dropping out after a missed payment subtracts. These fade with a 180-day half-life.
- Verification (up to 50 points): verified phone, email, and CNIC. CNIC alone is worth 20 points - verify it in your Profile.
- Penalties: a fraud or payment dispute resolved against you costs 120 points, but penalties also decay over time (180-day half-life) and can never exceed 400 points in total.

How to improve: pay every cycle on time, complete the committees you join, and verify your CNIC. Tap your score on the Dashboard to see the full breakdown. Organizers see your score when you request to join their committee.`,
  },
  {
    title: 'Supported Payment Methods',
    category: 'payments',
    priority: 10,
    keywords: ['payment', 'jazzcash', 'easypaisa', 'bank', 'iban', 'wallet', 'pay', 'paisa', 'tareeqa', 'methods'],
    content: `Sanjhi supports these payment methods across Pakistan:

• JazzCash mobile wallet
• EasyPaisa mobile wallet
• Direct bank transfer (IBAN)

Link your account in Profile → Linked Accounts before your first payment. After paying, submit your payment in the app with the transaction reference so your organizer can confirm it. All receipts are recorded on the platform ledger for transparency.`,
  },
  {
    title: 'How to Submit a Payment',
    category: 'payments',
    priority: 9,
    keywords: ['submit', 'pay', 'payment', 'due', 'contribution', 'adaigi', 'jama', 'kaise karun'],
    content: `To submit your monthly contribution:

1. Open My Payments from the bottom navigation.
2. Find the due payment for your committee cycle.
3. Pay via your linked account (JazzCash, EasyPaisa, or bank transfer).
4. Tap Pay Now and enter the sender account details or transaction reference.

Your payment is marked awaiting confirmation until the organizer verifies it, then it becomes paid and your Trust Score earns +15 points for on-time payment.`,
  },
  {
    title: 'Payout Turn Schedule',
    category: 'payouts',
    priority: 9,
    keywords: ['payout', 'turn', 'schedule', 'receive', 'money', 'number', 'baari', 'kab milegi'],
    content: `Payout turns are assigned fairly when a committee starts:

• Fixed order: members are assigned turn #1, #2, #3 based on the initial setup by the organizer.
• Automatic reminders: Sanjhi alerts you 3 days before your payout is due to be released.
• When your turn arrives, the organizer releases the full pool amount to your linked account.

You can see your upcoming payout turn on the committee detail screen and on your Dashboard.`,
  },
  {
    title: 'Release Payout (Organizers)',
    category: 'payouts',
    priority: 5,
    keywords: ['release', 'payout', 'organizer', 'distribute', 'release karna'],
    content: `Organizers release payouts when the cycle member's turn arrives:

1. Open the committee and go to the current cycle.
2. Tap Release Payout for the member whose turn it is.
3. Confirm the amount and the member's linked account.

The payout is recorded on the ledger and the member is notified. Releasing payouts cannot be done through the WhatsApp bot — use the web app.`,
  },
  {
    title: 'Filing Complaints and Disputes',
    category: 'complaints',
    priority: 10,
    keywords: ['complaint', 'dispute', 'fraud', 'issue', 'problem', 'shikayat', 'madad', 'support', 'help'],
    content: `If you have an issue or a payment dispute:

1. Open the Support section from the bottom navigation bar.
2. Tap File a Complaint and choose the category: payment dispute, harassment, suspected fraud, or other.
3. Add details and any evidence (screenshots or receipts).

Our AI triage system reviews complaints, prioritizes urgent financial queries, and routes complex cases to the admin team. Track the status anytime under My Complaints. For urgent help you can also reach us on WhatsApp.`,
  },
  {
    title: 'Complaint Statuses Explained',
    category: 'complaints',
    priority: 4,
    keywords: ['status', 'complaint', 'pending', 'in review', 'resolved', 'dismissed', 'ai resolved'],
    content: `Your complaint can move through these statuses:

• pending — filed and waiting for review.
• in_review — the AI investigator or admin team is examining it.
• ai_resolved — resolved automatically by the AI with a summary you can read.
• needs_human_review — escalated to a human admin for a decision.
• resolved — closed with resolution notes.
• dismissed — closed without action (reasons are provided).

You are notified every time the status changes.`,
  },
  {
    title: 'CNIC Verification',
    category: 'account',
    priority: 6,
    keywords: ['cnic', 'verification', 'verify', 'identity', 'nadra', 'card', 'tasdeeq'],
    content: `Verifying your CNIC adds +30 points to your Trust Score and builds member confidence:

1. Go to Profile → CNIC Verification.
2. Upload clear photos of your CNIC front and back.
3. Submit for review — the admin team verifies it, usually within 1–2 business days.

You get a notification once approved. If rejected, the reason is shown so you can re-submit corrected photos.`,
  },
  {
    title: 'Account Login and Security',
    category: 'account',
    priority: 6,
    keywords: ['login', 'password', 'otp', 'security', 'account', 'forgot', 'reset', 'bhoool'],
    content: `Sanjhi keeps your account safe with phone-number login:

• Login uses a one-time password (OTP) sent by SMS — no password needed.
• If you set a password and forget it, use Forgot Password to reset it via OTP.
• Never share your OTP with anyone — Sanjhi staff will never ask for it.
• Update your profile photo, email, and linked accounts in Profile settings.

If you suspect unauthorized access, contact support immediately on WhatsApp.`,
  },
  {
    title: 'Notifications and Reminders',
    category: 'general',
    priority: 4,
    keywords: ['notification', 'reminder', 'alert', 'bell', 'notification'],
    content: `Sanjhi keeps you informed with in-app notifications:

• Payment received and payment due reminders.
• Join requests, approvals, and rejections.
• Payout released alerts and overdue flags.
• Complaint status updates and CNIC verification results.

Tap the bell icon on your Dashboard to see all notifications; unread ones show a badge count.`,
  },
  {
    title: 'Using the Sanjhi WhatsApp Bot',
    category: 'general',
    priority: 5,
    keywords: ['whatsapp', 'bot', 'chat', 'message', 'number', 'robot'],
    content: `You can manage your Sanjhi account directly on WhatsApp:

• Message us at +92 341 1713517.
• The bot understands English, Roman Urdu, and Urdu — even voice notes.
• It can show your dashboard, list your committees, help you create or join pools, submit payments, and file complaints.
• Send "end session" anytime to reset the conversation.

For anything the bot cannot do, it will point you to the web app.`,
  },
  {
    title: 'Contact Human Support',
    category: 'general',
    priority: 10,
    keywords: ['contact', 'human', 'support', 'whatsapp', 'call', 'help', 'rabta', 'baat'],
    content: `Need a human? You can reach our support team directly on WhatsApp:

• Message us at +92 341 1713517.
• Business hours: 9 AM – 9 PM PKT, seven days a week.
• For disputes, attach screenshots or receipts so we can help faster.

You can also tap the green WhatsApp button on the Assistant screen to open a chat instantly.`,
  },
];
