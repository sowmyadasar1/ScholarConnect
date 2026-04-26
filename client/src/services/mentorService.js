import api from './api';

export const mentorService = {
  /**
   * List all approved mentors.
   * Route: GET /api/mentors
   */
  listMentors: async (params = {}) => {
    const response = await api.get('/mentors', { params });
    return response.data.mentors || [];
  },

  /**
   * Get a single mentor by ID with skills.
   * Route: GET /api/mentors/:id
   */
  getById: async (mentorId) => {
    const response = await api.get(`/mentors/${mentorId}`);
    return response.data;
  },

  /**
   * Get ML-scored mentor matches for the current user.
   * Route: GET /api/mentors/matches/me
   */
  getMatches: async () => {
    const response = await api.get('/mentors/matches/me');
    return response.data.matches || [];
  },

  /**
   * Register current user as a mentor (requires admin approval).
   * Route: POST /api/mentors/register
   */
  register: async (data) => {
    const response = await api.post('/mentors/register', data);
    return response.data;
  },

  /**
   * Request a specific mentor.
   * Route: POST /api/mentors/:id/request
   */
  requestMentor: async (mentorId) => {
    const response = await api.post(`/mentors/${mentorId}/request`);
    return response.data;
  },

  /**
   * Respond to a mentee request (accept/reject).
   * Route: PUT /api/mentors/matches/:matchId/respond
   */
  respondToRequest: async (matchId, status) => {
    const response = await api.put(`/mentors/matches/${matchId}/respond`, { status });
    return response.data;
  },
};
