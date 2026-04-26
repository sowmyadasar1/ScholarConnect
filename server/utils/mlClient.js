/**
 * ML Service Client
 *
 * Simple HTTP client for the Python ML/NLP microservice.
 * All ML calls go through here so we have a single place
 * to handle timeouts, retries, and fallbacks.
 */

const axios = require('axios');

const ML_BASE = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// 10s timeout — ML can be slow, but don't wait forever
const client = axios.create({
  baseURL: ML_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Get project recommendations for a user.
 * Sends skills, interests, and academic level to the ML service.
 */
async function getRecommendations(userProfile) {
  try {
    const { data } = await client.post('/recommend', userProfile);
    return data;
  } catch (err) {
    console.error('ML getRecommendations failed:', err.message);
    return { recommendations: [], fallback: true };
  }
}

/**
 * Get mentor compatibility scores.
 */
async function getMentorMatches(userSkills, mentors) {
  try {
    const { data } = await client.post('/match/mentors', { userSkills, mentors });
    return data;
  } catch (err) {
    console.error('ML getMentorMatches failed:', err.message);
    return { matches: [] };
  }
}

/**
 * Get teammate suggestions based on complementary skills.
 */
async function getTeammateMatches(userProfile, candidates) {
  try {
    const { data } = await client.post('/match/teammates', { userProfile, candidates });
    return data;
  } catch (err) {
    console.error('ML getTeammateMatches failed:', err.message);
    return { suggestions: [] };
  }
}

/**
 * Parse natural language skill input.
 * e.g., "I know Python and some React, learning ML" → structured skills
 */
async function parseNaturalLanguageSkills(text) {
  try {
    const { data } = await client.post('/nlp/parse-skills', { text });
    return data;
  } catch (err) {
    console.error('ML parseNaturalLanguageSkills failed:', err.message);
    return { skills: [] };
  }
}

async function generateAiProjects(query, userSkills, projects) {
  try {
    const { data } = await client.post('/generate', { query, user_skills: userSkills, projects });
    return data;
  } catch (err) {
    console.error('ML generateAiProjects failed:', err.message);
    return { recommendations: [], fallback: true };
  }
}

module.exports = { getRecommendations, getMentorMatches, getTeammateMatches, parseNaturalLanguageSkills, generateAiProjects };
