/**
 * Request Controller
 *
 * Unified endpoint for getting all sent/received requests across
 * collaboration requests, mentor matches, and team invites.
 */

const { pool } = require('../config/db');
const NotificationModel = require('../models/notification.model');

const RequestController = {
  /**
   * GET /api/requests/sent
   * Get all requests the current user has sent:
   * - Collaboration join requests
   * - Mentor requests
   * - Team invites sent
   */
  async getSentRequests(req, res, next) {
    try {
      const userId = req.user.id;

      // 1. Collab join requests sent by this user
      const [collabRequests] = await pool.query(
        `SELECT cr.id, cr.status, cr.message, cr.created_at,
                cp.repo_name as target_name, 'collab_request' as request_type
         FROM collaboration_requests cr
         JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
         WHERE cr.user_id = ? AND cr.type = 'request'
         ORDER BY cr.created_at DESC`,
        [userId]
      );

      // 2. Mentor requests (status = 'requested')
      const [mentorRequests] = await pool.query(
        `SELECT mm.id, mm.status, mm.explanation as message, mm.requested_at as created_at,
                u.name as target_name, 'mentor_request' as request_type
         FROM mentor_matches mm
         JOIN mentors m ON mm.mentor_id = m.id
         JOIN users u ON m.user_id = u.id
         WHERE mm.user_id = ? AND mm.status != 'suggested'
         ORDER BY mm.requested_at DESC`,
        [userId]
      );

      // 3. Team invites sent by this user
      const [invitesSent] = await pool.query(
        `SELECT cr.id, cr.status, cr.message, cr.created_at,
                u.name as target_name, 'team_invite' as request_type
         FROM collaboration_requests cr
         JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
         JOIN users u ON cr.user_id = u.id
         WHERE cp.owner_id = ? AND cr.type = 'invite'
         ORDER BY cr.created_at DESC`,
        [userId]
      );

      const requests = [
        ...collabRequests.map(r => ({ ...r, type_label: 'Project' })),
        ...mentorRequests.map(r => ({ ...r, type_label: 'Mentor' })),
        ...invitesSent.map(r => ({ ...r, type_label: 'Team Invite' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.json({ requests });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/requests/received
   */
  async getReceivedRequests(req, res, next) {
    try {
      const userId = req.user.id;

      // 1. Collab requests on projects this user owns
      const [collabReceived] = await pool.query(
        `SELECT cr.id, cr.status, cr.message, cr.created_at,
                u.name as from_name, cp.repo_name as project_name,
                'collab_request' as request_type
         FROM collaboration_requests cr
         JOIN users u ON cr.user_id = u.id
         JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
         WHERE cp.owner_id = ? AND cr.type = 'request'
         ORDER BY cr.created_at DESC`,
        [userId]
      );

      // 2. Mentor requests received
      const [mentorReceived] = await pool.query(
        `SELECT mm.id, mm.status, mm.explanation as message, mm.requested_at as created_at,
                u.name as from_name, 'Mentorship' as project_name,
                'mentor_request' as request_type
         FROM mentor_matches mm
         JOIN users u ON mm.user_id = u.id
         JOIN mentors m ON mm.mentor_id = m.id
         WHERE m.user_id = ? AND mm.status = 'requested'
         ORDER BY mm.requested_at DESC`,
        [userId]
      );

      // 3. Team invites received
      const [invitesReceived] = await pool.query(
        `SELECT cr.id, cr.status, cr.message, cr.created_at,
                owner_user.name as from_name, cp.repo_name as project_name,
                'team_invite' as request_type
         FROM collaboration_requests cr
         JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
         JOIN users owner_user ON cp.owner_id = owner_user.id
         WHERE cr.user_id = ? AND cr.type = 'invite'
         ORDER BY cr.created_at DESC`,
        [userId]
      );

      const requests = [
        ...collabReceived.map(r => ({ ...r, type_label: 'Join Request' })),
        ...mentorReceived.map(r => ({ ...r, type_label: 'Mentor Request' })),
        ...invitesReceived.map(r => ({ ...r, type_label: 'Team Invite' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.json({ requests });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/requests/:id/respond
   */
  async respondToRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { request_type, status } = req.body;
      const userId = req.user.id;

      if (!['accepted', 'rejected', 'declined'].includes(status)) {
        return res.status(400).json({ error: 'Status must be accepted, rejected, or declined.' });
      }

      let targetUserId = null;
      let notifTitle = '';

      if (request_type === 'collab_request') {
        await pool.query('UPDATE collaboration_requests SET status = ? WHERE id = ?', [status, id]);
        const [rows] = await pool.query('SELECT user_id FROM collaboration_requests WHERE id = ?', [id]);
        targetUserId = rows[0]?.user_id;
        notifTitle = `Your collaboration request was ${status}`;
      } else if (request_type === 'mentor_request') {
        await pool.query('UPDATE mentor_matches SET status = ? WHERE id = ?', [status, id]);
        if (status === 'accepted') {
          await pool.query(
            'UPDATE mentors SET current_mentees = current_mentees + 1 WHERE id = (SELECT mentor_id FROM mentor_matches WHERE id = ?)',
            [id]
          );
        }
        const [rows] = await pool.query('SELECT user_id FROM mentor_matches WHERE id = ?', [id]);
        targetUserId = rows[0]?.user_id;
        notifTitle = `Your mentor request was ${status}`;
      } else if (request_type === 'team_invite') {
        const normalizedStatus = status === 'rejected' ? 'declined' : status;
        await pool.query('UPDATE collaboration_requests SET status = ? WHERE id = ?', [normalizedStatus, id]);
        
        const [rows] = await pool.query(`
          SELECT cp.owner_id 
          FROM collaboration_requests cr
          JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
          WHERE cr.id = ?`, [id]);
        targetUserId = rows[0]?.owner_id;
        notifTitle = `Your team invite was ${status}`;
      } else {
        return res.status(400).json({ error: 'Invalid request_type.' });
      }

      // Create notification for the other party
      if (targetUserId) {
        await NotificationModel.create({
          user_id: targetUserId,
          type: `${request_type}_${status}`,
          title: notifTitle,
          message: `Your request was ${status} by the recipient.`,
          reference_type: request_type,
          reference_id: parseInt(id),
        });
      }

      res.json({ message: `Request ${status}` });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = RequestController;
