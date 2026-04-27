/**
 * Reputation Controller
 *
 * Tracks user contributions across the platform and awards badges.
 *
 * Points:
 *   - project_completed: +50
 *   - task_completed: +10
 *   - invite_accepted: +15
 *   - mentor_endorsed: +25
 *   - feedback_given: +5
 *   - message_sent: +1
 *
 * Badges:
 *   - rising_researcher: 50+ points
 *   - top_collaborator: 150+ points
 *   - trusted_mentor: 200+ points + is a mentor
 *   - code_warrior: 10+ tasks completed
 *   - team_player: 5+ invites accepted
 */

const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const POINT_VALUES = {
  project_completed: 50,
  task_completed: 10,
  invite_accepted: 15,
  mentor_endorsed: 25,
  feedback_given: 5,
  message_sent: 1,
  note_created: 3,
};

const BADGE_RULES = [
  { type: 'rising_researcher', label: 'Rising Researcher', minPoints: 50, icon: '🌱' },
  { type: 'top_collaborator', label: 'Top Collaborator', minPoints: 150, icon: '🤝' },
  { type: 'trusted_mentor', label: 'Trusted Mentor', minPoints: 200, icon: '🎓', requiresMentor: true },
  { type: 'code_warrior', label: 'Code Warrior', minPoints: 100, icon: '⚔️' },
  { type: 'team_player', label: 'Team Player', minPoints: 75, icon: '🏅' },
];

const ReputationController = {
  /**
   * GET /api/reputation/:userId
   * Get user's reputation score and badges.
   */
  async getReputation(req, res, next) {
    try {
      const userId = req.params.userId || req.user.id;

      // Total points
      const [pointRows] = await pool.query(
        'SELECT COALESCE(SUM(points), 0) as total_points FROM reputation_events WHERE user_id = ?',
        [userId]
      );
      const totalPoints = pointRows[0]?.total_points || 0;

      // Event breakdown
      const [breakdown] = await pool.query(
        'SELECT event_type, SUM(points) as points, COUNT(*) as count FROM reputation_events WHERE user_id = ? GROUP BY event_type',
        [userId]
      );

      // Badges
      const [badges] = await pool.query(
        'SELECT * FROM user_badges WHERE user_id = ? ORDER BY awarded_at DESC',
        [userId]
      );

      // Rank among all users
      const [rankRows] = await pool.query(
        `SELECT COUNT(*) + 1 as rank FROM (
           SELECT user_id, SUM(points) as total FROM reputation_events GROUP BY user_id HAVING total > ?
         )`,
        [totalPoints]
      );
      const rank = rankRows[0]?.rank || 1;

      res.json({
        user_id: userId,
        total_points: totalPoints,
        rank,
        breakdown,
        badges: badges.map(b => {
          const rule = BADGE_RULES.find(r => r.type === b.badge_type);
          return { ...b, label: rule?.label, icon: rule?.icon };
        }),
        available_badges: BADGE_RULES.map(r => ({
          ...r,
          earned: badges.some(b => b.badge_type === r.type),
          progress: Math.min(100, Math.round((totalPoints / r.minPoints) * 100))
        }))
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/reputation/award
   * Award reputation points (internal use, called by other controllers).
   * Also checks and awards badges.
   */
  async award(req, res, next) {
    try {
      const { user_id, event_type, reference_id } = req.body;
      const points = POINT_VALUES[event_type];
      if (!points) throw new AppError(`Unknown event type: ${event_type}`, 400);

      await pool.query(
        'INSERT INTO reputation_events (user_id, event_type, points, reference_id) VALUES (?, ?, ?, ?)',
        [user_id, event_type, points, reference_id || null]
      );

      // Check for new badges
      const [pointRows] = await pool.query(
        'SELECT COALESCE(SUM(points), 0) as total FROM reputation_events WHERE user_id = ?',
        [user_id]
      );
      const totalPoints = pointRows[0]?.total || 0;

      // Check mentor status for trusted_mentor badge
      const [mentorRows] = await pool.query(
        'SELECT id FROM mentors WHERE user_id = ? AND is_approved = 1',
        [user_id]
      );
      const isMentor = mentorRows.length > 0;

      const newBadges = [];
      for (const rule of BADGE_RULES) {
        if (totalPoints >= rule.minPoints) {
          if (rule.requiresMentor && !isMentor) continue;

          try {
            await pool.query(
              'INSERT INTO user_badges (user_id, badge_type) VALUES (?, ?)',
              [user_id, rule.type]
            );
            newBadges.push(rule);
          } catch (e) {
            // UNIQUE constraint — badge already awarded, skip
          }
        }
      }

      res.json({ points_awarded: points, total_points: totalPoints, new_badges: newBadges });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/reputation/leaderboard
   * Top users by reputation.
   */
  async leaderboard(req, res, next) {
    try {
      const [rows] = await pool.query(
        `SELECT re.user_id, u.name, u.avatar_url, SUM(re.points) as total_points, COUNT(*) as total_events
         FROM reputation_events re JOIN users u ON re.user_id = u.id
         GROUP BY re.user_id
         ORDER BY total_points DESC
         LIMIT 20`
      );

      // Attach badges for top users
      const leaderboard = await Promise.all(rows.map(async (r) => {
        const [badges] = await pool.query('SELECT badge_type FROM user_badges WHERE user_id = ?', [r.user_id]);
        return { ...r, badges: badges.map(b => b.badge_type) };
      }));

      res.json({ leaderboard });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ReputationController;
