import api from './api';

export const adminService = {
  /**
   * Get platform statistics.
   * Route: GET /api/admin/stats
   */
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data.stats || response.data;
  },

  /**
   * List pending mentor approvals.
   * Route: GET /api/admin/mentors/pending
   */
  getPendingMentors: async () => {
    const response = await api.get('/admin/mentors/pending');
    return response.data.mentors || response.data;
  },

  /**
   * Approve a mentor.
   * Route: PUT /api/admin/mentors/:id/approve
   */
  approveMentor: async (mentorId) => {
    const response = await api.put(`/admin/mentors/${mentorId}/approve`);
    return response.data;
  },

  /**
   * Reject a mentor.
   * Route: PUT /api/admin/mentors/:id/reject
   */
  rejectMentor: async (mentorId) => {
    const response = await api.put(`/admin/mentors/${mentorId}/reject`);
    return response.data;
  },

  /**
   * List all users (paginated).
   * Route: GET /api/admin/users
   */
  listUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Create a new project in the catalog.
   * Route: POST /api/admin/projects
   */
  createProject: async (data) => {
    const response = await api.post('/admin/projects', data);
    return response.data;
  },

  /**
   * Update a project.
   * Route: PUT /api/admin/projects/:id
   */
  updateProject: async (id, data) => {
    const response = await api.put(`/admin/projects/${id}`, data);
    return response.data;
  },

  /**
   * List all feedback (paginated).
   * Route: GET /api/admin/feedback
   */
  listFeedback: async (params = {}) => {
    const response = await api.get('/admin/feedback', { params });
    return response.data;
  },

  /**
   * List all skills.
   * Route: GET /api/admin/skills
   */
  listSkills: async () => {
    const response = await api.get('/admin/skills');
    return response.data.skills || [];
  },
};
