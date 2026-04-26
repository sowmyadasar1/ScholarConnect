import api from './api';

export const collabService = {
  /**
   * List all open collaboration projects.
   * Route: GET /api/collab
   */
  listProjects: async (params = {}) => {
    const response = await api.get('/collab', { params });
    return response.data.projects || [];
  },

  /**
   * Get current user's imported projects.
   * Route: GET /api/collab/my
   */
  myProjects: async () => {
    const response = await api.get('/collab/my');
    return response.data.projects || [];
  },

  /**
   * Get a collaboration project by ID with its join requests.
   * Route: GET /api/collab/:id
   */
  getById: async (projectId) => {
    const response = await api.get(`/collab/${projectId}`);
    return response.data;
  },

  /**
   * Import a GitHub repo as a collaboration project.
   * Route: POST /api/collab/import
   */
  importRepo: async (projectData) => {
    const response = await api.post('/collab/import', projectData);
    return response.data;
  },

  /**
   * Create a project manually (wraps import with manual data).
   * Route: POST /api/collab/import
   */
  createProject: async (projectData) => {
    const response = await api.post('/collab/import', {
      repo_url: projectData.github_repo_url || '',
      repo_name: projectData.repo_name,
      description: projectData.description,
      topics: projectData.topics || [],
    });
    return response.data;
  },

  /**
   * Fetch the authenticated user's GitHub repositories for import.
   * Route: GET /api/collab/github/repos
   */
  listGithubRepos: async () => {
    const response = await api.get('/collab/github/repos');
    return response.data.repos || [];
  },

  /**
   * Toggle collaboration status on a project.
   * Route: PUT /api/collab/:id/toggle
   */
  toggleCollab: async (projectId) => {
    const response = await api.put(`/collab/${projectId}/toggle`);
    return response.data;
  },

  /**
   * Request to join a collaboration project.
   * Route: POST /api/collab/:id/request
   */
  requestToJoin: async (projectId, message) => {
    const response = await api.post(`/collab/${projectId}/request`, { message });
    return response.data;
  },

  /**
   * Respond to a join request (owner accepts/rejects).
   * Route: PUT /api/collab/requests/:requestId/respond
   */
  respondToRequest: async (requestId, status) => {
    const response = await api.put(`/collab/requests/${requestId}/respond`, { status });
    return response.data;
  },

  // Aliases for compatibility
  listOpenProjects: async (params = {}) => {
    const response = await api.get('/collab', { params });
    return response.data;
  },
  getMyProjects: async () => {
    const response = await api.get('/collab/my');
    return response.data;
  },
  getMyInvites: async () => {
    const response = await api.get('/collab/invites/me');
    return response.data; // { received, sent }
  },
  createManual: async (projectData) => {
    const response = await api.post('/collab/manual', projectData);
    return response.data;
  },
  autoInviteRole: async (projectId, role) => {
    const response = await api.post(`/collab/${projectId}/auto-invite`, { role });
    return response.data;
  }
};
