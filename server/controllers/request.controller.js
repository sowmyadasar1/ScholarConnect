/**
 * Request Controller
 *
 * Unified endpoint for getting all sent/received requests across
 * collaboration requests, mentor matches, and team invites.
 */

const { pool } = require('../config/db');
const NotificationModel = require('../models/notification.model');
const ConnectionModel = require('../models/connection.model');

const RequestController = {
  /**
   * GET /api/requests/sent
   * Get all requests the current user has sent:
   * - Collaboration join requests
   * - Mentor requests
   * - Team invites sent (both project-based and direct teammate invites)
   */
  async getSentRequests(req, res, next) {
    try {
      const userId = req.user.id;

      // 1. Collab join requests sent by this user
      const [collabRequests] = await pool.query(
        `SELECT cr.id, cr.status, cr.message, cr.created_at,
                cp.repo_name as target_name, 'collab_request' as request_type,
                t.id as team_id
         FROM collaboration_requests cr
         JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
         LEFT JOIN teams t ON cp.id = t.collab_project_id
         WHERE cr.user_id = ? AND cr.type = 'request'
         ORDER BY cr.created_at DESC`,
        [userId]
      );

      // 2. Mentor requests (status != 'suggested')
      const [mentorRequests] = await pool.query(
        `SELECT mm.id, mm.status, mm.explanation as message, mm.requested_at as created_at,
                u.name as target_name, 'mentor_request' as request_type,
                t.id as team_id
         FROM mentor_matches mm
         JOIN mentors m ON mm.mentor_id = m.id
         JOIN users u ON m.user_id = u.id
         LEFT JOIN teams t ON mm.id = t.mentor_match_id
         WHERE mm.user_id = ? AND mm.status != 'suggested'
         ORDER BY mm.requested_at DESC`,
        [userId]
      );

      // 3. Project-based team invites sent by this user (as project owner)
      const [projectInvitesSent] = await pool.query(
        `SELECT cr.id, cr.status, cr.message, cr.created_at,
                u.name as target_name, 'team_invite' as request_type
         FROM collaboration_requests cr
         JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
         JOIN users u ON cr.user_id = u.id
         WHERE cp.owner_id = ? AND cr.type = 'invite'
         ORDER BY cr.created_at DESC`,
        [userId]
      );

      // 4. Direct teammate invites sent by this user (no project context)
      const [directInvitesSent] = await pool.query(
        `SELECT cr.id, cr.status, cr.message, cr.created_at,
                u.name as target_name, 'team_invite' as request_type
         FROM collaboration_requests cr
         JOIN users u ON cr.user_id = u.id
         WHERE cr.sender_id = ? AND cr.type = 'invite' AND cr.collab_project_id IS NULL
         ORDER BY cr.created_at DESC`,
        [userId]
      );

      const requests = [
        ...collabRequests.map(r => ({ ...r, type_label: 'Project' })),
        ...mentorRequests.map(r => ({ ...r, type_label: 'Mentor' })),
        ...projectInvitesSent.map(r => ({ ...r, type_label: 'Team Invite' })),
        ...directInvitesSent.map(r => ({ ...r, type_label: 'Team Invite' })),
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
                'collab_request' as request_type, t.id as team_id
         FROM collaboration_requests cr
         JOIN users u ON cr.user_id = u.id
         JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
         LEFT JOIN teams t ON cp.id = t.collab_project_id
         WHERE cp.owner_id = ? AND cr.type = 'request'
         ORDER BY cr.created_at DESC`,
        [userId]
      );

      // 2. Mentor requests received
      const [mentorReceived] = await pool.query(
        `SELECT mm.id, mm.status, mm.explanation as message, mm.requested_at as created_at,
                u.name as from_name, 'Mentorship' as project_name,
                'mentor_request' as request_type, t.id as team_id
         FROM mentor_matches mm
         JOIN users u ON mm.user_id = u.id
         JOIN mentors m ON mm.mentor_id = m.id
         LEFT JOIN teams t ON mm.id = t.mentor_match_id
         WHERE m.user_id = ? AND mm.status = 'requested'
         ORDER BY mm.requested_at DESC`,
        [userId]
      );

      // 3. Project-based team invites received by this user
      const [projectInvitesReceived] = await pool.query(
        `SELECT cr.id, cr.status, cr.message, cr.created_at,
                owner_user.name as from_name, cp.repo_name as project_name,
                'team_invite' as request_type, t.id as team_id
         FROM collaboration_requests cr
         JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
         JOIN users owner_user ON cp.owner_id = owner_user.id
         LEFT JOIN teams t ON cp.id = t.collab_project_id
         WHERE cr.user_id = ? AND cr.type = 'invite' AND cr.collab_project_id IS NOT NULL
         ORDER BY cr.created_at DESC`,
        [userId]
      );

      // 4. Direct teammate invites received (no project context)
      const [directInvitesReceived] = await pool.query(
        `SELECT cr.id, cr.status, cr.message, cr.created_at,
                sender.name as from_name, 'Collaboration' as project_name,
                'team_invite' as request_type
         FROM collaboration_requests cr
         JOIN users sender ON cr.sender_id = sender.id
         WHERE cr.user_id = ? AND cr.type = 'invite' AND cr.collab_project_id IS NULL
         ORDER BY cr.created_at DESC`,
        [userId]
      );

      const requests = [
        ...collabReceived.map(r => ({ ...r, type_label: 'Join Request' })),
        ...mentorReceived.map(r => ({ ...r, type_label: 'Mentor Request' })),
        ...projectInvitesReceived.map(r => ({ ...r, type_label: 'Team Invite' })),
        ...directInvitesReceived.map(r => ({ ...r, type_label: 'Team Invite' })),
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

      // Common logic for team-based requests (collab, team_invite, mentor_invite)
      const handleTeamJoin = async (interaction) => {
        if (status !== 'accepted' || !interaction || !interaction.collab_project_id) return;

        // Find or create team for this project
        let [teams] = await pool.query('SELECT id FROM teams WHERE collab_project_id = ?', [interaction.collab_project_id]);
        let teamId;
        
        if (teams.length === 0) {
          const [projectRows] = await pool.query('SELECT repo_name, owner_id FROM collaboration_projects WHERE id = ?', [interaction.collab_project_id]);
          const project = projectRows[0];
          if (!project) return;

          const [result] = await pool.query(
            'INSERT INTO teams (name, collab_project_id, created_by) VALUES (?, ?, ?)',
            [project.repo_name, interaction.collab_project_id, project.owner_id]
          );
          teamId = result.insertId;
        } else {
          teamId = teams[0].id;
        }

        // Add member to team_members
        const memberRole = interaction.role || interaction.mentor_role || 'member';
        await pool.query(
          'INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
          [teamId, interaction.user_id, memberRole]
        );

        // Ensure persistent connection
        await ConnectionModel.ensureConnection(userId, interaction.user_id, interaction.mentor_role ? 'mentor' : 'teammate');

        // Log activity
        await pool.query(
          'INSERT INTO workspace_activity (team_id, user_id, action, details) VALUES (?, ?, ?, ?)',
          [teamId, interaction.user_id, 'user_joined', `Joined the project as ${memberRole}.`]
        );
      };

      if (request_type === 'collab_request') {
        await pool.query('UPDATE collaboration_requests SET status = ? WHERE id = ?', [status, id]);
        const [rows] = await pool.query('SELECT user_id, collab_project_id, role FROM collaboration_requests WHERE id = ?', [id]);
        const interaction = rows[0];
        targetUserId = interaction?.user_id;
        await handleTeamJoin(interaction);
        notifTitle = `Your collaboration request was ${status}`;

      } else if (request_type === 'mentor_request') {
        await pool.query('UPDATE mentor_matches SET status = ? WHERE id = ?', [status, id]);
        const [rows] = await pool.query(`
          SELECT mm.*, u.name as student_name, mentor_u.name as mentor_name, mentor_u.id as mentor_user_id
          FROM mentor_matches mm
          JOIN users u ON mm.user_id = u.id
          JOIN mentors m ON mm.mentor_id = m.id
          JOIN users mentor_u ON m.user_id = mentor_u.id
          WHERE mm.id = ?`, [id]);
        const match = rows[0];
        targetUserId = match?.user_id;

        if (status === 'accepted' && match) {
          await pool.query('UPDATE mentors SET current_mentees = current_mentees + 1 WHERE id = ?', [match.mentor_id]);
          const teamName = `Mentorship: ${match.mentor_name} & ${match.student_name}`;
          const [teamResult] = await pool.query(
            'INSERT INTO teams (name, mentor_match_id, created_by) VALUES (?, ?, ?)',
            [teamName, id, match.mentor_user_id]
          );
          const teamId = teamResult.insertId;
          await pool.query(
            'INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, ?), (?, ?, ?)',
            [teamId, match.user_id, 'student', teamId, match.mentor_user_id, 'mentor']
          );
          await ConnectionModel.ensureConnection(match.user_id, match.mentor_user_id, 'mentor');
          await pool.query(
            'INSERT INTO workspace_activity (team_id, user_id, action, details) VALUES (?, ?, ?, ?)',
            [teamId, match.mentor_user_id, 'mentorship_started', 'Mentorship workspace created.']
          );
        }
        notifTitle = `Your mentor request was ${status}`;

      } else if (request_type === 'team_invite') {
        const normalizedStatus = status === 'rejected' ? 'declined' : status;
        await pool.query('UPDATE collaboration_requests SET status = ? WHERE id = ?', [normalizedStatus, id]);
        const [rows] = await pool.query(`
          SELECT cr.user_id, cr.sender_id, cp.owner_id, cr.collab_project_id, cr.role, cp.repo_name
          FROM collaboration_requests cr
          LEFT JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
          WHERE cr.id = ?`, [id]);
        const interaction = rows[0];
        targetUserId = interaction?.sender_id || interaction?.owner_id;
        await handleTeamJoin(interaction);
        notifTitle = `Your team invite was ${status}`;

      } else if (request_type === 'mentor_invite') {
        await pool.query('UPDATE collaboration_requests SET status = ? WHERE id = ?', [status, id]);
        const [rows] = await pool.query(`
          SELECT cr.*, cp.repo_name, cp.owner_id
          FROM collaboration_requests cr
          JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
          WHERE cr.id = ?`, [id]);
        const interaction = rows[0];
        targetUserId = interaction?.sender_id;
        await handleTeamJoin(interaction);
        notifTitle = `Your mentor invitation was ${status}`;

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
  /**
   * DELETE /api/requests/:id
   * Cancel a sent request or invite.
   */
  async cancelRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { type } = req.query; // 'collab_request' or 'mentor_request'
      const userId = req.user.id;

      if (type === 'collab_request' || type === 'team_invite') {
        // Only allow if current user is the sender (user_id for requests, or owner of project for invites)
        // Actually cr.user_id is the person requesting to join, or the person invited.
        // If type='request', user_id is the sender.
        // If type='invite', sender_id is the sender.
        const [result] = await pool.query(
          `DELETE FROM collaboration_requests 
           WHERE id = ? AND (user_id = ? OR sender_id = ?) AND status = 'pending'`,
          [id, userId, userId]
        );
        if (result.affectedRows === 0) throw new AppError('Request not found or not cancellable', 404);
      } else if (type === 'mentor_request') {
        const [result] = await pool.query(
          `DELETE FROM mentor_matches 
           WHERE id = ? AND user_id = ? AND status = 'requested'`,
          [id, userId]
        );
        if (result.affectedRows === 0) throw new AppError('Mentorship request not found or not cancellable', 404);
      } else {
        throw new AppError('Invalid request type', 400);
      }

      res.json({ message: 'Request cancelled successfully' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = RequestController;
