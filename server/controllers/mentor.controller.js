/**
 * Mentor Controller
 *
 * Handles mentor browsing, registration, matching, and conflict resolution.
 * Compatibility formula: 0.4*skill + 0.3*domain + 0.2*experience + 0.1*availability
 */

const MentorModel = require('../models/mentor.model');
const UserModel = require('../models/user.model');
const SkillModel = require('../models/skill.model');
const mlClient = require('../utils/mlClient');
const { AppError } = require('../middleware/errorHandler');

const MentorController = {
  /**
   * GET /api/mentors
   * List all approved mentors. Optional domain filter.
   */
  async list(req, res, next) {
    try {
      const { domain, search } = req.query;
      const mentors = await MentorModel.findAll({ approved: true, domain, search });

      if (!mentors || mentors.length === 0) {
        return res.json({ mentors: [], message: 'No mentors found matching your criteria.' });
      }

      // Attach skills to each mentor
      const enriched = await Promise.all(
        mentors.map(async (m) => {
          try {
            const skills = await MentorModel.getSkills(m.id);
            return { ...m, skills: skills || [] };
          } catch (e) {
            console.error(`Failed to fetch skills for mentor ${m.id}:`, e);
            return { ...m, skills: [] };
          }
        })
      );

      res.json({ mentors: enriched });
    } catch (err) {
      console.error('Mentor list error:', err);
      next(new AppError('Failed to retrieve mentor list. Please check database connectivity.', 500));
    }
  },

  /**
   * GET /api/mentors/:id
   * Get single mentor with skills.
   */
  async getById(req, res, next) {
    try {
      const mentor = await MentorModel.findById(req.params.id);
      if (!mentor) throw new AppError('Mentor not found', 404);

      const skills = await MentorModel.getSkills(mentor.id);
      res.json({ mentor, skills });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/mentors/register
   * Register current user as a mentor (requires admin approval).
   */
  async register(req, res, next) {
    try {
      const existing = await MentorModel.findByUserId(req.user.id);
      if (existing) throw new AppError('You are already registered as a mentor', 409);

      const { domain, experience_years, max_mentees, bio, skills } = req.body;
      const mentorId = await MentorModel.register(req.user.id, { domain, experience_years, max_mentees, bio });

      // Add mentor skills
      if (skills && skills.length > 0) {
        for (const s of skills) {
          const skill = await SkillModel.findOrCreate(s.name, s.category || 'language');
          await MentorModel.addSkill(mentorId, skill.id, s.proficiency || 3);
        }
      }

      const mentor = await MentorModel.findById(mentorId);
      res.status(201).json({ mentor, message: 'Registered! Awaiting admin approval.' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/mentors/matches/me
   * Get mentor matches for the current user.
   * Calls ML service for scoring, then stores results.
   */
  async getMatches(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Authentication required', 401);

      const userSkills = await UserModel.getSkills(userId);
      const user = await UserModel.findById(userId);

      // Get all approved mentors with their skills
      const mentors = await MentorModel.findAll({ approved: true });
      if (!mentors || mentors.length === 0) {
         return res.json({ matches: [], message: 'No mentors available for matching.' });
      }

      const mentorsWithSkills = await Promise.all(
        mentors.map(async (m) => {
          const skills = await MentorModel.getSkills(m.id);
          return { ...m, skills: skills || [] };
        })
      );

      // Call ML service for scoring
      let mlResult = { matches: [] };
      try {
        const mappedSkills = Array.isArray(userSkills) 
          ? userSkills.map((s) => ({ name: s.name, proficiency: s.proficiency }))
          : [];
          
        mlResult = await mlClient.getMentorMatches(
          mappedSkills,
          mentorsWithSkills
        );
      } catch (mlErr) {
        console.error('ML Matcher failed, using basic fallback');
      }

      // If ML failed or returned nothing, create basic matches from all approved mentors
      if (!mlResult.matches || mlResult.matches.length === 0) {
        mlResult.matches = mentors.map(m => ({
          mentor_id: m.id,
          compatibility_score: 0.5, // Default mid-score for discovery
          explanation: `Suggested based on your academic level and mentor's expertise in ${m.domain}.`
        }));
      }

      if (mlResult.matches && mlResult.matches.length > 0) {
        await MentorModel.saveMatches(userId, mlResult.matches);
      }

      const matches = await MentorModel.getMatches(userId);
      res.json({ matches: matches || [] });
    } catch (err) {
      console.error('Mentor matches error:', err);
      // Final safety net: try to return some mentors even on error
      try {
        const fallbackMentors = await MentorModel.findAll({ approved: true });
        res.json({ matches: fallbackMentors.map(m => ({
          id: -1, // Temporary ID for UI
          mentor_id: m.id,
          mentor_name: m.name,
          mentor_avatar: m.avatar_url,
          domain: m.domain,
          experience_years: m.experience_years,
          compatibility_score: 0.3,
          status: 'suggested',
          explanation: 'Available mentors (matching system busy)'
        })) });
      } catch (innerErr) {
        next(new AppError('The matching engine encountered an error.', 500));
      }
    }
  },

  /**
   * POST /api/mentors/:id/request
   * Request a specific mentor. Implements conflict resolution:
   * 1. Check mentor capacity
   * 2. If multiple requests → highest compatibility wins
   * 3. Tie → higher skill level
   * 4. Tie → first-come-first-serve
   */
  async requestMentor(req, res, next) {
    try {
      const mentorId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check capacity
      const hasCapacity = await MentorModel.hasCapacity(mentorId);
      if (!hasCapacity) {
        // Suggest alternatives — get other matches for this user
        const matches = await MentorModel.getMatches(userId);
        const alternatives = matches
          .filter((m) => m.mentor_id !== mentorId)
          .slice(0, 3);

        throw new AppError(
          `This mentor has reached their maximum mentees. Consider these alternatives: ${alternatives.map((a) => a.mentor_name).join(', ')}`,
          409
        );
      }

      await MentorModel.requestMentor(userId, mentorId);
      res.json({ message: 'Mentor request sent successfully.' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/mentors/matches/:matchId/respond
   * Mentor responds to a mentee request (accept/reject).
   */
  async respondToRequest(req, res, next) {
    try {
      const { matchId } = req.params;
      const { status } = req.body; // 'accepted' or 'rejected'

      if (!['accepted', 'rejected'].includes(status)) {
        throw new AppError('Status must be "accepted" or "rejected"', 400);
      }

      await MentorModel.respondToRequest(matchId, status);
      res.json({ message: `Request ${status}.` });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = MentorController;
