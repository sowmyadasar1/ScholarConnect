/**
 * Workspace Controller
 *
 * Manages collaboration workspaces: Kanban tasks, team chat,
 * shared notes, and activity feeds.
 *
 * Every workspace is tied to a team (teams table).
 */

const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const WorkspaceController = {
  /**
   * GET /api/workspace/:teamId
   * Full workspace load: project info, members, tasks, messages, notes, activity.
   */
  async getWorkspace(req, res, next) {
    try {
      const { teamId } = req.params;
      console.log(`[WorkspaceController] Loading workspace for teamId: ${teamId}, userId: ${req.user.id}`);


      // Verify team exists and user is a member
      const [teamRows] = await pool.query(
        `SELECT t.*, cp.repo_name, cp.description as project_description, cp.github_repo_url, cp.topics,
                mm.explanation as mentorship_goal
         FROM teams t
         LEFT JOIN collaboration_projects cp ON t.collab_project_id = cp.id
         LEFT JOIN mentor_matches mm ON t.mentor_match_id = mm.id
         WHERE t.id = ?`,
        [teamId]
      );
      if (!teamRows[0]) {
        console.warn(`[WorkspaceController] Team NOT FOUND for ID: ${teamId}`);
        throw new AppError('Workspace not found', 404);
      }

      // Fetch names separately to avoid complex join issues in SQLite
      const team = teamRows[0];
      if (team.mentor_match_id) {
        const [mentorInfo] = await pool.query(`
          SELECT u.name as student_name, mentor_u.name as mentor_name
          FROM mentor_matches mm
          JOIN users u ON mm.user_id = u.id
          JOIN mentors m ON mm.mentor_id = m.id
          JOIN users mentor_u ON m.user_id = mentor_u.id
          WHERE mm.id = ?`, [team.mentor_match_id]);
        if (mentorInfo[0]) {
          team.student_name = mentorInfo[0].student_name;
          team.mentor_name = mentorInfo[0].mentor_name;
        }
      }

      const [memberCheck] = await pool.query(
        'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
        [teamId, req.user.id]
      );
      if (!memberCheck[0]) {
        console.warn(`[WorkspaceController] User ${req.user.id} is NOT A MEMBER of team ${teamId}`);
        throw new AppError('You are not a member of this workspace', 403);
      }

      // Load members
      const [members] = await pool.query(
        `SELECT tm.role, tm.joined_at, u.id, u.name, u.avatar_url, u.preferred_role
         FROM team_members tm JOIN users u ON tm.user_id = u.id
         WHERE tm.team_id = ?`,
        [teamId]
      );

      // Load tasks
      const [tasks] = await pool.query(
        `SELECT wt.*, u.name as assignee_name, u.avatar_url as assignee_avatar,
                c.name as creator_name
         FROM workspace_tasks wt
         LEFT JOIN users u ON wt.assigned_to = u.id
         LEFT JOIN users c ON wt.created_by = c.id
         WHERE wt.team_id = ?
         ORDER BY wt.created_at DESC`,
        [teamId]
      );

      // Load recent messages (last 50)
      const [messages] = await pool.query(
        `SELECT wm.*, u.name as user_name, u.avatar_url
         FROM workspace_messages wm JOIN users u ON wm.user_id = u.id
         WHERE wm.team_id = ?
         ORDER BY wm.created_at ASC
         LIMIT 50`,
        [teamId]
      );

      // Load notes
      const [notes] = await pool.query(
        `SELECT wn.*, u.name as author_name
         FROM workspace_notes wn JOIN users u ON wn.user_id = u.id
         WHERE wn.team_id = ?
         ORDER BY wn.is_pinned DESC, wn.created_at DESC`,
        [teamId]
      );

      // Load activity (last 30)
      const [activity] = await pool.query(
        `SELECT wa.*, u.name as user_name, u.avatar_url
         FROM workspace_activity wa LEFT JOIN users u ON wa.user_id = u.id
         WHERE wa.team_id = ?
         ORDER BY wa.created_at DESC LIMIT 30`,
        [teamId]
      );

      res.json({
        team: teamRows[0],
        members,
        tasks,
        messages,
        notes,
        activity
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── Tasks (Kanban) ───────────────────────────────────

  async createTask(req, res, next) {
    try {
      const { teamId } = req.params;
      const { title, description, status, assigned_to, priority, due_date } = req.body;

      if (!title) throw new AppError('Task title is required', 400);

      const [result] = await pool.query(
        `INSERT INTO workspace_tasks (team_id, title, description, status, assigned_to, priority, created_by, due_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [teamId, title, description || '', status || 'todo', assigned_to || null, priority || 'medium', req.user.id, due_date || null]
      );

      // Log activity
      await pool.query(
        'INSERT INTO workspace_activity (team_id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [teamId, req.user.id, 'task_created', `Created task: ${title}`]
      );

      res.status(201).json({ task: { id: result.insertId, title, status: status || 'todo' } });
    } catch (err) {
      next(err);
    }
  },

  async updateTask(req, res, next) {
    try {
      const { teamId, taskId } = req.params;
      const { title, description, status, assigned_to, priority, due_date } = req.body;

      // Build dynamic UPDATE
      const fields = [];
      const params = [];
      if (title !== undefined) { fields.push('title = ?'); params.push(title); }
      if (description !== undefined) { fields.push('description = ?'); params.push(description); }
      if (status !== undefined) { fields.push('status = ?'); params.push(status); }
      if (assigned_to !== undefined) { fields.push('assigned_to = ?'); params.push(assigned_to); }
      if (priority !== undefined) { fields.push('priority = ?'); params.push(priority); }
      if (due_date !== undefined) { fields.push('due_date = ?'); params.push(due_date); }

      if (fields.length === 0) throw new AppError('No fields to update', 400);

      const [taskRows] = await pool.query('SELECT title FROM workspace_tasks WHERE id = ?', [taskId]);
      const currentTask = taskRows[0];

      params.push(taskId, teamId);
      await pool.query(`UPDATE workspace_tasks SET ${fields.join(', ')} WHERE id = ? AND team_id = ?`, params);

      // Log activity for status changes
      if (status) {
        const statusLabels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
        const details = `Moved task to ${statusLabels[status] || status}`;
        await pool.query(
          'INSERT INTO workspace_activity (team_id, user_id, action, details) VALUES (?, ?, ?, ?)',
          [teamId, req.user.id, 'task_updated', details]
        );

        // Also post to milestones/general channel if completed
        if (status === 'done') {
          await pool.query(
            'INSERT INTO workspace_messages (team_id, user_id, content, type) VALUES (?, ?, ?, ?)',
            [teamId, req.user.id, `✅ completed task: ${currentTask?.title || 'a task'}`, 'milestones']
          );
        }
      }

      res.json({ message: 'Task updated' });
    } catch (err) {
      next(err);
    }
  },

  async deleteTask(req, res, next) {
    try {
      const { teamId, taskId } = req.params;
      await pool.query('DELETE FROM workspace_tasks WHERE id = ? AND team_id = ?', [taskId, teamId]);
      res.json({ message: 'Task deleted' });
    } catch (err) {
      next(err);
    }
  },

  // ─── Messages (Chat) ──────────────────────────────────

  async sendMessage(req, res, next) {
    try {
      const { teamId } = req.params;
      const { content, type } = req.body;
      if (!content) throw new AppError('Message content required', 400);

      const [result] = await pool.query(
        'INSERT INTO workspace_messages (team_id, user_id, content, type) VALUES (?, ?, ?, ?)',
        [teamId, req.user.id, content, type || 'chat']
      );

      res.status(201).json({
        message: { id: result.insertId, content, user_id: req.user.id, type: type || 'chat', created_at: new Date().toISOString() }
      });
    } catch (err) {
      next(err);
    }
  },

  async getMessages(req, res, next) {
    try {
      const { teamId } = req.params;
      const { before, limit } = req.query;
      let sql = `SELECT wm.*, u.name as user_name, u.avatar_url
                 FROM workspace_messages wm JOIN users u ON wm.user_id = u.id
                 WHERE wm.team_id = ?`;
      const params = [teamId];
      if (before) { sql += ' AND wm.id < ?'; params.push(before); }
      sql += ' ORDER BY wm.created_at DESC LIMIT ?';
      params.push(parseInt(limit) || 50);

      const [rows] = await pool.query(sql, params);
      res.json({ messages: rows.reverse() });
    } catch (err) {
      next(err);
    }
  },

  // ─── Notes ─────────────────────────────────────────────

  async createNote(req, res, next) {
    try {
      const { teamId } = req.params;
      const { title, content } = req.body;
      if (!title) throw new AppError('Note title required', 400);

      const [result] = await pool.query(
        'INSERT INTO workspace_notes (team_id, user_id, title, content) VALUES (?, ?, ?, ?)',
        [teamId, req.user.id, title, content || '']
      );

      await pool.query(
        'INSERT INTO workspace_activity (team_id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [teamId, req.user.id, 'note_created', `Added note: ${title}`]
      );

      // Post to general channel
      await pool.query(
        'INSERT INTO workspace_messages (team_id, user_id, content, type) VALUES (?, ?, ?, ?)',
        [teamId, req.user.id, `📝 added a new note: ${title}`, 'general']
      );

      res.status(201).json({ note: { id: result.insertId, title } });
    } catch (err) {
      next(err);
    }
  },

  async updateNote(req, res, next) {
    try {
      const { teamId, noteId } = req.params;
      const { title, content, is_pinned } = req.body;

      const fields = [];
      const params = [];
      if (title !== undefined) { fields.push('title = ?'); params.push(title); }
      if (content !== undefined) { fields.push('content = ?'); params.push(content); }
      if (is_pinned !== undefined) { fields.push('is_pinned = ?'); params.push(is_pinned ? 1 : 0); }

      if (fields.length === 0) throw new AppError('No fields to update', 400);
      params.push(noteId, teamId);
      await pool.query(`UPDATE workspace_notes SET ${fields.join(', ')} WHERE id = ? AND team_id = ?`, params);

      res.json({ message: 'Note updated' });
    } catch (err) {
      next(err);
    }
  },

  async deleteNote(req, res, next) {
    try {
      const { teamId, noteId } = req.params;
      await pool.query('DELETE FROM workspace_notes WHERE id = ? AND team_id = ?', [noteId, teamId]);
      res.json({ message: 'Note deleted' });
    } catch (err) {
      next(err);
    }
  },

  // ─── Repo ──────────────────────────────────────────────

  async updateRepo(req, res, next) {
    try {
      const { teamId } = req.params;
      const { github_repo_url } = req.body;

      if (!github_repo_url) throw new AppError('GitHub Repo URL required', 400);

      const [teamRows] = await pool.query('SELECT collab_project_id FROM teams WHERE id = ?', [teamId]);
      if (!teamRows[0] || !teamRows[0].collab_project_id) {
        throw new AppError('No collaboration project linked to this team', 400);
      }

      const collabProjectId = teamRows[0].collab_project_id;
      await pool.query(
        'UPDATE collaboration_projects SET github_repo_url = ? WHERE id = ?',
        [github_repo_url, collabProjectId]
      );

      // Log activity
      await pool.query(
        'INSERT INTO workspace_activity (team_id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [teamId, req.user.id, 'repo_linked', `Linked GitHub repository: ${github_repo_url}`]
      );

      res.json({ message: 'Repository linked successfully' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = WorkspaceController;
