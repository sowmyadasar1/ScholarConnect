/**
 * Auth Routes
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// GitHub OAuth
router.get('/github', AuthController.githubAuth);
router.get('/github/callback', AuthController.githubCallback);

// Google OAuth
router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleCallback);

// Protected routes
router.get('/me', authenticate, AuthController.getMe);
router.put('/profile', authenticate, AuthController.updateProfile);
router.get('/github/repos', authenticate, AuthController.getGithubRepos);
router.post('/github/import', authenticate, AuthController.importGithubRepos);
router.post('/github/sync', authenticate, AuthController.syncGithub);
router.get('/skills', authenticate, AuthController.getMasterSkills);
router.post('/skills', authenticate, AuthController.addSkills);
router.delete('/skills/:id', authenticate, AuthController.deleteSkill);
router.get('/users/search', authenticate, AuthController.searchUsers);
router.delete('/profile', authenticate, AuthController.deleteAccount);

module.exports = router;
