import { query } from '../config/db.js';
import { chatCompletion } from '../utilities/groqLlm.js';

/**
 * Curate polished, human-friendly highlight messages for activities
 * using the Groq LLM. Falls back to raw template descriptions
 * if the API is unavailable or fails.
 */
async function curateActivityMessages(activities) {
  // Only curate the most recent entries the dashboard will show
  const limit = Math.min(activities.length, 12);
  if (limit === 0) return activities;

  try {
    const list = activities
      .slice(0, limit)
      .map((a, i) => `${i}. [${a.type}] ${a.description}`)
      .join('\n');

    const content = await chatCompletion(
      [
        {
          role: 'system',
          content:
            'You curate concise, friendly activity highlight messages for Sanjhi AI, a Pakistani ROSCA committee savings app. ' +
            'Rewrite each numbered activity into a short engaging one-liner (max 14 words) while keeping every fact intact: amounts, member names, committee names, and cycle numbers. ' +
            'Use a warm, celebratory tone appropriate for financial milestones. ' +
            'Return ONLY a JSON array of strings in the exact same order and count as the input. No extra text or markdown.',
        },
        { role: 'user', content: `Rewrite these activity messages:\n${list}` },
      ],
      { max_tokens: 450, temperature: 0.7, timeoutMs: 20000 }
    );

    // Extract JSON array even if wrapped in markdown fences
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return activities;

    const curated = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(curated)) return activities;

    return activities.map((a, i) => {
      if (i >= limit) return a;
      const polished = typeof curated[i] === 'string' ? curated[i].trim() : '';
      return polished
        ? { ...a, raw_description: a.description, description: polished }
        : a;
    });
  } catch (err) {
    console.warn('Activity message curation failed, using raw descriptions:', err.message);
    return activities;
  }
}

export async function getUserActivities(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Unified query to fetch activities from multiple sources
    // Types: committee_created, payment, payout, member_request, participant_added
    const activitiesRes = await query(
      `
      -- Committees created by user
      SELECT
          'committee_created' as type,
          c.id,
          CAST(c.status AS TEXT) as status,
          c.created_at as created_at,
          c.name as committee_name,
          'Created committee ' || c.name as description
      FROM committees c
      WHERE c.created_by = $1

      UNION ALL

      -- Payments made by user
      SELECT 
          'payment' as type,
          p.id,
          CAST(p.status AS TEXT) as status,
          p.submitted_at as created_at,
          c.name as committee_name,
          'Paid Rs. ' || c.contribution_amount || ' to ' || c.name || ' for cycle ' || cy.cycle_number as description
      FROM payments p
      JOIN cycles cy ON p.cycle_id = cy.id
      JOIN committees c ON cy.committee_id = c.id
      WHERE p.user_id = $1

      UNION ALL

      -- Payouts received by user
      SELECT 
          'payout' as type,
          cy.id,
          CAST(cy.payout_status AS TEXT) as status,
          cy.payout_sent_at as created_at,
          c.name as committee_name,
          'Received payout of Rs. ' || (c.contribution_amount * c.capacity) || ' from ' || c.name || ' for cycle ' || cy.cycle_number as description
      FROM cycles cy
      JOIN committees c ON cy.committee_id = c.id
      WHERE cy.recipient_user_id = $1 AND cy.payout_sent_at IS NOT NULL

      UNION ALL

      -- User's own join requests / memberships
      SELECT 
          'member_request' as type,
          m.id,
          CAST(m.status AS TEXT) as status,
          COALESCE(m.joined_at, m.created_at) as created_at,
          c.name as committee_name,
          CASE WHEN m.status = 'approved' THEN 'Joined committee ' || c.name
               ELSE 'Requested to join ' || c.name || ' (' || CAST(m.status AS TEXT) || ')' END as description
      FROM members m
      JOIN committees c ON m.committee_id = c.id
      WHERE m.user_id = $1

      UNION ALL

      -- Organizer view: participants requesting / joining their committee
      SELECT 
          'participant_added' as type,
          m.id,
          CAST(m.status AS TEXT) as status,
          COALESCE(m.joined_at, m.created_at) as created_at,
          c.name as committee_name,
          COALESCE(u.full_name, 'A member') ||
            CASE WHEN m.status = 'approved' THEN ' joined your committee ' ELSE ' requested to join your committee ' END ||
            c.name as description
      FROM members m
      JOIN committees c ON m.committee_id = c.id
      JOIN organizers o ON o.committee_id = c.id
      LEFT JOIN users u ON u.id = m.user_id
      WHERE o.user_id = $1 AND m.user_id <> $1
      
      ORDER BY created_at DESC
      LIMIT 50;
      `,
      [userId]
    );

    const curatedActivities = await curateActivityMessages(activitiesRes.rows);

    return res.status(200).json({
      activities: curatedActivities,
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return res.status(500).json({ error: 'Failed to fetch activities.' });
  }
}
