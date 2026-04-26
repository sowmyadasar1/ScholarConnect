import api from './api';

export const projectService = {
  /**
   * Fetches personalized project recommendations for the current user.
   * Route: GET /api/projects/recommendations/me
   */
  getRecommendations: async () => {
    const response = await api.get('/projects/recommendations/me');
    return response.data;
  },

  /**
   * Generates dynamic projects based on a natural language query using AI.
   * Route: POST /api/projects/generate
   */
  generateAiProjects: async (query) => {
    const response = await api.post('/projects/generate', { query });
    return response.data;
  },

  /**
   * Fetches all projects with optional filters.
   * Route: GET /api/projects
   */
  getAllProjects: async (params = {}) => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  /**
   * Get a single project by ID.
   * Route: GET /api/projects/:id
   */
  getById: async (projectId) => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  /**
   * Apply to a project (collaboration request).
   * Route: POST /api/projects/:id/apply
   */
  applyToProject: async (projectId, message) => {
    const response = await api.post(`/projects/${projectId}/apply`, { message });
    return response.data;
  },

  /**
   * Get skill gaps for a specific project.
   * Route: GET /api/projects/:id/skill-gaps
   */
  getSkillGaps: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/skill-gaps`);
    return response.data;
  },

  /**
   * Get roadmap for a specific project.
   * Route: GET /api/projects/:id/roadmap
   */
  getRoadmap: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/roadmap`);
    return response.data;
  },

  /**
   * Get trending + beginner-friendly projects (cold start).
   * Route: GET /api/projects/cold-start
   */
  getColdStart: async () => {
    const response = await api.get('/projects/cold-start');
    return response.data;
  },
};
