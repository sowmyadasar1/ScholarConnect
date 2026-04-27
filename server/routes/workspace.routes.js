/**
 * Workspace Routes
 *
 * GET    /api/workspace/:teamId                — Full workspace load
 * POST   /api/workspace/:teamId/tasks          — Create task
 * PUT    /api/workspace/:teamId/tasks/:taskId  — Update task (status, assignment)
 * DELETE /api/workspace/:teamId/tasks/:taskId  — Delete task
 * GET    /api/workspace/:teamId/messages       — Get chat messages
 * POST   /api/workspace/:teamId/messages       — Send message
 * POST   /api/workspace/:teamId/notes          — Create note
 * PUT    /api/workspace/:teamId/notes/:noteId  — Update note
 * DELETE /api/workspace/:teamId/notes/:noteId  — Delete note
 */

const router = require('express').Router();
const WorkspaceController = require('../controllers/workspace.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Full workspace
router.get('/:teamId', WorkspaceController.getWorkspace);

// Tasks (Kanban)
router.post('/:teamId/tasks', WorkspaceController.createTask);
router.put('/:teamId/tasks/:taskId', WorkspaceController.updateTask);
router.delete('/:teamId/tasks/:taskId', WorkspaceController.deleteTask);

// Chat
router.get('/:teamId/messages', WorkspaceController.getMessages);
router.post('/:teamId/messages', WorkspaceController.sendMessage);

// Notes
router.post('/:teamId/notes', WorkspaceController.createNote);
router.put('/:teamId/notes/:noteId', WorkspaceController.updateNote);
router.delete('/:teamId/notes/:noteId', WorkspaceController.deleteNote);

// Repo
router.put('/:teamId/repo', WorkspaceController.updateRepo);

module.exports = router;
