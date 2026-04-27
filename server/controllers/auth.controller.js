/**
 * Auth Controller
 *
 * Handles registration, login, OAuth callbacks, and profile management.
 * JWT is issued on all successful auth flows.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const UserModel = require('../models/user.model');
const SkillModel = require('../models/skill.model');
const { AppError } = require('../middleware/errorHandler');
const { fetchUserRepos, fetchRepoLanguages, extractSkillsFromRepos } = require('../utils/github');
const mlClient = require('../utils/mlClient');
const ProfileService = require('../services/profile.service');

// Helper: generate JWT for a user
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

const AuthController = {
  /**
   * POST /api/auth/register
   * Email/password registration (fallback auth method)
   */
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      // Check for existing user
      const existing = await UserModel.findByEmail(email);
      if (existing) throw new AppError('Email already registered', 409);

      const password_hash = await bcrypt.hash(password, 10);
      const userId = await UserModel.create({ email, password_hash, name });
      const user = await UserModel.findById(userId);

      const token = signToken(user);
      res.status(201).json({ token, user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   * Email/password login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user || !user.password_hash) {
        throw new AppError('Invalid email or password', 401);
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) throw new AppError('Invalid email or password', 401);

      // Auto-elevate admin email
      if (email === 'admin@scholarconnect.io' && !user.is_admin) {
        await UserModel.setAdmin(user.id, true);
        user.is_admin = 1;
      }

      const token = signToken(user);
      res.json({ token, user: await UserModel.findById(user.id) });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/github
   * Redirect to GitHub OAuth
   */
  githubAuth: passport.authenticate('github', { session: false }),

  /**
   * GET /api/auth/github/callback
   * GitHub OAuth callback — issues JWT and redirects to frontend
   */
  githubCallback(req, res, next) {
    passport.authenticate('github', { session: false }, async (err, user, info) => {
      if (err || !user) {
        console.error('[GitHub Auth] Callback Error:', err);
        console.error('[GitHub Auth] Info:', info);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=github_failed&details=${encodeURIComponent(err?.message || 'Unauthorized')}`);
      }
      
      // Auto-elevate admin email on GitHub login too
      if (user.email === 'admin@scholarconnect.io' && !user.is_admin) {
        await UserModel.setAdmin(user.id, true);
        user.is_admin = 1;
      }

      const token = signToken(user);
      
      // Trigger background enrichment if first time or missing data
      const skills = await UserModel.getSkills(user.id);
      const isNewUser = !skills || skills.length === 0;
      
      if (isNewUser && user.github_access_token) {
        // Run in background so we don't block the redirect
        ProfileService.enrichFromGitHub(user.id, user.github_access_token);
      }

      const redirectUrl = isNewUser 
        ? `${process.env.CLIENT_URL}/auth/callback?token=${token}&onboarding=true`
        : `${process.env.CLIENT_URL}/auth/callback?token=${token}`;
        
      res.redirect(redirectUrl);
    })(req, res, next);
  },

  /**
   * GET /api/auth/google
   * Redirect to Google OAuth
   */
  googleAuth: passport.authenticate('google', { session: false, scope: ['profile', 'email'] }),

  /**
   * GET /api/auth/google/callback
   */
  googleCallback(req, res, next) {
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err || !user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
      }
      const token = signToken(user);
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    })(req, res, next);
  },

  /**
   * GET /api/auth/me
   * Get current user profile + skills + interests
   */
  async getMe(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) throw new AppError('User not found', 404);

      const skills = await UserModel.getSkills(user.id);
      const interests = await UserModel.getInterests(user.id);

      res.json({ user, skills, interests });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/auth/profile
   * Update profile info (name, bio, academic level, etc.)
   */
  async updateProfile(req, res, next) {
    try {
      const { name, bio, academic_level, preferred_role, availability } = req.body;
      await UserModel.updateProfile(req.user.id, { name, bio, academic_level, preferred_role, availability });
      const user = await UserModel.findById(req.user.id);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/skills
   * Add skills to user profile. Accepts array of { name, proficiency, category }
   */
  async addSkills(req, res, next) {
    try {
      const { skills } = req.body; // [{ name, proficiency, category }]

      for (const s of skills) {
        const skill = await SkillModel.findOrCreate(s.name, s.category || 'language');
        // proficiency should be 'Beginner', 'Intermediate', or 'Advanced'
        await SkillModel.addUserSkill(req.user.id, skill.id, s.proficiency || 'Intermediate', 'manual');
      }

      const updatedSkills = await UserModel.getSkills(req.user.id);
      res.json({ skills: updatedSkills });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/auth/skills/:id
   * Remove a skill from user profile
   */
  async deleteSkill(req, res, next) {
    try {
      const { id } = req.params;
      await SkillModel.removeUserSkill(req.user.id, id);
      const updatedSkills = await UserModel.getSkills(req.user.id);
      res.json({ skills: updatedSkills });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/skills/natural
   * Accept natural language input like "I know Python and React"
   * and parse it into structured skills via the ML service.
   */
  async addSkillsNatural(req, res, next) {
    try {
      const { text } = req.body;
      const parsed = await mlClient.parseNaturalLanguageSkills(text);

      // parsed.skills = [{ name, proficiency, category }]
      for (const s of parsed.skills) {
        const skill = await SkillModel.findOrCreate(s.name, s.category || 'language');
        await SkillModel.addUserSkill(req.user.id, skill.id, s.proficiency || 1, 'nlp');
      }

      const updatedSkills = await UserModel.getSkills(req.user.id);
      res.json({ skills: updatedSkills, parsed: parsed.skills });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/github/sync
   * Fetch GitHub repos and extract skills into the user's profile.
   */
  async syncGithub(req, res, next) {
    try {
      const user = await UserModel.findByEmail(req.user.email);
      if (!user?.github_access_token) {
        throw new AppError('No GitHub account linked. Please connect GitHub first.', 400);
      }

      const repos = await fetchUserRepos(user.github_access_token);
      const extracted = extractSkillsFromRepos(repos);

      // Save extracted skills
      for (const item of extracted.slice(0, 20)) {
        const skill = await SkillModel.findOrCreate(item.skill, 'language');
        // Map count to proficiency labels
        let proficiency = 'Beginner';
        if (item.count > 10) proficiency = 'Advanced';
        else if (item.count > 3) proficiency = 'Intermediate';
        
        await SkillModel.addUserSkill(user.id, skill.id, proficiency, 'github');
      }

      const skills = await UserModel.getSkills(user.id);
      res.json({ message: 'GitHub skills synced', repos_scanned: repos.length, skills });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/github/repos
   * Fetch list of repositories for the authenticated user.
   */
  async getGithubRepos(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      
      if (!user?.github_access_token) {
        console.warn(`[GitHub Repos] Token missing for user ${req.user.id}. Decryption might have failed or account not linked.`);
        throw new AppError('GitHub access token is missing or invalid. Please re-authenticate via GitHub.', 400);
      }

      console.log(`[GitHub Repos] Fetching repos for ${user.email}...`);
      const repos = await fetchUserRepos(user.github_access_token);
      res.json(repos);
    } catch (err) {
      console.error(`[GitHub Repos] Error: ${err.message}`);
      if (err.message.includes('401')) {
        return next(new AppError('GitHub token expired. Please log in again.', 401));
      }
      next(err);
    }
  },

  /**
   * POST /api/auth/github/import
   * Extract skills from specific repositories.
   */
  async importGithubRepos(req, res, next) {
    try {
      const { repoFullNames } = req.body; // Array of repo full names like ['user/repo']
      if (!repoFullNames || !Array.isArray(repoFullNames)) {
        throw new AppError('repoFullNames array is required', 400);
      }

      const user = await UserModel.findById(req.user.id);
      if (!user?.github_access_token) {
        throw new AppError('GitHub account not linked', 400);
      }

      console.log(`[GitHub Import] Importing ${repoFullNames.length} repos for user ${user.id}...`);

      const allSkills = {};
      
      for (const fullName of repoFullNames) {
        try {
          const [owner, repoName] = fullName.split('/');
          const languages = await fetchRepoLanguages(user.github_access_token, owner, repoName);
          
          for (const [lang, bytes] of Object.entries(languages)) {
            const l = lang.toLowerCase();
            allSkills[l] = (allSkills[l] || 0) + bytes;
          }
        } catch (repoErr) {
          console.error(`[GitHub Import] Error fetching ${fullName}:`, repoErr.message);
        }
      }

      // Convert byte counts to 1-5 proficiency using logarithmic scale
      const extracted = Object.entries(allSkills)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12); 

      for (const [name, weight] of extracted) {
        const skill = await SkillModel.findOrCreate(name, 'language');
        // Map weight to labels
        let proficiency = 'Beginner';
        const kb = weight / 1024;
        if (kb > 100) proficiency = 'Advanced';
        else if (kb > 10) proficiency = 'Intermediate';
        
        await SkillModel.addUserSkill(user.id, skill.id, proficiency, 'github');
      }

      const updatedSkills = await UserModel.getSkills(user.id);
      res.json({ 
        message: `Imported skills from ${repoFullNames.length} repositories.`,
        skills: updatedSkills
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/users/search
   * Search for users by name or bio (Public/Authenticated)
   */
  async searchUsers(req, res, next) {
    try {
      const { q, role } = req.query;
      if (!q) return res.json({ users: [] });
      const users = await UserModel.search(q, { role });
      res.json({ users });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/skills
   * Get all master skills
   */
  async getMasterSkills(req, res, next) {
    try {
      const skills = await SkillModel.findAll();
      res.json({ skills });
    } catch (err) {
      next(err);
    }
  },
  async deleteAccount(req, res, next) {
    try {
      await UserModel.delete(req.user.id);
      res.json({ message: 'Account deleted successfully' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
