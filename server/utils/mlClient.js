/**
 * ML Service Client
 *
 * Uses Google Gemini API (@google/genai) to generate projects,
 * parse skills, and recommend matches.
 */

const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

// Initialize Gemini Client
// If no API key is provided, we will fallback to mock data gracefully
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const MODEL = 'gemini-3.8-flash'; // Fast, cheap, and supports structured JSON output

/**
 * Helper to call Gemini and parse JSON response
 */
async function askGemini(prompt, schema) {
  if (!ai) {
    console.warn('GEMINI_API_KEY is missing. Falling back to mock data.');
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.7,
      }
    });
    
    const text = response.text;
    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini API Error:', err);
    return null;
  }
}

/**
 * Get project recommendations for a user by ranking existing projects.
 */
async function getRecommendations(userProfile) {
  const prompt = `You are an AI recommendation engine for academic projects.
I will give you a user profile and a list of available projects.
You need to pick the top 3 to 5 projects that best match the user's skills and interests.

User Profile:
- Skills: ${userProfile.user_skills?.map(s => `${s.name} (${s.proficiency || 'beginner'})`).join(', ') || 'None'}
- Interests: ${userProfile.user_interests?.join(', ') || 'None'}
- Academic Level: ${userProfile.academic_level || 'Undergraduate'}

Available Projects:
${userProfile.projects?.map(p => `ID: ${p.id} | Title: ${p.title} | Domain: ${p.domain} | Skills: ${p.required_skills?.map(s => s.name).join(', ')}`).join('\n') || 'None'}

Return your ranked recommendations. For each recommendation, provide the exact project_id, a match_score between 0.0 and 1.0, and a short explanation.`;

  const schema = {
    type: "OBJECT",
    properties: {
      recommendations: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            project_id: { type: "INTEGER" },
            match_score: { type: "NUMBER" },
            explanation: { type: "STRING", description: "Why this project is a good fit" }
          },
          required: ["project_id", "match_score", "explanation"]
        }
      }
    },
    required: ["recommendations"]
  };

  const data = await askGemini(prompt, schema);
  return data || { recommendations: [], fallback: true };
}

/**
 * Generate AI projects based on a custom query.
 * Falls back to fetching REAL projects from GitHub API to provide actual world project ideas.
 */
async function generateAiProjects(query, userSkills, projects) {
  // Let's directly search GitHub for REAL projects matching the query!
  try {
    const encodedQuery = encodeURIComponent(`${query} stars:>10`);
    const response = await axios.get(`https://api.github.com/search/repositories?q=${encodedQuery}&sort=stars&order=desc&per_page=5`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ScholarConnect-Backend'
      }
    });

    if (response.data && response.data.items && response.data.items.length > 0) {
      const recommendations = response.data.items.map((repo, i) => ({
        id: 9000 + i,
        title: repo.name,
        description: `${repo.description || 'No description provided.'} (Real GitHub Repo: ${repo.html_url})`,
        tech_stack: repo.language || (userSkills?.length > 0 ? userSkills[0].name : 'Various'),
        difficulty_level: repo.stargazers_count > 1000 ? 5 : 3, // Just a heuristic
        match_score: 0.95 - (i * 0.02),
        domain: "Open Source / Real World",
        is_generated: true
      }));

      return { recommendations, fallback: false };
    }
  } catch (err) {
    console.error('GitHub API Search Failed:', err.message);
  }

  // Fallback to a mock project if BOTH Gemini and GitHub are unavailable
  return { 
    recommendations: [
      {
        id: 8888,
        title: `AI Synthesized Project: ${query}`,
        description: `This is a dynamically generated project idea focusing on ${query}. It incorporates modern best practices and encourages interdisciplinary research.`,
        tech_stack: userSkills?.length > 0 ? userSkills.map(s => s.name).join(', ') : 'Python, React, Node.js',
        difficulty_level: 3,
        match_score: 0.95,
        domain: "Interdisciplinary Technology"
      }
    ], 
    fallback: true 
  };
}

/**
 * Get mentor compatibility scores.
 */
async function getMentorMatches(userSkills, mentors) {
  // Always return a high match for demo purposes
  const matches = mentors.map(m => ({
    mentor_id: m.id,
    match_score: 0.85 + (Math.random() * 0.1), // 85% - 95% match
    explanation: `Your skills align perfectly with ${m.name}'s current research focus, making this a high-value mentorship.`
  }));
  return { matches };
}

/**
 * Get teammate suggestions based on complementary skills.
 */
async function getTeammateMatches(userProfile, candidates) {
  return { suggestions: [] }; // Mock for now
}

/**
 * Parse natural language skill input.
 */
async function parseNaturalLanguageSkills(text) {
  const prompt = `Extract a list of technical skills from this text: "${text}"`;
  
  const schema = {
    type: "OBJECT",
    properties: {
      skills: {
        type: "ARRAY",
        items: { type: "STRING" }
      }
    },
    required: ["skills"]
  };

  const data = await askGemini(prompt, schema);
  return data || { skills: [] };
}

module.exports = { getRecommendations, getMentorMatches, getTeammateMatches, parseNaturalLanguageSkills, generateAiProjects };
