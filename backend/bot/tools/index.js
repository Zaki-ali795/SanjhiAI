import { getDashboard } from './dashboard.js';
import { listMyCommittees, getCommitteeDetail, createCommittee, joinCommitteeByCode } from './committees.js';
import { getMyPayments, submitMyPayment } from './payments.js';
import { fileComplaint, getMyComplaints } from './complaints.js';
import { getNotifications } from './notifications.js';
import { getCalendarReminderLink } from './calendar.js';
import { deleteSession } from '../sessionManager.js';

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_dashboard',
      description: 'Get the user\'s dashboard overview: trust score, balance, active committees, upcoming payouts, and recent notifications.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_my_committees',
      description: 'List all committees the user is part of (as organizer, co-organizer, or member).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_committee_detail',
      description: 'Get detailed info about a specific committee including members, cycles, and next payout.',
      parameters: {
        type: 'object',
        properties: {
          committee_id: { type: 'string', description: 'UUID of the committee' },
        },
        required: ['committee_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_committee',
      description: 'Create a new savings committee. Requires name, contribution amount, capacity, and interval type.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Committee name' },
          contribution_amount: { type: 'number', description: 'Contribution amount in PKR per cycle' },
          capacity: { type: 'integer', description: 'Total number of members/slots' },
          interval_type: { type: 'string', enum: ['15_days', '1_month', '2_months'], description: 'Payment interval' },
        },
        required: ['name', 'contribution_amount', 'capacity', 'interval_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'join_committee_by_code',
      description: 'Join a committee using an invite code (e.g. SANJHI-1234A).',
      parameters: {
        type: 'object',
        properties: {
          invite_code: { type: 'string', description: 'The committee invite code' },
        },
        required: ['invite_code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_payments',
      description: 'Get the user\'s payment history and upcoming dues across all committees.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'submit_my_payment',
      description: 'Submit a self-reported payment for a specific committee cycle. User must provide sender account details or transaction reference.',
      parameters: {
        type: 'object',
        properties: {
          committee_id: { type: 'string', description: 'UUID of the committee' },
          cycle_id: { type: 'string', description: 'UUID of the cycle' },
          sender_account_details: { type: 'string', description: 'Sender account details or transaction reference' },
        },
        required: ['committee_id', 'cycle_id', 'sender_account_details'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'file_complaint',
      description: 'File a complaint against a member. Requires category and description.',
      parameters: {
        type: 'object',
        properties: {
          accused_user_id: { type: 'string', description: 'UUID of the accused user (optional)' },
          committee_id: { type: 'string', description: 'UUID of the related committee (optional)' },
          category: { type: 'string', enum: ['payment_dispute', 'harassment', 'suspected_fraud', 'other'], description: 'Complaint category' },
          description: { type: 'string', description: 'Detailed description of the complaint' },
        },
        required: ['category', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_complaints',
      description: 'Get all complaints filed by the user with their current status.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_notifications',
      description: 'Get the user\'s recent notifications.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_calendar_reminder_link',
      description: 'Get a 1-click Google Calendar reminder link for committee payment due dates.',
      parameters: {
        type: 'object',
        properties: {
          committee_id: { type: 'string', description: 'Optional committee UUID' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'logout',
      description: 'Log out the user from the WhatsApp bot session.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

export async function executeTool(toolName, args, session, phone) {
  const jwt = session.jwt;

  switch (toolName) {
    case 'get_dashboard':
      return getDashboard(jwt);

    case 'list_my_committees':
      return listMyCommittees(jwt);

    case 'get_committee_detail':
      return getCommitteeDetail(jwt, args.committee_id);

    case 'create_committee':
      return createCommittee(jwt, {
        name: args.name,
        contribution_amount: args.contribution_amount,
        capacity: args.capacity,
        interval_type: args.interval_type,
      });

    case 'join_committee_by_code':
      return joinCommitteeByCode(jwt, args.invite_code);

    case 'get_my_payments':
      return getMyPayments(jwt);

    case 'submit_my_payment':
      return submitMyPayment(jwt, args.committee_id, args.cycle_id, args.sender_account_details);

    case 'file_complaint':
      return fileComplaint(jwt, {
        accused_user_id: args.accused_user_id || null,
        committee_id: args.committee_id || null,
        category: args.category,
        description: args.description,
      });

    case 'get_my_complaints':
      return getMyComplaints(jwt);

    case 'get_notifications':
      return getNotifications(jwt);

    case 'get_calendar_reminder_link':
      return getCalendarReminderLink(jwt, args.committee_id);

    case 'logout':
      await deleteSession(phone);
      return { success: true, data: { message: 'Logged out successfully.' } };

    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}
