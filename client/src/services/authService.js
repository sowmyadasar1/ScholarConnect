import api from './api';

/**
 * Auth Service
 * 
 * Handles user identity, GitHub/Google OAuth, and profile sync.
 */
export const authService = {
  /**
   * Get current user profile
   */
  async getMe() {
    const { data } = await api.get('/auth/me');
    return data;
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    const { data } = await api.put('/auth/profile', profileData);
    return data;
  },

  /**
   * Sync GitHub skills
   */
  async syncGithub() {
    const { data } = await api.post('/auth/github/sync');
    return data;
  },

  /**
   * Fetch user's GitHub repositories
   */
  async getGithubRepos() {
    const { data } = await api.get('/auth/github/repos');
    return data;
  },

  /**
   * Import skills from selected GitHub repositories
   */
  async importGithubRepos(repoFullNames) {
    const { data } = await api.post('/auth/github/import', { repoFullNames });
    return data;
  },

  /**
   * Get all master skills
   */
  async getMasterSkills() {
    const { data } = await api.get('/auth/skills');
    return data;
  },

  /**
   * Manual skill addition
   */
  async addSkills(skills) {
    const { data } = await api.post('/auth/skills', { skills });
    return data;
  },
  
  async deleteSkill(skillId) {
    const { data } = await api.delete(`/auth/skills/${skillId}`);
    return data;
  },

  /**
   * Search for users/mentors
   */
  async searchUsers(query, role = '') {
    const { data } = await api.get(`/auth/users/search?q=${encodeURIComponent(query)}&role=${role}`);
    return data;
  },
  
  async deleteAccount() {
    const { data } = await api.delete('/auth/profile');
    return data;
  }
};
