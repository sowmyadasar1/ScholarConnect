/**
 * Mentor Routes
 *
 * GET    /api/mentors                     — List approved mentors
 * GET    /api/mentors/matches/me          — My mentor matches
 * GET    /api/mentors/:id                 — Mentor detail
 * POST   /api/mentors/register            — Register as mentor
 * POST   /api/mentors/:id/request         — Request a mentor
 * PUT    /api/mentors/matches/:matchId/respond — Accept/reject mentee
 */

const router = require('express').Router();
const MentorController = require('../controllers/mentor.controller');
const { authenticate } = require('../middleware/auth');

// Public
router.get('/', MentorController.list);
router.get('/:id', MentorController.getById);

// Protected
router.get('/matches/me', authenticate, MentorController.getMatches);
router.post('/register', authenticate, MentorController.register);
router.post('/:id/request', authenticate, MentorController.requestMentor);
router.put('/matches/:matchId/respond', authenticate, MentorController.respondToRequest);

module.exports = router;
