/**
 * Feedback Controller
 *
 * Users rate project recommendations, mentor matches, and teammate suggestions.
 * Ratings are stored and used by the ML service to adjust future scores.
 */

const FeedbackModel = require('../models/feedback.model');
const { AppError } = require('../middleware/errorHandler');

const FeedbackController = {
  /**
   * POST /api/feedback
   * Submit a rating for a recommendation, mentor match, or teammate suggestion.
   */
  async submit(req, res, next) {
    try {
      const { target_type, target_id, rating, comment, tags } = req.body;

      const validTypes = ['project_recommendation', 'mentor_match', 'teammate_suggestion'];
      if (!validTypes.includes(target_type)) {
        throw new AppError(`target_type must be one of: ${validTypes.join(', ')}`, 400);
      }
      if (!rating || rating < 1 || rating > 5) {
        throw new AppError('Rating must be between 1 and 5', 400);
      }

      await FeedbackModel.create({
        user_id: req.user.id,
        target_type,
        target_id,
        rating,
        comment,
        tags: tags || []
      });

      res.status(201).json({ message: 'Feedback submitted. Thank you!' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/feedback/my
   * Get all feedback submitted by the current user.
   */
  async myFeedback(req, res, next) {
    try {
      const feedback = await FeedbackModel.findByUser(req.user.id);
      res.json({ feedback });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = FeedbackController;
