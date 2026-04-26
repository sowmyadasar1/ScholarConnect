/**
 * Profile Service
 * 
 * Orchestrates background profile enrichment after GitHub OAuth.
 * Fetches repos, extracts skills, and populates user data.
 */

const { fetchUserRepos, extractSkillsFromRepos } = require('../utils/github');
const UserModel = require('../models/user.model');
const SkillModel = require('../models/skill.model');

const ProfileService = {
  /**
   * Deep enrich user profile from GitHub
   * @param {number} userId 
   * @param {string} accessToken 
   */
  async enrichFromGitHub(userId, accessToken) {
    try {
      console.log(`[ProfileService] Enriching profile for user ${userId}...`);
      
      const { fetchUserRepos, fetchRepoLanguages } = require('../utils/github');
      const repos = await fetchUserRepos(accessToken);
      if (!repos || repos.length === 0) return;

      const allSkills = {};
      // Scan top 10 most recent repos for language breakdown
      const topRepos = repos.slice(0, 10);
      
      for (const repo of topRepos) {
        try {
          const languages = await fetchRepoLanguages(accessToken, repo.owner.login, repo.name);
          for (const [lang, bytes] of Object.entries(languages)) {
            const l = lang.toLowerCase();
            allSkills[l] = (allSkills[l] || 0) + bytes;
          }
        } catch (repoErr) {
          console.error(`[ProfileService] Error fetching ${repo.full_name}:`, repoErr.message);
        }
      }

      // Convert byte counts to 1-5 proficiency using logarithmic scale
      const extracted = Object.entries(allSkills)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12); 

      for (const [name, weight] of extracted) {
        const skill = await SkillModel.findOrCreate(name, 'language');
        const proficiency = Math.min(5, Math.max(1, Math.ceil(Math.log10(weight / 1000))));
        await SkillModel.addUserSkill(userId, skill.id, proficiency, 'github');
      }

      console.log(`[ProfileService] Enrichment complete for user ${userId}.`);
    } catch (err) {
      console.error(`[ProfileService] Enrichment failed: ${err.message}`);
    }
  }
};

module.exports = ProfileService;
