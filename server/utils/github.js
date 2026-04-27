/**
 * GitHub API Helper
 *
 * Fetches user repos and extracts languages/topics to build a skill profile.
 * Uses the user's stored GitHub access token.
 */

const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

/**
 * Fetch public + private repos for the authenticated user.
 * We limit to 50 most recently updated repos — more than enough
 * for skill extraction without hitting rate limits.
 */
async function fetchUserRepos(accessToken) {
  try {
    const { data } = await axios.get(`${GITHUB_API}/user/repos`, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      },
      params: { sort: 'updated', per_page: 50, type: 'owner' },
    });

    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: { login: repo.owner.login },
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      topics: repo.topics || [],
      stargazers_count: repo.stargazers_count,
      updated_at: repo.updated_at,
    }));
  } catch (err) {
    console.error('GitHub fetchUserRepos error:', err.message);
    return [];
  }
}

/**
 * Fetch the language breakdown for a specific repo.
 * Returns object like { "Python": 25000, "JavaScript": 18000 }
 */
async function fetchRepoLanguages(accessToken, owner, repo) {
  try {
    const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/languages`, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      },
    });
    return data;
  } catch (err) {
    console.error(`GitHub fetchRepoLanguages error for ${owner}/${repo}:`, err.message);
    return {};
  }
}

/**
 * Extract a unified skill set from all repos.
 * Collects languages and topics, counts frequency,
 * and returns an array sorted by frequency (most used first).
 */
function extractSkillsFromRepos(repos) {
  const skillCount = {};

  for (const repo of repos) {
    // Primary language
    if (repo.language) {
      const lang = repo.language.toLowerCase();
      skillCount[lang] = (skillCount[lang] || 0) + 2; // weight primary language higher
    }

    // Topics (e.g., "react", "machine-learning")
    for (const topic of repo.topics) {
      const t = topic.toLowerCase().replace(/-/g, ' ');
      skillCount[t] = (skillCount[t] || 0) + 1;
    }
  }

  // Sort by frequency and return
  return Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .map(([skill, count]) => ({ skill, count }));
}

module.exports = { fetchUserRepos, fetchRepoLanguages, extractSkillsFromRepos };
