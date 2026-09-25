/**
 * ML Service Client
 *
 * Uses Google Gemini API (@google/genai) to generate projects,
 * parse skills, and recommend matches.
 */

const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini Client
// If no API key is provided, we will fallback to mock data gracefully
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const MODEL = 'gemini-2.5-flash'; // Fast, cheap, and supports structured JSON output

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
 */
async function generateAiProjects(query, userSkills, projects) {
  const prompt = `You are a creative technical project generator for university students and researchers.
Generate 5 hyper-realistic, detailed project concepts based on the following query.
If the user's skills are relevant, tailor the projects slightly to their skills.
Query: "${query}"
User Skills: ${userSkills?.map(s => s.name).join(', ') || 'None'}`;

  const schema = {
    type: "OBJECT",
    properties: {
      recommendations: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            description: { type: "STRING" },
            tech_stack: { type: "STRING", description: "Comma separated list of technologies" },
            difficulty_level: { type: "INTEGER", description: "1 to 5" },
            match_score: { type: "NUMBER" },
            domain: { type: "STRING" }
          },
          required: ["title", "description", "tech_stack", "difficulty_level", "match_score", "domain"]
        }
      }
    },
    required: ["recommendations"]
  };

  const data = await askGemini(prompt, schema);
  if (data && data.recommendations) {
    data.recommendations.forEach((r, i) => r.id = 8000 + i);
    return data;
  }

  return { recommendations: [], fallback: true };
}

/**
 * Get mentor compatibility scores.
 */
async function getMentorMatches(userSkills, mentors) {
  return { matches: [] }; // Mock for now
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
