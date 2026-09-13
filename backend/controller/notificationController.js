import { query } from '../config/db.js';
import { getCache, setCache, delCache } from '../config/redis.js';

/**
 * Helper to create a notification for a user.
 * Uses the DDL schema: (user_id, type, channel, content, related_committee_id, created_at)
 */
export async function createNotification(userId, type, channel, content, relatedCommitteeId = null) {
  try {
    const res = await query(
      `INSERT INTO notifications (user_id, type, channel, content, related_committee_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [userId, type || 'payment_received', channel || 'in_app', content || 'Notification', relatedCommitteeId]
    );

    // Invalidate cached unread count for user
    if (userId) {
      delCache(`sanjhi:cache:unread_notifs:${userId}`).catch(() => {});
    }

    return res.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * GET /api/notifications
 * Fetches all notifications for the authenticated user with optional category filter
 */
export async function getUserNotifications(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { category } = req.query;
    let categoryClause = '';
    const params = [userId];

    if (category === 'payments') {
      categoryClause = ` AND (n.type::text LIKE 'payment%' OR n.type::text LIKE 'cycle%' OR n.type::text LIKE 'payout%' OR n.type::text = 'overdue_flag')`;
    } else if (category === 'committees') {
      categoryClause = ` AND (n.type::text LIKE 'join%' OR n.type::text LIKE 'member%' OR n.type::text LIKE 'public%')`;
    } else if (category === 'security') {
      categoryClause = ` AND (n.type::text LIKE 'cnic%')`;
    } else if (category === 'system') {
      categoryClause = ` AND (n.type::text LIKE 'complaint%')`;
    }

    const result = await query(
      `SELECT n.*, c.name AS committee_name
       FROM notifications n
       LEFT JOIN committees c ON c.id = n.related_committee_id
       WHERE n.user_id = $1 ${categoryClause}
       ORDER BY n.created_at DESC`,
      params
    );

    return res.status(200).json({
      notifications: result.rows,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marks a notification as read
 */
export async function markNotificationAsRead(req, res) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const result = await query(
      `UPDATE notifications
       SET read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    // Invalidate cached unread count for user
    delCache(`sanjhi:cache:unread_notifs:${userId}`).catch(() => {});

    return res.status(200).json({
      message: 'Notification marked as read.',
      notification: result.rows[0],
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
}

/**
 * PATCH /api/notifications/read-all
 * Marks all notifications as read for current user
 */
export async function markAllNotificationsAsRead(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    await query(
      `UPDATE notifications
       SET read_at = NOW()
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );

    // Invalidate cached unread count for user
    delCache(`sanjhi:cache:unread_notifs:${userId}`).catch(() => {});

    return res.status(200).json({
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ error: 'Failed to mark all as read.' });
  }
}

/**
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications (cached for 30s in Redis)
 */
export async function getUnreadNotificationCount(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const cacheKey = `sanjhi:cache:unread_notifs:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached !== null && cached !== undefined) {
      return res.status(200).json(cached);
    }

    const result = await query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );

    const payload = { count: parseInt(result.rows[0]?.count || 0, 10) };
    await setCache(cacheKey, payload, 30);

    return res.status(200).json(payload);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({ error: 'Failed to fetch unread count.' });
  }
}
